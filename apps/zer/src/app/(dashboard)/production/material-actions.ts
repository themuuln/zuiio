"use server";

import { capture, withDbCapture } from "@zuiio/capture";
import { requireWriteAction } from "@/lib/action-utils";
import { revalidateEntities } from "@/lib/revalidate";

// ─── Material Issue ────────────────────────────────────────────────────────

interface IssueMaterialsInput {
  order_id: string;
  material_ids: string[];
  quantities: number[];
}

export async function issueMaterials(input: IssueMaterialsInput) {
  const ctx = await requireWriteAction("production_orders.update");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId } = ctx;

  // Generate idempotency key
  const operationId = `issue-${input.order_id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const { error } = await withDbCapture(
    "production: issueMaterials",
    supabase.rpc("issue_production_materials", {
      p_production_order_id: input.order_id,
      p_material_ids: input.material_ids,
      p_quantities: input.quantities,
      p_operation_id: operationId,
    }),
  );

  if (error) {
    capture(error, { context: "production: issueMaterials" });
    return {
      error: error.message?.includes("хэмжээ")
        ? error.message
        : "Материал гаргахад алдаа гарлаа.",
    };
  }

  revalidateEntities(["production_orders"]);

  return { success: true };
}

// ─── Material Return ───────────────────────────────────────────────────────

interface ReturnMaterialsInput {
  order_id: string;
  material_ids: string[];
  quantities: number[];
}

export async function returnMaterials(input: ReturnMaterialsInput) {
  const ctx = await requireWriteAction("production_orders.update");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId } = ctx;

  const operationId = `return-${input.order_id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const { error } = await withDbCapture(
    "production: returnMaterials",
    supabase.rpc("return_production_materials", {
      p_production_order_id: input.order_id,
      p_material_ids: input.material_ids,
      p_quantities: input.quantities,
      p_operation_id: operationId,
    }),
  );

  if (error) {
    capture(error, { context: "production: returnMaterials" });
    return {
      error: error.message?.includes("хэмжээ")
        ? error.message
        : "Материал буцаахад алдаа гарлаа.",
    };
  }

  revalidateEntities(["production_orders"]);

  return { success: true };
}

// ─── Record Usage ──────────────────────────────────────────────────────────

interface RecordUsageInput {
  order_id: string;
  material_ids: string[];
  quantities: number[];
}

export async function recordUsage(input: RecordUsageInput) {
  const ctx = await requireWriteAction("production_orders.update");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId } = ctx;

  const operationId = `usage-${input.order_id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const { error } = await withDbCapture(
    "production: recordUsage",
    supabase.rpc("record_production_usage", {
      p_production_order_id: input.order_id,
      p_material_ids: input.material_ids,
      p_quantities: input.quantities,
      p_operation_id: operationId,
    }),
  );

  if (error) {
    capture(error, { context: "production: recordUsage" });
    return {
      error: error.message?.includes("хэмжээ")
        ? error.message
        : "Материал ашиглахад алдаа гарлаа.",
    };
  }

  revalidateEntities(["production_orders"]);

  return { success: true };
}
