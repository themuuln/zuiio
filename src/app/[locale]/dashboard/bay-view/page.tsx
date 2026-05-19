"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const BayViewClient = dynamic(
  () =>
    import("@/components/bay-view/bay-view-client").then(
      (m) => m.BayViewClient,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-40" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={`skeleton-${i}`} className="h-44 rounded-xl" />
          ))}
        </div>
      </div>
    ),
  },
);

export default function BayViewPage() {
  return <BayViewClient />;
}
