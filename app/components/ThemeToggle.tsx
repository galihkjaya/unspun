"use client";

import { useCallback, useSyncExternalStore } from "react";

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Dark unless an explicit "light" choice is stored. */
function current(): boolean {
  try {
    return localStorage.getItem("theme") !== "light";
  } catch {
    return true; // storage blocked — dark default
  }
}

/** Applies one theme everywhere: legacy [data-theme] attr plus the .light-mode class. */
function apply(light: boolean) {
  document.getElementById("root")?.classList.toggle("light-mode", light);
  document.documentElement.setAttribute("data-theme", light ? "light" : "dark");
}

export default function ThemeToggle() {
  // Server snapshot defaults to dark; the stored choice lands after hydration.
  const isDark = useSyncExternalStore(subscribe, current, () => true);

  const toggle = useCallback(() => {
    const next = !current();
    apply(!next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      // storage blocked — the class still applies for this session
    }
    listeners.forEach((listener) => listener());
  }, []);

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle theme"
      className="grid size-9 shrink-0 place-items-center rounded-lg transition-all"
      style={{ border: "1px solid var(--border)", color: "var(--text-secondary)" }}
    >
      {isDark ? (
        // Sun icon — click to go light
        <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 3v1m0 16v1m8.66-9h-1M4.34 12h-1m15.07-6.07-.71.71M5.64 18.36l-.71.71M18.36 18.36l-.71-.71M5.64 5.64l-.71-.71M12 7a5 5 0 100 10A5 5 0 0012 7z"
          />
        </svg>
      ) : (
        // Moon icon — click to go dark
        <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z"
          />
        </svg>
      )}
    </button>
  );
}
