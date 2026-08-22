import type { Recommendation, Sentiment } from "@/app/lib/types";

const SENTIMENT: Record<Sentiment, { label: string; className: string }> = {
  positive: { label: "Positive", className: "bg-clean/10 text-clean" },
  mixed: { label: "Mixed", className: "bg-amber-500/15 text-amber-700" },
  negative: { label: "Negative", className: "bg-strip/10 text-strip" },
};

const money = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });

export default function ResultCard({ item }: { item: Recommendation }) {
  const sentiment = SENTIMENT[item.sentiment];

  return (
    <article className="rounded-2xl border border-line bg-canvas p-4 transition-colors hover:border-accent/40 sm:p-5">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span aria-hidden="true" className="text-sm font-semibold text-muted">
          #{item.rank}
        </span>
        <h3 className="min-w-0 flex-1 text-lg font-semibold text-ink">
          <span className="sr-only">Rank {item.rank}: </span>
          {item.name}
        </h3>
        {item.price > 0 && <span className="text-lg font-semibold text-ink">{money(item.price)}</span>}
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs">
        <span className={`rounded-full px-2.5 py-1 font-semibold ${sentiment.className}`}>{sentiment.label}</span>
        <span className="rounded-full bg-surface px-2.5 py-1 text-muted">
          {item.mentions} Reddit {item.mentions === 1 ? "mention" : "mentions"}
        </span>
      </div>

      {item.communityQuote && (
        <blockquote className="mt-3 border-l-2 border-line pl-3 text-sm leading-relaxed text-ink italic">
          “{item.communityQuote}”
        </blockquote>
      )}

      {item.caveat && (
        <p className="mt-3 text-sm leading-relaxed text-muted">
          <span className="font-semibold text-ink">Caveat: </span>
          {item.caveat}
        </p>
      )}

      {item.buyUrl && (
        <a
          href={item.buyUrl}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="mt-2 -mx-1 inline-block px-1 py-3 text-sm font-semibold text-accent hover:underline"
        >
          See listing<span className="sr-only"> for {item.name}</span> →
        </a>
      )}
    </article>
  );
}
