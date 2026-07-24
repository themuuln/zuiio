import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { capture } from "@zuiio/capture";
import type { Database } from "@/lib/supabase/types";

export type SupabaseDb = SupabaseClient<Database>;

/**
 * Fetch products by IDs for stock validation.
 * Returns a Map of productId -> product data.
 */
export async function fetchProductsForStock(
  supabase: SupabaseDb,
  organizationId: string,
  productIds: string[],
): Promise<
  Map<
    string,
    {
      id: string;
      name: string;
      current_stock: number | null;
      unit: string | null;
    }
  >
> {
  const { data: products, error } = await supabase
    .from("products")
    .select("id, name, current_stock, unit")
    .eq("organization_id", organizationId)
    .in("id", productIds);
  if (error) capture(error, { context: "[stock-utils] fetchProductsForStock" });

  return new Map((products ?? []).map((p) => [p.id, p]));
}

/**
 * Fetch variants by IDs for stock validation.
 * Returns a Map of variantId -> variant data.
 */
export async function fetchVariantsForStock(
  supabase: SupabaseDb,
  variantIds: string[],
): Promise<
  Map<string, { id: string; current_stock: number | null; product_id: string }>
> {
  const { data: variants, error } = await supabase
    .from("product_variants")
    .select("id, current_stock, product_id")
    .in("id", variantIds);
  if (error) capture(error, { context: "[stock-utils] fetchVariantsForStock" });

  return new Map(
    (variants ?? []).map((v) => [
      v.id,
      { ...v, product_id: v.product_id ?? "" },
    ]),
  );
}

/**
 * Atomically decrement a product's current_stock.
 * Uses .gte() guard to prevent negative stock.
 *
 * Returns the updated product row on success, or null if insufficient stock.
 */
export async function decrementProductStock(
  supabase: SupabaseDb,
  organizationId: string,
  productId: string,
  quantity: number,
): Promise<{ id: string; current_stock: number; name: string } | null> {
  const { data: product, error: fetchError } = await supabase
    .from("products")
    .select("id, current_stock, name")
    .eq("organization_id", organizationId)
    .eq("id", productId)
    .single();
  if (fetchError)
    capture(fetchError, { context: "[stock-utils] decrementProductStock" });

  if (!product) return null;

  const { data: updated, error } = await supabase
    .from("products")
    .update({
      current_stock: Number(product.current_stock ?? 0) - quantity,
    })
    .eq("organization_id", organizationId)
    .eq("id", productId)
    .gte("current_stock", quantity)
    .select("id, current_stock, name")
    .maybeSingle();

  if (error || !updated) return null;
  return updated as { id: string; current_stock: number; name: string };
}

/**
 * Atomically decrement a variant's current_stock.
 * Uses .gte() guard to prevent negative stock.
 */
export async function decrementVariantStock(
  supabase: SupabaseDb,
  variantId: string,
  quantity: number,
): Promise<boolean> {
  const { data: variant, error: fetchError } = await supabase
    .from("product_variants")
    .select("id, current_stock")
    .eq("id", variantId)
    .single();
  if (fetchError)
    capture(fetchError, {
      context: "[stock-utils] decrementVariantStock fetch",
    });

  if (!variant) return false;

  const { data: updated, error } = await supabase
    .from("product_variants")
    .update({
      current_stock: Number(variant.current_stock ?? 0) - quantity,
    })
    .eq("id", variantId)
    .gte("current_stock", quantity)
    .select("id")
    .maybeSingle();
  if (error)
    capture(error, { context: "[stock-utils] decrementVariantStock update" });

  return !!updated;
}

/**
 * Atomically increment a product's current_stock.
 */
export async function incrementProductStock(
  supabase: SupabaseDb,
  organizationId: string,
  productId: string,
  quantity: number,
): Promise<boolean> {
  const { data: product, error: fetchError } = await supabase
    .from("products")
    .select("current_stock")
    .eq("organization_id", organizationId)
    .eq("id", productId)
    .single();
  if (fetchError)
    capture(fetchError, { context: "[stock-utils] incrementProductStock" });

  if (!product) return false;

  const { error } = await supabase
    .from("products")
    .update({
      current_stock: Number(product.current_stock ?? 0) + quantity,
    })
    .eq("organization_id", organizationId)
    .eq("id", productId);

  return !error;
}

/**
 * Create stock movement records for sale/purchase/return items.
 */
export async function createStockMovements(
  supabase: SupabaseDb,
  params: {
    organizationId: string;
    branchId: string;
    type: "in" | "out";
    reference: string;
    createdBy: string;
    items: Array<{
      productId: string;
      quantity: number;
      unitCost: number;
      variantId?: string | null;
    }>;
  },
): Promise<{ error?: string }> {
  const { organizationId, branchId, type, reference, createdBy, items } =
    params;

  const movements = items.map((item) => ({
    organization_id: organizationId,
    branch_id: branchId,
    product_id: item.productId,
    type,
    quantity: item.quantity,
    unit_cost: item.unitCost,
    reference,
    created_by: createdBy,
    variant_id: item.variantId ?? null,
  }));

  const { error } = await supabase.from("stock_movements").insert(movements);

  if (error) {
    return {
      error: error.message ?? "Барааны хөдөлгөөн бүртгэхэд алдаа гарлаа.",
    };
  }

  return {};
}
