import Sparkline from "@/app/components/Sparkline";
import { TrendBadge } from "@/app/components/TrendBar";
import type { Recommendation, Sentiment, Trend } from "@/app/lib/types";

const SENTIMENT: Record<Sentiment, { label: string; className: string }> = {
  positive: { label: "Positive", className: "text-positive" },
  mixed: { label: "Mixed", className: "text-mixed" },
  negative: { label: "Negative", className: "text-negative" },
};

const money = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });

function Thumbnail({ item }: { item: Recommendation }) {
  const box =
    "size-14 shrink-0 overflow-hidden rounded-lg border border-line bg-bg sm:size-20";

  if (!item.thumbnail) {
    return (
      <div aria-hidden="true" className={`${box} grid place-items-center`}>
        <span className="text-xl font-semibold text-muted sm:text-2xl">{item.name.charAt(0)}</span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- remote Google Shopping CDN thumbnails, no loader configured
    <img
      src={item.thumbnail}
      alt=""
      loading="lazy"
      decoding="async"
      className={`${box} object-contain p-1`}
    />
  );
}

export default function ResultCard({
  item,
  index,
  trend,
}: {
  item: Recommendation;
  index?: number;
  trend?: Trend;
}) {
  const sentiment = SENTIMENT[item.sentiment];
  const links = item.redditLinks ?? [];
  // No index means a cached result: render instantly, no entrance animation.
  const staggered = index !== undefined;

  return (
    <article
      className={`rounded-xl border border-line bg-card p-4 transition-colors hover:bg-card-hover sm:p-5 ${
        staggered ? "animate-reveal" : ""
      }`}
      style={staggered ? { animationDelay: `${index * 150}ms` } : undefined}
    >
      <div className="flex gap-4">
        <Thumbnail item={item} />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span aria-hidden="true" className="font-mono text-sm text-muted">
              #{item.rank}
            </span>
            <h3 className="min-w-0 flex-1 text-base font-semibold text-ink sm:text-lg">
              <span className="sr-only">Rank {item.rank}: </span>
              {item.name}
            </h3>
            {item.price > 0 && (
              <span className="font-mono text-base font-semibold text-ink sm:text-lg">{money(item.price)}</span>
            )}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            <span className={`font-medium ${sentiment.className}`}>{sentiment.label}</span>
            <span className="text-muted">
              <span className="font-mono">{item.mentions}</span> Reddit{" "}
              {item.mentions === 1 ? "mention" : "mentions"}
            </span>
            {trend && trend.data.length >= 2 && (
              <span className="flex items-center gap-2">
                <Sparkline
                  data={trend.data}
                  direction={trend.direction}
                  label={`Search interest for ${item.name}: ${trend.change}`}
                />
                <TrendBadge trend={trend} />
              </span>
            )}
          </div>
        </div>
      </div>

      {item.communityQuote && (
        <blockquote className="mt-4 border-l-2 border-line pl-3 text-sm leading-relaxed text-ink italic">
          “{item.communityQuote}”
        </blockquote>
      )}

      {item.caveat && (
        <p className="mt-3 text-sm leading-relaxed text-muted">
          <span className="font-medium text-ink">Caveat: </span>
          {item.caveat}
        </p>
      )}

      {links.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-muted">Evidence:</span>
          {links.map((link) => (
            <a
              key={link.url}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              // py-2 keeps the tap target at ~32px on mobile.
              className="rounded-full border border-line px-2.5 py-2 text-muted transition-colors hover:border-accent/50 hover:text-accent"
            >
              {link.subreddit} thread ↗
            </a>
          ))}
        </div>
      )}

      {item.buyUrl && (
        <a
          href={item.buyUrl}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="mt-2 -mx-1 inline-block px-1 py-3 text-sm font-medium text-accent hover:underline"
        >
          See listing<span className="sr-only"> for {item.name}</span> →
        </a>
      )}
    </article>
  );
}
