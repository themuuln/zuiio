"use server";

import { requireWriteAction } from "@/lib/action-utils";
import { validateStockMovementInput } from "@/lib/domain-rules";
import { parseAmount } from "@/lib/erp";
import { checkLowStockAndNotify } from "@/lib/notification";
import { revalidateEntities } from "@/lib/revalidate";
import { getString } from "@/lib/validation";

export async function createStockMovement(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const ctx = await requireWriteAction("stock_movements.create");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId, userId, branchId } = ctx;

  const productId = getString(formData, "product_id");
  const type = getString(formData, "type");
  const quantity = parseAmount(formData.get("quantity"));
  const unitCost = parseAmount(formData.get("unit_cost"));
  const reference = getString(formData, "reference") || null;
  const notes = getString(formData, "notes") || null;

  const validationError = validateStockMovementInput({
    productId,
    type,
    quantity,
  });
  if (validationError) {
    return { error: validationError };
  }

  // Verify product exists and belongs to this organization
  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id, current_stock, name")
    .eq("organization_id", organizationId)
    .eq("id", productId)
    .single();

  if (productError || !product) {
    return { error: "Сонгосон бүтээгдэхүүн олдсонгүй." };
  }

  // INSERT stock_movement record
  const { error: movementError } = await supabase
    .from("stock_movements")
    .insert({
      organization_id: organizationId,
      branch_id: branchId!,
      product_id: productId,
      type,
      quantity,
      unit_cost: unitCost || null,
      reference,
      notes,
      created_by: userId,
    });

  if (movementError) {
    return {
      error: movementError.message ?? "Хөдөлгөөн бүртгэхэд алдаа гарлаа.",
    };
  }

  // Atomic stock update: use .gte() guard to prevent
  // negative stock when decreasing (adjustment with negative quantity).
  // For positive adjustments and stock-in, the guard always passes.
  const updateQuery = supabase
    .from("products")
    .update({ current_stock: Number(product.current_stock ?? 0) + quantity })
    .eq("organization_id", organizationId)
    .eq("id", productId);

  // For decrements, guard against stock going below 0
  if (quantity < 0) {
    updateQuery.gte("current_stock", Math.abs(quantity));
  }

  const { data: updatedProduct, error: stockUpdateError } = await updateQuery
    .select("id, current_stock, min_stock, name")
    .maybeSingle();

  if (stockUpdateError || (!updatedProduct && quantity < 0)) {
    // Rollback the stock_movement insert
    await supabase
      .from("stock_movements")
      .delete()
      .eq("organization_id", organizationId)
      .eq("product_id", productId)
      .eq("type", type)
      .eq("quantity", quantity)
      .eq("created_by", userId)
      .order("created_at", { ascending: false })
      .limit(1);

    if (stockUpdateError) {
      return {
        error: stockUpdateError.message ?? "Үлдэгдэл шинэчлэхэд алдаа гарлаа.",
      };
    }

    return { error: "Үлдэгдэл хүрэлцэхгүй байна." };
  }

  // Check low stock and notify
  if (updatedProduct) {
    checkLowStockAndNotify(
      organizationId,
      updatedProduct.name,
      updatedProduct.current_stock ?? 0,
      updatedProduct.min_stock ?? 0,
    );
  }

  revalidateEntities(["inventory"]);
  return { success: true as const, error: undefined };
}
