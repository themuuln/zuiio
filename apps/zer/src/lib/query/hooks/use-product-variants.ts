"use client";

import { useQuery } from "@tanstack/react-query";
import { capture } from "@zuiio/capture";
import { variantKeys } from "@/lib/query/keys";
import { createClient } from "@/lib/supabase/client";

export type VariantGroupWithOptions = {
  id: string;
  product_id: string;
  name: string;
  sort_order: number | null;
  options: {
    id: string;
    group_id: string;
    value: string;
    sort_order: number | null;
  }[];
};

export type ProductVariant = {
  id: string;
  product_id: string;
  sku: string | null;
  barcode: string | null;
  cost_price: number | null;
  sale_price: number | null;
  current_stock: number | null;
  min_stock: number | null;
  image_urls: string[] | null;
  is_active: boolean | null;
  created_at: string | null;
  option_labels: string;
  option_ids: string[];
};

export type ProductVariantDetail = ProductVariant & {
  assignments: {
    id: string;
    option_id: string;
    group_name: string;
    option_value: string;
  }[];
};

async function fetchVariantGroups(productId: string) {
  const supabase = createClient();

  const { data: groups, error: groupsError } = await supabase
    .from("product_variant_groups")
    .select("id, product_id, name, sort_order")
    .eq("product_id", productId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (groupsError) {
    capture(groupsError, { context: "fetchVariantGroups:groups" });
    throw groupsError;
  }

  const groupsWithOptions: VariantGroupWithOptions[] = [];
  for (const group of groups) {
    const { data: options, error: optionsError } = await supabase
      .from("product_variant_options")
      .select("id, group_id, value, sort_order")
      .eq("group_id", group.id)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (optionsError) {
      capture(optionsError, { context: "fetchVariantGroups:options" });
      throw optionsError;
    }

    groupsWithOptions.push({ ...group, options: options ?? [] });
  }

  return groupsWithOptions;
}

async function fetchVariants(productId: string) {
  const supabase = createClient();

  const { data: variants, error } = await supabase
    .from("product_variants")
    .select(
      "id, product_id, sku, barcode, cost_price, sale_price, current_stock, min_stock, image_urls, is_active, created_at",
    )
    .eq("product_id", productId)
    .order("created_at", { ascending: true });

  if (error) {
    capture(error, { context: "fetchVariants:variants" });
    throw error;
  }

  const enriched: ProductVariant[] = [];
  for (const v of variants ?? []) {
    const { data: assigns, error: assignError } = await supabase
      .from("product_variant_assignments")
      .select("id, option_id")
      .eq("variant_id", v.id);

    if (assignError) {
      capture(assignError, { context: "fetchVariants:assignments" });
      throw assignError;
    }

    // Fetch option values
    const optionIds = assigns?.map((a) => a.option_id) ?? [];
    let optionLabels = "";

    if (optionIds.length > 0) {
      const { data: opts, error: optsError } = await supabase
        .from("product_variant_options")
        .select("value, group_id")
        .in("id", optionIds)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });

      if (optsError) {
        capture(optsError, { context: "fetchVariants:options" });
        throw optsError;
      }
      optionLabels = opts?.map((o) => o.value).join(" / ") ?? "";
    }

    enriched.push({
      ...v,
      option_labels: optionLabels,
      option_ids: optionIds,
    });
  }

  return enriched;
}

export function useVariantGroups(productId: string | undefined) {
  return useQuery({
    queryKey: variantKeys.byProduct(productId ?? ""),
    queryFn: () => fetchVariantGroups(productId!),
    enabled: !!productId,
  });
}

export function useProductVariants(productId: string | undefined) {
  return useQuery({
    queryKey: [...variantKeys.byProduct(productId ?? ""), "variants"],
    queryFn: () => fetchVariants(productId!),
    enabled: !!productId,
  });
}
