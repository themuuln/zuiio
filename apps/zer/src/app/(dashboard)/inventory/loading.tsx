import { Skeleton } from "@/components/ui/skeleton";

export default function InventoryLoading() {
  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>

      {/* KPI Skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
      </div>

      {/* Low Stock Products Skeleton */}
      <div className="rounded-xl border">
        <div className="border-b px-6 py-4">
          <Skeleton className="h-5 w-52" />
        </div>
        <div className="p-6">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="mt-3 h-8 w-full" />
          <Skeleton className="mt-3 h-8 w-full" />
        </div>
      </div>

      {/* Recent Movements Skeleton */}
      <div className="rounded-xl border">
        <div className="border-b px-6 py-4">
          <Skeleton className="h-5 w-48" />
        </div>
        <div className="p-6">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="mt-3 h-8 w-full" />
          <Skeleton className="mt-3 h-8 w-full" />
        </div>
      </div>
    </div>
  );
}
