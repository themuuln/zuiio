// Full-screen workshop display — no sidebar/header (rendered as fixed overlay)
export const instant = true;

import { WorkshopDisplayClient } from "@/components/workshop-display/workshop-display-client";

export default function DisplayPage() {
  return (
    <div className="fixed inset-0 z-50">
      <WorkshopDisplayClient />
    </div>
  );
}
