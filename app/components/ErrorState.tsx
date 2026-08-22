"use client";

export default function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="rounded-xl border border-negative/30 bg-negative/[0.06] p-5 sm:p-6">
      <h2 className="text-base font-semibold text-negative">That search didn’t go through</h2>
      <p className="mt-2 text-sm leading-relaxed text-ink">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 rounded-full bg-negative px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-negative/40"
      >
        Retry
      </button>
    </div>
  );
}
