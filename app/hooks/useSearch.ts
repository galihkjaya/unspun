"use client";

import { useCallback, useRef, useState } from "react";

import { useLocalStorage } from "@/app/hooks/useLocalStorage";
import { addEntry, findCached } from "@/app/lib/history";
import { HISTORY_KEY, type SearchHistoryEntry, type SearchResult } from "@/app/lib/types";

const EMPTY: SearchHistoryEntry[] = []; // stable reference for useLocalStorage

export function useSearch() {
  const { value: history, get: getHistory, set: setHistory, remove: clearHistory } = useLocalStorage(HISTORY_KEY, EMPTY);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastQuery = useRef<string | null>(null);

  const run = useCallback(
    async (query: string, { force = false } = {}) => {
      lastQuery.current = query;
      setError(null);

      if (!force) {
        const cached = findCached(getHistory(), query);
        if (cached) {
          setResult(cached);
          setLoading(false);
          return;
        }
      }

      setLoading(true);
      try {
        const response = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
        });
        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            typeof payload?.error === "string"
              ? payload.error
              : response.status >= 500
                ? "The search service is unreachable. Check that the API is running, then retry."
                : `Request failed (${response.status}).`,
          );
        }

        const fresh = payload as SearchResult;
        setResult(fresh);
        setHistory((prev) =>
          addEntry(prev, { id: crypto.randomUUID(), query, timestamp: fresh.timestamp, result: fresh }),
        );
      } catch (err) {
        setResult(null);
        setError(err instanceof Error ? err.message : "Something went wrong.");
      } finally {
        setLoading(false);
      }
    },
    [getHistory, setHistory],
  );

  const retry = useCallback(() => {
    if (lastQuery.current) void run(lastQuery.current, { force: true });
  }, [run]);

  return { result, loading, error, history, search: run, retry, clearHistory, activeQuery: result?.query ?? null };
}
