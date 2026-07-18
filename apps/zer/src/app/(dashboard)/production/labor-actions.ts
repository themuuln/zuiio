"use server";

import { capture, withDbCapture } from "@zuiio/capture";
import { requireWriteAction } from "@/lib/action-utils";
import { revalidateEntities } from "@/lib/revalidate";

// ─── Types ─────────────────────────────────────────────────────────────────

export interface LaborRecord {
  id: string;
  production_stage_id: string;
  employee_id: string;
  employee_name: string;
  hours: number;
  hourly_rate_snapshot: number;
  labor_cost: number | null;
  notes: string | null;
  created_at: string;
}

export interface StageLaborSummary {
  stage_id: string;
  total_hours: number;
  total_cost: number;
  records: LaborRecord[];
}

export interface OrderCostSummary {
  material_actual_cost: number;
  labor_actual_cost: number;
  total_actual_cost: number;
  revenue: number | null;
  profit: number | null;
}

export interface ActionError {
  error: string;
}

// ─── Add labor record ──────────────────────────────────────────────────────

interface AddLaborRecordInput {
  stage_id: string;
  employee_id: string;
  hours: number;
  hourly_rate: number;
  notes?: string;
}

export async function addLaborRecord(input: AddLaborRecordInput) {
  const ctx = await requireWriteAction("production_orders.create");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId } = ctx;

  // Validate stage belongs to org and is in_progress or completed
  const { data: stage, error: stageError } = await withDbCapture(
    "labor: addLaborRecord validate stage",
    supabase
      .from("production_stages")
      .select("id, status, organization_id")
      .eq("id", input.stage_id)
      .eq("organization_id", organizationId)
      .single(),
  );

  if (stageError || !stage) {
    capture(stageError, { context: "labor: addLaborRecord validate stage" });
    return { error: "Үйлдвэрлэлийн шат олдсонгүй." };
  }

  if (stage.status !== "in_progress" && stage.status !== "completed") {
    return {
      error: "Зөвхөн явагдаж буй эсвэл дууссан шатад ажилтан нэмнэ үү.",
    };
  }

  // Validate employee belongs to org
  const { data: employee, error: empError } = await withDbCapture(
    "labor: addLaborRecord validate employee",
    supabase
      .from("employees")
      .select("id, organization_id")
      .eq("id", input.employee_id)
      .eq("organization_id", organizationId)
      .single(),
  );

  if (empError || !employee) {
    capture(empError, { context: "labor: addLaborRecord validate employee" });
    return { error: "Ажилтан олдсонгүй." };
  }

  // Insert labor record
  const { error: insertError } = await withDbCapture(
    "labor: addLaborRecord insert",
    supabase.from("production_stage_labor").insert({
      organization_id: organizationId,
      production_stage_id: input.stage_id,
      employee_id: input.employee_id,
      hours: input.hours,
      hourly_rate_snapshot: input.hourly_rate,
      notes: input.notes ?? null,
    }),
  );

  if (insertError) {
    capture(insertError, { context: "labor: addLaborRecord insert" });
    return { error: "Ажилтан бүртгэхэд алдаа гарлаа." };
  }

  revalidateEntities(["production"]);

  return { success: true };
}

// ─── Remove labor record ───────────────────────────────────────────────────

export async function removeLaborRecord(laborId: string) {
  const ctx = await requireWriteAction("production_orders.update");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId } = ctx;

  // Validate the record exists and belongs to org
  const { data: record, error: fetchError } = await withDbCapture(
    "labor: removeLaborRecord fetch",
    supabase
      .from("production_stage_labor")
      .select(
        "id, production_stage_id, organization_id, production_stages!inner(status)",
      )
      .eq("id", laborId)
      .eq("organization_id", organizationId)
      .single(),
  );

  if (fetchError || !record) {
    capture(fetchError, { context: "labor: removeLaborRecord fetch" });
    return { error: "Ажилтын бүртгэл олдсонгүй." };
  }

  // Only allow removal for in_progress stages
  const stageStatus = (record as Record<string, unknown>).production_stages;
  const status =
    stageStatus && typeof stageStatus === "object" && "status" in stageStatus
      ? String((stageStatus as Record<string, unknown>).status)
      : "";
  if (status !== "in_progress") {
    return { error: "Зөвхөн явагдаж буй шатны ажилтыг устгана." };
  }

  const { error: deleteError } = await withDbCapture(
    "labor: removeLaborRecord delete",
    supabase.from("production_stage_labor").delete().eq("id", laborId),
  );

  if (deleteError) {
    capture(deleteError, { context: "labor: removeLaborRecord delete" });
    return { error: "Ажилтын бүртгэл устгахад алдаа гарлаа." };
  }

  revalidateEntities(["production"]);

  return { success: true };
}

// ─── Get stage labor summary ───────────────────────────────────────────────

export async function getStageLaborSummary(stageId: string) {
  const ctx = await requireWriteAction("production_orders.read");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId } = ctx;

  const { data: records, error } = await withDbCapture(
    "labor: getStageLaborSummary",
    supabase
      .from("production_stage_labor")
      .select(
        "id, production_stage_id, employee_id, hours, hourly_rate_snapshot, labor_cost, notes, created_at, employees!inner(full_name)",
      )
      .eq("production_stage_id", stageId)
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: true }),
  );

  if (error) {
    return {
      error: "Ажилтын мэдээлэл авахад алдаа гарлаа.",
    } as ActionError;
  }

  const mapped: LaborRecord[] = (records ?? []).map((r) => {
    const emp = r.employees as unknown as { full_name: string };
    return {
      id: r.id,
      production_stage_id: r.production_stage_id,
      employee_id: r.employee_id,
      employee_name: emp?.full_name ?? "",
      hours: r.hours,
      hourly_rate_snapshot: r.hourly_rate_snapshot,
      labor_cost: r.labor_cost,
      notes: r.notes,
      created_at: r.created_at,
    };
  });

  const totalHours = mapped.reduce((sum, r) => sum + r.hours, 0);
  const totalCost = mapped.reduce((sum, r) => sum + (r.labor_cost ?? 0), 0);

  return {
    data: {
      stage_id: stageId,
      total_hours: totalHours,
      total_cost: totalCost,
      records: mapped,
    } satisfies StageLaborSummary,
  };
}

// ─── Get order cost summary ────────────────────────────────────────────────

export async function getOrderCostSummary(orderId: string) {
  const ctx = await requireWriteAction("production_orders.read");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId } = ctx;

  // 1. Fetch order to check sale_item_id
  const { data: order, error: orderError } = await withDbCapture(
    "labor: getOrderCostSummary order",
    supabase
      .from("production_orders")
      .select("id, sale_item_id, organization_id")
      .eq("id", orderId)
      .eq("organization_id", organizationId)
      .single(),
  );

  if (orderError || !order) {
    capture(orderError, { context: "labor: getOrderCostSummary order" });
    return { error: "Үйлдвэрлэлийн захиалга олдсонгүй." } as ActionError;
  }

  // 2. Material actual cost from production_materials
  //    issued_quantity * estimated_unit_cost_snapshot - returned_quantity * estimated_unit_cost_snapshot
  const { data: materials, error: matError } = await withDbCapture(
    "labor: getOrderCostSummary materials",
    supabase
      .from("production_materials")
      .select(
        "issued_quantity, returned_quantity, estimated_unit_cost_snapshot",
      )
      .eq("production_order_id", orderId),
  );

  if (matError) {
    capture(matError, { context: "labor: getOrderCostSummary materials" });
    return {
      error: "Материалын зардал тооцоолоход алдаа гарлаа.",
    } as ActionError;
  }

  const materialActualCost = (materials ?? []).reduce((sum, m) => {
    const issued = m.issued_quantity * (m.estimated_unit_cost_snapshot ?? 0);
    const returned =
      m.returned_quantity * (m.estimated_unit_cost_snapshot ?? 0);
    return sum + issued - returned;
  }, 0);

  // 3. Labor actual cost from production_stage_labor via join
  const { data: stages, error: stagesError } = await withDbCapture(
    "labor: getOrderCostSummary stages",
    supabase
      .from("production_stages")
      .select("id")
      .eq("production_order_id", orderId),
  );

  if (stagesError) {
    capture(stagesError, { context: "labor: getOrderCostSummary stages" });
    return { error: "Шатны мэдээлэл авахад алдаа гарлаа." } as ActionError;
  }

  const stageIds = (stages ?? []).map((s) => s.id);

  let laborActualCost = 0;
  if (stageIds.length > 0) {
    const { data: laborRecords, error: laborError } = await withDbCapture(
      "labor: getOrderCostSummary labor",
      supabase
        .from("production_stage_labor")
        .select("labor_cost")
        .in("production_stage_id", stageIds),
    );

    if (laborError) {
      capture(laborError, { context: "labor: getOrderCostSummary labor" });
      return {
        error: "Ажилтын зардал тооцоолоход алдаа гарлаа.",
      } as ActionError;
    }

    laborActualCost = (laborRecords ?? []).reduce(
      (sum, r) => sum + (r.labor_cost ?? 0),
      0,
    );
  }

  // 4. Revenue from linked sale_item
  let revenue: number | null = null;
  if (order.sale_item_id) {
    const { data: saleItem, error: saleError } = await withDbCapture(
      "labor: getOrderCostSummary sale_item",
      supabase
        .from("sale_items")
        .select("total_price")
        .eq("id", order.sale_item_id)
        .single(),
    );

    if (!saleError && saleItem) {
      revenue = saleItem.total_price;
    }
  }

  // 5. Profit = revenue - total cost (only if revenue exists)
  const totalActualCost = materialActualCost + laborActualCost;
  const profit = revenue !== null ? revenue - totalActualCost : null;

  return {
    data: {
      material_actual_cost: materialActualCost,
      labor_actual_cost: laborActualCost,
      total_actual_cost: totalActualCost,
      revenue,
      profit,
    } satisfies OrderCostSummary,
  };
}

// ─── List active employees for selector ────────────────────────────────────

export async function listActiveEmployees() {
  const ctx = await requireWriteAction("production_orders.read");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId } = ctx;

  const { data: employees, error } = await withDbCapture(
    "labor: listActiveEmployees",
    supabase
      .from("employees")
      .select("id, full_name, position")
      .eq("organization_id", organizationId)
      .eq("is_active", true)
      .order("full_name", { ascending: true }),
  );

  if (error) {
    capture(error, { context: "labor: listActiveEmployees" });
    return { error: "Ажилтны жагсаалт авахад алдаа гарлаа." } as ActionError;
  }

  return {
    data: (employees ?? []).map((e) => ({
      id: e.id,
      full_name: e.full_name,
      position: e.position,
    })),
  };
}
