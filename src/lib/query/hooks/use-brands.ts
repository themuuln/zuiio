"use client";

import { createSimpleQuery } from "@/lib/query/factory";
import { brandKeys } from "@/lib/query/keys";

export const useBrands = createSimpleQuery({
  keys: brandKeys,
  table: "brands",
  select: "id, name, logo_url",
});
