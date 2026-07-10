// Route renders user-specific content — legitimate cache opt-out.
export const instant = false;

import { CustomersPage } from "./_customers-client";

export default function CustomersPageWrapper() {
  return <CustomersPage />;
}
