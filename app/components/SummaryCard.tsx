import type { SearchResult } from "@/app/lib/types";

const money = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export default function SummaryCard({ result }: { result: SearchResult }) {
  const { summary, savings, quarantined, recommendations, astroturfFlags } = result;
  const top = recommendations[0];

  return (
    <section aria-labelledby="summary-heading" className="rounded-xl border border-line bg-card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 id="summary-heading" className="font-mono text-xs tracking-widest text-muted uppercase">
          The unspun answer
        </h2>
        {savings > 0 && (
          <span className="rounded-full border border-positive/30 bg-positive/10 px-2.5 py-1 text-xs font-medium text-positive">
            Saves <span className="font-mono">{money(savings)}</span> vs the affiliate pick
          </span>
        )}
      </div>

      <p className="mt-4 text-lg leading-relaxed text-ink sm:text-xl">{summary}</p>

      {top && (
        <p className="mt-4 text-base text-ink">
          <span className="font-medium">Top pick: </span>
          {top.name}
          {top.price > 0 && <span className="font-mono text-muted"> — {money(top.price)}</span>}
        </p>
      )}

      <dl className="mt-5 flex flex-wrap gap-x-6 gap-y-2 border-t border-line pt-4 text-sm">
        <div className="flex gap-1.5">
          <dt className="text-muted">Sources stripped</dt>
          <dd className="font-mono font-medium text-negative">{quarantined.length}</dd>
        </div>
        <div className="flex gap-1.5">
          <dt className="text-muted">Products ranked</dt>
          <dd className="font-mono font-medium text-ink">{recommendations.length}</dd>
        </div>
        <div className="flex gap-1.5">
          <dt className="text-muted">Astroturf flags</dt>
          <dd className="font-mono font-medium text-ink">{astroturfFlags.length}</dd>
        </div>
      </dl>

      {astroturfFlags.length > 0 && (
        <ul className="mt-4 space-y-1.5 text-sm text-muted">
          {astroturfFlags.map((flag) => (
            <li key={flag} className="flex gap-2">
              <span aria-hidden="true" className="text-mixed">
                ▲
              </span>
              <span>{flag}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
