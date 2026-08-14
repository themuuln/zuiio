export const instant = true;

import { WorkOrdersPage } from "./_work-orders-client";

export default function Page() {
  return (
    <div className="px-4 pt-4 pb-6 md:px-6">
      <WorkOrdersPage />
    </div>
  );
}
