# Unspun

Search without the sales pitch.

Google ranks affiliate listicles first because of domain authority, not because the reviews are legitimate. Unspun strips those publishers out of a product search, reads the Reddit discussion underneath, prices the community favourite against the affiliate pick, and returns one synthesized answer.

Built for the DevNetwork [API + Cloud + AI] Hackathon 2026 — SerpApi "Best AI Use Case".

## How it works

```
query
  │
  ├─ SerpAPI Google Search        → bias audit: quarantined[] + clean[]   ┐
  ├─ SerpAPI Google Search        → Reddit-scoped sentiment snippets      ├─ parallel
  └─ SerpAPI Google Shopping      → live pricing                         ┘
  │
  ├─ SerpAPI Google Shopping      → price of the top affiliate pick (depends on the audit)
  │
  ├─ Cerebras (one call)          → summary, ranking, savings delta, astroturf flags
  │
  └─ POST /api/trends             → Google Trends per ranked product (after results paint)
```

The bias audit is deterministic Python, not an LLM call: a hardcoded affiliate blacklist plus a listicle title pattern (`api/services/bias_detector.py`). The single Cerebras call handles everything that needs judgement — sentiment synthesis, ranking, astroturf detection, the savings calculation, and tightening the quarantine reasons.

Product thumbnails and per-product Reddit evidence links are matched deterministically in `api/index.py` by distinctive-token overlap, so a card only ever cites a thread that actually mentions it.

## Endpoints

| Endpoint | Cost | Notes |
| --- | --- | --- |
| `POST /api/search` | 3-4 SerpAPI + 1 Cerebras | The main pipeline. |
| `POST /api/trends` | up to 4 SerpAPI | Called after results render; product names only exist post-synthesis. |
| `POST /api/compare` | 2× the above | Two pipelines concurrently, so 2 of the 5 requests/min. |

## Stack

- Next.js (App Router) + TypeScript + Tailwind, client-side only
- FastAPI on a Vercel Python Serverless Function (`api/index.py`)
- Cerebras `gpt-oss-120b` for synthesis, SerpAPI for all search data
- No database — search history, results, and trends are cached in `localStorage` for 24h
- Dark/light theme from `prefers-color-scheme`, overridable, applied before first paint

## Setup

```bash
npm install
python3 -m venv .venv
.venv/bin/pip install -r requirements-dev.txt   # requirements.txt + local dev server
cp .env.local.example .env.local                # then fill in your keys
```

`.env.local`:

```
SERPAPI_KEY=          # serpapi.com/manage-api-key
CEREBRAS_API_KEY=     # cloud.cerebras.ai
CEREBRAS_MODEL=gpt-oss-120b
```

Run both processes:

```bash
npm run api    # FastAPI on :8000
npm run dev    # Next.js on :3000, proxies /api/* to :8000
```

The dev proxy lives in `next.config.ts` and only applies when `NODE_ENV=development`. In production `vercel.json` routes `/api/*` to the Python function instead.

## Verify

```bash
npm run check   # self-checks: cache rules, bias detector, trend math, LLM parser, enrichment
npm run lint
npm run build
```

## Deploy

Import the repo into Vercel and set the three environment variables. Vercel detects Next.js and the Python function in the same project; `requirements.txt` at the root is installed automatically.

## Constraints worth knowing

**Cerebras: 5 RPM / 30k TPM.** One call per search, ~3-4k tokens. A second call only fires if the first response is not parseable JSON, and is skipped entirely when the remaining function budget cannot fit it. Repeat searches are served from `localStorage` for 24 hours, so re-running a demo query costs nothing. A 429 returns a clear message rather than blocking on SDK backoff.

`reasoning_effort="low"` is deliberate: `gpt-oss-120b` otherwise spends its completion budget reasoning and truncates the JSON mid-object.

**Vercel: 10s function timeout on the free tier.** The three searches share a 6.5s deadline and run concurrently; the dependent affiliate-price lookup is skipped if the budget is already spent, and synthesis gets whatever remains of 9s. Reddit and Shopping failures degrade to empty rather than failing the search — only the organic call is required, since it drives the bias audit.

Trends are a separate endpoint for the same reason: the product names only exist after synthesis, and four live Trends scrapes measured ~6s on their own.

**Uncached SerpAPI queries are scraped live** and were measured taking anywhere from 0.4s to 13s. Overruns return 504 with a retry hint; SerpAPI caches the scrape it just completed, so the retry returns in about a second.

## Layout

```
api/
  index.py                      /api/search, /api/trends, /api/compare
  services/
    schemas.py                  Pydantic models, serialized camelCase
    bias_detector.py            affiliate blacklist + listicle detection
    serpapi_client.py           organic / reddit / shopping / trends
    cerebras_client.py          prompt builder, synthesis call, JSON normalization
app/
  page.tsx                      landing, results, and compare views
  components/                   Landing, LoadingSequence, SummaryCard, QuarantineZone,
                                ResultCard, Sparkline, TrendBar, CompareView, ThemeToggle, …
  hooks/                        useSearch, useTrends, useCompare, useLocalStorage
  lib/                          types.ts, history.ts (+ history.check.ts), copy.ts
```

Every non-trivial piece of logic carries a runnable self-check; `npm run check` executes all of them.
