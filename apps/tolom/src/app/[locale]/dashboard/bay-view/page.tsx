export const instant = true;

import dynamic from "next/dynamic";
import { BayViewPageSkeleton } from "@/components/bay-view-v2/_page-skeleton";

const BayViewV2Client = dynamic(
  () =>
    import("@/components/bay-view-v2/bay-view-v2-client").then(
      (m) => m.BayViewV2Client,
    ),
  {
    loading: () => <BayViewPageSkeleton />,
  },
);

export default function Page() {
  return (
    <div className="flex h-full flex-col">
      <BayViewV2Client />
    </div>
  );
}
