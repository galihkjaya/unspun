import type { SearchResult } from "@/app/lib/types";

const money = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export default function SummaryCard({ result }: { result: SearchResult }) {
  const { summary, savings, quarantined, recommendations, astroturfFlags } = result;

  return (
    <section aria-labelledby="summary-heading" className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 id="summary-heading" className="text-sm font-semibold tracking-wide text-muted uppercase">
          The unspun answer
        </h2>
        {savings > 0 && (
          <span className="rounded-full bg-clean/10 px-3 py-1 text-sm font-semibold text-clean">
            Saves {money(savings)} vs the affiliate pick
          </span>
        )}
      </div>

      <p className="mt-3 text-lg leading-relaxed text-ink">{summary}</p>

      {recommendations[0] && (
        <p className="mt-4 text-base text-ink">
          <span className="font-semibold">Top pick: </span>
          {recommendations[0].name}
          {recommendations[0].price > 0 && <span className="text-muted"> — {money(recommendations[0].price)}</span>}
        </p>
      )}

      <dl className="mt-5 flex flex-wrap gap-x-6 gap-y-2 border-t border-line pt-4 text-sm">
        <div className="flex gap-1.5">
          <dt className="text-muted">Sources stripped</dt>
          <dd className="font-semibold text-strip">{quarantined.length}</dd>
        </div>
        <div className="flex gap-1.5">
          <dt className="text-muted">Products ranked</dt>
          <dd className="font-semibold text-ink">{recommendations.length}</dd>
        </div>
        <div className="flex gap-1.5">
          <dt className="text-muted">Astroturf flags</dt>
          <dd className="font-semibold text-ink">{astroturfFlags.length}</dd>
        </div>
      </dl>

      {astroturfFlags.length > 0 && (
        <ul className="mt-4 space-y-1.5 text-sm text-muted">
          {astroturfFlags.map((flag) => (
            <li key={flag} className="flex gap-2">
              <span aria-hidden="true" className="text-strip">
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
