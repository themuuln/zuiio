// Route renders user-specific content — legitimate cache opt-out.
export const instant = false;

import { CustomersPage } from "./_customers-client";

export default function CustomersPageWrapper() {
  return (
    <div className="px-4 pt-4 pb-6 md:px-6">
      <CustomersPage />
    </div>
  );
}
