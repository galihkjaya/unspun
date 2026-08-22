"""Cerebras synthesis: one merged call per search query.

Rate limits are 5 RPM / 30k TPM, so bias reasoning, sentiment synthesis,
astroturf flagging, ranking and the savings delta all live in a single prompt.
The only second call is a stricter JSON re-ask when the first response fails to
parse — a correctness fallback, not a pipeline stage.
"""

import json
import os
import re
from datetime import datetime, timezone

from cerebras.cloud.sdk import AsyncCerebras, RateLimitError

MAX_OUTPUT_TOKENS = 3000
REASONING_EFFORT = "low"
TIMEOUT = 8.0  # synthesis is the last step; the whole function must land under 10s

SYSTEM_PROMPT = (
    "You are Unspun, a search engine that strips affiliate marketing bias out of "
    "product research. You are given raw Google results, Reddit discussion snippets "
    "and live Google Shopping prices. Trust the Reddit community signal over the "
    "affiliate publishers. Never invent products, quotes, prices or URLs that do not "
    "appear in the supplied data. Reply with a single JSON object and nothing else."
)

RESPONSE_CONTRACT = """{
  "summary": "2-3 sentences: what the community actually recommends and why, in plain language",
  "recommendations": [
    {
      "rank": 1,
      "name": "exact product name",
      "mentions": 0,
      "sentiment": "positive | mixed | negative",
      "communityQuote": "short paraphrase or quote grounded in a Reddit snippet",
      "caveat": "the real downside redditors raise",
      "price": 0.0,
      "buyUrl": "url from the shopping data, or \\"\\" if none"
    }
  ],
  "savings": 0.0,
  "astroturfFlags": ["why a specific post looks promotional or astroturfed"],
  "quarantineNotes": [{"domain": "example.com", "reason": "one clause on why this source is unreliable"}]
}"""


def _fmt_results(items: list[dict], limit: int = 10) -> str:
    if not items:
        return "  (none returned)"
    lines = []
    for i, r in enumerate(items[:limit], 1):
        lines.append(f"  {i}. {r.get('title', '')} [{r.get('link', '')}]\n     {r.get('snippet', '')}".rstrip())
    return "\n".join(lines)


def _fmt_shopping(label: str, items: list[dict]) -> str:
    if not items:
        return f"{label}: (no pricing returned)"
    lines = [f"{label}:"]
    for r in items:
        rating = f", rated {r['rating']}" if r.get("rating") else ""
        lines.append(f"  - {r['title']} — ${r['price']:.2f} at {r.get('seller') or 'unknown seller'}{rating} [{r.get('link', '')}]")
    return "\n".join(lines)


def build_prompt(
    query: str,
    quarantined: list[dict],
    clean: list[dict],
    reddit: list[dict],
    shopping: list[dict],
    affiliate_shopping: list[dict],
) -> str:
    quarantine_block = (
        "\n".join(f"  - {q['domain']}: {q['reason']}" for q in quarantined) or "  (nothing stripped)"
    )
    return f"""User query: "{query}"

STRIPPED SOURCES (already quarantined by domain audit — tighten each reason, do not add or remove domains):
{quarantine_block}

REMAINING ORGANIC RESULTS:
{_fmt_results(clean)}

REDDIT DISCUSSION SNIPPETS (the primary signal):
{_fmt_results(reddit)}

{_fmt_shopping("LIVE PRICING for the leading community pick", shopping)}

{_fmt_shopping("LIVE PRICING for the leading affiliate-recommended product", affiliate_shopping)}

Tasks:
1. Rank up to 4 products the Reddit discussion genuinely supports, best first. `mentions` = how many supplied Reddit snippets reference that product; never inflate it.
2. Ground every communityQuote and caveat in a supplied snippet.
3. Set `price` from the shopping data (cheapest credible listing) and `buyUrl` to that listing's URL. Use 0 and "" when there is no match.
4. `savings` = leading affiliate product price minus your rank-1 price, in dollars. Use 0.0 if either price is missing or the result would be negative.
5. `astroturfFlags`: name concrete promotional/astroturf tells in the Reddit snippets. Empty array if none are evident.
6. `quarantineNotes`: one tightened reason per stripped domain above.

Respond with exactly this JSON shape:
{RESPONSE_CONTRACT}"""


_FENCE = re.compile(r"```(?:json)?\s*(.*?)\s*```", re.DOTALL)


def parse_response(raw: str) -> dict:
    """Extract the JSON object from a model reply. Raises ValueError if absent."""
    text = (raw or "").strip()
    if match := _FENCE.search(text):
        text = match.group(1).strip()

    try:
        parsed = json.loads(text)
    except json.JSONDecodeError:
        start, end = text.find("{"), text.rfind("}")
        if start == -1 or end <= start:
            raise ValueError("no JSON object in model response")
        parsed = json.loads(text[start : end + 1])

    if not isinstance(parsed, dict):
        raise ValueError("model response was not a JSON object")
    return parsed


_SENTIMENTS = {"positive", "mixed", "negative"}


def _num(value, default: float = 0.0) -> float:
    if isinstance(value, bool) or not isinstance(value, (int, float, str)):
        return default
    try:
        return float(str(value).replace("$", "").replace(",", "").strip())
    except ValueError:
        return default


def normalize(parsed: dict, query: str, quarantined: list[dict]) -> dict:
    """Coerce a loose model object into the SearchResult contract."""
    notes = {
        str(n.get("domain", "")): str(n.get("reason", ""))
        for n in parsed.get("quarantineNotes") or []
        if isinstance(n, dict)
    }

    recommendations = []
    for i, r in enumerate(parsed.get("recommendations") or [], 1):
        if not isinstance(r, dict) or not str(r.get("name", "")).strip():
            continue
        sentiment = str(r.get("sentiment", "")).lower()
        recommendations.append(
            {
                "rank": int(_num(r.get("rank"), i)) or i,
                "name": str(r["name"]).strip(),
                "mentions": max(0, int(_num(r.get("mentions")))),
                "sentiment": sentiment if sentiment in _SENTIMENTS else "mixed",
                "communityQuote": str(r.get("communityQuote", "")),
                "caveat": str(r.get("caveat", "")),
                "price": max(0.0, round(_num(r.get("price")), 2)),
                "buyUrl": str(r.get("buyUrl", "")),
            }
        )
    recommendations.sort(key=lambda r: r["rank"])

    return {
        "query": query,
        "summary": str(parsed.get("summary", "")).strip(),
        "quarantined": [
            {"domain": q["domain"], "reason": notes.get(q["domain"]) or q["reason"]} for q in quarantined
        ],
        "recommendations": recommendations,
        "savings": max(0.0, round(_num(parsed.get("savings")), 2)),
        "astroturfFlags": [str(f) for f in parsed.get("astroturfFlags") or [] if str(f).strip()],
        "timestamp": datetime.now(timezone.utc).isoformat(timespec="seconds"),
    }


async def synthesize(prompt: str) -> dict:
    """One Cerebras call; on unparseable output, one stricter re-ask."""
    api_key = os.environ.get("CEREBRAS_API_KEY")
    if not api_key:
        raise RuntimeError("CEREBRAS_API_KEY is not set")
    model = os.environ.get("CEREBRAS_MODEL", "gpt-oss-120b")

    # max_retries=0: the SDK's default is to retry a 429 with backoff, which would
    # blow past Vercel's function limit. Surface the rate limit to the caller and
    # let the user retry instead of holding the request open.
    client = AsyncCerebras(api_key=api_key, timeout=TIMEOUT, max_retries=0)

    async def ask(messages: list[dict]) -> str:
        completion = await client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=0.2,
            max_completion_tokens=MAX_OUTPUT_TOKENS,
            response_format={"type": "json_object"},
            # gpt-oss spends completion tokens on reasoning before emitting content;
            # "high" effort truncates the JSON mid-object at this token budget.
            reasoning_effort=REASONING_EFFORT,
        )
        choice = completion.choices[0]
        if choice.finish_reason == "length":
            raise ValueError("model response was truncated before the JSON closed")
        return choice.message.content or ""

    messages = [{"role": "system", "content": SYSTEM_PROMPT}, {"role": "user", "content": prompt}]
    try:
        return parse_response(await ask(messages))
    except ValueError:
        # Strict retry. Counts against 5 RPM, so it only runs on a parse failure.
        return parse_response(
            await ask(
                messages
                + [
                    {
                        "role": "user",
                        "content": (
                            "Your previous reply was not a complete JSON object. Reply again with only "
                            "the raw JSON object — no prose, no markdown fences — and keep every string short."
                        ),
                    },
                ]
            )
        )


__all__ = ["build_prompt", "parse_response", "normalize", "synthesize", "RateLimitError"]


if __name__ == "__main__":
    assert parse_response('```json\n{"a": 1}\n```') == {"a": 1}
    assert parse_response('Sure thing:\n{"a": [1, 2]}\nHope that helps!') == {"a": [1, 2]}
    for bad in ("no object here", "", "[1,2]"):
        try:
            parse_response(bad)
            raise AssertionError(f"expected failure for {bad!r}")
        except ValueError:
            pass

    out = normalize(
        {
            "summary": "  Community likes the Levoit.  ",
            "recommendations": [
                {"rank": 2, "name": "Winix 5500-2", "mentions": "3", "sentiment": "POSITIVE", "price": "$189.99", "buyUrl": "u"},
                {"rank": 1, "name": "Levoit Core 300S", "mentions": -1, "sentiment": "glowing", "price": "bad"},
                {"name": "   "},
            ],
            "savings": "-40",
            "astroturfFlags": ["1-day-old account shilling", "  "],
            "quarantineNotes": [{"domain": "forbes.com", "reason": "tightened"}],
        },
        "best air purifier for small room",
        [{"domain": "forbes.com", "reason": "original"}, {"domain": "cnet.com", "reason": "kept"}],
    )
    assert [r["name"] for r in out["recommendations"]] == ["Levoit Core 300S", "Winix 5500-2"]
    assert out["recommendations"][0]["sentiment"] == "mixed" and out["recommendations"][0]["price"] == 0.0
    assert out["recommendations"][1]["sentiment"] == "positive" and out["recommendations"][1]["mentions"] == 3
    assert out["recommendations"][0]["mentions"] == 0
    assert out["savings"] == 0.0  # negative delta clamped
    assert out["summary"] == "Community likes the Levoit."
    assert out["astroturfFlags"] == ["1-day-old account shilling"]
    assert [q["reason"] for q in out["quarantined"]] == ["tightened", "kept"]
    assert out["timestamp"].endswith("+00:00")

    prompt = build_prompt(
        "best air purifier for small room",
        [{"domain": "forbes.com", "reason": "affiliate"}],
        [{"title": "HEPA basics", "link": "https://x.io/a", "snippet": "s"}],
        [{"title": "r/AirPurifiers thread", "link": "https://reddit.com/r/a", "snippet": "Levoit is fine"}],
        [{"title": "Levoit Core 300S", "price": 99.99, "seller": "Amazon", "rating": 4.6, "link": "https://buy"}],
        [],
    )
    assert "forbes.com" in prompt and "Levoit Core 300S" in prompt and "$99.99" in prompt
    assert "(no pricing returned)" in prompt
    print("cerebras_client self-check OK")
