/**
 * Self-check for the localStorage cache rules. Run: npm run check:history
 */
import assert from "node:assert/strict";

import { addEntry, findCached, MAX_HISTORY } from "./history";
import { CACHE_TTL_MS, type SearchHistoryEntry, type SearchResult } from "./types";

const NOW = Date.UTC(2026, 7, 22, 12, 0, 0);

const result = (query: string) =>
  ({
    query,
    summary: "s",
    quarantined: [],
    recommendations: [],
    savings: 0,
    astroturfFlags: [],
    timestamp: new Date(NOW).toISOString(),
  }) satisfies SearchResult;

const entry = (query: string, ageMs = 0): SearchHistoryEntry => ({
  id: query,
  query,
  timestamp: new Date(NOW - ageMs).toISOString(),
  result: result(query),
});

// fresh hit / stale miss / unknown miss
const history = [entry("fresh"), entry("stale", CACHE_TTL_MS + 1_000)];
assert.equal(findCached(history, "fresh", NOW)?.query, "fresh");
assert.equal(findCached(history, "stale", NOW), null);
assert.equal(findCached(history, "never searched", NOW), null);
// exactly at the TTL boundary is expired
assert.equal(findCached([entry("edge", CACHE_TTL_MS)], "edge", NOW), null);

// newest first, deduplicated by query
const deduped = addEntry(history, entry("fresh"));
assert.deepEqual(
  deduped.map((e) => e.query),
  ["fresh", "stale"],
);

// cap enforced, oldest dropped
const full = Array.from({ length: MAX_HISTORY }, (_, i) => entry(`q${i}`));
const capped = addEntry(full, entry("newest"));
assert.equal(capped.length, MAX_HISTORY);
assert.equal(capped[0].query, "newest");
assert.equal(
  capped.some((e) => e.query === `q${MAX_HISTORY - 1}`),
  false,
);

console.log("history self-check OK");
