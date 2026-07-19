// Route renders user-specific content — legitimate cache opt-out.
export const instant = false;

import { WorkOrdersPage } from "./_work-orders-client";

export default function WorkOrdersPageWrapper() {
  return (
    <div className="px-4 pt-4 pb-6 md:px-6">
      <WorkOrdersPage />
    </div>
  );
}
