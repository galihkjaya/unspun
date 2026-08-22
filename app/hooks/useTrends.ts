"use client";

import { useEffect, useRef, useState } from "react";

import type { SearchResult, Trend } from "@/app/lib/types";

/**
 * Fetches Google Trends for the ranked products once results are on screen.
 *
 * Separate from the search request because the product names only exist after
 * synthesis, and four live Trends scrapes measured ~6s — inside /api/search that
 * would push a cold request past Vercel's 10s function limit.
 *
 * Keyed by query so a stale response can never paint sparklines onto a newer
 * result, and so state is only ever set from the async callback.
 */
export function useTrends(result: SearchResult | null) {
  const [byQuery, setByQuery] = useState<Record<string, Trend[]>>({});
  const requested = useRef(new Set<string>());
  const query = result?.query ?? null;

  useEffect(() => {
    const names = result?.recommendations.map((r) => r.name).filter(Boolean) ?? [];
    if (!query || names.length === 0 || requested.current.has(query)) return;

    requested.current.add(query);
    const controller = new AbortController();

    void (async () => {
      try {
        const response = await fetch("/api/trends", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ names: names.slice(0, 4) }),
          signal: controller.signal,
        });
        if (!response.ok) return;
        const payload = (await response.json()) as { trends?: Trend[] };
        setByQuery((prev) => ({ ...prev, [query]: payload.trends ?? [] }));
      } catch {
        // Trends are supplementary; a failure just leaves the cards bare.
        requested.current.delete(query);
      }
    })();

    return () => controller.abort();
  }, [query, result]);

  return query ? (byQuery[query] ?? []) : [];
}
