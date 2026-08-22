import Sparkline from "@/app/components/Sparkline";
import type { Trend, TrendDirection } from "@/app/lib/types";

const ARROW: Record<TrendDirection, string> = { up: "↑", down: "↓", flat: "→" };
const TEXT: Record<TrendDirection, string> = {
  up: "text-positive",
  down: "text-negative",
  flat: "text-muted",
};

export function TrendBadge({ trend }: { trend: Trend }) {
  return (
    <span className={`inline-flex items-center gap-1 font-mono text-xs ${TEXT[trend.direction]}`}>
      <span aria-hidden="true">{ARROW[trend.direction]}</span>
      {trend.change}
    </span>
  );
}

/** Compact interest comparison shown above the results once trends resolve. */
export default function TrendBar({ trends }: { trends: Trend[] }) {
  const withData = trends.filter((t) => t.data.length >= 2);
  if (withData.length === 0) return null;

  return (
    <section
      aria-labelledby="trend-heading"
      className="animate-rise rounded-xl border border-line bg-card px-4 py-3.5 sm:px-5"
    >
      <h2 id="trend-heading" className="font-mono text-xs tracking-widest text-muted uppercase">
        <span aria-hidden="true">📈</span> Search interest — last 90 days
      </h2>
      <ul className="mt-3 space-y-2">
        {withData.map((trend) => (
          <li key={trend.name} className="flex items-center gap-3 text-sm">
            <span className="min-w-0 flex-1 truncate text-ink">{trend.name}</span>
            <Sparkline
              data={trend.data}
              direction={trend.direction}
              label={`${trend.name}: ${trend.change}`}
            />
            <span className="w-28 text-right">
              <TrendBadge trend={trend} />
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
