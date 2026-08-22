export default function LoadingSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite" className="space-y-4">
      <p className="sr-only">Stripping affiliate results and checking community sentiment…</p>

      <div className="animate-pulse rounded-2xl border border-line bg-surface p-5 sm:p-6">
        <div className="h-3 w-40 rounded bg-line" />
        <div className="mt-4 space-y-2">
          <div className="h-4 w-full rounded bg-line" />
          <div className="h-4 w-11/12 rounded bg-line" />
          <div className="h-4 w-2/3 rounded bg-line" />
        </div>
        <div className="mt-6 flex gap-4">
          <div className="h-3 w-24 rounded bg-line" />
          <div className="h-3 w-24 rounded bg-line" />
        </div>
      </div>

      {[0, 1, 2].map((i) => (
        <div key={i} className="animate-pulse rounded-2xl border border-line bg-canvas p-4 sm:p-5">
          <div className="flex justify-between gap-4">
            <div className="h-5 w-1/2 rounded bg-line" />
            <div className="h-5 w-16 rounded bg-line" />
          </div>
          <div className="mt-3 flex gap-2">
            <div className="h-6 w-20 rounded-full bg-line" />
            <div className="h-6 w-28 rounded-full bg-line" />
          </div>
          <div className="mt-4 space-y-2">
            <div className="h-3.5 w-full rounded bg-line" />
            <div className="h-3.5 w-4/5 rounded bg-line" />
          </div>
        </div>
      ))}
    </div>
  );
}
