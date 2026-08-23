"use client";

import { useStats } from "@/app/hooks/useStats";

function StatCell({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-1 px-3 py-4 text-center sm:px-4">
      <span className="font-mono text-[10px] tracking-widest text-muted uppercase sm:text-xs">
        {label}
      </span>
      <span className="flex items-baseline gap-1">
        <span className="text-2xl font-semibold tabular-nums text-ink sm:text-3xl">{value}</span>
        {unit && <span className="text-sm text-muted">{unit}</span>}
      </span>
    </div>
  );
}

/**
 * One partitioned box for today's live metrics — average response time,
 * affiliates stripped, sources read. All computed from search_history in
 * localStorage at render time, never hardcoded.
 */
export default function StatsBar() {
  const { speedValue, speedUnit, affiliatesBlocked, sourcesRead } = useStats();

  return (
    <div
      aria-label="Today's search stats"
      className="grid grid-cols-3 divide-x divide-line overflow-hidden rounded-xl border border-line bg-card"
    >
      <StatCell label="Avg Speed" value={speedValue} unit={speedUnit} />
      <StatCell label="Affiliates Blocked" value={String(affiliatesBlocked)} />
      <StatCell label="Sources Read" value={String(sourcesRead)} />
    </div>
  );
}
