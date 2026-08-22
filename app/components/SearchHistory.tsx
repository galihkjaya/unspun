"use client";

import type { SearchHistoryEntry } from "@/app/lib/types";

export default function SearchHistory({
  entries,
  activeQuery,
  onSelect,
  onClear,
}: {
  entries: SearchHistoryEntry[];
  activeQuery: string | null;
  onSelect: (query: string) => void;
  onClear: () => void;
}) {
  return (
    <nav aria-label="Search history" className="rounded-xl border border-line bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-mono text-xs tracking-widest text-muted uppercase">Recent</h2>
        {entries.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="-mr-2 rounded px-2 py-2 text-xs text-muted transition-colors hover:text-negative focus-visible:ring-2 focus-visible:ring-accent/40"
          >
            Clear
          </button>
        )}
      </div>

      {entries.length === 0 ? (
        <p className="mt-3 text-sm leading-relaxed text-muted">Searches are cached here for 24 hours.</p>
      ) : (
        <ul className="mt-3 space-y-0.5">
          {entries.map((entry) => {
            const active = entry.query === activeQuery;
            return (
              <li key={entry.id}>
                <button
                  type="button"
                  onClick={() => onSelect(entry.query)}
                  aria-current={active ? "true" : undefined}
                  className={`w-full truncate rounded-lg px-2.5 py-2 text-left text-sm transition-colors focus-visible:ring-2 focus-visible:ring-accent/40 ${
                    active ? "bg-accent/10 font-medium text-accent" : "text-ink hover:bg-card-hover"
                  }`}
                >
                  {entry.query}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </nav>
  );
}
