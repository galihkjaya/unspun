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
  └─ Cerebras (one call)          → summary, ranking, savings delta, astroturf flags
```

The bias audit is deterministic Python, not an LLM call: a hardcoded affiliate blacklist plus a listicle title pattern (`api/services/bias_detector.py`). The single Cerebras call handles everything that needs judgement — sentiment synthesis, ranking, astroturf detection, the savings calculation, and tightening the quarantine reasons.

## Stack

- Next.js (App Router) + TypeScript + Tailwind, client-side only
- FastAPI on a Vercel Python Serverless Function (`api/index.py`)
- Cerebras `gpt-oss-120b` for synthesis, SerpAPI for all search data
- No database — search history and the 24h result cache live in `localStorage`

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
npm run check   # self-checks: cache rules, bias detector, LLM response parser
npm run lint
npm run build
```

## Deploy

Import the repo into Vercel and set the three environment variables. Vercel detects Next.js and the Python function in the same project; `requirements.txt` at the root is installed automatically. No other configuration is needed.

## Constraints worth knowing

**Cerebras: 5 RPM / 30k TPM.** One call per search, ~3-4k tokens. A second call only fires if the first response is not parseable JSON. Repeat searches are served from `localStorage` for 24 hours, so re-running a demo query costs nothing. A 429 returns a clear message rather than blocking on SDK backoff.

**Vercel: 10s function timeout on the free tier.** The three searches share a 6.5s deadline and run concurrently; the dependent affiliate-price lookup is skipped if the budget is already spent. Reddit and Shopping failures degrade to empty rather than failing the search — only the organic call is required, since it drives the bias audit.

**Uncached SerpAPI queries are scraped live** and were measured taking anywhere from 0.4s to 13s. Overruns return 504 with a retry hint; SerpAPI caches the scrape it just completed, so the retry returns in about a second.

## Layout

```
api/
  index.py                      POST /api/search — pipeline orchestration
  services/
    schemas.py                  Pydantic models, serialized camelCase
    bias_detector.py            affiliate blacklist + listicle detection
    serpapi_client.py           get_organic / get_reddit_sentiment / get_shopping
    cerebras_client.py          prompt builder, synthesis call, JSON normalization
app/
  page.tsx                      search page
  components/                   SearchBar, SummaryCard, QuarantineZone, ResultCard, …
  hooks/                        useLocalStorage, useSearch
  lib/                          types.ts, history.ts (+ history.check.ts)
```

Each Python service and the cache logic carry a runnable self-check; `npm run check` executes all three.
