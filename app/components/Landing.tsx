"use client";

import SearchBar from "@/app/components/SearchBar";
import { DEMO_QUERIES, GOOGLE_RESULTS, STATS, STEPS } from "@/app/lib/copy";

export default function Landing({
  value,
  onChange,
  onSubmit,
  loading,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (query: string) => void;
  loading: boolean;
}) {
  return (
    <>
      <section className="flex min-h-[88svh] flex-col justify-center py-16">
        <h1 className="text-5xl font-bold tracking-tight text-ink sm:text-7xl">Unspun.</h1>
        <p className="mt-3 text-lg text-muted sm:text-xl">Search without the sales pitch.</p>

        <div className="mt-10 max-w-2xl">
          <SearchBar
            value={value}
            onChange={onChange}
            onSubmit={() => onSubmit(value.trim())}
            loading={loading}
            autoFocus
          />

          <ul className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-2 text-sm text-muted">
            <li className="text-muted">Try:</li>
            {DEMO_QUERIES.map((query) => (
              <li key={query}>
                <button
                  type="button"
                  onClick={() => onChange(query)}
                  className="rounded-full border border-line px-3 py-1.5 text-left transition-colors hover:border-accent/50 hover:text-accent focus-visible:ring-2 focus-visible:ring-accent/40"
                >
                  {query}
                </button>
              </li>
            ))}
          </ul>

          <ul className="mt-8 flex flex-wrap gap-2">
            {STATS.map((stat) => (
              <li
                key={stat.label}
                className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs text-muted"
              >
                <span aria-hidden="true">{stat.icon}</span>
                <span className="font-mono font-medium text-ink">{stat.value}</span>
                <span>{stat.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="contrast-heading" className="border-t border-line py-16 sm:py-24">
        <h2 id="contrast-heading" className="sr-only">
          What Google shows you versus what Unspun shows you
        </h2>

        <div className="grid gap-6 sm:grid-cols-2 sm:gap-10">
          <div className="opacity-60">
            <p className="font-mono text-xs tracking-widest text-muted uppercase">What Google shows you</p>
            <ul className="mt-5 space-y-3">
              {GOOGLE_RESULTS.map((item) => (
                <li key={item.rank} className="flex gap-3 text-ink line-through decoration-muted/60">
                  <span className="font-mono text-muted">#{item.rank}</span>
                  <span>{item.source}</span>
                </li>
              ))}
            </ul>
            <p className="mt-5 flex items-center gap-2 text-sm text-negative">
              <span aria-hidden="true">⚠</span> Ranked by domain authority and commission
            </p>
          </div>

          <div>
            <p className="font-mono text-xs tracking-widest text-accent uppercase">What Unspun shows you</p>
            <div className="mt-5 rounded-xl border border-line bg-card p-5">
              <p className="flex items-baseline gap-3">
                <span className="font-mono text-muted">#1</span>
                <span className="text-lg font-semibold text-ink">Levoit Core 300</span>
              </p>
              <ul className="mt-3 space-y-1.5 pl-8 text-sm text-muted">
                <li>↳ 847 Reddit mentions across 12 threads</li>
                <li>
                  ↳ <span className="font-mono text-ink">$99</span> · <span className="text-positive">Positive</span>
                </li>
              </ul>
            </div>
            <p className="mt-5 flex items-center gap-2 text-sm text-positive">
              <span aria-hidden="true">✓</span> Ranked by what owners actually say
            </p>
          </div>
        </div>
      </section>

      <section aria-labelledby="how-heading" className="border-t border-line py-16 sm:py-24">
        <h2 id="how-heading" className="font-mono text-xs tracking-widest text-muted uppercase">
          How it works
        </h2>
        <ol className="mt-8 grid gap-8 sm:grid-cols-3 sm:gap-6">
          {STEPS.map((step) => (
            <li key={step.title}>
              <span aria-hidden="true" className="text-2xl text-accent">
                {step.n}
              </span>
              <h3 className="mt-2 text-base font-semibold text-ink">{step.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
