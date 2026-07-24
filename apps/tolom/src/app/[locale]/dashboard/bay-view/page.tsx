export const instant = true;

import { Suspense } from "react";
import { BayViewV2Client } from "@/components/bay-view-v2/bay-view-v2-client";

export default function Page() {
  return (
    <div className="flex h-full flex-col">
      <Suspense fallback={<div className="h-full" />}>
        <BayViewV2Client />
      </Suspense>
    </div>
  );
}
