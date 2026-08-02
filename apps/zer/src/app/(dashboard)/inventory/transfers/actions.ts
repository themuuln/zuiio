"use server";

import { capture, withDbCapture } from "@zuiio/capture";
import { requireWriteAction } from "@/lib/action-utils";
import { logAuditEventWithClient } from "@/lib/audit";
import { revalidateEntities } from "@/lib/revalidate";
import { getString } from "@/lib/validation";

interface TransferItem {
  product_id: string;
  quantity: number;
}

export interface TransferActionResult {
  success?: true;
  error?: string;
}

/**
 * Create a pending stock transfer (header + items). Approval is deferred to
 * approveStockTransfer so stock is only touched inside the atomic RPC.
 */
export async function createStockTransfer(
  _prevState: TransferActionResult | undefined,
  formData: FormData,
): Promise<TransferActionResult> {
  const ctx = await requireWriteAction("inventory.update");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId, userId } = ctx;

  const fromWarehouseId = getString(formData, "from_warehouse_id");
  const toWarehouseId = getString(formData, "to_warehouse_id");
  const notes = getString(formData, "notes") || null;
  const itemsJson = formData.get("items");

  if (!fromWarehouseId || !toWarehouseId) {
    return { error: "Эхлэх болон очих агуулахыг сонгоно уу." };
  }
  if (fromWarehouseId === toWarehouseId) {
    return { error: "Эхлэх болон очих агуулах ижил байж болохгүй." };
  }
  if (!itemsJson || typeof itemsJson !== "string") {
    return { error: "Шилжүүлэх бараа шаардлагатай." };
  }

  let items: TransferItem[];
  try {
    items = JSON.parse(itemsJson) as TransferItem[];
  } catch (err) {
    capture(err, { context: "transfers: parse items" });
    return { error: "Барааны мэдээллийн формат буруу байна." };
  }

  if (!Array.isArray(items) || items.length === 0) {
    return { error: "Дор хаяж нэг бараа оруулна уу." };
  }
  for (const item of items) {
    if (
      !item ||
      typeof item.product_id !== "string" ||
      !item.product_id ||
      !Number.isFinite(item.quantity) ||
      item.quantity <= 0
    ) {
      return { error: "Барааны тоо хэмжээ эерэг тоо байх ёстой." };
    }
  }

  const { data: transfer, error: transferError } = await withDbCapture(
    "stock_transfers: create",
    supabase
      .from("stock_transfers")
      .insert({
        organization_id: organizationId,
        from_warehouse_id: fromWarehouseId,
        to_warehouse_id: toWarehouseId,
        notes,
        created_by: userId,
      } as never)
      .select("id")
      .single(),
  );

  if (transferError || !transfer) {
    capture(transferError, { context: "transfers: create" });
    return {
      error: `Шилжүүлэг үүсгэхэд алдаа гарлаа: ${transferError?.message ?? "үл мэдэгдэх алдаа"}`,
    };
  }

  const { error: itemsError } = await withDbCapture(
    "stock_transfer_items: create",
    supabase.from("stock_transfer_items").insert(
      items.map((item) => ({
        transfer_id: transfer.id as string,
        product_id: item.product_id,
        quantity: item.quantity,
      })) as never,
    ),
  );

  if (itemsError) {
    capture(itemsError, { context: "transfers: create items" });
    return {
      error: `Шилжүүлгийн бараа хадгалахад алдаа гарлаа: ${itemsError.message}`,
    };
  }

  await logAuditEventWithClient(
    supabase,
    organizationId,
    userId,
    "created",
    "stock_transfer",
    transfer.id as string,
    undefined,
    "Агуулах хооронд шилжүүлэг үүсгэсэн",
  );

  revalidateEntities(["inventory"]);
  return { success: true, error: undefined };
}

/**
 * Approve a pending transfer. Delegates the entire stock movement to the
 * approve_stock_transfer RPC so decrement/increment/movements/status are
 * applied atomically in one database transaction.
 */
export async function approveStockTransfer(
  _prevState: TransferActionResult | undefined,
  formData: FormData,
): Promise<TransferActionResult> {
  const ctx = await requireWriteAction("inventory.update");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId, userId } = ctx;

  const id = getString(formData, "id");
  if (!id) return { error: "Шилжүүлгийн ID олдсонгүй." };

  const { data: rpcResult, error: rpcError } = await supabase.rpc(
    "approve_stock_transfer",
    { p_transfer_id: id },
  );

  if (
    rpcError ||
    (rpcResult &&
      typeof rpcResult === "object" &&
      "error" in rpcResult &&
      rpcResult.error)
  ) {
    capture(rpcError ?? rpcResult, { context: "transfers: approve RPC" });
    // RPC-level business errors are already Mongolian; transport errors get
    // a generic Mongolian message (details captured above).
    const businessError =
      rpcResult && typeof rpcResult === "object" && "error" in rpcResult
        ? String(rpcResult.error)
        : null;
    return {
      error: businessError ?? "Шилжүүлэг баталгаажуулахад алдаа гарлаа.",
    };
  }

  await logAuditEventWithClient(
    supabase,
    organizationId,
    userId,
    "status_changed",
    "stock_transfer",
    id,
    undefined,
    "Шилжүүлэг баталгаажсан",
  );

  revalidateEntities(["inventory"]);
  return { success: true, error: undefined };
}

/**
 * Cancel a pending transfer. Only pending transfers can be cancelled; the
 * scoped update guarantees no completed transfer is ever touched.
 */
export async function cancelStockTransfer(
  _prevState: TransferActionResult | undefined,
  formData: FormData,
): Promise<TransferActionResult> {
  const ctx = await requireWriteAction("inventory.update");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId, userId } = ctx;

  const id = getString(formData, "id");
  if (!id) return { error: "Шилжүүлгийн ID олдсонгүй." };

  const { data: updated, error } = await withDbCapture(
    "stock_transfers: cancel",
    supabase
      .from("stock_transfers")
      .update({ status: "cancelled" } as never)
      .eq("id" as never, id)
      .eq("organization_id" as never, organizationId)
      .eq("status" as never, "pending")
      .select("id")
      .maybeSingle(),
  );

  if (error) {
    capture(error, { context: "transfers: cancel" });
    return { error: `Шилжүүлэг цуцлахад алдаа гарлаа: ${error.message}` };
  }
  if (!updated) {
    return {
      error:
        "Шилжүүлэг цуцлах боломжгүй байна. Зөвхөн хүлээгдэж буй шилжүүлгийг цуцлах боломжтой.",
    };
  }

  await logAuditEventWithClient(
    supabase,
    organizationId,
    userId,
    "status_changed",
    "stock_transfer",
    id,
    undefined,
    "Шилжүүлэг цуцлагдсан",
  );

  revalidateEntities(["inventory"]);
  return { success: true, error: undefined };
}
