"use server";

import { capture } from "@zuiio/capture";
import { requireWriteAction } from "@/lib/action-utils";
import { revalidateEntities } from "@/lib/revalidate";

interface AdjustmentItem {
  product_id: string;
  variant_id: string | null;
  quantity: number;
  unit_cost: number | null;
}

export async function createBatchAdjustment(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const ctx = await requireWriteAction("stock_movements.create");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId, userId, branchId } = ctx;
  if (!branchId) {
    return { error: "Салбар сонгоогүй байна." };
  }

  const notes = formData.get("notes") as string | null;
  const itemsJson = formData.get("items") as string | null;

  if (!itemsJson) {
    return { error: "Барааны мэдээлэл шаардлагатай." };
  }

  let items: AdjustmentItem[];
  try {
    items = JSON.parse(itemsJson);
  } catch (e) {
    capture(e, { context: "inventory: parse adjustment items" });
    return { error: "Барааны мэдээллийн формат буруу байна." };
  }

  if (!Array.isArray(items) || items.length === 0) {
    return { error: "Дор хаяж нэг бараа оруулна уу." };
  }

  const batchId = crypto.randomUUID();
  const reference = `batch:${batchId}`;
  const defaultNotes = notes || "Бөөнөөр тохируулга";

  // Process all adjustments atomically via RPC
  const { data: rpcResult, error: rpcError } = await supabase.rpc(
    "process_batch_adjustment",
    {
      p_org_id: organizationId,
      p_branch_id: branchId,
      p_user_id: userId,
      p_items: items
        .filter((item) => item.quantity !== 0)
        .map((item) => ({
          product_id: item.product_id,
          variant_id: item.variant_id ?? null,
          quantity: item.quantity,
          unit_cost: item.unit_cost,
        })),
      p_reference: reference,
      p_notes: defaultNotes,
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
        "Тохируулга хадгалахад алдаа гарлаа.",
    };
  }

  revalidateEntities(["inventory"]);
  return { success: true, error: undefined, batchId };
}
