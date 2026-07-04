// Route renders user-specific content — legitimate cache opt-out.
export const instant = false;

import { InventoryPage } from "./_inventory-client";

export default function InventoryPageWrapper() {
  return <InventoryPage />;
}
