"use server";
import { capture, withDbCapture } from "@zuiio/capture";

import { postPurchaseToJournal } from "@/lib/accounting";
import { requireWriteAction } from "@/lib/action-utils";
import { withBranchFilter } from "@/lib/branches";
import { revalidateEntities, revalidateEntityTag } from "@/lib/revalidate";
import { getString } from "@/lib/validation";
import { purchaseSchema } from "@/lib/validation-schemas";

export async function createPurchaseOrder(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const ctx = await requireWriteAction("purchases.create");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId, userId, branchId } = ctx;

  // Check if org uses suppliers
  const { data: orgSettings, error: orgSettingsError } = await withDbCapture(
    "purchases: fetch org settings",
    supabase
      .from("organizations")
      .select("has_suppliers")
      .eq("id", organizationId)
      .single(),
  );

  if (orgSettingsError) {
    capture(orgSettingsError, { context: "purchases: fetch org settings" });
  }
  const hasSuppliers =
    (orgSettings as { has_suppliers: boolean } | null)?.has_suppliers ?? true;

  const supplierId = getString(formData, "supplier_id") || null;
  const orderDate = getString(formData, "order_date");
  const expectedDate = getString(formData, "expected_date") || null;
  const notes = getString(formData, "notes") || null;
  const itemsJson = getString(formData, "items");
  const parsedPurchase = purchaseSchema.safeParse({
    supplier_id: supplierId,
    order_date: orderDate,
    expected_date: expectedDate,
    notes,
    items: itemsJson,
  });
  if (!parsedPurchase.success) {
    return {
      error: parsedPurchase.error.issues[0]?.message || "Мэдээлэл буруу байна.",
    };
  }

  if (hasSuppliers && !supplierId) {
    return { error: "Нийлүүлэгч сонгоно уу." };
  }

  if (!itemsJson) {
    return { error: "Барааны мэдээлэл шаардлагатай." };
  }

  let items: Array<{
    product_id: string;
    description?: string;
    quantity: number;
    unit_cost: number;
    variant_id?: string;
  }>;

  try {
    items = JSON.parse(itemsJson);
  } catch (e) {
    capture(e, { context: "purchases: parse items" });
    return { error: "Барааны мэдээллийн формат буруу байна." };
  }

  if (!Array.isArray(items) || items.length === 0) {
    return { error: "Дор хаяж нэг бараа оруулна уу." };
  }

  for (const item of items) {
    if (!item.product_id) {
      return { error: "Бүтээгдэхүүн сонгоно уу." };
    }
    if (!item.quantity || item.quantity <= 0) {
      return { error: "Тоо хэмжээ 0-ээс их байх ёстой." };
    }
  }

  // Generate purchase order number
  const { data: orderNum, error: orderNumError } = await supabase.rpc(
    "generate_purchase_order_number",
  );
  if (orderNumError) {
    capture(orderNumError, { context: "purchases: generate order number" });
    return { error: "Захиалгын дугаар үүсгэхэд алдаа гарлаа." };
  }
  const orderNumber = orderNum as string;

  const totalAmount = items.reduce(
    (sum, item) => sum + item.quantity * item.unit_cost,
    0,
  );

  // Insert purchase order
  const { data: purchaseOrder, error: poError } = await withDbCapture(
    "purchases: create purchase order",
    supabase
      .from("purchase_orders")
      .insert({
        organization_id: organizationId,
        branch_id: branchId,
        supplier_id: supplierId,
        order_number: orderNumber,
        order_date: orderDate || new Date().toISOString().slice(0, 10),
        expected_date: expectedDate,
        status: "draft",
        total_amount: totalAmount,
        notes,
        created_by: userId,
      })
      .select("id")
      .single(),
  );
  if (poError) {
    return {
      error: `Захиалга үүсгэхэд алдаа гарлаа: ${poError.message}`,
    };
  }

  // Insert purchase order items
  const orderItems = items.map((item) => ({
    purchase_order_id: purchaseOrder.id,
    product_id: item.product_id,
    description: item.description || null,
    quantity: item.quantity,
    unit_cost: item.unit_cost,
    variant_id: item.variant_id ?? null,
  }));

  const { error: itemsError } = await withDbCapture(
    "purchases: insert PO items",
    supabase.from("purchase_order_items").insert(orderItems),
  );

  if (itemsError) {
    // Rollback: delete the purchase order
    await withDbCapture(
      "purchases: rollback delete PO",
      supabase.from("purchase_orders").delete().eq("id", purchaseOrder.id),
    );
    return {
      error: `Барааны мэдээлэл хадгалахад алдаа гарлаа: ${itemsError.message}`,
    };
  }

  // Post to general ledger (fire-and-forget)
  postPurchaseToJournal(
    supabase,
    organizationId,
    userId,
    branchId,
    purchaseOrder.id,
    {
      total_amount: totalAmount,
      order_date: orderDate || new Date().toISOString().slice(0, 10),
      status: "draft",
    },
  ).catch((err) => capture(err, { context: "post_purchase_to_journal" }));

  revalidateEntities(["purchases"]);
  return { success: true as const, error: undefined };
}

export async function updatePurchaseOrderStatus(
  orderId: string,
  status: string,
) {
  const ctx = await requireWriteAction("purchases.update");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId, userId, branchId, isBranchScoped } = ctx;

  let fetchQuery = supabase
    .from("purchase_orders")
    .select("status")
    .eq("id", orderId)
    .eq("organization_id", organizationId);

  fetchQuery = withBranchFilter(fetchQuery, branchId, isBranchScoped);

  const { data: order } = await withDbCapture(
    "purchases: fetch order status",
    fetchQuery.single(),
  );

  if (!order) {
    return { error: "Захиалга олдсонгүй." };
  }

  // When marking as received, update inventory
  if (status === "received") {
    const { data: items, error: itemsError } = await withDbCapture(
      "purchases: fetch items for restock",
      supabase
        .from("purchase_order_items")
        .select(
          "id, product_id, quantity, received_quantity, unit_cost, variant_id",
        )
        .eq("purchase_order_id", orderId),
    );

    if (itemsError) {
      capture(itemsError, { context: "purchases: fetch items for restock" });
    }

    if (items && items.length > 0) {
      const remainingItems = items
        .filter(
          (item) =>
            Number(item.quantity) - Number(item.received_quantity ?? 0) > 0,
        )
        .map((item) => {
          const remaining =
            Number(item.quantity) - Number(item.received_quantity ?? 0);
          return {
            product_id: item.product_id ?? "",
            variant_id: item.variant_id ?? null,
            quantity: remaining,
            unit_cost: item.unit_cost,
          };
        });

      if (remainingItems.length > 0) {
        const { error: rpcError } = await supabase.rpc(
          "process_restock_stock_movements",
          {
            p_org_id: organizationId,
            p_branch_id: branchId,
            p_user_id: userId,
            p_po_id: orderId,
            p_items: remainingItems,
            p_mark_received: true,
          },
        );

        if (rpcError) {
          return {
            error: `Бараа хүлээн авахад алдаа: ${rpcError.message}`,
          };
        }
      }
    }
  }

  const updateQuery = supabase
    .from("purchase_orders")
    .update({ status })
    .eq("id", orderId)
    .eq("organization_id", organizationId);

  const { error } = await withDbCapture(
    "purchases: update order status",
    updateQuery,
  );

  if (error) {
    capture(error, { context: "purchases: updatePurchaseOrderStatus" });
    return { error: `Төлөв шинэчлэхэд алдаа гарлаа: ${error.message}` };
  }

  revalidateEntities(["purchases", "inventory", "products"]);
  revalidateEntityTag("products", organizationId);
  return { success: true as const, error: undefined };
}

export async function receivePurchaseOrderItems(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const ctx = await requireWriteAction("purchases.update");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId, userId, branchId, isBranchScoped } = ctx;

  const orderId = getString(formData, "order_id");
  const itemsJson = getString(formData, "items");

  if (!orderId || !itemsJson) {
    return { error: "Өгөгдөл дутуу байна." };
  }

  let items: Array<{ item_id: string; received_quantity: number }>;
  try {
    items = JSON.parse(itemsJson);
  } catch (e) {
    capture(e, { context: "purchases: parse receive items" });
    return { error: "Барааны мэдээллийн формат буруу байна." };
  }

  if (!Array.isArray(items) || items.length === 0) {
    return { error: "Дор хаяж нэг барааны мэдээлэл оруулна уу." };
  }

  // Verify the order belongs to this organization
  let fetchQuery = supabase
    .from("purchase_orders")
    .select("id, status, organization_id")
    .eq("id", orderId)
    .eq("organization_id", organizationId);

  fetchQuery = withBranchFilter(fetchQuery, branchId, isBranchScoped);

  const { data: order, error: orderError } = await withDbCapture(
    "purchases: verify order",
    fetchQuery.single(),
  );

  if (orderError || !order) {
    return { error: "Захиалга олдсонгүй." };
  }

  // Process receive in a single transaction RPC
  const { data: rpcResult, error: rpcError } = await supabase.rpc(
    "process_receive_purchase_items",
    {
      p_org_id: organizationId,
      p_branch_id: branchId,
      p_user_id: userId,
      p_order_id: orderId,
      p_items: items.map((item) => ({
        item_id: item.item_id,
        received_quantity: item.received_quantity,
      })),
    },
  );

  if (
    rpcError ||
    (rpcResult &&
      typeof rpcResult === "object" &&
      "error" in rpcResult &&
      rpcResult.error)
  ) {
    return {
      error:
        rpcError?.message ??
        (rpcResult && typeof rpcResult === "object" && "error" in rpcResult
          ? String(rpcResult.error)
          : null) ??
        "Бараа хүлээн авахад алдаа гарлаа.",
    };
  }

  revalidateEntities(["purchases"]);
  revalidateEntityTag("products", organizationId);
  return { success: true as const, error: undefined };
}
