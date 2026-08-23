```markdown
<p align="center">
  <img src="public/unspun-banner.png" alt="Unspun" width="100%" />
</p>

<p align="center">
  <strong>Search without the sales pitch.</strong><br/>
  Google ranks affiliate listicles first because of domain authority, not because the reviews are real.<br/>
  Unspun strips those publishers out, reads the Reddit discussion underneath, and returns one synthesized answer.
</p>

<p align="center">
  <a href="https://unspun-v.vercel.app"><img src="https://img.shields.io/badge/Live-unspun--v.vercel.app-black?style=for-the-badge&logo=vercel" /></a>
  <a href="https://youtu.be/UuwpphgzAB0"><img src="https://img.shields.io/badge/Demo-Watch%20on%20YouTube-red?style=for-the-badge&logo=youtube" /></a>
  <img src="https://img.shields.io/badge/Stack-Next.js%20%2B%20FastAPI-blue?style=for-the-badge" />
  <img src="https://img.shields.io/badge/AI-Cerebras%20gpt--oss--120b-purple?style=for-the-badge" />
</p>

---

## What is Unspun?

You search "best mechanical keyboard under $100." Google gives you ten affiliate articles from the same five publishers, all ranking the same keyboard that pays the highest commission.

Unspun runs that same query, audits every result for affiliate bias using a deterministic blacklist and listicle pattern detector, pulls the actual Reddit discussion underneath, fetches live pricing, and synthesizes everything into one ranked answer — telling you what the community actually recommends, not what earns the most commission.

**The 10x claim:** finding a trustworthy product recommendation used to take 20+ minutes of cross-referencing Reddit threads manually. Unspun does it in under 10 seconds.

---

## How it works

```
query
  │
  ├─ SerpAPI Google Search     → bias audit: quarantined[] + clean[]    ┐
  ├─ SerpAPI Google Search     → Reddit-scoped sentiment snippets       ├─ parallel
  └─ SerpAPI Google Shopping   → live pricing                          ┘
  │
  ├─ SerpAPI Google Shopping   → price of the top affiliate pick
  │
  ├─ Cerebras (one call)       → summary, ranking, savings delta, astroturf flags
  │
  └─ POST /api/trends          → Google Trends per ranked product (after results paint)
```

The bias audit is deterministic Python, not an LLM call — a hardcoded affiliate blacklist plus a listicle title pattern (`api/services/bias_detector.py`). One Cerebras call handles everything that needs judgement: sentiment synthesis, ranking, astroturf detection, savings calculation, and tightening quarantine reasons.

Product thumbnails and per-product Reddit evidence links are matched deterministically in `api/index.py` by distinctive-token overlap, so a card only ever cites a thread that actually mentions it.

---

## Features

- **Bias audit** — deterministic affiliate blacklist + listicle pattern detection, no LLM needed
- **Reddit sentiment** — real community opinions pulled and synthesized, not aggregator summaries
- **Live pricing** — Google Shopping prices fetched in parallel with the search
- **Savings delta** — shows how much cheaper the community pick is vs the affiliate recommendation
- **Astroturf detection** — Cerebras flags suspiciously promotional Reddit threads
- **Google Trends** — post-synthesis trend sparklines per ranked product
- **Compare mode** — run two queries side by side concurrently
- **24h result cache** — repeat searches cost nothing, served instantly from local cache
- **Dark / light theme** — respects `prefers-color-scheme`, overridable, applied before first paint

---

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js (App Router) + TypeScript + Tailwind CSS |
| Backend | FastAPI on Vercel Python Serverless Functions |
| AI synthesis | Cerebras `gpt-oss-120b` |
| Search & data | SerpAPI (organic, Reddit, Shopping, Trends) |
| Deployment | Vercel (frontend + API in one repo) |
| Caching | localStorage, 24h TTL, keyed by query |

---

## Concepts implemented

| Concept | Where it lives |
|---------|---------------|
| API endpoints | `api/index.py` — `/api/search`, `/api/trends`, `/api/compare` with proper HTTP status codes and Pydantic validation |
| LLM integration | `api/services/cerebras_client.py` — single Cerebras call with RPM/TPM budget awareness, JSON normalization, and 429 handling |
| Caching | `app/hooks/useLocalStorage.ts` + `app/lib/history.ts` — 24h keyed cache, repeat queries served instantly |
| Web scraping pipeline | `api/services/serpapi_client.py` + `api/services/bias_detector.py` — parallel SerpAPI scrapes, deterministic affiliate blacklist, idempotent result enrichment |
| Deployment | Vercel — live at [unspun-v.vercel.app](https://unspun-v.vercel.app), zero-config CI from `main` |

> **Swap note — Database:** Unspun is intentionally stateless. Search results are per-session by design; persisting them server-side would require user identity, which adds scope without solving the core problem. localStorage gives the same repeat-search benefit without the infrastructure cost.
>
> **Swap note — Deployment** replaces Reporting (PDF/email): generating a PDF of search results has no natural place in the user flow. The output of Unspun is a synthesized answer you act on immediately, not a document you file away.

---

## Endpoints

| Method | Endpoint | Cost | Notes |
|--------|----------|------|-------|
| `POST` | `/api/search` | 3–4 SerpAPI + 1 Cerebras | Main pipeline |
| `POST` | `/api/trends` | up to 4 SerpAPI | Called after results render |
| `POST` | `/api/compare` | 2× the above | Two pipelines concurrently |

---

## Run it locally

### Prerequisites

- Node.js 18+
- Python 3.11+
- A [SerpAPI key](https://serpapi.com/manage-api-key)
- A [Cerebras API key](https://cloud.cerebras.ai)

### Setup

```bash
# 1. Clone
git clone https://github.com/galihkjaya/unspun.git
cd unspun

# 2. Install JS dependencies
npm install

# 3. Set up Python environment
python3 -m venv .venv
.venv/bin/pip install -r requirements-dev.txt

# 4. Configure environment
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
SERPAPI_KEY=your_serpapi_key_here
CEREBRAS_API_KEY=your_cerebras_key_here
CEREBRAS_MODEL=gpt-oss-120b
```

### Start

```bash
npm run api   # FastAPI on :8000
npm run dev   # Next.js on :3000, proxies /api/* to :8000
```

Open [http://localhost:3000](http://localhost:3000) and search anything.

### Verify

```bash
npm run check   # runs all self-checks: cache rules, bias detector, trend math, LLM parser, enrichment
npm run lint
npm run build
```

---

## Deploy your own

1. Fork this repo
2. Import into [Vercel](https://vercel.com)
3. Set the three environment variables (`SERPAPI_KEY`, `CEREBRAS_API_KEY`, `CEREBRAS_MODEL`)
4. Deploy — Vercel auto-detects Next.js and the Python serverless function from `requirements.txt`

---

## Constraints worth knowing

**Cerebras: 5 RPM / 30k TPM.** One call per search (~3–4k tokens). A retry only fires if the first response isn't valid JSON, and is skipped entirely when the function budget is too tight. `reasoning_effort="low"` is deliberate — `gpt-oss-120b` otherwise spends its budget reasoning and truncates JSON mid-object.

**Vercel: 10s function timeout (free tier).** Three SerpAPI calls share a 6.5s deadline and run concurrently. The dependent affiliate-price lookup is skipped if the budget is spent. Synthesis gets whatever remains of 9s. Reddit and Shopping failures degrade gracefully — only the organic call is required.

**Uncached SerpAPI queries** measured anywhere from 0.4s to 13s. Overruns return 504 with a retry hint; SerpAPI caches the scrape it just completed, so the retry is fast.

---

## Project layout

```
api/
  index.py                    /api/search, /api/trends, /api/compare
  services/
    schemas.py                Pydantic models, serialized camelCase
    bias_detector.py          affiliate blacklist + listicle detection
    serpapi_client.py         organic / reddit / shopping / trends
    cerebras_client.py        prompt builder, synthesis call, JSON normalization
app/
  page.tsx                    landing, results, and compare views
  components/                 Landing, LoadingSequence, SummaryCard, QuarantineZone,
                              ResultCard, Sparkline, TrendBar, CompareView, ThemeToggle
  hooks/                      useSearch, useTrends, useCompare, useLocalStorage
  lib/                        types.ts, history.ts, copy.ts
public/
  unspun-banner.png
scripts/                      self-check scripts
```

---

## Future ideas

- Server-side search history with user accounts
- Email digest of saved searches
- Browser extension for inline bias flagging
- Support for non-English queries

---

<p align="center">
  Built for the DevNetwork [API + Cloud + AI] Hackathon 2026 · SerpApi "Best AI Use Case"
</p>
```