"use client";

import { createSimpleQuery } from "@/lib/query/factory";
import { brandKeys } from "@/lib/query/keys";

export const useBrands = createSimpleQuery<{
  id: string;
  name: string;
  logo_url: string | null;
}>({
  keys: brandKeys,
  table: "brands",
  select: "id, name, logo_url",
});
