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
      <div className="mx-3 tablet:mx-4 lg:mx-6">
        <div className="flex flex-col gap-2 pt-3 pb-5 tablet:pt-4 tablet:pb-6 lg:pt-5 lg:pb-8">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-7 w-40" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-28 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    ),
  },
);

export default function BayViewPage() {
  return (
    <div className="-mx-3 -mb-5 -mt-3 flex h-full flex-col overflow-hidden tablet:-mx-4 tablet:-mb-6 tablet:-mt-4 lg:-mx-6 lg:-mb-8 lg:-mt-5">
      <BayViewV2Client />
    </div>
  );
}
