"use client";

import { createSimpleQuery } from "@/lib/query/factory";
import { inventoryKeys } from "@/lib/query/keys";

export const useInventory = createSimpleQuery({
  keys: inventoryKeys,
  table: "stock_movements",
  select: "*, products(name, sku, unit)",
  orderBy: "created_at",
  orderDirection: "desc",
});
