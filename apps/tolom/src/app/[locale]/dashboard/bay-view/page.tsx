"use client";

import dynamic from "next/dynamic";
import { BayViewPageSkeleton } from "@/components/bay-view-v2/_page-skeleton";

const BayViewV2Client = dynamic(
  () =>
    import("@/components/bay-view-v2/bay-view-v2-client").then(
      (m) => m.BayViewV2Client,
    ),
  {
    ssr: false,
    loading: () => <BayViewPageSkeleton />,
  },
);

export default function BayViewPage() {
  return (
    <div className="-mx-3 -mb-5 -mt-3 flex h-full flex-col overflow-hidden tablet:-mx-4 tablet:-mb-6 tablet:-mt-4 lg:-mx-6 lg:-mb-8 lg:-mt-5">
      <BayViewV2Client />
    </div>
  );
}
