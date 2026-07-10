// Route renders user-specific content — legitimate cache opt-out.
export const instant = false;

import type { ReactNode } from "react";
import DashboardClientShell from "./_dashboard-client-shell";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <DashboardClientShell>{children}</DashboardClientShell>;
}
