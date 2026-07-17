"use server";

import { capture, withDbCapture } from "@zuiio/capture";
import { requireWriteAction } from "@/lib/action-utils";
import { revalidateEntities } from "@/lib/revalidate";

// ─── Shared types ──────────────────────────────────────────────────────────

export interface QualityCheckListItem {
  id: string;
  production_order_id: string;
  order_number: string;
  production_stage_id: string | null;
  stage_name: string | null;
  check_type: "in_process" | "final";
  result: "pass" | "fail" | "conditional";
  defect_description: string | null;
  defect_photos: string[] | null;
  checked_by: string;
  checked_by_name: string;
  checked_at: string;
}

export interface QualityCheckSummary {
  total: number;
  pass: number;
  fail: number;
  conditional: number;
}

// ─── List quality checks ───────────────────────────────────────────────────

export async function listQualityChecks(productionOrderId?: string) {
  const ctx = await requireWriteAction("quality_checks.read");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId } = ctx;

  let query = supabase
    .from("quality_checks")
    .select(`
      id,
      production_order_id,
      production_stage_id,
      check_type,
      result,
      defect_description,
      defect_photos,
      checked_by,
      checked_at,
      production_orders!inner(order_number),
      production_stages(stage_name)
    `)
    .eq("organization_id", organizationId)
    .order("checked_at", { ascending: false });

  if (productionOrderId) {
    query = query.eq("production_order_id", productionOrderId);
  }

  const { data, error } = await withDbCapture("quality: listChecks", query);

  if (error) {
    capture(error, { context: "quality: listChecks" });
    return { error: "Чанарын шалгалтын жагсаалт татахад алдаа гарлаа." };
  }

  const checks: QualityCheckListItem[] = (data ?? []).map(
    (row: Record<string, unknown>) => {
      const order = row.production_orders as Record<string, unknown> | null;
      const stage = row.production_stages as Record<string, unknown> | null;

      return {
        id: row.id as string,
        production_order_id: row.production_order_id as string,
        order_number: (order?.order_number as string) ?? "",
        production_stage_id: row.production_stage_id as string | null,
        stage_name: (stage?.stage_name as string) ?? null,
        check_type: row.check_type as "in_process" | "final",
        result: row.result as "pass" | "fail" | "conditional",
        defect_description: row.defect_description as string | null,
        defect_photos: row.defect_photos as string[] | null,
        checked_by: row.checked_by as string,
        checked_by_name: "",
        checked_at: row.checked_at as string,
      };
    },
  );

  return { data: checks };
}

// ─── Create quality check ──────────────────────────────────────────────────

interface CreateQualityCheckInput {
  production_order_id: string;
  production_stage_id?: string | null;
  check_type: "in_process" | "final";
  result: "pass" | "fail" | "conditional";
  defect_description?: string | null;
  defect_photos?: string[] | null;
}

export async function createQualityCheck(input: CreateQualityCheckInput) {
  const ctx = await requireWriteAction("quality_checks.create");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId, userId } = ctx;

  const insertData: Record<string, unknown> = {
    organization_id: organizationId,
    production_order_id: input.production_order_id,
    production_stage_id: input.production_stage_id ?? null,
    check_type: input.check_type,
    result: input.result,
    defect_description: input.defect_description ?? null,
    defect_photos: input.defect_photos ?? [],
    checked_by: userId,
  };

  const { data, error } = await withDbCapture(
    "quality: createCheck",
    supabase.from("quality_checks").insert(insertData).select("id").single(),
  );

  if (error) {
    capture(error, { context: "quality: createCheck" });
    return { error: "Чанарын шалгалт бүртгэхэд алдаа гарлаа." };
  }

  revalidateEntities(["production"]);

  return { data: { id: data.id as string } };
}

// ─── Upload defect photo ───────────────────────────────────────────────────

export async function uploadDefectPhoto(
  productionOrderId: string,
  file: File,
): Promise<{ data: { path: string } } | { error: string }> {
  const ctx = await requireWriteAction("quality_checks.create");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId } = ctx;

  const ext = file.name.split(".").pop() ?? "jpg";
  const filePath = `${organizationId}/${productionOrderId}/${crypto.randomUUID()}.${ext}`;

  const { error } = await withDbCapture(
    "quality: uploadPhoto",
    supabase.storage.from("defect-photos").upload(filePath, file, {
      contentType: file.type,
      upsert: false,
    }),
  );

  if (error) {
    capture(error, { context: "quality: uploadPhoto" });
    return { error: "Зураг байршуулахад алдаа гарлаа." };
  }

  return { data: { path: filePath } };
}

// ─── Get quality checks summary ────────────────────────────────────────────

export async function getQualityChecksSummary(
  productionOrderId: string,
): Promise<{ data: QualityCheckSummary } | { error: string }> {
  const ctx = await requireWriteAction("quality_checks.read");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId } = ctx;

  const { data, error } = await withDbCapture(
    "quality: getSummary",
    supabase
      .from("quality_checks")
      .select("result")
      .eq("organization_id", organizationId)
      .eq("production_order_id", productionOrderId),
  );

  if (error) {
    capture(error, { context: "quality: getSummary" });
    return { error: "Чанарын шалгалтын дүн татахад алдаа гарлаа." };
  }

  const rows = data ?? [];
  const summary: QualityCheckSummary = {
    total: rows.length,
    pass: rows.filter((r: Record<string, unknown>) => r.result === "pass")
      .length,
    fail: rows.filter((r: Record<string, unknown>) => r.result === "fail")
      .length,
    conditional: rows.filter(
      (r: Record<string, unknown>) => r.result === "conditional",
    ).length,
  };

  return { data: summary };
}
