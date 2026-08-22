"use client";

export default function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="rounded-2xl border border-strip/30 bg-strip/5 p-5 sm:p-6">
      <h2 className="text-base font-semibold text-strip">That search didn’t go through</h2>
      <p className="mt-2 text-sm leading-relaxed text-ink">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 rounded-full bg-strip px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-strip/40"
      >
        Retry
      </button>
    </div>
  );
}
