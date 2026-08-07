export function ShopPageSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholder
          key={i}
          className="animate-pulse rounded-xl border border-border/50 bg-[var(--surface-1)]"
        >
          {/* Image placeholder */}
          <div className="aspect-square rounded-t-xl bg-[var(--surface-2)]" />

          {/* Content skeleton */}
          <div className="flex flex-col gap-2 p-4">
            <div className="h-4 w-3/4 rounded bg-[var(--surface-2)]" />
            <div className="h-3 w-1/2 rounded bg-[var(--surface-2)]" />
            <div className="mt-2 h-5 w-1/3 rounded bg-[var(--surface-2)]" />
            <div className="h-3 w-1/4 rounded bg-[var(--surface-2)]" />
          </div>
        </div>
      ))}
    </div>
  );
}
