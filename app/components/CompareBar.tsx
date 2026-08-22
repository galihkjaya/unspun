"use client";

export default function CompareBar({
  queryA,
  queryB,
  onChangeA,
  onChangeB,
  onSubmit,
  onCancel,
  loading,
}: {
  queryA: string;
  queryB: string;
  onChangeA: (value: string) => void;
  onChangeB: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const ready = queryA.trim().length >= 2 && queryB.trim().length >= 2;

  const field = (id: string, label: string, value: string, onChange: (v: string) => void) => (
    <div className="min-w-0 flex-1">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={label}
        autoComplete="off"
        className="w-full min-w-0 rounded-full border border-line bg-card px-4 py-2.5 text-sm text-ink transition-[border-color,box-shadow] outline-none placeholder:text-muted focus:border-accent focus:shadow-[0_0_0_4px_var(--accent-glow)]"
      />
    </div>
  );

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        if (ready && !loading) onSubmit();
      }}
      className="flex flex-wrap items-center gap-2 sm:flex-nowrap"
    >
      {field("qa", "First product", queryA, onChangeA)}
      <span aria-hidden="true" className="font-mono text-xs text-muted">
        vs
      </span>
      {field("qb", "Second product", queryB, onChangeB)}

      <div className="flex w-full gap-2 sm:w-auto">
        <button
          type="submit"
          disabled={loading || !ready}
          className="flex-1 rounded-full bg-accent px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none"
        >
          {loading ? "Comparing…" : "Compare"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-line px-4 py-2.5 text-sm text-muted transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-accent/40"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
