"use client";

import dynamic from "next/dynamic";
import { BayViewPageSkeleton } from "@/components/bay-view-v3/_page-skeleton";

// ─── Bay View V3 Page ─────────────────────────────────────
// Thin server wrapper. Dynamic import keeps client code out
// of the server bundle. SSR disabled for real-time data.

const BayViewV3 = dynamic(
  () =>
    import("@/components/bay-view-v3/bay-view-v3").then((mod) => mod.BayViewV3),
  {
    ssr: false,
    loading: () => <BayViewPageSkeleton />,
  },
);

export default function BayViewV3Page() {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <BayViewV3 />
    </div>
  );
}
