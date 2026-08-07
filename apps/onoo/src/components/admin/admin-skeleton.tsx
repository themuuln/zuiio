import { Skeleton } from "@/components/ui/skeleton";

/**
 * Reusable admin page skeleton for loading states.
 * Replace simple text spinners with this for consistent look.
 */

export function AdminTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: placeholder rows have no data-derived key
        <div key={`skeleton-row-${i}`} className="flex items-center gap-4">
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  );
}

export function AdminCardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-6 w-32" />
      </div>
      <div className="rounded-lg border p-6">
        <div className="mb-4">
          <Skeleton className="mb-2 h-5 w-40" />
          <Skeleton className="h-3 w-24" />
        </div>
        <AdminTableSkeleton />
      </div>
    </div>
  );
}
