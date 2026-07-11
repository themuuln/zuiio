// Route renders user-specific content — legitimate cache opt-out.
export const instant = false;

import { Suspense } from "react";
import { BayViewV2Client } from "@/components/bay-view-v2/bay-view-v2-client";

export default function BayViewPage() {
  return (
    <div className="flex h-full flex-col">
      <Suspense fallback={<div className="h-full" />}>
        <BayViewV2Client />
      </Suspense>
    </div>
  );
}
