export default function PublicRouteLoading() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="space-y-3">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-4 w-32 animate-pulse rounded bg-muted" />
      </div>
      <div className="space-y-4">
        {["skeleton-1", "skeleton-2", "skeleton-3", "skeleton-4"].map((id) => (
          <div key={id} className="h-12 animate-pulse rounded bg-muted" />
        ))}
      </div>
    </div>
  );
}
