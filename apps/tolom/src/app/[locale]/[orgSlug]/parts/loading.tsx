export default function StorefrontLoading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header skeleton */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-4xl items-center gap-4 px-4 py-6">
          <div className="size-12 animate-pulse rounded-lg bg-muted" />
          <div className="flex flex-col gap-2">
            <div className="h-5 w-32 animate-pulse rounded bg-muted" />
            <div className="h-3 w-24 animate-pulse rounded bg-muted" />
          </div>
        </div>
      </header>

      {/* Content skeleton */}
      <main className="mx-auto max-w-4xl px-4 py-6">
        <div className="mb-4">
          <div className="h-5 w-40 animate-pulse rounded bg-muted" />
          <div className="mt-1 h-3 w-56 animate-pulse rounded bg-muted" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col items-center gap-2 rounded-lg border border-border bg-card p-4"
            >
              <div className="h-5 w-16 animate-pulse rounded bg-muted" />
              <div className="h-3 w-12 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
