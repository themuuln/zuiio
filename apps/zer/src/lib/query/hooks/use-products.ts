"use client";

import { createSimpleQuery } from "@/lib/query/factory";
import { productKeys } from "@/lib/query/keys";

export const useProducts = createSimpleQuery({
  keys: productKeys,
  table: "products",
  select: "id, name, sku, sale_price, current_stock, unit, barcode, image_url",
  softDelete: true,
});
