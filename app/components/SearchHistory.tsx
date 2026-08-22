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
    <nav aria-label="Search history" className="rounded-2xl border border-line bg-surface p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold tracking-wide text-muted uppercase">Recent</h2>
        {entries.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="-mr-2 rounded px-2 py-2 text-xs font-semibold text-muted hover:text-strip focus-visible:ring-2 focus-visible:ring-accent/40"
          >
            Clear
          </button>
        )}
      </div>

      {entries.length === 0 ? (
        <p className="mt-3 text-sm text-muted">Past searches are cached here for 24 hours.</p>
      ) : (
        <ul className="mt-3 space-y-1">
          {entries.map((entry) => {
            const active = entry.query === activeQuery;
            return (
              <li key={entry.id}>
                <button
                  type="button"
                  onClick={() => onSelect(entry.query)}
                  aria-current={active ? "true" : undefined}
                  className={`w-full truncate rounded-lg px-2.5 py-2 text-left text-sm focus-visible:ring-2 focus-visible:ring-accent/40 ${
                    active ? "bg-accent/10 font-semibold text-accent" : "text-ink hover:bg-canvas"
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
