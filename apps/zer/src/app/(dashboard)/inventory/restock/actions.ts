"use server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { capture } from "@zuiio/capture";
import { postPurchaseToJournal } from "@/lib/accounting";
import { requireWriteAction } from "@/lib/action-utils";
import { revalidateEntities } from "@/lib/revalidate";
import type { Database } from "@/lib/supabase/types";

interface RestockItem {
  product_id: string;
  variant_id?: string | null;
  quantity: number;
  unit_cost: number;
}

interface SupplierOrder {
  supplier_id: string | null;
  items: RestockItem[];
}

async function processSingleOrder(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  userId: string,
  branchId: string,
  order: SupplierOrder,
): Promise<{ created: boolean; error?: string }> {
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
      branch_id: branchId,
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
    return {
      created: false,
      error: `Захиалга үүсгэхэд алдаа: ${poError.message}`,
    };
  }

  // Insert purchase order items
  const orderItems = order.items.map((item) => ({
    purchase_order_id: purchaseOrder.id,
    product_id: item.product_id,
    quantity: item.quantity,
    unit_cost: item.unit_cost,
    variant_id: item.variant_id ?? null,
  }));

  const { error: itemsError } = await supabase
    .from("purchase_order_items")
    .insert(orderItems);

  if (itemsError) {
    // Rollback: delete the purchase order
    await supabase.from("purchase_orders").delete().eq("id", purchaseOrder.id);
    return {
      created: false,
      error: `Барааны мэдээлэл хадгалахад алдаа: ${itemsError.message}`,
    };
  }

  // --- Auto-receive stock atomically via RPC ---
  // Inserts stock movements, updates product stocks, marks PO as received
  // in a single database transaction (replaces ~N+4 round trips).
  const { data: rpcResult, error: rpcError } = await supabase.rpc(
    "process_restock_stock_movements",
    {
      p_org_id: organizationId,
      p_branch_id: branchId,
      p_user_id: userId,
      p_po_id: purchaseOrder.id,
      p_items: order.items.map((item) => ({
        product_id: item.product_id,
        variant_id: item.variant_id ?? null,
        quantity: item.quantity,
        unit_cost: item.unit_cost,
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
    const errorMsg =
      rpcError?.message ??
      (rpcResult && typeof rpcResult === "object" && "error" in rpcResult
        ? String(rpcResult.error)
        : null) ??
      "Алдаа гарлаа";
    // Rollback: delete the purchase order and its items
    await supabase.from("purchase_orders").delete().eq("id", purchaseOrder.id);
    return { created: false, error: `Бараа хүлээн авахад алдаа: ${errorMsg}` };
  }

  // Post to general ledger (fire-and-forget with error capture)
  try {
    await postPurchaseToJournal(
      supabase,
      organizationId,
      userId,
      branchId,
      purchaseOrder.id,
      {
        total_amount: totalAmount,
        order_date: new Date().toISOString().slice(0, 10),
        status: "received",
      },
    );
  } catch (err) {
    capture(err, { context: "restock: postPurchaseToJournal" });
  }

  return { created: true };
}

export async function batchCreatePurchaseOrders(
  supplierOrders: SupplierOrder[],
) {
  const ctx = await requireWriteAction("purchases.create");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId, userId, branchId } = ctx;

  if (!branchId) {
    return {
      success: false,
      error: "Салбар сонгоогүй байна.",
      createdCount: 0,
    };
  }

  // Process supplier orders in parallel since they are independent
  const results = await Promise.all(
    supplierOrders
      .filter((o) => o.items.length > 0)
      .map((order) =>
        processSingleOrder(supabase, organizationId, userId, branchId, order),
      ),
  );

  const errors = results
    .filter((r) => !r.created)
    .map((r) => r.error ?? undefined)
    .filter(Boolean);
  const createdCount = results.filter((r) => r.created).length;

  revalidateEntities(["purchases", "inventory", "products"]);

  if (errors.length > 0) {
    return {
      success: createdCount > 0,
      error: errors.join(". "),
      createdCount,
    };
  }

  return { success: true, error: undefined, createdCount };
}
