export function ShopPageSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="animate-pulse rounded-lg border p-4">
          <div className="mb-4 aspect-square rounded-md bg-muted" />
          <div className="mb-2 h-4 w-3/4 rounded bg-muted" />
          <div className="mb-4 h-4 w-1/2 rounded bg-muted" />
          <div className="h-10 rounded-md bg-muted" />
        </div>
      ))}
    </div>
  );
}
