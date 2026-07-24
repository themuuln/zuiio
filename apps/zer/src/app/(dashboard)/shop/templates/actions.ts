"use server";

import { capture, withDbCapture } from "@zuiio/capture";
import { requireActionContext, requireWriteAction } from "@/lib/action-utils";
import { revalidateEntity } from "@/lib/revalidate";
import type { CartItem } from "@/lib/shop-cart";
import {
  fetchProductsForStock,
  fetchVariantsForStock,
} from "@/lib/stock-utils";
import { getString } from "@/lib/validation";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type OrderTemplateItem = {
  productId: string;
  variantId?: string | null;
  quantity: number;
};

export type OrderTemplateListItem = {
  id: string;
  name: string;
  notes: string | null;
  is_active: boolean | null;
  contact_id: string | null;
  contact_name: string | null;
  item_count: number;
  created_at: string | null;
  updated_at: string | null;
};

export type LoadTemplateResult = {
  success: true;
  items: CartItem[];
  warnings: string[];
};

// ---------------------------------------------------------------------------
// List
// ---------------------------------------------------------------------------

export async function listOrderTemplates(): Promise<
  { data: OrderTemplateListItem[] } | { error: string }
> {
  const ctx = await requireActionContext("sales.read");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId } = ctx;

  const { data: templates, error } = await withDbCapture(
    "order_templates:list",
    supabase
      .from("order_templates")
      .select(
        `
        id,
        name,
        notes,
        is_active,
        contact_id,
        contact:contacts(name),
        created_at,
        updated_at
      `,
      )
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false }),
  );

  if (error) {
    capture(error, { context: "order_templates: list" });
    return { error: "Загваруудыг татаж чадсангүй." };
  }

  // Fetch item counts per template
  const templateIds = (templates ?? []).map((t) => t.id);
  const itemCounts: Record<string, number> = {};

  if (templateIds.length > 0) {
    const { data: counts } = await withDbCapture(
      "order_templates:item_counts",
      supabase
        .from("order_template_items")
        .select("template_id")
        .in("template_id", templateIds)
        .eq("organization_id", organizationId),
    );
    if (counts) {
      for (const row of counts) {
        itemCounts[row.template_id] = (itemCounts[row.template_id] ?? 0) + 1;
      }
    }
  }

  const result: OrderTemplateListItem[] = (templates ?? []).map((t) => ({
    id: t.id,
    name: t.name,
    notes: t.notes,
    is_active: t.is_active,
    contact_id: t.contact_id,
    contact_name:
      (t.contact as unknown as { name: string } | null)?.name ?? null,
    item_count: itemCounts[t.id] ?? 0,
    created_at: t.created_at,
    updated_at: t.updated_at,
  }));

  return { data: result };
}

// ---------------------------------------------------------------------------
// Get single template with items (for edit view)
// ---------------------------------------------------------------------------

export type OrderTemplateDetail = {
  id: string;
  name: string;
  notes: string | null;
  contact_id: string | null;
  items: Array<{
    product_id: string;
    variant_id: string | null;
    quantity: number;
    product_name: string;
  }>;
};

export async function getOrderTemplate(
  templateId: string,
): Promise<{ data: OrderTemplateDetail } | { error: string }> {
  const ctx = await requireActionContext("sales.read");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId } = ctx;

  const { data: template, error } = await withDbCapture(
    "order_templates:get",
    supabase
      .from("order_templates")
      .select(
        `
        id,
        name,
        notes,
        contact_id,
        items:order_template_items(
          product_id,
          variant_id,
          quantity,
          product:products(name)
        )
      `,
      )
      .eq("id", templateId)
      .eq("organization_id", organizationId)
      .single(),
  );

  if (error || !template) {
    capture(error, { context: "order_templates: get template" });
    return { error: "Загвар олдсонгүй." };
  }

  const rawItems = template.items as unknown as Array<{
    product_id: string;
    variant_id: string | null;
    quantity: number;
    product: { name: string } | null;
  }> | null;

  return {
    data: {
      id: template.id,
      name: template.name,
      notes: template.notes,
      contact_id: template.contact_id,
      items: (rawItems ?? []).map((i) => ({
        product_id: i.product_id,
        variant_id: i.variant_id,
        quantity: i.quantity,
        product_name: i.product?.name ?? "Тодорхойгүй",
      })),
    },
  };
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

export async function createOrderTemplate(
  _prevState: { error?: string } | undefined,
  formData: FormData,
): Promise<{ success?: true; error?: string; templateId?: string }> {
  const ctx = await requireWriteAction("sales.create");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId } = ctx;

  const name = getString(formData, "name");
  if (!name) {
    return { error: "Загварын нэр шаардлагатай." };
  }

  const contactId = getString(formData, "contact_id") || null;
  const notes = getString(formData, "notes") || null;

  const itemsRaw = formData.get("items");
  if (!itemsRaw) {
    return { error: "Бүтээгдэхүүн шаардлагатай." };
  }

  let items: OrderTemplateItem[];
  try {
    items = JSON.parse(itemsRaw.toString()) as OrderTemplateItem[];
  } catch (e) {
    capture(e, { context: "order_templates: parse items" });
    return { error: "Бүтээгдэхүүний мэдээллийн формат буруу байна." };
  }

  if (!Array.isArray(items) || items.length === 0) {
    return { error: "Дор хаяж нэг бүтээгдэхүүн оруулна уу." };
  }

  // Validate products exist and are in this org
  const productIds = items.map((i) => i.productId);
  const productMap = await fetchProductsForStock(
    supabase,
    organizationId,
    productIds,
  );

  for (const item of items) {
    if (!productMap.has(item.productId)) {
      return {
        error: `Бүтээгдэхүүн олдсонгүй (${item.productId}).`,
      };
    }
    if (!Number.isFinite(item.quantity) || item.quantity < 1) {
      return { error: "Тоо хэмжээ буруу байна." };
    }
  }

  // Insert template
  const { data: template, error: templateError } = await withDbCapture(
    "order_templates:create",
    supabase
      .from("order_templates")
      .insert({
        organization_id: organizationId,
        name,
        contact_id: contactId,
        notes,
      })
      .select("id")
      .single(),
  );

  if (templateError || !template) {
    capture(templateError, { context: "order_templates: insert template" });
    return {
      error: `Загвар үүсгэхэд алдаа гарлаа: ${templateError?.message ?? "Тодорхойгүй алдаа"}`,
    };
  }

  // Insert template items
  const templateItems = items.map((item) => ({
    template_id: template.id,
    organization_id: organizationId,
    product_id: item.productId,
    variant_id: item.variantId ?? null,
    quantity: item.quantity,
  }));

  const { error: itemsError } = await withDbCapture(
    "order_templates:create_items",
    supabase.from("order_template_items").insert(templateItems),
  );

  if (itemsError) {
    // Rollback template
    await withDbCapture(
      "order_templates: rollback delete",
      supabase.from("order_templates").delete().eq("id", template.id),
    );
    capture(itemsError, { context: "order_templates: insert items" });
    return {
      error: `Загварын бүтээгдэхүүн хадгалахад алдаа гарлаа: ${itemsError.message}`,
    };
  }

  revalidateEntity("shop");
  return { success: true, templateId: template.id };
}

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------

export async function updateOrderTemplate(
  templateId: string,
  _prevState: { error?: string } | undefined,
  formData: FormData,
): Promise<{ success?: true; error?: string }> {
  const ctx = await requireWriteAction("sales.update");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId } = ctx;

  // Verify ownership
  const { data: existing, error: fetchError } = await withDbCapture(
    "order_templates:fetch_for_update",
    supabase
      .from("order_templates")
      .select("id")
      .eq("id", templateId)
      .eq("organization_id", organizationId)
      .single(),
  );

  if (fetchError || !existing) {
    return { error: "Загвар олдсонгүй." };
  }

  const name = getString(formData, "name");
  if (!name) {
    return { error: "Загварын нэр шаардлагатай." };
  }

  const contactId = getString(formData, "contact_id") || null;
  const notes = getString(formData, "notes") || null;

  const itemsRaw = formData.get("items");
  if (!itemsRaw) {
    return { error: "Бүтээгдэхүүн шаардлагатай." };
  }

  let items: OrderTemplateItem[];
  try {
    items = JSON.parse(itemsRaw.toString()) as OrderTemplateItem[];
  } catch (e) {
    capture(e, { context: "order_templates: parse update items" });
    return { error: "Бүтээгдэхүүний мэдээллийн формат буруу байна." };
  }

  if (!Array.isArray(items) || items.length === 0) {
    return { error: "Дор хаяж нэг бүтээгдэхүүн оруулна уу." };
  }

  // Validate products
  const productIds = items.map((i) => i.productId);
  const productMap = await fetchProductsForStock(
    supabase,
    organizationId,
    productIds,
  );

  for (const item of items) {
    if (!productMap.has(item.productId)) {
      return { error: `Бүтээгдэхүүн олдсонгүй (${item.productId}).` };
    }
    if (!Number.isFinite(item.quantity) || item.quantity < 1) {
      return { error: "Тоо хэмжээ буруу байна." };
    }
  }

  // Update template header
  const { error: updateError } = await withDbCapture(
    "order_templates:update",
    supabase
      .from("order_templates")
      .update({
        name,
        contact_id: contactId,
        notes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", templateId)
      .eq("organization_id", organizationId),
  );

  if (updateError) {
    capture(updateError, { context: "order_templates: update template" });
    return {
      error: `Загвар шинэчлэхэд алдаа гарлаа: ${updateError.message}`,
    };
  }

  // Replace items: delete old, insert new
  const { error: deleteItemsError } = await withDbCapture(
    "order_templates:delete_old_items",
    supabase
      .from("order_template_items")
      .delete()
      .eq("template_id", templateId)
      .eq("organization_id", organizationId),
  );

  if (deleteItemsError) {
    capture(deleteItemsError, { context: "order_templates: delete old items" });
    return { error: "Хуучин бүтээгдэхүүн устгахад алдаа гарлаа." };
  }

  const templateItems = items.map((item) => ({
    template_id: templateId,
    organization_id: organizationId,
    product_id: item.productId,
    variant_id: item.variantId ?? null,
    quantity: item.quantity,
  }));

  const { error: insertItemsError } = await withDbCapture(
    "order_templates:insert_new_items",
    supabase.from("order_template_items").insert(templateItems),
  );

  if (insertItemsError) {
    capture(insertItemsError, { context: "order_templates: insert new items" });
    return {
      error: `Шинэ бүтээгдэхүүн хадгалахад алдаа гарлаа: ${insertItemsError.message}`,
    };
  }

  revalidateEntity("shop");
  return { success: true };
}

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------

export async function deleteOrderTemplate(
  templateId: string,
): Promise<{ success?: true; error?: string }> {
  const ctx = await requireWriteAction("sales.delete");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId } = ctx;

  // Verify ownership
  const { data: existing, error: fetchError } = await withDbCapture(
    "order_templates:fetch_for_delete",
    supabase
      .from("order_templates")
      .select("id")
      .eq("id", templateId)
      .eq("organization_id", organizationId)
      .single(),
  );

  if (fetchError || !existing) {
    return { error: "Загвар олдсонгүй." };
  }

  // Delete items first, then template
  const { error: deleteItemsError } = await withDbCapture(
    "order_templates:delete_items",
    supabase
      .from("order_template_items")
      .delete()
      .eq("template_id", templateId)
      .eq("organization_id", organizationId),
  );

  if (deleteItemsError) {
    capture(deleteItemsError, { context: "order_templates: delete items" });
    return { error: "Загварын бүтээгдэхүүн устгахад алдаа гарлаа." };
  }

  const { error: deleteError } = await withDbCapture(
    "order_templates:delete_template",
    supabase
      .from("order_templates")
      .delete()
      .eq("id", templateId)
      .eq("organization_id", organizationId),
  );

  if (deleteError) {
    capture(deleteError, { context: "order_templates: delete template" });
    return {
      error: `Загвар устгахад алдаа гарлаа: ${deleteError.message}`,
    };
  }

  revalidateEntity("shop");
  return { success: true };
}

// ---------------------------------------------------------------------------
// Load Template Into Cart
// ---------------------------------------------------------------------------

export async function loadTemplateIntoCart(
  templateId: string,
): Promise<LoadTemplateResult | { error: string }> {
  const ctx = await requireActionContext("sales.read");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId } = ctx;

  // Fetch template with items + product info
  const { data: template, error: templateError } = await withDbCapture(
    "order_templates:load",
    supabase
      .from("order_templates")
      .select(
        `
        id,
        name,
        items:order_template_items(
          id,
          product_id,
          variant_id,
          quantity,
          product:products(id, name, sale_price, current_stock, unit)
        )
      `,
      )
      .eq("id", templateId)
      .eq("organization_id", organizationId)
      .single(),
  );

  if (templateError || !template) {
    capture(templateError, { context: "order_templates: load template" });
    return { error: "Загвар олдсонгүй." };
  }

  const rawItems = template.items as unknown as Array<{
    id: string;
    product_id: string;
    variant_id: string | null;
    quantity: number;
    product: {
      id: string;
      name: string;
      sale_price: number | null;
      current_stock: number | null;
      unit: string | null;
    } | null;
  }> | null;

  if (!rawItems || rawItems.length === 0) {
    return { error: "Загварт бүтээгдэхүүн байхгүй байна." };
  }

  // Check stock for all items (including variants)
  const variantIds = rawItems
    .filter((i) => i.variant_id)
    .map((i) => i.variant_id!);

  const variantMap =
    variantIds.length > 0
      ? await fetchVariantsForStock(supabase, variantIds)
      : new Map<
          string,
          { id: string; current_stock: number | null; product_id: string }
        >();

  const warnings: string[] = [];
  const cartItems: CartItem[] = [];

  for (const item of rawItems) {
    // Product removed from catalog
    if (!item.product) {
      warnings.push(`"${item.product_id}" бүтээгдэхүүн каталогоос хасагдсан.`);
      continue;
    }

    if (item.variant_id) {
      const variant = variantMap.get(item.variant_id);
      const currentStock = variant?.current_stock ?? 0;

      if (currentStock <= 0) {
        warnings.push(`"${item.product.name}" вариантын үлдэгдэл дууссан.`);
        continue;
      }

      const safeQty = Math.min(item.quantity, currentStock);
      if (safeQty < item.quantity) {
        warnings.push(
          `"${item.product.name}" вариантын үлдэгдэл хүрэлцэхгүй. (Хүссэн: ${item.quantity}, Үлдэгдэл: ${currentStock})`,
        );
      }

      cartItems.push({
        productId: item.product.id,
        name: item.product.name,
        unitPrice: Number(item.product.sale_price ?? 0),
        quantity: safeQty,
        unit: item.product.unit ?? "ш",
        maxStock: currentStock,
        variantId: item.variant_id,
      });
    } else {
      const currentStock = Number(item.product.current_stock ?? 0);

      if (currentStock <= 0) {
        warnings.push(
          `"${item.product.name}" бүтээгдэхүүний үлдэгдэл дууссан.`,
        );
        continue;
      }

      const safeQty = Math.min(item.quantity, currentStock);
      if (safeQty < item.quantity) {
        warnings.push(
          `"${item.product.name}" бүтээгдэхүүний үлдэгдэл хүрэлцэхгүй. (Хүссэн: ${item.quantity}, Үлдэгдэл: ${currentStock})`,
        );
      }

      cartItems.push({
        productId: item.product.id,
        name: item.product.name,
        unitPrice: Number(item.product.sale_price ?? 0),
        quantity: safeQty,
        unit: item.product.unit ?? "ш",
        maxStock: currentStock,
      });
    }
  }

  if (cartItems.length === 0 && warnings.length > 0) {
    return {
      success: true,
      items: [],
      warnings: [
        "Бүх бүтээгдэхүүн үлдэгдэлгүй эсвэл каталогоос хасагдсан байна.",
        ...warnings,
      ],
    };
  }

  return { success: true, items: cartItems, warnings };
}
