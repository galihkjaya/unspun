"use client";

import { useState } from "react";

import CompareBar from "@/app/components/CompareBar";
import CompareView from "@/app/components/CompareView";
import ErrorState from "@/app/components/ErrorState";
import Landing from "@/app/components/Landing";
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

export default function Home() {
  const { result, loading, error, history, settling, animate, search, retry, clearHistory, activeQuery } =
    useSearch();
  const trends = useTrends(result);
  const compare = useCompare();

  const [query, setQuery] = useState("");
  const [queryB, setQueryB] = useState("");
  const [comparing, setComparing] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

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

  const busy = loading || compare.loading;
  const landing = !result && !error && !busy && !compare.result && !compare.error && !comparing;

  const historyPanel = (
    <SearchHistory entries={history} activeQuery={activeQuery} onSelect={pickHistory} onClear={clearHistory} />
  );

  if (landing) {
    return (
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <div className="flex justify-end pt-5">
          <ThemeToggle />
        </div>
        <Landing
          value={query}
          onChange={setQuery}
          onSubmit={submit}
          onCompare={() => setComparing(true)}
          loading={loading}
        />
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

          {busy && (
            <LoadingSequence
              query={comparing ? `${query} vs ${queryB}` : query || activeQuery || ""}
              quarantined={settling?.quarantined ?? null}
              done={settling !== null}
            />
          )}

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
