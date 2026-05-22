"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const BayViewV2Client = dynamic(
  () =>
    import("@/components/bay-view-v2/bay-view-v2-client").then(
      (m) => m.BayViewV2Client,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col gap-4 p-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    ),
  },
);

export default function BayViewPage() {
  return <BayViewV2Client />;
}
