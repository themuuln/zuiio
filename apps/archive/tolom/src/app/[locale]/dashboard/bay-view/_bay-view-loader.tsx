"use client";

import dynamic from "next/dynamic";
import { BayViewPageSkeleton } from "@/components/bay-view-v2/_page-skeleton";

const BayViewV2Client = dynamic(
  () =>
    import("@/components/bay-view-v2/bay-view-v2-client").then(
      (mod) => mod.BayViewV2Client,
    ),
  {
    ssr: false,
    loading: () => <BayViewPageSkeleton />,
  },
);

export function BayViewLoader() {
  return (
    <div className="flex h-full flex-col">
      <BayViewV2Client />
    </div>
  );
}
