"use client";

import { useEffect, useRef, useState } from "react";

const MODEL = process.env.NEXT_PUBLIC_CEREBRAS_MODEL || "gpt-oss-120b";
const MESSAGE_MS = 1200; // how long each status message holds
const FADE_MS = 300; // matches transition-opacity duration-300 on the text

const MESSAGES = [
  "Understanding your request...",
  "Connecting to SerpAPI...",
  "Stripping affiliate sources...",
  "Reading Reddit threads...",
  "Checking live prices...",
  "Structuring the answer...",
] as const;

/** Favicon absorbed into the box while its step runs, one per data source. */
const STEP_FAVICONS: Record<number, string> = {
  2: "google.com", // stripping affiliates out of organic results
  3: "reddit.com", // reading community threads
  4: "google.com", // Google Shopping price checks
};

// Start offsets: roughly 80px outside a random edge of the ~480x160 box.
const SIDES = [
  { x: "-88px", y: "-24px" },
  { x: "88px", y: "20px" },
  { x: "-40px", y: "-84px" },
  { x: "48px", y: "84px" },
] as const;

interface Flight {
  id: number;
  domain: string;
  fromX: string;
  fromY: string;
}

/**
 * The loading state: a single neon box whose border highlight walks clockwise,
 * narrating the pipeline one message at a time while source favicons are
 * absorbed into it. Fades itself out when done so results can reveal.
 */
export default function LoadingSequence({ done }: { done: boolean }) {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(true);
  const [flights, setFlights] = useState<Flight[]>([]);
  const nextFlightId = useRef(0);

  // Hold the current message, then fade out...
  useEffect(() => {
    if (!visible || done) return;
    const timer = setTimeout(() => setVisible(false), MESSAGE_MS - FADE_MS);
    return () => clearTimeout(timer);
  }, [visible, done]);

  // ...then swap in the next message and fade back in. Loops until done.
  useEffect(() => {
    if (visible || done) return;
    const timer = setTimeout(() => {
      setStep((s) => (s + 1) % MESSAGES.length);
      setVisible(true);
    }, FADE_MS);
    return () => clearTimeout(timer);
  }, [visible, done]);

  // Spawn an absorbing favicon whenever a source-backed step comes up. Each
  // flight removes itself on animationend — no timers to clean up mid-step.
  useEffect(() => {
    if (done || !(step in STEP_FAVICONS)) return;
    const side = SIDES[Math.floor(Math.random() * SIDES.length)];
    const id = nextFlightId.current++;
    setFlights((prev) => [...prev, { id, domain: STEP_FAVICONS[step], fromX: side.x, fromY: side.y }]);
  }, [step, done]);

  return (
    <div
      aria-busy={!done}
      aria-live="polite"
      className={`relative mx-auto my-16 w-full max-w-[480px] transition-opacity duration-300 ${
        done ? "opacity-0" : "opacity-100"
      }`}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {flights.map((flight) => (
          <span key={flight.id} className="absolute inset-0 m-auto size-8">
            {/* eslint-disable-next-line @next/next/no-img-element -- remote favicon service, no loader configured */}
            <img
              src={`https://www.google.com/s2/favicons?domain=${flight.domain}&sz=32`}
              alt=""
              decoding="async"
              className="neon-favicon size-full rounded-md"
              style={{ "--from-x": flight.fromX, "--from-y": flight.fromY } as React.CSSProperties}
              onAnimationEnd={() => setFlights((prev) => prev.filter((f) => f.id !== flight.id))}
            />
          </span>
        ))}
      </div>

      <div className="loading-neon rounded-lg px-8 py-10">
        <p
          className={`h-6 text-center font-mono text-sm text-white transition-opacity duration-300 ${
            visible ? "opacity-100" : "opacity-0"
          }`}
        >
          {MESSAGES[step]}
        </p>
        <p className="mt-3 text-center font-mono text-xs text-white/40">via {MODEL}</p>
      </div>
    </div>
  );
}
