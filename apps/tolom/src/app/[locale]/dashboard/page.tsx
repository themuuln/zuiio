// Route renders user-specific content — legitimate cache opt-out.
export const instant = false;

import { DashboardPage } from "./_dashboard-client";

export default function DashboardPageWrapper() {
  return <DashboardPage />;
}
