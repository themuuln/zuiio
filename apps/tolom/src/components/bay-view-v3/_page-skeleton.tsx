"use client";

// ─── PageSkeleton ─────────────────────────────────────────
// Loading state for the entire Bay View page.
// Mirrors the exact layout structure so there's no layout shift.

export function BayViewPageSkeleton() {
  return (
    <div role="status" className="flex h-full flex-col overflow-hidden">
      {/* KPI strip skeleton */}
      <div className="flex flex-wrap gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-16 w-36 animate-pulse rounded-lg border bg-muted/40"
          />
        ))}
      </div>

      {/* Filter bar skeleton */}
      <div className="mt-4 flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-8 w-20 animate-pulse rounded-full bg-muted/40"
          />
        ))}
      </div>

      {/* Bay grid skeleton */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-48 animate-pulse rounded-xl border bg-muted/30 p-4"
          >
            <div className="flex gap-2">
              <div className="h-5 w-8 rounded bg-muted/60" />
              <div className="h-5 w-20 rounded-full bg-muted/60" />
            </div>
            <div className="mt-4 h-4 w-32 rounded bg-muted/60" />
            <div className="mt-2 h-3 w-24 rounded bg-muted/40" />
            <div className="mt-4 h-3 w-20 rounded bg-muted/40" />
          </div>
        ))}
      </div>
    </div>
  );
}
