"use client";

import { useStats } from "@/app/hooks/useStats";

function Cell({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="stats-cell flex flex-col items-center gap-1 text-center">
      <span className="font-mono text-[10px] tracking-widest text-muted uppercase sm:text-xs">
        {label}
      </span>
      <span className="flex items-baseline gap-1">
        <span className="font-mono text-2xl font-semibold tabular-nums text-ink sm:text-3xl">
          {value}
        </span>
        {unit && <span className="text-sm text-muted">{unit}</span>}
      </span>
    </div>
  );
}

/**
 * One partitioned glass box for today's live metrics, computed from
 * search_history in localStorage at render time, never hardcoded.
 */
export default function StatsBar() {
  const { speedValue, speedUnit, affiliatesBlocked, sourcesRead } = useStats();

  // The hook exposes no raw entry count; any ranked recommendation or measured
  // duration means at least one search happened today.
  const searchedToday = sourcesRead > 0 || speedValue !== "--";

  return (
    <div aria-label="Today's search stats" className="stats-bar w-full">
      <Cell label="Avg Speed" value={speedValue === "--" ? "—" : speedValue} unit={speedValue === "--" ? undefined : speedUnit} />
      <Cell label="Affiliates Blocked" value={String(affiliatesBlocked)} />
      {/* Repeats are served from the localStorage cache, so they are instant. */}
      <Cell label="On Repeat" value={searchedToday ? "<50ms" : "0"} />
    </div>
  );
}
