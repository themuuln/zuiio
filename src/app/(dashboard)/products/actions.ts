"use server";

import { revalidatePath } from "next/cache";
import { validateProductInput } from "@/lib/domain-rules";
import { parseAmount, requireAppContext } from "@/lib/erp";
import { getString } from "@/lib/validation";

export async function updateProduct(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const { supabase, organizationId } = await requireAppContext();

  const id = getString(formData, "id");
  const name = getString(formData, "name");
  const sku = getString(formData, "sku");
  const barcode = getString(formData, "barcode");
  const unit = getString(formData, "unit") || "ширхэг";
  const categoryName = getString(formData, "category_name");
  const costPrice = parseAmount(formData.get("cost_price"));
  const salePrice = parseAmount(formData.get("sale_price"));
  const currentStock = parseAmount(formData.get("current_stock"));
  const minStock = parseAmount(formData.get("min_stock"));

  if (!id) {
    return { error: "Бүтээгдэхүүний ID олдсонгүй." };
  }

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

  // Check for duplicate name (exclude current product)
  const { data: existingByName } = await supabase
    .from("products")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("name", name)
    .neq("id", id)
    .maybeSingle();

  if (existingByName) {
    return { error: "Ийм нэртэй бүтээгдэхүүн аль хэдийн бүртгэгдсэн байна." };
  }

  // Check for duplicate SKU (exclude current product)
  if (sku) {
    const { data: existingBySku } = await supabase
      .from("products")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("sku", sku)
      .neq("id", id)
      .maybeSingle();

    if (existingBySku) {
      return {
        error: "Ийм SKU-тай бүтээгдэхүүн аль хэдийн бүртгэгдсэн байна.",
      };
    }
  }

  // Resolve category
  let categoryId: string | null = null;
  if (categoryName) {
    const { data: existingCategory } = await supabase
      .from("categories")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("name", categoryName)
      .maybeSingle();

    if (existingCategory) {
      categoryId = existingCategory.id;
    } else {
      const { data: createdCategory } = await supabase
        .from("categories")
        .insert({
          organization_id: organizationId,
          name: categoryName,
        })
        .select("id")
        .single();

      if (!createdCategory) {
        return { error: "Ангилал үүсэхэд алдаа гарлаа." };
      }

      categoryId = createdCategory.id;
    }
  }

  const { error } = await supabase
    .from("products")
    .update({
      name,
      sku: sku || null,
      barcode: barcode || null,
      unit,
      category_id: categoryId,
      cost_price: costPrice,
      sale_price: salePrice,
      min_stock: minStock,
    })
    .eq("id", id)
    .eq("organization_id", organizationId);

  if (error) {
    return { error: error.message ?? "Бүтээгдэхүүн хадгалахад алдаа гарлаа." };
  }

  revalidatePath("/products");
  revalidatePath("/inventory");
  revalidatePath("/");
  return { success: true as const };
}
