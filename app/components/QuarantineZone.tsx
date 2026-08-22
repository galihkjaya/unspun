import type { QuarantinedDomain } from "@/app/lib/types";

// Native <details> for the collapsible — no state, keyboard accessible for free.
// Expanded by default: the stripped sources are the point of the product.
export default function QuarantineZone({ quarantined }: { quarantined: QuarantinedDomain[] }) {
  if (quarantined.length === 0) return null;

  return (
    <details open className="group rounded-xl border border-negative/25 bg-negative/[0.06]">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl p-4 text-left focus-visible:ring-2 focus-visible:ring-accent/40 sm:px-5">
        <span className="text-sm font-semibold text-negative">
          <span aria-hidden="true">🚫</span> Stripped from results
          <span className="ml-2 font-mono font-normal opacity-70">({quarantined.length})</span>
        </span>
        <span aria-hidden="true" className="shrink-0 text-negative transition-transform group-open:rotate-180">
          ▾
        </span>
      </summary>

      <ul className="space-y-4 border-t border-negative/20 px-4 py-4 sm:px-5">
        {quarantined.map(({ domain, reason }) => (
          <li key={domain}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm font-semibold text-negative line-through decoration-negative/50">
                {domain}
              </span>
              <span className="rounded border border-negative/30 px-1.5 py-0.5 font-mono text-[10px] tracking-wide text-negative uppercase">
                bias
              </span>
            </div>
            <p className="mt-1 text-sm leading-relaxed text-muted">{reason}</p>
          </li>
        ))}
      </ul>
    </details>
  );
}
