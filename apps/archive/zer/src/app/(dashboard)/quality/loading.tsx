export default function QualityLoading() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-10 w-36 animate-pulse rounded bg-muted" />
      </div>
      <div className="flex gap-3">
        <div className="h-10 w-40 animate-pulse rounded bg-muted" />
        <div className="h-10 w-40 animate-pulse rounded bg-muted" />
      </div>
      <div className="space-y-3">
        {[
          "skeleton-1",
          "skeleton-2",
          "skeleton-3",
          "skeleton-4",
          "skeleton-5",
        ].map((key) => (
          <div
            key={key}
            className="h-14 w-full animate-pulse rounded bg-muted"
          />
        ))}
      </div>
    </div>
  );
}
