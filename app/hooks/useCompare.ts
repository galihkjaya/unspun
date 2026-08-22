"use client";

import { useCallback, useState } from "react";

import type { CompareResult } from "@/app/lib/types";

/**
 * Two searches side by side. Not cached: a comparison is a pair, and caching it
 * under the existing single-query history schema would mean changing that
 * schema. Costs two Cerebras calls, so it eats ~2 of the 5 RPM budget.
 */
export function useCompare() {
  const [result, setResult] = useState<CompareResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async (queryA: string, queryB: string) => {
    setError(null);
    setLoading(true);
    try {
      const response = await fetch("/api/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ queryA, queryB }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          typeof payload?.error === "string"
            ? payload.error
            : response.status >= 500
              ? "The search service is unreachable. Check that the API is running, then retry."
              : `Request failed (${response.status}).`,
        );
      }
      setResult(payload as CompareResult);
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { result, loading, error, compare: run, reset };
}
