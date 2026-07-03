"use server";

import { revalidatePath } from "next/cache";
import { validateProductInput } from "@/lib/domain-rules";
import { parseAmount, requireAppContext } from "@/lib/erp";
import { getString } from "@/lib/validation";

export async function createProduct(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const { supabase, organizationId, userId } = await requireAppContext();

  const name = getString(formData, "name");
  const sku = getString(formData, "sku");
  const barcode = getString(formData, "barcode");
  const unit = getString(formData, "unit") || "ширхэг";
  const categoryName = getString(formData, "category_name");
  const costPrice = parseAmount(formData.get("cost_price"));
  const salePrice = parseAmount(formData.get("sale_price"));
  const currentStock = parseAmount(formData.get("current_stock"));
  const minStock = parseAmount(formData.get("min_stock"));

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

  const duplicateProductQuery = supabase
    .from("products")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("name", name);

  const [existingByNameResult, existingBySkuResult] = await Promise.all([
    duplicateProductQuery.maybeSingle(),
    sku
      ? supabase
          .from("products")
          .select("id")
          .eq("organization_id", organizationId)
          .eq("sku", sku)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  if (existingByNameResult.error) {
    return { error: existingByNameResult.error.message };
  }

  if (existingBySkuResult.error) {
    return { error: existingBySkuResult.error.message };
  }

  if (existingByNameResult.data) {
    return { error: "Ийм нэртэй бүтээгдэхүүн аль хэдийн бүртгэгдсэн байна." };
  }

  if (existingBySkuResult.data) {
    return { error: "Ийм SKU-тай бүтээгдэхүүн аль хэдийн бүртгэгдсэн байна." };
  }

  let categoryId: string | null = null;
  let createdCategoryId: string | null = null;
  if (categoryName) {
    const { data: existingCategory, error: categoryLookupError } =
      await supabase
        .from("categories")
        .select("id")
        .eq("organization_id", organizationId)
        .eq("name", categoryName)
        .maybeSingle();

    if (categoryLookupError) {
      return { error: categoryLookupError.message };
    }

    if (existingCategory) {
      categoryId = existingCategory.id;
    } else {
      const { data: createdCategory, error: categoryInsertError } =
        await supabase
          .from("categories")
          .insert({
            organization_id: organizationId,
            name: categoryName,
          })
          .select("id")
          .single();

      if (categoryInsertError || !createdCategory) {
        return { error: categoryInsertError?.message ?? "Ангилал үүссэнгүй." };
      }

      categoryId = createdCategory.id;
      createdCategoryId = createdCategory.id;
    }
  }

  const { data: product, error } = await supabase
    .from("products")
    .insert({
      organization_id: organizationId,
      name,
      sku: sku || null,
      barcode: barcode || null,
      unit,
      category_id: categoryId,
      cost_price: costPrice,
      sale_price: salePrice,
      current_stock: currentStock,
      min_stock: minStock,
    })
    .select("id")
    .single();

  if (error || !product) {
    if (createdCategoryId) {
      await supabase.from("categories").delete().eq("id", createdCategoryId);
    }
    return { error: error?.message ?? "Бүтээгдэхүүн хадгалахад алдаа гарлаа." };
  }

  if (currentStock > 0) {
    const { error: movementError } = await supabase
      .from("stock_movements")
      .insert({
        organization_id: organizationId,
        product_id: product.id,
        type: "in",
        quantity: currentStock,
        unit_cost: costPrice,
        reference: "initial-stock",
        notes: "Анхны үлдэгдэл",
        created_by: userId,
      });

    if (movementError) {
      await supabase.from("products").delete().eq("id", product.id);
      if (createdCategoryId) {
        await supabase.from("categories").delete().eq("id", createdCategoryId);
      }
      return { error: movementError.message };
    }
  }

  revalidatePath("/products");
  revalidatePath("/inventory");
  revalidatePath("/");
  return { success: true as const };
}
