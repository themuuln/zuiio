"use server";

import { requireWriteAction } from "@/lib/action-utils";
import { revalidateEntities } from "@/lib/revalidate";

interface BundleItemInput {
  product_id: string;
  variant_id: string | null;
  quantity: number;
}

export async function createBundle(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const ctx = await requireWriteAction("products.create");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId, userId } = ctx;

  const name = formData.get("name") as string | null;
  const sku = formData.get("sku") as string | null;
  const salePriceStr = formData.get("sale_price") as string | null;
  const description = formData.get("description") as string | null;
  const itemsJson = formData.get("items") as string | null;

  if (!name?.trim()) {
    return { error: "Багцын нэр шаардлагатай." };
  }

  if (!itemsJson) {
    return { error: "Багцын барааны мэдээлэл шаардлагатай." };
  }

  let items: BundleItemInput[];
  try {
    items = JSON.parse(itemsJson);
  } catch {
    return { error: "Барааны мэдээллийн формат буруу байна." };
  }

  if (!Array.isArray(items) || items.length === 0) {
    return { error: "Дор хаяж нэг бараа оруулна уу." };
  }

  const salePrice = salePriceStr ? Number.parseFloat(salePriceStr) : null;

  // Calculate cost price from bundle items (batch SELECT, no N+1)
  const variantItems = items.filter((i) => i.variant_id);
  const productItems = items.filter((i) => !i.variant_id);
  let costPrice = 0;

  if (variantItems.length > 0) {
    const { data: variants } = await supabase
      .from("product_variants")
      .select("id, cost_price")
      .in(
        "id",
        variantItems.map((i) => i.variant_id!),
      );
    const variantMap = new Map(
      (variants || []).map((v) => [v.id, v.cost_price ?? 0]),
    );
    for (const item of variantItems) {
      costPrice += (variantMap.get(item.variant_id!) ?? 0) * item.quantity;
    }
  }

  if (productItems.length > 0) {
    const { data: products } = await supabase
      .from("products")
      .select("id, cost_price")
      .in(
        "id",
        productItems.map((i) => i.product_id),
      );
    const productMap = new Map(
      (products || []).map((p) => [p.id, p.cost_price ?? 0]),
    );
    for (const item of productItems) {
      costPrice += (productMap.get(item.product_id) ?? 0) * item.quantity;
    }
  }

  const { data: bundle, error: bundleError } = await supabase
    .from("product_bundles")
    .insert({
      organization_id: organizationId,
      name: name.trim(),
      sku: sku?.trim() || null,
      sale_price: salePrice,
      cost_price: costPrice || null,
      description: description?.trim() || null,
    })
    .select("id")
    .single();

  if (bundleError) {
    return {
      error: `Багц үүсгэхэд алдаа гарлаа: ${bundleError.message}`,
    };
  }

  const bundleItems = items.map((item) => ({
    bundle_id: bundle.id,
    product_id: item.product_id,
    variant_id: item.variant_id ?? null,
    quantity: item.quantity,
  }));

  const { error: itemsError } = await supabase
    .from("product_bundle_items")
    .insert(bundleItems);

  if (itemsError) {
    await supabase.from("product_bundles").delete().eq("id", bundle.id);
    return {
      error: `Багцын бараа хадгалахад алдаа гарлаа: ${itemsError.message}`,
    };
  }

  revalidateEntities(["products"]);
  return { success: true, error: undefined };
}

export async function deleteBundle(bundleId: string) {
  const ctx = await requireWriteAction("products.delete");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId } = ctx;

  const { error } = await supabase
    .from("product_bundles")
    .delete()
    .eq("id", bundleId)
    .eq("organization_id", organizationId);

  if (error) {
    return { error: `Багц устгахад алдаа гарлаа: ${error.message}` };
  }

  revalidateEntities(["products"]);
  return { success: true, error: undefined };
}

export async function updateBundle(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const ctx = await requireWriteAction("products.update");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId } = ctx;

  const id = formData.get("id") as string | null;
  const name = formData.get("name") as string | null;
  const sku = formData.get("sku") as string | null;
  const salePriceStr = formData.get("sale_price") as string | null;
  const description = formData.get("description") as string | null;
  const isActiveStr = formData.get("is_active") as string | null;
  const itemsJson = formData.get("items") as string | null;

  if (!id) return { error: "Багцын ID олдсонгүй." };
  if (!name?.trim()) return { error: "Багцын нэр шаардлагатай." };

  const salePrice = salePriceStr ? Number.parseFloat(salePriceStr) : null;
  const isActive =
    isActiveStr === "true" ? true : isActiveStr === "false" ? false : undefined;

  // Calculate cost price from bundle items (batch SELECT, no N+1)
  let costPrice = 0;
  if (itemsJson) {
    let items: BundleItemInput[];
    try {
      items = JSON.parse(itemsJson);
    } catch {
      return { error: "Барааны мэдээллийн формат буруу байна." };
    }

    if (!Array.isArray(items) || items.length === 0) {
      return { error: "Дор хаяж нэг бараа оруулна уу." };
    }

    const variantItems = items.filter((i) => i.variant_id);
    const productItems = items.filter((i) => !i.variant_id);

    if (variantItems.length > 0) {
      const { data: variants } = await supabase
        .from("product_variants")
        .select("id, cost_price")
        .in(
          "id",
          variantItems.map((i) => i.variant_id!),
        );
      const variantMap = new Map(
        (variants || []).map((v) => [v.id, v.cost_price ?? 0]),
      );
      for (const item of variantItems) {
        costPrice += (variantMap.get(item.variant_id!) ?? 0) * item.quantity;
      }
    }

    if (productItems.length > 0) {
      const { data: products } = await supabase
        .from("products")
        .select("id, cost_price")
        .in(
          "id",
          productItems.map((i) => i.product_id),
        );
      const productMap = new Map(
        (products || []).map((p) => [p.id, p.cost_price ?? 0]),
      );
      for (const item of productItems) {
        costPrice += (productMap.get(item.product_id) ?? 0) * item.quantity;
      }
    }
  }

  const { error: updateError } = await supabase
    .from("product_bundles")
    .update({
      name: name.trim(),
      sku: sku?.trim() || null,
      sale_price: salePrice,
      cost_price: costPrice || null,
      description: description?.trim() || null,
      ...(isActive !== undefined ? { is_active: isActive } : {}),
    })
    .eq("id", id)
    .eq("organization_id", organizationId);

  if (updateError) {
    return { error: `Багц шинэчлэхэд алдаа гарлаа: ${updateError.message}` };
  }

  // Update bundle items if provided
  if (itemsJson) {
    let items: BundleItemInput[];
    try {
      items = JSON.parse(itemsJson);
    } catch {
      return { error: "Барааны мэдээллийн формат буруу байна." };
    }

    // Delete existing items and insert new ones
    const { error: deleteError } = await supabase
      .from("product_bundle_items")
      .delete()
      .eq("bundle_id", id);

    if (deleteError) {
      return {
        error: `Багцын бараа устгахад алдаа гарлаа: ${deleteError.message}`,
      };
    }

    const bundleItems = items.map((item) => ({
      bundle_id: id,
      product_id: item.product_id,
      variant_id: item.variant_id ?? null,
      quantity: item.quantity,
    }));

    const { error: itemsError } = await supabase
      .from("product_bundle_items")
      .insert(bundleItems);

    if (itemsError) {
      return {
        error: `Багцын бараа хадгалахад алдаа гарлаа: ${itemsError.message}`,
      };
    }
  }

  revalidateEntities(["products"]);
  return { success: true, error: undefined };
}
