"""SerpAPI client: organic search, Reddit-scoped search, Google Shopping.

Uses the JSON endpoint (not ``output=md``) because the pipeline needs structured
fields — ``link`` for the domain audit, ``extracted_price`` for the savings math.

Timeouts are passed in per call, not baked in: an uncached query makes SerpAPI
scrape live (measured 0.4s–13s), while a repeat query returns in under a second.
The caller owns the budget because the whole pipeline has to fit inside Vercel's
10s function limit.
"""

import os

import httpx

BASE_URL = "https://serpapi.com/search.json"
DEFAULT_TIMEOUT = 6.0
CONNECT_TIMEOUT = 3.0


class SerpApiError(RuntimeError):
    pass


class SerpApiTimeout(SerpApiError):
    """Live scrape overran the caller's budget. A retry usually hits their cache."""


def client() -> httpx.AsyncClient:
    """Client shared across the pipeline. `retries` covers cold connect failures."""
    return httpx.AsyncClient(
        timeout=httpx.Timeout(DEFAULT_TIMEOUT, connect=CONNECT_TIMEOUT),
        transport=httpx.AsyncHTTPTransport(retries=2),
    )


def _key() -> str:
    key = os.environ.get("SERPAPI_KEY")
    if not key:
        raise SerpApiError("SERPAPI_KEY is not set")
    return key


async def _get(client: httpx.AsyncClient, params: dict, timeout: float) -> dict:
    try:
        response = await client.get(
            BASE_URL,
            params={**params, "api_key": _key()},
            timeout=httpx.Timeout(timeout, connect=min(CONNECT_TIMEOUT, timeout)),
        )
        response.raise_for_status()
        payload = response.json()
    except httpx.HTTPStatusError as exc:
        raise SerpApiError(f"SerpAPI returned {exc.response.status_code}") from exc
    except httpx.TimeoutException as exc:
        raise SerpApiTimeout(f"SerpAPI timed out after {timeout:.1f}s") from exc
    except httpx.HTTPError as exc:
        # Transport errors frequently stringify to "" — fall back to the class name.
        raise SerpApiError(f"SerpAPI request failed: {str(exc) or type(exc).__name__}") from exc

    if error := payload.get("error"):
        raise SerpApiError(str(error))
    return payload


def _organic(payload: dict) -> list[dict]:
    return [
        {
            "title": r.get("title", ""),
            "link": r.get("link", ""),
            "snippet": r.get("snippet", ""),
        }
        for r in payload.get("organic_results", [])
    ]


async def get_organic(
    client: httpx.AsyncClient, query: str, *, timeout: float = DEFAULT_TIMEOUT, num: int = 10
) -> list[dict]:
    """Top organic results for the raw query — input to the bias audit."""
    payload = await _get(
        client, {"engine": "google", "q": query, "num": num, "hl": "en", "gl": "us"}, timeout
    )
    return _organic(payload)


async def get_reddit_sentiment(
    client: httpx.AsyncClient, query: str, *, timeout: float = DEFAULT_TIMEOUT, num: int = 10
) -> list[dict]:
    """Reddit-scoped results; snippets carry the community sentiment signal."""
    payload = await _get(
        client,
        {"engine": "google", "q": f"{query} site:reddit.com", "num": num, "hl": "en", "gl": "us"},
        timeout,
    )
    return _organic(payload)


async def get_shopping(
    client: httpx.AsyncClient, query: str, *, timeout: float = DEFAULT_TIMEOUT, num: int = 6
) -> list[dict]:
    """Live pricing for a query or product name. Items without a price are dropped."""
    payload = await _get(client, {"engine": "google_shopping", "q": query, "hl": "en", "gl": "us"}, timeout)

    items = []
    for r in payload.get("shopping_results", []):
        price = r.get("extracted_price")
        if isinstance(price, bool) or not isinstance(price, (int, float)):
            continue
        items.append(
            {
                "title": r.get("title", ""),
                "price": float(price),
                "seller": r.get("source", ""),
                "rating": r.get("rating"),
                "link": r.get("product_link") or r.get("link") or "",
            }
        )
        if len(items) >= num:
            break
    return items
