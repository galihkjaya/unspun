"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * localStorage as an external store. `useSyncExternalStore` keeps SSR and
 * hydration honest (server renders `initial`, client swaps in the stored value)
 * without a setState-in-effect.
 *
 * `initial` must be a stable reference — use a module-level constant.
 */

type Listener = () => void;

const listeners = new Map<string, Set<Listener>>();
const snapshots = new Map<string, { raw: string | null; parsed: unknown }>();

function readRaw(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null; // storage blocked (Safari private mode)
  }
}

/** Cached by raw string so repeat calls return an identical reference. */
function read<T>(key: string, initial: T): T {
  const raw = readRaw(key);
  const cached = snapshots.get(key);
  if (cached && cached.raw === raw) return cached.parsed as T;

  let parsed = initial;
  if (raw !== null) {
    try {
      parsed = JSON.parse(raw) as T;
    } catch {
      parsed = initial; // corrupt entry
    }
  }
  snapshots.set(key, { raw, parsed });
  return parsed;
}

function notify(key: string) {
  listeners.get(key)?.forEach((listener) => listener());
}

export function useLocalStorage<T>(key: string, initial: T) {
  const subscribe = useCallback(
    (listener: Listener) => {
      const forKey = listeners.get(key) ?? new Set<Listener>();
      listeners.set(key, forKey);
      forKey.add(listener);
      // Cross-tab updates.
      const onStorage = (e: StorageEvent) => {
        if (e.key === key || e.key === null) listener();
      };
      window.addEventListener("storage", onStorage);
      return () => {
        forKey.delete(listener);
        window.removeEventListener("storage", onStorage);
      };
    },
    [key],
  );

  const value = useSyncExternalStore(
    subscribe,
    () => read(key, initial),
    () => initial,
  );

  /** Fresh read outside of render — avoids mirroring state into a ref. */
  const get = useCallback(() => read(key, initial), [key, initial]);

  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      const resolved = typeof next === "function" ? (next as (prev: T) => T)(read(key, initial)) : next;
      try {
        window.localStorage.setItem(key, JSON.stringify(resolved));
      } catch {
        // Quota exceeded or storage unavailable — nothing to sync.
      }
      notify(key);
    },
    [key, initial],
  );

  const remove = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // ignore
    }
    notify(key);
  }, [key]);

  return { value, get, set, remove };
}
