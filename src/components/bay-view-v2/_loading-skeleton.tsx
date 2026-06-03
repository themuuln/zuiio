"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function BayViewLoadingSkeleton() {
  return (
    <div className="flex flex-col gap-5 p-4">
      <div className="flex items-center justify-between border-b pb-4">
        <Skeleton className="h-7 w-44" />
        <Skeleton className="h-9 w-48" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-2">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <Skeleton key={i} className="h-44 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
