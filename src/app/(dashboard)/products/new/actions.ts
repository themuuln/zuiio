"use server";

import { requireActionContext } from "@/lib/action-utils";
import { validateProductInput } from "@/lib/domain-rules";
import { revalidateEntity } from "@/lib/revalidate";

export async function createProduct(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const ctx = await requireActionContext("products.create");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId } = ctx;

  const name = formData.get("name")?.toString() ?? "";
  const costPrice = Number(formData.get("cost_price") ?? 0);
  const salePrice = Number(formData.get("sale_price") ?? 0);
  const currentStock = Number(formData.get("current_stock") ?? 0);
  const minStock = Number(formData.get("min_stock") ?? 0);
  const sku = formData.get("sku")?.toString() ?? null;
  const barcode = formData.get("barcode")?.toString() ?? null;
  const unit = formData.get("unit")?.toString() ?? "ширхэг";
  const brandId = formData.get("brand_id")?.toString() || null;
  const categoryName = formData.get("category_name")?.toString() || null;

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

  // Resolve category_name to category_id
  let categoryId: string | null = null;
  if (categoryName) {
    const { data: existing } = await supabase
      .from("categories")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("name", categoryName.trim())
      .maybeSingle();

    if (existing) {
      categoryId = existing.id;
    } else {
      const { data: created } = await supabase
        .from("categories")
        .insert({ name: categoryName.trim(), organization_id: organizationId })
        .select("id")
        .single();

      if (created) categoryId = created.id;
    }
  }

  const { data: product, error } = await supabase
    .from("products")
    .insert({
      organization_id: organizationId,
      name: name.trim(),
      sku: sku?.trim() || null,
      barcode: barcode?.trim() || null,
      unit,
      brand_id: brandId || null,
      category_id: categoryId,
      cost_price: costPrice,
      sale_price: salePrice,
      current_stock: currentStock,
      min_stock: minStock,
    })
    .select("id")
    .single();

  if (error) {
    return { error: error.message };
  }

  // Handle variants if provided
  const variantGroupsRaw = formData.get("variant_groups")?.toString();
  const variantDataRaw = formData.get("variant_data")?.toString();

  if (variantGroupsRaw && variantDataRaw && product) {
    try {
      const groups: {
        id: string;
        name: string;
        options: { id: string; value: string }[];
      }[] = JSON.parse(variantGroupsRaw);
      const variants: {
        sku: string;
        cost_price: number;
        sale_price: number;
        current_stock: number;
        option_ids: string[];
        image_url: string | null;
      }[] = JSON.parse(variantDataRaw);

      if (groups.length > 0) {
        // 1. Create groups and options, mapping temp IDs to real IDs
        const optionIdMap = new Map<string, string>(); // temp ID -> real DB ID

        for (const group of groups) {
          const { data: dbGroup, error: groupError } = await supabase
            .from("product_variant_groups")
            .insert({
              product_id: product.id,
              name: group.name.trim(),
            })
            .select("id")
            .single();

          if (groupError || !dbGroup) {
            console.error("Failed to create variant group:", groupError);
            continue;
          }

          for (const option of group.options) {
            if (!option.value.trim()) continue;
            const { data: dbOption, error: optionError } = await supabase
              .from("product_variant_options")
              .insert({
                group_id: dbGroup.id,
                value: option.value.trim(),
              })
              .select("id")
              .single();

            if (optionError || !dbOption) continue;
            optionIdMap.set(option.id, dbOption.id);
          }
        }

        // 2. Create variants with stock = 0 for any empty SKUs
        for (const v of variants) {
          if (!v.sku?.trim()) continue; // skip variants without SKU
          const realOptionIds = v.option_ids
            .map((oid) => optionIdMap.get(oid))
            .filter((id): id is string => !!id);

          if (realOptionIds.length === 0) continue;

          const { data: dbVariant, error: variantError } = await supabase
            .from("product_variants")
            .insert({
              product_id: product.id,
              sku: v.sku.trim(),
              cost_price: v.cost_price,
              sale_price: v.sale_price,
              current_stock: v.current_stock,
              image_urls: v.image_url ? [v.image_url] : null,
              is_active: true,
            })
            .select("id")
            .single();

          if (variantError || !dbVariant) continue;

          // 3. Create assignments
          const assignments = realOptionIds.map((oid) => ({
            variant_id: dbVariant.id,
            option_id: oid,
          }));

          const { error: assignError } = await supabase
            .from("product_variant_assignments")
            .insert(assignments);

          if (assignError) {
            console.error("Failed to create variant assignments:", assignError);
          }
        }
      }
    } catch (parseError) {
      console.error("Failed to parse variant data:", parseError);
      return {
        error:
          "Бүтээгдэхүүн хадгалагдсан боловч вариантуудыг хадгалахад алдаа гарлаа.",
      };
    }
  }

  revalidateEntity("products");
  return { success: true as const };
}
