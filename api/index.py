"""Unspun API — single FastAPI function behind /api on Vercel.

Pipeline: (organic + reddit + shopping in parallel) -> bias audit
-> affiliate price lookup if budget allows -> one Cerebras synthesis call.

Timing is the binding constraint. Vercel's free tier kills the function at 10s
and synthesis needs ~2s, so the searches share one deadline and run
concurrently. An uncached SerpAPI query is scraped live and was measured taking
0.4s-13s; when it overruns we return 504 rather than hanging, because SerpAPI
caches the scrape it just finished and an immediate retry lands in under a
second.
"""

import asyncio
import re
import time

from cerebras.cloud.sdk import RateLimitError
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from api.services import bias_detector, cerebras_client, serpapi_client
from api.services.schemas import SearchRequest, SearchResult

app = FastAPI(title="Unspun API", docs_url=None, redoc_url=None)

SEARCH_BUDGET = 6.5  # leaves ~2s for synthesis inside the 10s function limit
AFFILIATE_MIN_BUDGET = 1.5

TIMEOUT_MESSAGE = (
    "Google is still being scraped for this query. Hit retry — the second attempt "
    "is served from cache and returns immediately."
)

# "Coway Airmega 200M", "Levoit Core 300S" — brand + alphanumeric model.
_PRODUCT_NAME = re.compile(r"\b([A-Z][A-Za-z]{2,} (?:[A-Z][A-Za-z]+ )?[A-Z0-9][\w-]*\d[\w-]*)\b")

_STOPWORDS = {"the", "a", "an", "for", "with", "and", "of", "in", "on", "air", "pro", "plus", "mini", "max", "new"}
_SUBREDDIT = re.compile(r"reddit\.com/r/([A-Za-z0-9_]+)")


def _tokens(name: str) -> set[str]:
    """Distinctive lowercase tokens of a product name ('Winix 5500-2' -> {'winix', '5500'})."""
    raw = re.split(r"[^a-z0-9]+", name.lower())
    return {t for t in raw if t and t not in _STOPWORDS and (t[0].isdigit() or len(t) > 1)}


def _match_shopping(name: str, shopping: list[dict]) -> dict | None:
    """Shopping item whose title shares the most distinctive tokens with the name."""
    want = _tokens(name)
    if not want:
        return None
    best, best_score = None, 0
    for item in shopping:
        score = len(want & _tokens(item.get("title", "")))
        if score > best_score:
            best, best_score = item, score
    return best


def _reddit_links_for(name: str, reddit: list[dict], limit: int = 3) -> list[dict]:
    """Reddit threads that mention this product, as ``{subreddit, url}``."""
    want = _tokens(name)
    links: list[dict] = []
    seen: set[str] = set()
    for r in reddit:
        url = r.get("link", "")
        subreddit = _SUBREDDIT.search(url)
        if not subreddit or url in seen:
            continue
        # Tokens already exclude stopwords and single letters, so one shared token
        # is a brand or model number — enough to count the thread as evidence.
        if not want & _tokens(f"{r.get('title', '')} {r.get('snippet', '')}"):
            continue
        seen.add(url)
        links.append({"subreddit": f"r/{subreddit.group(1)}", "url": url})
        if len(links) >= limit:
            break
    return links


def _enrich(result: dict, shopping: list[dict], reddit: list[dict]) -> dict:
    """Attach thumbnails and Reddit evidence to each recommendation.

    Keys are camelCase to match the rest of ``normalize``'s output.
    """
    for rec in result.get("recommendations", []):
        item = _match_shopping(rec["name"], shopping)
        rec["thumbnail"] = (item or {}).get("thumbnail", "")
        rec["redditLinks"] = _reddit_links_for(rec["name"], reddit)
    return result


def _affiliate_pick(items: list[dict], quarantined_domains: set[str]) -> str | None:
    """First product-looking name mentioned by a quarantined source, if any."""
    for item in items:
        if bias_detector.registrable_domain(item.get("link", "")) not in quarantined_domains:
            continue
        if match := _PRODUCT_NAME.search(f"{item.get('title', '')}. {item.get('snippet', '')}"):
            return match.group(1)
    return None


def _error(status: int, message: str) -> JSONResponse:
    return JSONResponse({"error": message}, status_code=status)


def _optional(result: list[dict] | BaseException) -> list[dict]:
    """Enrichment calls degrade to empty rather than failing the whole search."""
    return [] if isinstance(result, BaseException) else result


@app.exception_handler(RequestValidationError)
async def invalid_request(_: Request, __: RequestValidationError) -> JSONResponse:
    """Match the frontend's `{error}` shape instead of FastAPI's `{detail}`."""
    return _error(422, "Enter a search of at least 2 characters.")


@app.get("/api/health")
async def health() -> dict:
    return {"ok": True}


@app.post("/api/search", response_model=SearchResult, response_model_by_alias=True)
async def search(body: SearchRequest):
    query = body.query.strip()
    deadline = time.monotonic() + SEARCH_BUDGET

    async with serpapi_client.client() as client:
        organic_result, reddit_result, shopping_result = await asyncio.gather(
            serpapi_client.get_organic(client, query, timeout=SEARCH_BUDGET),
            serpapi_client.get_reddit_sentiment(client, query, timeout=SEARCH_BUDGET),
            serpapi_client.get_shopping(client, query, timeout=SEARCH_BUDGET),
            return_exceptions=True,
        )

        # Organic drives the bias audit — without it there is nothing to strip.
        if isinstance(organic_result, serpapi_client.SerpApiTimeout):
            return _error(504, TIMEOUT_MESSAGE)
        if isinstance(organic_result, serpapi_client.SerpApiError):
            return _error(502, f"Search provider failed: {organic_result}")
        if isinstance(organic_result, BaseException):
            raise organic_result

        organic = organic_result
        reddit, shopping = _optional(reddit_result), _optional(shopping_result)

        quarantined, clean = bias_detector.audit(organic)

        # Depends on the audit, so it cannot join the batch above. Skipped when
        # the parallel phase already spent the budget.
        affiliate_shopping: list[dict] = []
        affiliate_name = _affiliate_pick(organic, {q["domain"] for q in quarantined})
        remaining = deadline - time.monotonic()
        if affiliate_name and remaining >= AFFILIATE_MIN_BUDGET:
            try:
                affiliate_shopping = await serpapi_client.get_shopping(
                    client, affiliate_name, timeout=remaining, num=3
                )
            except serpapi_client.SerpApiError:
                pass  # the savings comparison is a nice-to-have

    prompt = cerebras_client.build_prompt(query, quarantined, clean, reddit, shopping, affiliate_shopping)
    try:
        parsed = await cerebras_client.synthesize(prompt)
    except RateLimitError:
        return _error(429, "Cerebras rate limit reached (5 requests/min). Wait a moment and retry.")
    except ValueError as exc:
        return _error(502, f"Could not parse the model response: {exc}")
    except Exception as exc:  # noqa: BLE001 — surface a message, never a stack trace
        return _error(502, f"Synthesis failed: {type(exc).__name__}")

    return _enrich(cerebras_client.normalize(parsed, query, quarantined), shopping, reddit)


if __name__ == "__main__":
    # Self-check for the enrichment matchers (no network, no app startup).
    shopping_fixture = [
        {"title": "Levoit Core 300S True HEPA Air Purifier", "thumbnail": "https://img/levoit"},
        {"title": "Winix 5500-2 Air Cleaner", "thumbnail": "https://img/winix"},
        {"title": "Generic Desk Fan", "thumbnail": "https://img/fan"},
    ]
    assert _match_shopping("Levoit Core 300S", shopping_fixture)["thumbnail"] == "https://img/levoit"
    assert _match_shopping("Winix 5500-2", shopping_fixture)["thumbnail"] == "https://img/winix"
    assert _match_shopping("Coway Airmega 400", shopping_fixture) is None, "no shared token must not match"
    # "Air Purifier" is all stopwords/generic, so it must not match the fan.
    assert _match_shopping("Air", shopping_fixture) is None

    reddit_fixture = [
        {"title": "Levoit Core 300S worth it?", "link": "https://reddit.com/r/AirPurifiers/a", "snippet": ""},
        {"title": "duplicate url", "link": "https://reddit.com/r/AirPurifiers/a", "snippet": "levoit"},
        {"title": "Best purifier?", "link": "https://reddit.com/r/HVAC/b", "snippet": "I run a Levoit daily"},
        {"title": "Unrelated", "link": "https://reddit.com/r/cars/c", "snippet": "tires"},
        {"title": "No subreddit", "link": "https://example.com/levoit", "snippet": "levoit"},
    ]
    links = _reddit_links_for("Levoit Core 300S", reddit_fixture)
    assert [x["subreddit"] for x in links] == ["r/AirPurifiers", "r/HVAC"], links
    assert _reddit_links_for("Dyson TP07", reddit_fixture) == []
    assert len(_reddit_links_for("Levoit", reddit_fixture, limit=1)) == 1

    enriched = _enrich(
        {"recommendations": [{"name": "Levoit Core 300S"}, {"name": "Nothing Matches XZ9"}]},
        shopping_fixture,
        reddit_fixture,
    )
    first, second = enriched["recommendations"]
    assert first["thumbnail"] == "https://img/levoit" and len(first["redditLinks"]) == 2
    assert second["thumbnail"] == "" and second["redditLinks"] == []
    print("enrichment self-check OK")
