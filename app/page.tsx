"use client";

import { useRef, useState } from "react";

import CompareBar from "@/app/components/CompareBar";
import CompareView from "@/app/components/CompareView";
import ErrorState from "@/app/components/ErrorState";
import LoadingSequence from "@/app/components/LoadingSequence";
import QuarantineZone from "@/app/components/QuarantineZone";
import ResultCard from "@/app/components/ResultCard";
import SearchBar from "@/app/components/SearchBar";
import SearchHistory from "@/app/components/SearchHistory";
import StatsBar from "@/app/components/StatsBar";
import SummaryCard from "@/app/components/SummaryCard";
import ThemeToggle from "@/app/components/ThemeToggle";
import TrendBar from "@/app/components/TrendBar";
import { useCompare } from "@/app/hooks/useCompare";
import { useSearch } from "@/app/hooks/useSearch";
import { useTrends } from "@/app/hooks/useTrends";
import { DEMO_QUERIES } from "@/app/lib/copy";

const BAD_ROWS = [
  { domain: "forbes.com", title: "10 Best Espresso Machines (We Tested!)", sponsored: true },
  { domain: "cnet.com", title: "Best Espresso Machines 2024", sponsored: false },
  { domain: "bhg.com", title: "Top 15 Espresso Machines Tested", sponsored: false },
] as const;

const HOW_IT_WORKS = [
  {
    n: "01",
    title: "Strip",
    body: "Remove 8+ affiliate publishers from organic results before a word is read.",
  },
  {
    n: "02",
    title: "Read",
    body: "Scan Reddit consensus in real-time via SerpAPI — what owners actually say.",
  },
  {
    n: "03",
    title: "Price",
    body: "Cross-check live shopping data so the community pick meets ground truth.",
  },
] as const;

export default function Home() {
  const { result, loading, error, history, settling, animate, search, retry, clearHistory, activeQuery } =
    useSearch();
  const trends = useTrends(result);
  const compare = useCompare();

  const [query, setQuery] = useState("");
  const [queryB, setQueryB] = useState("");
  const [comparing, setComparing] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const heroInput = useRef<HTMLInputElement>(null);

  const submit = (next: string) => {
    if (next.trim().length >= 2) void search(next.trim());
  };

  const pickHistory = (next: string) => {
    setQuery(next);
    setHistoryOpen(false);
    void search(next);
  };

  const exitCompare = () => {
    setComparing(false);
    compare.reset();
  };

  const focusHero = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    heroInput.current?.focus();
  };

  const busy = loading || compare.loading;
  const landing = !result && !error && !busy && !compare.result && !compare.error && !comparing;

  const historyPanel = (
    <SearchHistory entries={history} activeQuery={activeQuery} onSelect={pickHistory} onClear={clearHistory} />
  );

  if (landing) {
    return (
      <div className="relative">
        <nav className="glass-card fixed inset-x-0 top-0 z-20 rounded-none border-x-0 border-t-0">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
            <span className="font-serif text-xl font-bold tracking-tight text-ink">
              Unspun<span className="serif-italic">.</span>
            </span>
            <div className="hidden items-center gap-8 text-sm sm:flex">
              <a href="#how-it-works" className="text-muted transition-colors hover:text-ink">
                How it works
              </a>
              <a href="#problem" className="text-muted transition-colors hover:text-ink">
                The Problem
              </a>
            </div>
            <ThemeToggle />
          </div>
        </nav>

        {/* Hero */}
        <section className="flex flex-col items-center px-5 pt-36 pb-24 text-center sm:px-8">
          <p className="font-mono text-xs tracking-widest text-muted uppercase">AI-Powered Search</p>
          <h1 className="mt-5 font-serif text-6xl leading-none font-bold tracking-tight text-ink md:text-8xl">
            Search without
            <br />
            <em className="serif-italic font-normal">the sales pitch.</em>
          </h1>
          <p className="mt-6 max-w-xl leading-relaxed text-muted">
            Unspun strips affiliate listicles out of your search, reads the Reddit discussion
            underneath, and prices the community favourite against the affiliate pick.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit(query);
            }}
            className="mt-10 flex w-full max-w-xl gap-3"
          >
            <input
              ref={heroInput}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="What are you trying to buy?"
              className="search-input"
              autoFocus
            />
            <button type="submit" className="btn-primary shrink-0 rounded-xl px-5 text-sm font-medium">
              Unspin →
            </button>
          </form>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <span className="text-sm text-muted">Try:</span>
            {DEMO_QUERIES.map((demo) => (
              <button key={demo} type="button" onClick={() => setQuery(demo)} className="chip">
                {demo}
              </button>
            ))}
          </div>

          <div className="mt-10 w-full max-w-xl">
            <StatsBar />
          </div>
        </section>

        {/* Problem / Solution */}
        <section id="problem" className="border-t border-line px-5 py-24 sm:px-8">
          <div className="mx-auto grid max-w-5xl gap-5 md:grid-cols-2">
            <div className="glass-card rounded-2xl p-7">
              <div className="flex items-center gap-2.5">
                <span aria-hidden="true" className="size-2 rounded-full bg-negative" />
                <span className="text-sm font-medium text-ink">Standard Search</span>
                <span className="ml-auto rounded-full border border-negative/20 bg-negative/10 px-2.5 py-0.5 text-xs text-negative">
                  SEO Spam
                </span>
              </div>
              <ul className="mt-5 space-y-3">
                {BAD_ROWS.map((row) => (
                  <li key={row.domain} className="rounded-xl border border-line bg-card p-4">
                    <p className="flex items-center justify-between gap-3">
                      <span className="font-mono text-xs text-muted">{row.domain}</span>
                      {row.sponsored && (
                        <span className="rounded-full border border-mixed/20 bg-mixed/10 px-2 py-0.5 text-[11px] text-mixed">
                          Sponsored
                        </span>
                      )}
                    </p>
                    <p className="mt-1 text-sm text-ink">{row.title}</p>
                  </li>
                ))}
              </ul>
              <p className="mt-5 flex items-center gap-2 text-xs text-negative">
                <span aria-hidden="true">⚠</span> Ranked by domain authority &amp; commission
              </p>
            </div>

            <div className="glass-card rounded-2xl p-7">
              <div className="flex items-center gap-2.5">
                <span aria-hidden="true" className="size-2 rounded-full bg-positive" />
                <span className="text-sm font-medium text-ink">Unspun</span>
                <span className="ml-auto rounded-full border border-positive/20 bg-positive/10 px-2.5 py-0.5 text-xs text-positive">
                  Community Verified
                </span>
              </div>
              <p className="mt-5 rounded-lg border border-negative/20 bg-negative/5 p-3 text-xs leading-relaxed text-muted">
                🚫 Stripped: forbes.com, cnet.com, bhg.com — affiliate pattern detected
              </p>
              <ul className="mt-3 space-y-3">
                <li className="rounded-xl border border-line bg-card p-4">
                  <p className="flex flex-wrap items-baseline gap-x-3">
                    <span className="font-mono text-sm text-muted">#1</span>
                    <span className="font-medium text-ink">Breville Bambino Plus</span>
                    <span className="font-mono text-sm text-ink">$499</span>
                    <span className="rounded-full border border-positive/20 bg-positive/10 px-2 py-0.5 text-[11px] text-positive">
                      Positive
                    </span>
                  </p>
                  <p className="mt-1 pl-7 text-xs text-muted">847 Reddit mentions</p>
                  <p className="serif-italic mt-2 pl-7 text-sm text-muted">
                    &ldquo;Café-quality shots after a two-week break-in. Temperature stability is the
                    star.&rdquo;
                  </p>
                  <p className="mt-1 pl-7 text-xs text-muted">Caveat: steam wand has a learning curve.</p>
                </li>
                <li className="rounded-xl border border-line bg-card p-4">
                  <p className="flex flex-wrap items-baseline gap-x-3">
                    <span className="font-mono text-sm text-muted">#2</span>
                    <span className="font-medium text-ink">Gaggia Classic Pro</span>
                    <span className="font-mono text-sm text-ink">$449</span>
                    <span className="rounded-full border border-positive/20 bg-positive/10 px-2 py-0.5 text-[11px] text-positive">
                      Positive
                    </span>
                  </p>
                  <p className="mt-1 pl-7 text-xs text-muted">612 Reddit mentions</p>
                </li>
              </ul>
              <p className="mt-5 flex items-center gap-2 text-xs text-positive">
                <span aria-hidden="true">✓</span> Ranked by what owners actually say
              </p>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="border-t border-line px-5 py-24 sm:px-8">
          <div className="mx-auto max-w-5xl">
            <p className="font-mono text-xs tracking-widest text-muted uppercase">How It Works</p>
            <h2 className="mt-4 font-serif text-4xl font-bold tracking-tight text-ink md:text-5xl">
              How we find <em className="serif-italic font-normal">the truth.</em>
            </h2>
            <ol className="mt-12 grid gap-5 sm:grid-cols-3">
              {HOW_IT_WORKS.map((step) => (
                <li key={step.n} className="glass-card feature-card rounded-2xl p-7">
                  <span className="font-mono text-sm text-muted">{step.n}</span>
                  <h3 className="mt-3 font-serif text-2xl font-bold text-ink">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-line px-5 py-28 text-center sm:px-8">
          <h2 className="font-serif text-5xl font-bold tracking-tight text-ink md:text-7xl">
            Stop reading ads.
            <br />
            <em className="serif-italic font-normal text-muted">Start getting answers.</em>
          </h2>
          <p className="mx-auto mt-6 max-w-md text-muted">
            One honest answer, ranked by owners and priced against reality — every time you search.
          </p>
          <button
            type="button"
            onClick={focusHero}
            className="btn-primary mt-9 rounded-full px-7 py-3.5 text-sm font-medium"
          >
            Start Searching Now →
          </button>
        </section>

        <footer className="border-t border-line px-5 py-10 sm:px-8">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
            <span className="font-serif text-lg font-bold text-ink">Unspun.</span>
            <nav className="flex items-center gap-6 text-sm">
              <a
                href="https://github.com/galihkjaya/unspun"
                target="_blank"
                rel="noreferrer"
                className="text-muted transition-colors hover:text-ink"
              >
                GitHub
              </a>
              <a href="#" className="text-muted transition-colors hover:text-ink">
                Privacy
              </a>
              <a href="#" className="text-muted transition-colors hover:text-ink">
                Terms
              </a>
            </nav>
            <p className="text-xs text-muted">© 2026 Unspun. Built for human truth.</p>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
      <header className="sticky top-0 z-10 -mx-5 border-b border-line bg-bg/90 px-5 py-3 backdrop-blur sm:-mx-8 sm:px-8 lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:px-0 lg:py-6 lg:backdrop-blur-none">
        <div className="flex items-center gap-3">
          <span className="shrink-0 text-lg font-bold tracking-tight text-ink lg:text-xl">
            Unspun<span className="text-accent">.</span>
          </span>
          <div className="min-w-0 flex-1">
            {comparing ? (
              <CompareBar
                queryA={query}
                queryB={queryB}
                onChangeA={setQuery}
                onChangeB={setQueryB}
                onSubmit={() => void compare.compare(query.trim(), queryB.trim())}
                onCancel={exitCompare}
                loading={compare.loading}
              />
            ) : (
              <SearchBar
                value={query}
                onChange={setQuery}
                onSubmit={() => submit(query)}
                loading={loading}
                size="sm"
              />
            )}
          </div>
          {!comparing && (
            <button
              type="button"
              onClick={() => setComparing(true)}
              className="hidden shrink-0 rounded-full border border-line px-4 py-2.5 text-sm text-muted transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-accent/40 sm:block"
            >
              Compare
            </button>
          )}
          <ThemeToggle />
        </div>
      </header>

      <div className="mt-5">
        <StatsBar />
      </div>

      <div className="pb-20 lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-8">
        <aside className="hidden lg:block">
          <div className="sticky top-6">{historyPanel}</div>
        </aside>

        <main className="mt-5 min-w-0 space-y-4 lg:mt-0">
          <div className="lg:hidden">
            <button
              type="button"
              onClick={() => setHistoryOpen((open) => !open)}
              aria-expanded={historyOpen}
              className="rounded-full border border-line px-4 py-2 text-sm text-muted transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-accent/40"
            >
              Recent searches {history.length > 0 && `(${history.length})`}
            </button>
            {historyOpen && <div className="mt-3">{historyPanel}</div>}
          </div>

          {busy && <LoadingSequence done={settling !== null} />}

          {!busy && comparing && compare.error && (
            <ErrorState
              message={compare.error}
              onRetry={() => void compare.compare(query.trim(), queryB.trim())}
            />
          )}
          {!busy && !comparing && error && <ErrorState message={error} onRetry={retry} />}

          {!busy && comparing && compare.result && (
            <CompareView a={compare.result.a} b={compare.result.b} />
          )}

          {!busy && comparing && !compare.result && !compare.error && (
            <p className="rounded-xl border border-line bg-card p-5 text-sm text-muted">
              Enter two products to compare. Each side runs the full pipeline, so a comparison costs two of
              the five requests per minute.
            </p>
          )}

          {!busy && !comparing && !error && result && (
            <>
              <TrendBar trends={trends} />
              <SummaryCard result={result} />
              <QuarantineZone quarantined={result.quarantined} />
              {result.recommendations.length > 0 ? (
                <div className="space-y-3">
                  {result.recommendations.map((item, i) => (
                    <ResultCard
                      key={`${item.rank}-${item.name}`}
                      item={item}
                      index={animate ? i : undefined}
                      trend={trends.find((t) => t.name === item.name)}
                    />
                  ))}
                </div>
              ) : (
                <p className="rounded-xl border border-line bg-card p-5 text-sm text-muted">
                  No product had enough community support to rank. Try a more specific query.
                </p>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
