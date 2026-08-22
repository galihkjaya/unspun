import type { QuarantinedDomain } from "@/app/lib/types";

// Native <details> for the collapsible — no state, keyboard accessible for free.
export default function QuarantineZone({ quarantined }: { quarantined: QuarantinedDomain[] }) {
  if (quarantined.length === 0) return null;

  return (
    <details className="group rounded-2xl border border-strip/25 bg-strip/5">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-2xl p-4 text-left focus-visible:ring-2 focus-visible:ring-accent/40 sm:p-5">
        <span className="text-sm font-semibold text-strip sm:text-base">
          Quarantine zone — {quarantined.length} affiliate {quarantined.length === 1 ? "source" : "sources"} stripped
        </span>
        <span aria-hidden="true" className="shrink-0 text-strip transition-transform group-open:rotate-180">
          ▾
        </span>
      </summary>
      <ul className="space-y-3 border-t border-strip/20 px-4 py-4 sm:px-5">
        {quarantined.map(({ domain, reason }) => (
          <li key={domain}>
            <p className="font-mono text-sm font-semibold text-strip line-through decoration-strip/50">{domain}</p>
            <p className="mt-0.5 text-sm leading-relaxed text-muted">{reason}</p>
          </li>
        ))}
      </ul>
    </details>
  );
}
