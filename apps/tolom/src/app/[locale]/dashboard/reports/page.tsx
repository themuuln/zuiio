/**
 * Reports Page — ERP-grade business intelligence for auto service shops.
 *
 * Thin orchestrator: holds state + data hooks, delegates rendering to
 * focused sub-components (_reports-header, _reports-tab-bar, etc.).
 */
export const instant = true;

import ReportsPage from "./_reports-client";

export default function Page() {
  return <ReportsPage />;
}
