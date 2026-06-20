"use client";

import { createSimpleQuery } from "@/lib/query/factory";
import { productKeys } from "@/lib/query/keys";

export const useProducts = createSimpleQuery({
  keys: productKeys,
  table: "products",
  softDelete: true,
});
