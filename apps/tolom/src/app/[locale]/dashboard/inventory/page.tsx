// Route renders user-specific content — legitimate cache opt-out.
export const instant = false;

import { InventoryPage } from "./_inventory-client";

export default function InventoryPageWrapper() {
  return (
    <div className="px-4 pt-4 pb-6 md:px-6">
      <InventoryPage />
    </div>
  );
}
