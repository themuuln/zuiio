"use client";

import { createSimpleQuery } from "@/lib/query/factory";
import { saleKeys } from "@/lib/query/keys";

export const useSales = createSimpleQuery({
  keys: saleKeys,
  table: "sales",
  select: "id, total_amount, paid_amount, sale_date, status, payment_method",
  orderBy: "created_at",
  orderDirection: "desc",
});
