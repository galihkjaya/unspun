"use client";

import { useCallback, useSyncExternalStore } from "react";

type Theme = "dark" | "light";

const DARK = "(prefers-color-scheme: dark)";
const listeners = new Set<() => void>();

function stored(): Theme | null {
  try {
    const value = localStorage.getItem("theme");
    return value === "dark" || value === "light" ? value : null;
  } catch {
    return null; // storage blocked (Safari private mode)
  }
}

/** Effective theme: explicit choice wins, else the system preference. */
const current = (): Theme => stored() ?? (window.matchMedia(DARK).matches ? "dark" : "light");

function subscribe(listener: () => void) {
  listeners.add(listener);
  const media = window.matchMedia(DARK);
  media.addEventListener("change", listener);
  return () => {
    listeners.delete(listener);
    media.removeEventListener("change", listener);
  };
}

export default function ThemeToggle() {
  // Server has no preference to read; null renders a neutral icon until hydration.
  const theme = useSyncExternalStore<Theme | null>(subscribe, current, () => null);

  const toggle = useCallback(() => {
    const next: Theme = current() === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("theme", next);
    } catch {
      // Storage blocked — the attribute still applies for this session.
    }
    listeners.forEach((listener) => listener());
  }, []);

  const dark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className="grid size-9 shrink-0 place-items-center rounded-full border border-line text-muted transition-colors hover:bg-card-hover hover:text-ink focus-visible:ring-2 focus-visible:ring-accent/40"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4">
        {dark ? (
          <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4" />
          </g>
        ) : (
          <path fill="currentColor" d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
        )}
      </svg>
    </button>
  );
}
