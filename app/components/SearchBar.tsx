"use client";

import { useState } from "react";

export default function SearchBar({
  onSearch,
  loading,
  initialQuery = "",
}: {
  onSearch: (query: string) => void;
  loading: boolean;
  initialQuery?: string;
}) {
  const [value, setValue] = useState(initialQuery);
  const trimmed = value.trim();

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        if (trimmed.length >= 2 && !loading) onSearch(trimmed);
      }}
      className="flex gap-2"
    >
      <label htmlFor="q" className="sr-only">
        Search for a product
      </label>
      <input
        id="q"
        name="q"
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="best air purifier for small room"
        autoComplete="off"
        enterKeyHint="search"
        className="min-w-0 flex-1 rounded-full border border-line bg-canvas px-5 py-3 text-base text-ink shadow-sm outline-none placeholder:text-muted/70 focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30"
      />
      <button
        type="submit"
        disabled={loading || trimmed.length < 2}
        className="shrink-0 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 sm:px-7"
      >
        {loading ? "Unspinning…" : "Unspin"}
      </button>
    </form>
  );
}
