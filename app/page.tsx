"use client";

import { useState } from "react";

import ErrorState from "@/app/components/ErrorState";
import LoadingSkeleton from "@/app/components/LoadingSkeleton";
import QuarantineZone from "@/app/components/QuarantineZone";
import ResultCard from "@/app/components/ResultCard";
import SearchBar from "@/app/components/SearchBar";
import SearchHistory from "@/app/components/SearchHistory";
import SummaryCard from "@/app/components/SummaryCard";
import { useSearch } from "@/app/hooks/useSearch";
import { DEFAULT_QUERY } from "@/app/lib/types";

const EXAMPLES = [DEFAULT_QUERY, "best budget robot vacuum", "best mechanical keyboard under $100"];

export default function Home() {
  const { result, loading, error, history, search, retry, clearHistory, activeQuery } = useSearch();
  const [historyOpen, setHistoryOpen] = useState(false);
  const idle = !result && !loading && !error;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6">
      {/* Mobile/tablet: sticky search. Desktop: static header above the two-column grid. */}
      <header className="sticky top-0 z-10 -mx-4 border-b border-line bg-canvas/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:px-0 lg:pt-10 lg:pb-6 lg:backdrop-blur-none">
        <div className="flex items-center gap-3 lg:flex-col lg:items-stretch lg:gap-4">
          <div className="flex items-baseline gap-2 lg:justify-center">
            <span className="text-xl font-bold tracking-tight text-ink lg:text-3xl">Unspun</span>
            <span className="hidden text-sm text-muted sm:inline">Search without the sales pitch.</span>
          </div>
          <div className="min-w-0 flex-1 lg:mx-auto lg:w-full lg:max-w-2xl">
            <SearchBar onSearch={(q) => void search(q)} loading={loading} initialQuery={activeQuery ?? ""} />
          </div>
        </div>
      </header>

      <div className="lg:grid lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-8">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block">
          <div className="sticky top-6">
            <SearchHistory
              entries={history}
              activeQuery={activeQuery}
              onSelect={(q) => void search(q)}
              onClear={clearHistory}
            />
          </div>
        </aside>

        <main className="mt-5 min-w-0 space-y-4 lg:mt-0">
          {/* Tablet/mobile: history behind a toggle */}
          <div className="lg:hidden">
            <button
              type="button"
              onClick={() => setHistoryOpen((open) => !open)}
              aria-expanded={historyOpen}
              className="rounded-full border border-line px-4 py-2 text-sm font-semibold text-muted focus-visible:ring-2 focus-visible:ring-accent/40"
            >
              Recent searches {history.length > 0 && `(${history.length})`}
            </button>
            {historyOpen && (
              <div className="mt-3">
                <SearchHistory
                  entries={history}
                  activeQuery={activeQuery}
                  onSelect={(q) => {
                    setHistoryOpen(false);
                    void search(q);
                  }}
                  onClear={clearHistory}
                />
              </div>
            )}
          </div>

          {loading && <LoadingSkeleton />}
          {!loading && error && <ErrorState message={error} onRetry={retry} />}

          {!loading && !error && result && (
            <>
              <SummaryCard result={result} />
              <QuarantineZone quarantined={result.quarantined} />
              {result.recommendations.length > 0 ? (
                <div className="space-y-3">
                  {result.recommendations.map((item) => (
                    <ResultCard key={`${item.rank}-${item.name}`} item={item} />
                  ))}
                </div>
              ) : (
                <p className="rounded-2xl border border-line bg-surface p-5 text-sm text-muted">
                  No product had enough community support to rank. Try a more specific query.
                </p>
              )}
            </>
          )}

          {idle && (
            <section className="rounded-2xl border border-line bg-surface p-5 sm:p-8">
              <h2 className="text-base font-semibold text-ink">
                Google ranks affiliate listicles first. This ranks what people actually own.
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
                Unspun strips commission-driven publishers out of the results, reads the Reddit discussion underneath,
                then prices the community favourite against the affiliate pick.
              </p>
              <ul className="mt-5 flex flex-wrap gap-2">
                {EXAMPLES.map((example) => (
                  <li key={example}>
                    <button
                      type="button"
                      onClick={() => void search(example)}
                      className="rounded-full border border-line bg-canvas px-3.5 py-2 text-sm text-ink hover:border-accent/50 hover:text-accent focus-visible:ring-2 focus-visible:ring-accent/40"
                    >
                      {example}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
