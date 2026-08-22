"use client";

import { useEffect, useRef, useState } from "react";

import { CACHE_TTL_MS, type SearchResult, type Trend } from "@/app/lib/types";

const TRENDS_KEY = "trends_cache";

type Cached = Record<string, { timestamp: number; trends: Trend[] }>;

/** Separate key from search_history so the cached-result schema stays untouched. */
function readCache(): Cached {
  try {
    return JSON.parse(localStorage.getItem(TRENDS_KEY) ?? "{}") as Cached;
  } catch {
    return {};
  }
}

function writeCache(query: string, trends: Trend[]) {
  try {
    const fresh = Object.fromEntries(
      Object.entries(readCache()).filter(([, v]) => Date.now() - v.timestamp < CACHE_TTL_MS),
    );
    fresh[query] = { timestamp: Date.now(), trends };
    localStorage.setItem(TRENDS_KEY, JSON.stringify(fresh));
  } catch {
    // Storage unavailable — trends just re-fetch next time.
  }
}

/**
 * Fetches Google Trends for the ranked products once results are on screen.
 *
 * Separate from the search request because the product names only exist after
 * synthesis, and four live Trends scrapes measured ~6s — inside /api/search that
 * would push a cold request past Vercel's 10s function limit.
 *
 * Cached for 24h like search results, otherwise revisiting a cached search would
 * spend four SerpAPI calls to redraw the same sparklines.
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

    // Cache hit resolves here too, so state is only ever set from the async
    // callback — never synchronously in the effect body.
    void (async () => {
      const hit = readCache()[query];
      if (hit && Date.now() - hit.timestamp < CACHE_TTL_MS) {
        setByQuery((prev) => ({ ...prev, [query]: hit.trends }));
        return;
      }

      try {
        const response = await fetch("/api/trends", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ names: names.slice(0, 4) }),
          signal: controller.signal,
        });
        if (!response.ok) return;
        const payload = (await response.json()) as { trends?: Trend[] };
        const trends = payload.trends ?? [];
        writeCache(query, trends);
        setByQuery((prev) => ({ ...prev, [query]: trends }));
      } catch {
        // Trends are supplementary; a failure just leaves the cards bare.
        requested.current.delete(query);
      }
    })();

    return () => controller.abort();
  }, [query, result]);

  return query ? (byQuery[query] ?? []) : [];
}
