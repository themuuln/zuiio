// Route renders user-specific content — legitimate cache opt-out.
export const instant = false;

import { WorkOrdersPage } from "./_work-orders-client";

export default function WorkOrdersPageWrapper() {
  return <WorkOrdersPage />;
}
