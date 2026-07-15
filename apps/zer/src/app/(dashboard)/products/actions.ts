"use server";

import { capture } from "@zuiio/capture";
import { requireActionContext } from "@/lib/action-utils";
import { validateProductInput } from "@/lib/domain-rules";
import { checkLowStockAndNotify } from "@/lib/notification";
import { revalidateEntity } from "@/lib/revalidate";

export async function updateProduct(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const ctx = await requireActionContext("products.update");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId } = ctx;

  const id = formData.get("id")?.toString();
  if (!id) {
    return { error: "Бүтээгдэхүүний ID олдсонгүй." };
  }

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
  const isPublic = formData.get("is_public") === "on";

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
    const { data: existing, error: queryError } = await supabase
      .from("categories")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("name", categoryName.trim())
      .maybeSingle();
    if (queryError) {
      capture(queryError, {
        context: "updateProduct: check existing category",
      });
    }

    if (existing) {
      categoryId = existing.id;
    } else {
      const { data: created, error: createCatError } = await supabase
        .from("categories")
        .insert({
          name: categoryName.trim(),
          organization_id: organizationId,
          slug: "",
        })
        .select("id")
        .single();
      if (createCatError) {
        capture(createCatError, { context: "updateProduct: create category" });
      }

      if (created) categoryId = created.id;
    }
  }

  const { error } = await supabase
    .from("products")
    .update({
      name: name.trim(),
      sku: sku?.trim() || null,
      barcode: barcode?.trim() || null,
      unit,
      brand_id: brandId || null,
      category_id: categoryId,
      cost_price: costPrice,
      sale_price: salePrice,
      ...(formData.has("current_stock") ? { current_stock: currentStock } : {}),
      ...(isPublic !== undefined
        ? {
            is_public: isPublic,
            published_at: isPublic ? new Date().toISOString() : null,
          }
        : {}),
    } as never)
    .eq("id", id);

  if (error) {
    capture(error, { context: "updateProduct: update" });
    return { error: error.message };
  }

  // Handle variants if provided
  const variantGroupsRaw = formData.get("variant_groups")?.toString();
  const variantDataRaw = formData.get("variant_data")?.toString();

  if (variantGroupsRaw && variantDataRaw) {
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

      // Delete existing variant data (cascade: assignments → options → variants → groups)
      // Only after JSON parsing succeeds, to preserve old data if parsing fails
      const { data: existingVariants, error: varError } = await supabase
        .from("product_variants")
        .select("id")
        .eq("product_id", id);
      if (varError) {
        capture(varError, {
          context: "updateProduct: fetch existing variants",
        });
      }
      const existingVariantIds = (existingVariants ?? []).map((v) => v.id);

      const { data: existingGroups, error: groupError } = await supabase
        .from("product_variant_groups")
        .select("id")
        .eq("product_id", id);
      if (groupError) {
        capture(groupError, {
          context: "updateProduct: fetch existing groups",
        });
      }
      const existingGroupIds = (existingGroups ?? []).map((g) => g.id);

      if (existingVariantIds.length > 0) {
        await supabase
          .from("product_variant_assignments")
          .delete()
          .in("variant_id", existingVariantIds);
      }
      if (existingGroupIds.length > 0) {
        await supabase
          .from("product_variant_options")
          .delete()
          .in("group_id", existingGroupIds);
      }
      if (existingVariantIds.length > 0) {
        await supabase
          .from("product_variants")
          .delete()
          .in("id", existingVariantIds);
      }
      if (existingGroupIds.length > 0) {
        await supabase
          .from("product_variant_groups")
          .delete()
          .in("id", existingGroupIds);
      }

      if (groups.length > 0) {
        // 1. Create groups and options, mapping temp IDs to real IDs
        const optionIdMap = new Map<string, string>(); // temp ID -> real DB ID

        for (const group of groups) {
          const { data: dbGroup, error: groupError } = await supabase
            .from("product_variant_groups")
            .insert({
              product_id: id,
              name: group.name.trim(),
            })
            .select("id")
            .single();

          if (groupError || !dbGroup) {
            capture(groupError, { context: "products: create variant group" });
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
              product_id: id,
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
            capture(assignError, {
              context: "products: create variant assignments",
            });
          }
        }
      }
    } catch (parseError) {
      capture(parseError, { context: "products: parse variant data" });
      return {
        error:
          "Бүтээгдэхүүн шинэчлэгдсэн боловч вариантуудыг хадгалахад алдаа гарлаа.",
      };
    }
  }

  // Check low stock and notify
  checkLowStockAndNotify(organizationId, name, currentStock, minStock);

  revalidateEntity("products");
  return { success: true as const };
}

export async function deleteProduct(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const ctx = await requireActionContext("products.delete");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId } = ctx;

  const id = formData.get("id")?.toString();
  if (!id) {
    return { error: "Бүтээгдэхүүний ID олдсонгүй." };
  }

  // Soft-delete: set deleted_at instead of hard-deleting, so historical
  // references (stock movements, invoices, sales) remain valid.
  const { error } = await supabase
    .from("products")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("organization_id", organizationId);

  if (error) {
    capture(error, { context: "deleteProduct: delete" });
    return { error: error.message ?? "Бүтээгдэхүүн устгахад алдаа гарлаа." };
  }

  revalidateEntity("products");
  revalidateEntity("inventory");
  return { success: true as const };
}

export async function toggleProductPublication(
  productId: string,
  isPublic: boolean,
) {
  const ctx = await requireActionContext("products.update");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId } = ctx;

  const { error } = await supabase
    .from("products")
    .update({
      is_public: isPublic,
      published_at: isPublic ? new Date().toISOString() : null,
    } as never)
    .eq("id", productId)
    .eq("organization_id", organizationId);

  if (error) {
    capture(error, { context: "toggleProductPublication" });
    return { error: "Нийтлэх статус өөрчлөхөд алдаа гарлаа." };
  }

  revalidateEntity("products");
  return { success: true as const };
}
