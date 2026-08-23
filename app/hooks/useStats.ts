"use client";

import { useMemo } from "react";

import { useLocalStorage } from "@/app/hooks/useLocalStorage";
import { HISTORY_KEY, type SearchHistoryEntry } from "@/app/lib/types";

const EMPTY: SearchHistoryEntry[] = []; // stable reference for useLocalStorage

export interface Stats {
  speedValue: string; // "6.5" or "--" when nothing was searched today
  speedUnit: string; // "s" | "ms" | ""
  affiliatesBlocked: number;
  sourcesRead: number;
}

function isToday(timestamp: string, now: Date): boolean {
  const date = new Date(timestamp);
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

/** "6.5s" once past a second, raw ms below that. */
export function formatSpeed(avgMs: number): { value: string; unit: string } {
  if (avgMs >= 1000) return { value: (avgMs / 1000).toFixed(1), unit: "s" };
  return { value: String(Math.round(avgMs)), unit: "ms" };
}

/** Pure derivation from history so it stays testable without a component. */
export function computeStats(entries: SearchHistoryEntry[], now = new Date()): Stats {
  const today = entries.filter((entry) => isToday(entry.timestamp, now));

  const durations = today
    .map((entry) => entry.duration_ms)
    .filter((ms): ms is number => typeof ms === "number" && Number.isFinite(ms));
  const speed =
    durations.length > 0
      ? formatSpeed(durations.reduce((sum, ms) => sum + ms, 0) / durations.length)
      : { value: "--", unit: "" };

  const affiliatesBlocked = today.reduce((sum, entry) => sum + entry.result.quarantined.length, 0);

  // TODO: the stored schema has no exact source count — each recommendation
  // stands in for ~3 read sources (its reddit evidence plus a shopping lookup).
  const sourcesRead = today.reduce((sum, entry) => sum + entry.result.recommendations.length * 3, 0);

  return { speedValue: speed.value, speedUnit: speed.unit, affiliatesBlocked, sourcesRead };
}

/**
 * Today's search metrics for the stats bar. Re-renders on mount and whenever
 * localStorage changes: same-tab writes through the shared useLocalStorage
 * listener registry, cross-tab ones through its storage-event subscription.
 */
export function useStats(): Stats {
  const { value: history } = useLocalStorage(HISTORY_KEY, EMPTY);
  return useMemo(() => computeStats(history), [history]);
}
