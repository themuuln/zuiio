"use client";

import { createSimpleQuery } from "@/lib/query/factory";
import { saleKeys } from "@/lib/query/keys";

export const useSales = createSimpleQuery({
  keys: saleKeys,
  table: "sales",
  orderBy: "created_at",
  orderDirection: "desc",
});
