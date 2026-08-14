"use client";

import dynamic from "next/dynamic";
import { BayViewPageSkeleton } from "./_page-skeleton";

const BayViewV2ClientImpl = dynamic(
  () => import("./bay-view-v2-client").then((m) => m.BayViewV2Client),
  {
    ssr: false,
    loading: () => <BayViewPageSkeleton />,
  },
);

export function BayViewClientWrapper() {
  return <BayViewV2ClientImpl />;
}
