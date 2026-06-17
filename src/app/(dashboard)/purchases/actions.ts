"use server";

import { revalidatePath } from "next/cache";
import { requireAppContext } from "@/lib/erp";
import { getString } from "@/lib/validation";

export async function createPurchaseOrder(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const { supabase, organizationId, userId } = await requireAppContext();

  const supplierId = getString(formData, "supplier_id");
  const orderDate = getString(formData, "order_date");
  const expectedDate = getString(formData, "expected_date") || null;
  const notes = getString(formData, "notes") || null;
  const itemsJson = getString(formData, "items");

  if (!supplierId) {
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
  }>;

  try {
    items = JSON.parse(itemsJson);
  } catch {
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
  const { data: orderNum } = await supabase.rpc(
    "generate_purchase_order_number",
  );
  const orderNumber = orderNum as string;

  const totalAmount = items.reduce(
    (sum, item) => sum + item.quantity * item.unit_cost,
    0,
  );

  // Insert purchase order
  const { data: purchaseOrder, error: poError } = await supabase
    .from("purchase_orders")
    .insert({
      organization_id: organizationId,
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
    .single();

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
  }));

  const { error: itemsError } = await supabase
    .from("purchase_order_items")
    .insert(orderItems);

  if (itemsError) {
    // Rollback: delete the purchase order
    await supabase
      .from("purchase_orders")
      .delete()
      .eq("id", purchaseOrder.id);
    return {
      error: `Барааны мэдээлэл хадгалахад алдаа гарлаа: ${itemsError.message}`,
    };
  }

  revalidatePath("/purchases");
  revalidatePath("/");
  return { success: true as const };
}

export async function updatePurchaseOrderStatus(
  orderId: string,
  status: string,
) {
  const { supabase, organizationId } = await requireAppContext();

  const { data: order } = await supabase
    .from("purchase_orders")
    .select("status")
    .eq("id", orderId)
    .eq("organization_id", organizationId)
    .single();

  if (!order) {
    return { error: "Захиалга олдсонгүй." };
  }

  const { error } = await supabase
    .from("purchase_orders")
    .update({ status })
    .eq("id", orderId)
    .eq("organization_id", organizationId);

  if (error) {
    return { error: `Төлөв шинэчлэхэд алдаа гарлаа: ${error.message}` };
  }

  revalidatePath("/purchases");
  revalidatePath("/");
  return { success: true as const };
}

export async function receivePurchaseOrderItems(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const { supabase, organizationId, userId } = await requireAppContext();

  const orderId = getString(formData, "order_id");
  const itemsJson = getString(formData, "items");

  if (!orderId || !itemsJson) {
    return { error: "Өгөгдөл дутуу байна." };
  }

  let items: Array<{ item_id: string; received_quantity: number }>;
  try {
    items = JSON.parse(itemsJson);
  } catch {
    return { error: "Барааны мэдээллийн формат буруу байна." };
  }

  if (!Array.isArray(items) || items.length === 0) {
    return { error: "Дор хаяж нэг барааны мэдээлэл оруулна уу." };
  }

  // Verify the order belongs to this organization
  const { data: order, error: orderError } = await supabase
    .from("purchase_orders")
    .select("id, status, organization_id")
    .eq("id", orderId)
    .eq("organization_id", organizationId)
    .single();

  if (orderError || !order) {
    return { error: "Захиалга олдсонгүй." };
  }

  // Fetch all items for this order
  const { data: orderItems, error: itemsFetchError } = await supabase
    .from("purchase_order_items")
    .select("id, product_id, quantity, received_quantity")
    .eq("purchase_order_id", orderId);

  if (itemsFetchError || !orderItems) {
    return { error: "Барааны мэдээлэл олдсонгүй." };
  }

  // Update each item's received_quantity
  for (const item of items) {
    const existingItem = orderItems.find((oi) => oi.id === item.item_id);
    if (!existingItem) {
      return { error: "Бараа олдсонгүй." };
    }

    const newReceivedQty =
      Number(existingItem.received_quantity ?? 0) + item.received_quantity;

    if (newReceivedQty > Number(existingItem.quantity)) {
      return {
        error:
          "Хүлээн авсан тоо хэмжээ захиалсан хэмжээнээс хэтэрсэн байна.",
      };
    }

    const { error: updateError } = await supabase
      .from("purchase_order_items")
      .update({ received_quantity: newReceivedQty })
      .eq("id", item.item_id);

    if (updateError) {
      return {
        error: `Барааны хүлээн авалт шинэчлэхэд алдаа гарлаа: ${updateError.message}`,
      };
    }

    // Create stock movement (type='in')
    const { error: movementError } = await supabase
      .from("stock_movements")
      .insert({
        organization_id: organizationId,
        product_id: existingItem.product_id!,
        type: "in",
        quantity: item.received_quantity,
        reference: `PO-${orderId}`,
        notes: `Худалдан авалтын захиалгаар хүлээн авсан`,
        created_by: userId,
      });

    if (movementError) {
      return {
        error: `Барааны хөдөлгөөн бүртгэхэд алдаа гарлаа: ${movementError.message}`,
      };
    }

    // Update product current_stock
    const { data: product } = await supabase
      .from("products")
      .select("current_stock")
      .eq("organization_id", organizationId)
      .eq("id", existingItem.product_id!)
      .single();

    if (product) {
      await supabase
        .from("products")
        .update({
          current_stock:
            Number(product.current_stock ?? 0) + item.received_quantity,
        })
        .eq("organization_id", organizationId)
        .eq("id", existingItem.product_id!);
    }
  }

  // Determine new order status based on fulfillment
  const allItems = await supabase
    .from("purchase_order_items")
    .select("quantity, received_quantity")
    .eq("purchase_order_id", orderId);

  const allFullyReceived =
    allItems.data?.every(
      (oi) => Number(oi.received_quantity) >= Number(oi.quantity),
    ) ?? false;

  const anyReceived =
    allItems.data?.some(
      (oi) => Number(oi.received_quantity) > 0,
    ) ?? false;

  let newStatus = "sent";
  if (allFullyReceived) {
    newStatus = "received";
  } else if (anyReceived) {
    newStatus = "partially_received";
  }

  await supabase
    .from("purchase_orders")
    .update({ status: newStatus })
    .eq("id", orderId);

  revalidatePath("/purchases");
  revalidatePath("/");
  return { success: true as const };
}
