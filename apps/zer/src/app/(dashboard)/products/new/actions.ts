"use server";

import { capture } from "@zuiio/capture";
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
  const brandName = formData.get("brand_name")?.toString() || null;
  const categoryName = formData.get("category_name")?.toString() || null;
  const imageUrl = formData.get("image_url")?.toString() || null;

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
        context: "createProduct: check existing category",
      });
    }

    if (existing) {
      categoryId = existing.id;
    } else {
      const { data: created, error: createCatError } = await supabase
        .from("categories")
        .insert({ name: categoryName.trim(), organization_id: organizationId })
        .select("id")
        .single();
      if (createCatError) {
        capture(createCatError, { context: "createProduct: create category" });
      }

      if (created) categoryId = created.id;
    }
  }
  // Resolve brand_name to brand_id (find-or-create, same as categories)
  let resolvedBrandId: string | null = null;
  if (brandName) {
    const { data: existingBrand, error: brandQueryError } = await supabase
      .from("brands")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("name", brandName.trim())
      .maybeSingle();
    if (brandQueryError) {
      capture(brandQueryError, {
        context: "createProduct: check existing brand",
      });
    }

    if (existingBrand) {
      resolvedBrandId = existingBrand.id;
    } else {
      const { data: newBrand, error: createBrandError } = await supabase
        .from("brands")
        .insert({ name: brandName.trim(), organization_id: organizationId })
        .select("id")
        .single();
      if (createBrandError) {
        capture(createBrandError, { context: "createProduct: create brand" });
      }

      if (newBrand) resolvedBrandId = newBrand.id;
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
      brand_id: resolvedBrandId,
      category_id: categoryId,
      cost_price: costPrice,
      sale_price: salePrice,
      current_stock: currentStock,
      min_stock: minStock,
      image_url: imageUrl,
    })
    .select("id")
    .single();

  if (error) {
    capture(error, { context: "createProduct: insert" });
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
            capture(groupError, {
              context: "products/new: create variant group",
            });
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
            capture(assignError, {
              context: "products/new: create variant assignments",
            });
          }
        }
      }
    } catch (parseError) {
      capture(parseError, { context: "products/new: parse variant data" });
      return {
        error:
          "Бүтээгдэхүүн хадгалагдсан боловч вариантуудыг хадгалахад алдаа гарлаа.",
      };
    }
  }

  revalidateEntity("products");
  return { success: true as const };
}
