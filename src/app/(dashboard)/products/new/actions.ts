"use server";

import { revalidatePath } from "next/cache";
import { validateProductInput } from "@/lib/domain-rules";
import { requireAppContext } from "@/lib/erp";

export async function createProduct(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const { supabase, organizationId } = await requireAppContext();

  const name = formData.get("name")?.toString() ?? "";
  const costPrice = Number(formData.get("cost_price") ?? 0);
  const salePrice = Number(formData.get("sale_price") ?? 0);
  const currentStock = Number(formData.get("current_stock") ?? 0);
  const minStock = Number(formData.get("min_stock") ?? 0);
  const sku = formData.get("sku")?.toString() ?? null;
  const barcode = formData.get("barcode")?.toString() ?? null;
  const unit = formData.get("unit")?.toString() ?? "ширхэг";
  const brandId = formData.get("brand_id")?.toString() || null;

  const validationError = validateProductInput({
    name,
    costPrice,
    salePrice,
    currentStock,
    minStock,
  });

  if (validationError) {
    return { error: validationError };
  }

  const { error } = await supabase.from("products").insert({
    organization_id: organizationId,
    name: name.trim(),
    sku: sku?.trim() || null,
    barcode: barcode?.trim() || null,
    unit,
    brand_id: brandId || null,
    cost_price: costPrice,
    sale_price: salePrice,
    current_stock: currentStock,
    min_stock: minStock,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/products");
  return { success: true as const };
}
