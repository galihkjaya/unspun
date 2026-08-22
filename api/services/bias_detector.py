"""Affiliate/SEO bias audit over SerpAPI organic results.

Two signals for MVP: a hardcoded domain blacklist, and a listicle title pattern
("10 Best...", "Top 15..."). Everything else passes through clean.
"""

import re
from urllib.parse import urlparse

# Domains that monetize "best of" roundups via affiliate links.
AFFILIATE_BLACKLIST: dict[str, str] = {
    "forbes.com": "Forbes Vetted runs on affiliate commissions; high domain authority, no verifiable hands-on testing methodology disclosed",
    "cnet.com": "Affiliate-monetized commerce content; rankings correlate with partner programs, not measured performance",
    "bhg.com": "Better Homes & Gardens roundups are affiliate-funded and largely aggregate retailer copy",
    "nytimes.com": "Wirecutter operates on affiliate revenue; picks are paywalled and not independently reproducible",
    "nerdwallet.com": "Revenue comes from partner referrals; placement is influenced by compensation",
    "bankrate.com": "Advertiser-compensated placements disclosed site-wide; ordering reflects partner deals",
    "thespruce.com": "Dotdash Meredith affiliate network; product picks are commerce-driven",
    "goodhousekeeping.com": "Hearst affiliate commerce content; 'tested' claims lack published methodology",
}

# "10 Best", "Top 15", "7 best ... of 2026" — the listicle fingerprint.
_LISTICLE = re.compile(
    r"\b(?:\d{1,2}\s+(?:of\s+the\s+)?best|best\s+\d{1,2}|top\s+\d{1,2})\b",
    re.IGNORECASE,
)

# TODO: ML-based detection (train on affiliate-disclosure text + outbound link
# density) to catch conglomerates outside the blacklist. Not required for MVP.


def registrable_domain(url: str) -> str:
    """Host without leading www. Empty string when the URL is unusable."""
    host = (urlparse(url).hostname or "").lower()
    return host[4:] if host.startswith("www.") else host


def _blacklist_reason(domain: str) -> str | None:
    for blocked, reason in AFFILIATE_BLACKLIST.items():
        if domain == blocked or domain.endswith("." + blocked):
            return reason
    return None


def audit(results: list[dict]) -> tuple[list[dict], list[dict]]:
    """Split organic results into (quarantined, clean).

    Quarantined entries are ``{"domain", "reason"}``, deduplicated by domain so
    one publisher with four listicles does not flood the UI.
    """
    quarantined: list[dict] = []
    clean: list[dict] = []
    seen: set[str] = set()

    for item in results:
        link = item.get("link") or ""
        domain = registrable_domain(link)
        if not domain:
            continue

        title = item.get("title") or ""
        reason = _blacklist_reason(domain)
        if reason is None and _LISTICLE.search(title):
            reason = "Ranked listicle format ('best of' countdown) — a monetization template, not a comparative test"

        if reason is None:
            clean.append(item)
            continue

        if domain not in seen:
            seen.add(domain)
            quarantined.append({"domain": domain, "reason": reason})

    return quarantined, clean


if __name__ == "__main__":
    q, c = audit(
        [
            {"title": "Air purifier notes", "link": "https://www.forbes.com/vetted/x"},
            {"title": "More Forbes", "link": "https://forbes.com/y"},  # dedup
            {"title": "The 10 Best Air Purifiers of 2026", "link": "https://smallblog.io/a"},
            {"title": "How HEPA filtration works", "link": "https://achooallergy.com/b"},
            {"title": "Wirecutter pick", "link": "https://nytimes.com/wirecutter/z"},
            {"title": "no link"},
        ]
    )
    domains = [e["domain"] for e in q]
    assert domains == ["forbes.com", "smallblog.io", "nytimes.com"], domains
    assert [i["link"] for i in c] == ["https://achooallergy.com/b"], c
    assert all(e["reason"] for e in q)
    assert registrable_domain("https://www.CNET.com/path") == "cnet.com"
    assert registrable_domain("not a url") == ""
    assert _LISTICLE.search("Top 7 Purifiers") and not _LISTICLE.search("Best purifier for pets")
    print("bias_detector self-check OK")
