"use client";

export default function SearchBar({
  value,
  onChange,
  onSubmit,
  loading,
  autoFocus = false,
  id = "q",
  label = "Search for a product",
  placeholder = "best air purifier for small room",
  size = "lg",
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  loading: boolean;
  autoFocus?: boolean;
  id?: string;
  label?: string;
  placeholder?: string;
  size?: "lg" | "sm";
}) {
  const big = size === "lg";

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        if (value.trim().length >= 2 && !loading) onSubmit();
      }}
      className="flex items-center gap-2"
    >
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        enterKeyHint="search"
        autoFocus={autoFocus}
        className={`min-w-0 flex-1 rounded-full border border-line bg-card text-ink transition-[border-color,box-shadow] outline-none placeholder:text-muted focus:border-accent focus:shadow-[0_0_0_4px_var(--accent-glow)] ${
          big ? "px-5 py-3.5 text-base" : "px-4 py-2.5 text-sm"
        }`}
      />
      <button
        type="submit"
        disabled={loading || value.trim().length < 2}
        className={`shrink-0 rounded-full bg-accent font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 ${
          big ? "px-6 py-3.5 text-sm" : "px-4 py-2.5 text-sm"
        }`}
      >
        {loading ? "Unspinning…" : big ? "Unspin →" : "Unspin"}
      </button>
    </form>
  );
}
