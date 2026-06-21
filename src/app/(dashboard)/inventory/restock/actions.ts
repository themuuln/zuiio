"use server";

import { postPurchaseToJournal } from "@/lib/accounting";
import { requireWriteAction } from "@/lib/action-utils";
import { revalidateEntities } from "@/lib/revalidate";

interface RestockItem {
  product_id: string;
  quantity: number;
  unit_cost: number;
}

interface SupplierOrder {
  supplier_id: string | null;
  items: RestockItem[];
}

export async function batchCreatePurchaseOrders(
  supplierOrders: SupplierOrder[],
) {
  const ctx = await requireWriteAction("purchases.create");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId, userId, branchId } = ctx;

  const errors: string[] = [];
  let createdCount = 0;

  for (const order of supplierOrders) {
    if (order.items.length === 0) continue;

    const totalAmount = order.items.reduce(
      (sum, item) => sum + item.quantity * item.unit_cost,
      0,
    );

    // Generate purchase order number
    const { data: orderNum } = await supabase.rpc(
      "generate_purchase_order_number",
    );
    const orderNumber = orderNum as string;

    // Insert purchase order
    const { data: purchaseOrder, error: poError } = await supabase
      .from("purchase_orders")
      .insert({
        organization_id: organizationId,
        branch_id: branchId!,
        supplier_id: order.supplier_id,
        order_number: orderNumber,
        order_date: new Date().toISOString().slice(0, 10),
        status: "draft",
        total_amount: totalAmount,
        created_by: userId,
      })
      .select("id")
      .single();

    if (poError) {
      errors.push(`Захиалга үүсгэхэд алдаа: ${poError.message}`);
      continue;
    }

    // Insert purchase order items
    const orderItems = order.items.map((item) => ({
      purchase_order_id: purchaseOrder.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_cost: item.unit_cost,
      variant_id: null,
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
      errors.push(`Барааны мэдээлэл хадгалахад алдаа: ${itemsError.message}`);
      continue;
    }

    // Post to general ledger (fire-and-forget)
    postPurchaseToJournal(
      supabase,
      organizationId,
      userId,
      branchId!,
      purchaseOrder.id,
      {
        total_amount: totalAmount,
        order_date: new Date().toISOString().slice(0, 10),
        status: "draft",
      },
    ).catch(console.error);

    createdCount++;
  }

  revalidateEntities(["purchases"]);

  if (errors.length > 0) {
    return {
      success: createdCount > 0,
      error: errors.join(". "),
      createdCount,
    };
  }

  return { success: true, error: undefined, createdCount };
}
