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

export async function fetchVariantGroups(productId: string) {
  const supabase = createClient();

  // Single query: groups + nested options (was 1 + N queries)
  const { data: groups, error } = await supabase
    .from("product_variant_groups")
    .select(
      "id, product_id, name, sort_order, product_variant_options(id, group_id, value, sort_order)",
    )
    .eq("product_id", productId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    capture(error, { context: "fetchVariantGroups" });
    throw error;
  }

  return (groups ?? []).map((group) => ({
    id: group.id,
    product_id: group.product_id,
    name: group.name,
    sort_order: group.sort_order,
    options: (group.product_variant_options ?? [])
      .slice()
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
  }));
}

export async function fetchVariants(productId: string) {
  const supabase = createClient();

  // Single query: variants → assignments → options (was 1 + N×2 queries)
  const { data: variants, error } = await supabase
    .from("product_variants")
    .select(
      "id, product_id, sku, barcode, cost_price, sale_price, current_stock, min_stock, image_urls, is_active, created_at, product_variant_assignments(id, option_id, product_variant_options(value, group_id))",
    )
    .eq("product_id", productId)
    .order("created_at", { ascending: true });

  if (error) {
    capture(error, { context: "fetchVariants" });
    throw error;
  }

  return (variants ?? []).map((v) => {
    const assignments = v.product_variant_assignments ?? [];
    const optionIds = assignments.map((a) => a.option_id);
    const optionLabels = assignments
      .flatMap((a) => a.product_variant_options?.value ?? [])
      .join(" / ");

    return {
      id: v.id,
      product_id: v.product_id,
      sku: v.sku,
      barcode: v.barcode,
      cost_price: v.cost_price,
      sale_price: v.sale_price,
      current_stock: v.current_stock,
      min_stock: v.min_stock,
      image_urls: v.image_urls,
      is_active: v.is_active,
      created_at: v.created_at,
      option_labels: optionLabels,
      option_ids: optionIds,
    };
  });
}

export function useVariantGroups(productId: string | undefined) {
  return useQuery({
    queryKey: variantKeys.byProduct(productId ?? ""),
    queryFn: () => fetchVariantGroups(productId as string),
    enabled: !!productId,
  });
}

export function useProductVariants(productId: string | undefined) {
  return useQuery({
    queryKey: [...variantKeys.byProduct(productId ?? ""), "variants"],
    queryFn: () => fetchVariants(productId as string),
    enabled: !!productId,
  });
}
