"use client";

import QuarantineZone from "@/app/components/QuarantineZone";
import ResultCard from "@/app/components/ResultCard";
import type { SearchResult } from "@/app/lib/types";

const money = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

function Column({ result, winner }: { result: SearchResult; winner: boolean }) {
  const top = result.recommendations[0];

  return (
    <section aria-label={`Results for ${result.query}`} className="min-w-0 space-y-3">
      <div
        className={`rounded-xl border bg-card p-4 sm:p-5 ${
          winner ? "border-accent/50" : "border-line"
        }`}
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h3 className="font-mono text-xs tracking-widest text-muted uppercase">{result.query}</h3>
          {winner && (
            <span className="rounded-full bg-accent/10 px-2 py-0.5 font-mono text-[10px] tracking-wide text-accent uppercase">
              cheaper pick
            </span>
          )}
        </div>

        <p className="mt-3 text-sm leading-relaxed text-ink">{result.summary}</p>

        <dl className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 border-t border-line pt-3 text-xs">
          <div className="flex gap-1.5">
            <dt className="text-muted">Top pick</dt>
            <dd className="font-mono font-medium text-ink">
              {top?.price ? money(top.price) : "n/a"}
            </dd>
          </div>
          <div className="flex gap-1.5">
            <dt className="text-muted">Stripped</dt>
            <dd className="font-mono font-medium text-negative">{result.quarantined.length}</dd>
          </div>
          <div className="flex gap-1.5">
            <dt className="text-muted">Ranked</dt>
            <dd className="font-mono font-medium text-ink">{result.recommendations.length}</dd>
          </div>
        </dl>
      </div>

      <QuarantineZone quarantined={result.quarantined} />

      {result.recommendations.map((item, i) => (
        <ResultCard key={`${item.rank}-${item.name}`} item={item} index={i} />
      ))}
    </section>
  );
}

export default function CompareView({ a, b }: { a: SearchResult; b: SearchResult }) {
  const priceA = a.recommendations[0]?.price ?? 0;
  const priceB = b.recommendations[0]?.price ?? 0;
  // Only call a winner when both sides actually have a price.
  const cheaper = priceA > 0 && priceB > 0 ? (priceA <= priceB ? "a" : "b") : null;
  const delta = cheaper ? Math.abs(priceA - priceB) : 0;

  return (
    <div className="space-y-4">
      {cheaper && delta > 0 && (
        <p className="rounded-xl border border-line bg-card px-4 py-3 text-sm text-ink sm:px-5">
          <span className="font-medium">{(cheaper === "a" ? a : b).recommendations[0].name}</span> is{" "}
          <span className="font-mono text-positive">{money(delta)}</span> cheaper than the other side’s top
          pick.
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
        <Column result={a} winner={cheaper === "a"} />
        <Column result={b} winner={cheaper === "b"} />
      </div>
    </div>
  );
}
