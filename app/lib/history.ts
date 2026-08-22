import { CACHE_TTL_MS, type SearchHistoryEntry, type SearchResult } from "./types";

export const MAX_HISTORY = 20;

/** Cached result for `query` if it was fetched within the TTL, else null. */
export function findCached(
  history: SearchHistoryEntry[],
  query: string,
  now = Date.now(),
): SearchResult | null {
  const hit = history.find(
    (entry) => entry.query === query && now - new Date(entry.timestamp).getTime() < CACHE_TTL_MS,
  );
  return hit ? hit.result : null;
}

/** Newest first, one entry per query, capped at MAX_HISTORY. */
export function addEntry(
  history: SearchHistoryEntry[],
  entry: SearchHistoryEntry,
): SearchHistoryEntry[] {
  return [entry, ...history.filter((e) => e.query !== entry.query)].slice(0, MAX_HISTORY);
}
