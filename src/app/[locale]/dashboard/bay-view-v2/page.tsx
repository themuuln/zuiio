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

export default function BayViewV2Page() {
  return (
    <div className="absolute inset-0">
      <BayViewV2Client />
    </div>
  );
}
