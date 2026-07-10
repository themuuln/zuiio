// Route renders user-specific content — legitimate cache opt-out.
export const instant = false;

import { Suspense } from "react";
import { BayViewV2Client } from "@/components/bay-view-v2/bay-view-v2-client";

export default function BayViewPage() {
  return (
    <div className="-mx-3 -mb-5 -mt-3 flex h-full flex-col overflow-hidden tablet:-mx-4 tablet:-mb-6 tablet:-mt-4 lg:-mx-6 lg:-mb-8 lg:-mt-5">
      <Suspense fallback={<div className="h-full" />}>
        <BayViewV2Client />
      </Suspense>
    </div>
  );
}
