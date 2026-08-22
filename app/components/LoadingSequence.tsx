"use client";

import { useEffect, useState } from "react";

import type { QuarantinedDomain } from "@/app/lib/types";

const MODEL = process.env.NEXT_PUBLIC_CEREBRAS_MODEL || "gpt-oss-120b";
const STEP_MS = 800;

/**
 * Narrates the pipeline while it runs. The first lines are time-staggered because
 * the phases are not individually observable from the client — /api/search
 * returns once, at the end. The flagged-sources line is filled with real domains
 * and "Done." appears only when the response has landed.
 */
export default function LoadingSequence({
  query,
  quarantined,
  done,
}: {
  query: string;
  quarantined: QuarantinedDomain[] | null;
  done: boolean;
}) {
  const [shown, setShown] = useState(1);

  const flagged =
    quarantined === null
      ? "Cross-checking domains against the affiliate blacklist..."
      : quarantined.length === 0
        ? "No affiliate publishers in the top results."
        : `Found ${quarantined.length} source${quarantined.length === 1 ? "" : "s"} flagged: ${quarantined
            .slice(0, 2)
            .map((q) => q.domain)
            .join(", ")}${quarantined.length > 2 ? "…" : ""}`;

  const lines = [
    `Pulling organic results for '${query}'...`,
    "Auditing sources — stripping affiliate publishers...",
    flagged,
    "Scanning Reddit for real community consensus...",
    "Checking live prices...",
    `Synthesizing answer with ${MODEL}...`,
  ];

  useEffect(() => {
    if (shown >= lines.length) return;
    const timer = setTimeout(() => setShown((n) => n + 1), STEP_MS);
    return () => clearTimeout(timer);
  }, [shown, lines.length]);

  // On completion every line is revealed, however far the stagger got.
  const visible = done ? [...lines, "Done."] : lines.slice(0, shown);

  return (
    <div aria-busy={!done} aria-live="polite" className="border-l-2 border-accent pl-4">
      <ol className="space-y-2 font-mono text-sm">
        {visible.map((line, i) => {
          const last = i === visible.length - 1;
          return (
            <li key={`${i}-${line}`} className={`animate-rise ${last ? "text-ink" : "text-muted"}`}>
              {line}
              {last && (
                <span aria-hidden="true" className="animate-blink ml-0.5 text-accent">
                  ▋
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
