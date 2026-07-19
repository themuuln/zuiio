"use server";

import { capture, withDbCapture } from "@zuiio/capture";
import { requireWriteAction } from "@/lib/action-utils";
import { revalidateEntities } from "@/lib/revalidate";

function extractName(value: unknown): string {
  if (value && typeof value === "object" && "name" in value) {
    const v = value.name;
    if (typeof v === "string") return v;
  }
  return "";
}
// ─── Shared types ──────────────────────────────────────────────────────────

export interface ProductionOrderListItem {
  id: string;
  order_number: string;
  product_id: string;
  product_name: string;
  quantity: number;
  status: string;
  priority: string;
  planned_start_date: string | null;
  planned_end_date: string | null;
  created_at: string;
}

export interface ProductionStageData {
  id: string;
  stage_name: string;
  stage_order: number;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  notes: string | null;
}

export interface ProductionMaterialData {
  id: string;
  product_id: string;
  product_name: string;
  required_quantity: number;
  issued_quantity: number;
  used_quantity: number;
  returned_quantity: number;
  unit: string;
  required_width_mm: number | null;
  required_length_mm: number | null;
  required_thickness_mm: number | null;
  estimated_unit_cost_snapshot: number | null;
}

export interface ProductionOrderDetail {
  id: string;
  order_number: string;
  branch_id: string;
  sale_item_id: string | null;
  product_id: string;
  product_name: string;
  bom_id: string;
  bom_version: number;
  quantity: number;
  status: string;
  priority: string;
  planned_start_date: string | null;
  planned_end_date: string | null;
  actual_start_at: string | null;
  actual_end_at: string | null;
  estimated_cost_snapshot: number | null;
  completed_actual_cost: number | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  stages: ProductionStageData[];
  materials: ProductionMaterialData[];
}

// ─── Valid status transitions ───────────────────────────────────────────────

const VALID_ORDER_TRANSITIONS: Record<string, string[]> = {
  pending: ["in_progress", "cancelled"],
  in_progress: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

const VALID_STAGE_TRANSITIONS: Record<string, string[]> = {
  pending: ["in_progress", "skipped"],
  in_progress: ["completed"],
  completed: [],
  skipped: [],
};

// ─── List production orders ────────────────────────────────────────────────

export async function listProductionOrders(filters?: {
  status?: string;
  branch_id?: string;
}) {
  const ctx = await requireWriteAction("production_orders.read");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId, branchId } = ctx;

  const targetBranch = filters?.branch_id ?? branchId;

  let query = supabase
    .from("production_orders")
    .select(
      "id, order_number, product_id, quantity, status, priority, planned_start_date, planned_end_date, created_at, products!inner(name)",
    )
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (targetBranch) {
    query = query.eq("branch_id", targetBranch);
  }

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  const { data, error } = await withDbCapture(
    "production: listProductionOrders",
    query,
  );

  if (error) {
    capture(error, { context: "production: listProductionOrders" });
    return {
      error: "Үйлдвэрлэлийн захиалгын жагсаалт авахад алдаа гарлаа.",
    };
  }

  const orders: ProductionOrderListItem[] = (data ?? []).map((row) => ({
    id: row.id,
    order_number: row.order_number,
    product_id: row.product_id,
    product_name: extractName(row.products),
    quantity: row.quantity,
    status: row.status,
    priority: row.priority,
    planned_start_date: row.planned_start_date,
    planned_end_date: row.planned_end_date,
    created_at: row.created_at,
  }));

  return { data: orders };
}

// ─── Get single production order ───────────────────────────────────────────

export async function getProductionOrder(orderId: string) {
  const ctx = await requireWriteAction("production_orders.read");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId } = ctx;

  const { data: order, error: orderError } = await withDbCapture(
    "production: getProductionOrder",
    supabase
      .from("production_orders")
      .select("*, products!inner(name)")
      .eq("id", orderId)
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .single(),
  );

  if (orderError || !order) {
    capture(orderError, { context: "production: getProductionOrder" });
    return { error: "Үйлдвэрлэлийн захиалга олдсонгүй." };
  }

  const { data: stages, error: stagesError } = await withDbCapture(
    "production: getProductionOrder stages",
    supabase
      .from("production_stages")
      .select(
        "id, stage_name, stage_order, status, started_at, completed_at, notes",
      )
      .eq("production_order_id", orderId)
      .order("stage_order", { ascending: true }),
  );

  if (stagesError) {
    capture(stagesError, { context: "production: getProductionOrder stages" });
    return {
      error: "Үйлдвэрлэлийн шатны жагсаалт авахад алдаа гарлаа.",
    };
  }

  const { data: materials, error: materialsError } = await withDbCapture(
    "production: getProductionOrder materials",
    supabase
      .from("production_materials")
      .select("*, products!inner(name)")
      .eq("production_order_id", orderId),
  );

  if (materialsError) {
    capture(materialsError, {
      context: "production: getProductionOrder materials",
    });
    return {
      error: "Үйлдвэрлэлийн материалын жагсаалт авахад алдаа гарлаа.",
    };
  }

  const detail: ProductionOrderDetail = {
    id: order.id,
    order_number: order.order_number,
    branch_id: order.branch_id,
    sale_item_id: order.sale_item_id,
    product_id: order.product_id,
    product_name: extractName(order.products),
    bom_id: order.bom_id,
    bom_version: order.bom_version,
    quantity: order.quantity,
    status: order.status,
    priority: order.priority,
    planned_start_date: order.planned_start_date,
    planned_end_date: order.planned_end_date,
    actual_start_at: order.actual_start_at,
    actual_end_at: order.actual_end_at,
    estimated_cost_snapshot: order.estimated_cost_snapshot,
    completed_actual_cost: order.completed_actual_cost,
    notes: order.notes,
    created_by: order.created_by,
    created_at: order.created_at,
    stages: (stages ?? []).map((s) => ({
      id: s.id,
      stage_name: s.stage_name,
      stage_order: s.stage_order,
      status: s.status,
      started_at: s.started_at,
      completed_at: s.completed_at,
      notes: s.notes,
    })),
    materials: (materials ?? []).map((m) => ({
      id: m.id,
      product_id: m.product_id,
      product_name: extractName(m.products),
      required_quantity: m.required_quantity,
      issued_quantity: m.issued_quantity,
      used_quantity: m.used_quantity,
      returned_quantity: m.returned_quantity,
      unit: m.unit,
      required_width_mm: m.required_width_mm,
      required_length_mm: m.required_length_mm,
      required_thickness_mm: m.required_thickness_mm,
      estimated_unit_cost_snapshot: m.estimated_unit_cost_snapshot,
    })),
  };

  return { data: detail };
}

// ─── Create production order ───────────────────────────────────────────────

interface CreateProductionOrderInput {
  branch_id: string;
  product_id: string;
  bom_id: string;
  quantity: number;
  priority?: string;
  planned_start_date?: string;
  planned_end_date?: string;
  notes?: string;
  sale_item_id?: string;
}

export async function createProductionOrder(input: CreateProductionOrderInput) {
  const ctx = await requireWriteAction("production_orders.create");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId, userId } = ctx;

  // 1. Fetch BOM details and items in parallel
  const [bomResult, itemsResult] = await Promise.all([
    withDbCapture(
      "production: createOrder fetch BOM",
      supabase
        .from("product_boms")
        .select("id, version, status")
        .eq("id", input.bom_id)
        .eq("organization_id", organizationId)
        .eq("status", "active")
        .is("deleted_at", null)
        .single(),
    ),
    withDbCapture(
      "production: createOrder fetch BOM items",
      supabase
        .from("bom_items")
        .select(
          "id, material_product_id, quantity, unit, required_width_mm, required_length_mm, required_thickness_mm, estimated_unit_cost, sort_order",
        )
        .eq("bom_id", input.bom_id)
        .eq("organization_id", organizationId)
        .is("deleted_at", null)
        .order("sort_order", { ascending: true }),
    ),
  ]);

  if (bomResult.error || !bomResult.data) {
    capture(bomResult.error, {
      context: "production: createOrder fetch BOM",
    });
    return { error: "Идэвхтэй BOM олдсонгүй." };
  }

  if (itemsResult.error) {
    capture(itemsResult.error, {
      context: "production: createOrder fetch BOM items",
    });
    return { error: "BOM материалын жагсаалт авахад алдаа гарлаа." };
  }

  const bomItems = itemsResult.data;
  if (bomItems.length === 0) {
    return {
      error:
        "BOM-д материалын зүйл байхгүй байна. Эхлээд BOM-д материал нэмнэ үү.",
    };
  }

  // 2. Generate order number via RPC
  const { data: orderNumber, error: rpcError } = await withDbCapture(
    "production: createOrder generate number",
    supabase.rpc("generate_order_number", { p_org_id: organizationId }),
  );

  if (rpcError || !orderNumber) {
    capture(rpcError, { context: "production: createOrder generate number" });
    return { error: "Захиалгын дугаар үүсгэхэд алдаа гарлаа." };
  }

  // 3. Calculate estimated cost snapshot from BOM
  const estimatedCost = bomItems.reduce(
    (sum, item) =>
      sum + (item.estimated_unit_cost ?? 0) * item.quantity * input.quantity,
    0,
  );

  // 4. Insert production order
  const { data: order, error: insertError } = await withDbCapture(
    "production: createOrder insert",
    supabase
      .from("production_orders")
      .insert({
        organization_id: organizationId,
        branch_id: input.branch_id,
        order_number: orderNumber,
        sale_item_id: input.sale_item_id ?? null,
        product_id: input.product_id,
        bom_id: input.bom_id,
        bom_version: bomResult.data.version,
        quantity: input.quantity,
        priority: input.priority ?? "normal",
        planned_start_date: input.planned_start_date ?? null,
        planned_end_date: input.planned_end_date ?? null,
        estimated_cost_snapshot: estimatedCost,
        notes: input.notes ?? null,
        created_by: userId,
      })
      .select("id")
      .single(),
  );

  if (insertError || !order) {
    capture(insertError, { context: "production: createOrder insert" });
    return { error: "Үйлдвэрлэлийн захиалга үүсгэхэд алдаа гарлаа." };
  }

  // 5. Create default stages via RPC
  const { error: stagesError } = await withDbCapture(
    "production: createOrder default stages",
    supabase.rpc("create_default_stages", {
      p_order_id: order.id,
      p_org_id: organizationId,
    }),
  );

  if (stagesError) {
    capture(stagesError, {
      context: "production: createOrder default stages",
    });
    // Attempt cleanup: delete the order we just created
    await supabase.from("production_orders").delete().eq("id", order.id);
    return { error: "Үйлдвэрлэлийн шат үүсгэхэд алдаа гарлаа." };
  }

  // 6. Snapshot BOM items into production_materials (multiply by order quantity)
  const materialsToInsert = bomItems.map((item) => ({
    organization_id: organizationId,
    production_order_id: order.id,
    source_bom_item_id: item.id,
    product_id: item.material_product_id,
    required_quantity: item.quantity * input.quantity,
    unit: item.unit,
    required_width_mm: item.required_width_mm,
    required_length_mm: item.required_length_mm,
    required_thickness_mm: item.required_thickness_mm,
    estimated_unit_cost_snapshot: item.estimated_unit_cost ?? 0,
  }));

  const { error: materialsError } = await withDbCapture(
    "production: createOrder materials",
    supabase.from("production_materials").insert(materialsToInsert),
  );

  if (materialsError) {
    capture(materialsError, { context: "production: createOrder materials" });
    // Attempt cleanup: delete order + stages
    await supabase
      .from("production_stages")
      .delete()
      .eq("production_order_id", order.id);
    await supabase.from("production_orders").delete().eq("id", order.id);
    return {
      error: "Үйлдвэрлэлийн материалыг хадгалахад алдаа гарлаа.",
    };
  }

  revalidateEntities(["production"]);

  return { data: { id: order.id, order_number: orderNumber } };
}

// ─── Update production order status ────────────────────────────────────────

interface UpdateOrderStatusInput {
  order_id: string;
  new_status: string;
}

export async function updateProductionOrderStatus(
  input: UpdateOrderStatusInput,
) {
  const ctx = await requireWriteAction("production_orders.update");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId } = ctx;

  // Fetch current order
  const { data: order, error: fetchError } = await withDbCapture(
    "production: updateStatus fetch",
    supabase
      .from("production_orders")
      .select("id, status, deleted_at")
      .eq("id", input.order_id)
      .eq("organization_id", organizationId)
      .single(),
  );

  if (fetchError || !order) {
    capture(fetchError, { context: "production: updateStatus fetch" });
    return { error: "Үйлдвэрлэлийн захиалга олдсонгүй." };
  }

  if (order.deleted_at) {
    return { error: "Устгагдсан захиалгын төлөв өөрчлөх боломжгүй." };
  }

  // Validate transition
  const allowed = VALID_ORDER_TRANSITIONS[order.status] ?? [];
  if (!allowed.includes(input.new_status)) {
    return {
      error: `"${order.status}" төлөвөөс "${input.new_status}" руу шилжүүлэх боломжгүй.`,
    };
  }

  // ─── Completion validation ────────────────────────────────────────────
  if (input.new_status === "completed") {
    // 1. Check all stages are completed or skipped
    const { data: stages, error: stagesError } = await withDbCapture(
      "production: completionValidation stages",
      supabase
        .from("production_stages")
        .select("id, status")
        .eq("production_order_id", input.order_id),
    );

    if (stagesError) {
      capture(stagesError, {
        context: "production: completionValidation stages",
      });
      return { error: "Шатуудыг татахад алдаа гарлаа." };
    }

    const incompleteStages = (stages ?? []).filter(
      (s: Record<string, unknown>) =>
        s.status !== "completed" && s.status !== "skipped",
    );
    if (incompleteStages.length > 0) {
      return {
        error:
          "Бүх шатуудыг дуусгах эсвэл алгасах ёстой. Дутуу шат: " +
          incompleteStages.length,
      };
    }

    // 2. Check there is at least one final quality check
    const { data: checks, error: checksError } = await withDbCapture(
      "production: completionValidation checks",
      supabase
        .from("quality_checks")
        .select("id, result, checked_at")
        .eq("production_order_id", input.order_id)
        .eq("check_type", "final")
        .order("checked_at", { ascending: false }),
    );

    if (checksError) {
      capture(checksError, {
        context: "production: completionValidation checks",
      });
      return { error: "Чанарын шалгалтыг татахад алдаа гарлаа." };
    }

    if (!checks || checks.length === 0) {
      return {
        error:
          "Эцэслэх чанарын шалгалт хийгээгүй байна. Эцэслэх шалгалт заавал байх ёстой.",
      };
    }

    // 3. Check the latest final check result
    const latestCheck = checks[0] as Record<string, unknown>;
    const latestResult = latestCheck.result as string;
    if (latestResult === "fail") {
      return {
        error:
          "Сүүлийн эцэслэх шалгалт унасан тул захиалгыг дуусгах боломжгүй.",
      };
    }
  }
  const updateData = {
    status: input.new_status,
    ...(input.new_status === "in_progress"
      ? { actual_start_at: new Date().toISOString() }
      : {}),
    ...(input.new_status === "completed"
      ? { actual_end_at: new Date().toISOString() }
      : {}),
  };

  const { error: updateError } = await withDbCapture(
    "production: updateStatus",
    supabase
      .from("production_orders")
      .update(updateData)
      .eq("id", input.order_id),
  );

  if (updateError) {
    capture(updateError, { context: "production: updateStatus" });
    return {
      error: "Үйлдвэрлэлийн захиалгын төлөв шинэчлэхэд алдаа гарлаа.",
    };
  }

  revalidateEntities(["production"]);

  return { success: true };
}

// ─── Advance stage ─────────────────────────────────────────────────────────

interface AdvanceStageInput {
  stage_id: string;
  new_status: string;
  notes?: string;
}

export async function advanceStage(input: AdvanceStageInput) {
  const ctx = await requireWriteAction("production_orders.update");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId } = ctx;

  // Fetch stage with order info for validation
  const { data: stage, error: fetchError } = await withDbCapture(
    "production: advanceStage fetch",
    supabase
      .from("production_stages")
      .select("id, status, production_order_id, stage_order, organization_id")
      .eq("id", input.stage_id)
      .single(),
  );

  if (fetchError || !stage) {
    capture(fetchError, { context: "production: advanceStage fetch" });
    return { error: "Үйлдвэрлэлийн шат олдсонгүй." };
  }

  if (stage.organization_id !== organizationId) {
    return { error: "Хандах эрхгүй байна." };
  }

  // Validate transition
  const allowed = VALID_STAGE_TRANSITIONS[stage.status] ?? [];
  if (!allowed.includes(input.new_status)) {
    return {
      error: `"${stage.status}" төлөвөөс "${input.new_status}" руу шилжүүлэх боломжгүй.`,
    };
  }

  const updateData = {
    status: input.new_status,
    ...(input.new_status === "in_progress"
      ? { started_at: new Date().toISOString() }
      : {}),
    ...(input.new_status === "completed"
      ? { completed_at: new Date().toISOString() }
      : {}),
    ...(input.notes !== undefined ? { notes: input.notes } : {}),
  };

  const { error: updateError } = await withDbCapture(
    "production: advanceStage",
    supabase
      .from("production_stages")
      .update(updateData)
      .eq("id", input.stage_id),
  );

  if (updateError) {
    capture(updateError, { context: "production: advanceStage" });
    return { error: "Үйлдвэрлэлийн шат шинэчлэхэд алдаа гарлаа." };
  }

  revalidateEntities(["production"]);

  return { success: true };
}

// ─── Cancel production order ───────────────────────────────────────────────

export async function cancelProductionOrder(orderId: string) {
  const ctx = await requireWriteAction("production_orders.update");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId } = ctx;

  // Fetch current order
  const { data: order, error: fetchError } = await withDbCapture(
    "production: cancelOrder fetch",
    supabase
      .from("production_orders")
      .select("id, status, deleted_at")
      .eq("id", orderId)
      .eq("organization_id", organizationId)
      .single(),
  );

  if (fetchError || !order) {
    capture(fetchError, { context: "production: cancelOrder fetch" });
    return { error: "Үйлдвэрлэлийн захиалга олдсонгүй." };
  }

  if (order.deleted_at) {
    return { error: "Захиалга аль хэдийн устгагдсан байна." };
  }

  if (order.status === "completed") {
    return { error: "Дууссан захиалгыг цуцлах боломжгүй." };
  }

  if (order.status === "cancelled") {
    return { error: "Захиалга аль хэдийн цуцлагдсан байна." };
  }

  const { error: updateError } = await withDbCapture(
    "production: cancelOrder",
    supabase
      .from("production_orders")
      .update({ status: "cancelled" })
      .eq("id", orderId),
  );

  if (updateError) {
    capture(updateError, { context: "production: cancelOrder" });
    return {
      error: "Үйлдвэрлэлийн захиалгыг цуцлахад алдаа гарлаа.",
    };
  }

  revalidateEntities(["production"]);

  return { success: true };
}

// ─── Get production order stats ────────────────────────────────────────────

export interface ProductionOrderStats {
  total: number;
  pending: number;
  in_progress: number;
  completed: number;
  cancelled: number;
  total_cost: number;
}

export async function getProductionOrderStats() {
  const ctx = await requireWriteAction("production_orders.read");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId } = ctx;

  const { data, error } = await withDbCapture(
    "production: getStats",
    supabase
      .from("production_orders")
      .select("status, estimated_cost_snapshot")
      .eq("organization_id", organizationId)
      .is("deleted_at", null),
  );

  if (error) {
    capture(error, { context: "production: getStats" });
    return { error: "Статистик мэдээлэл авахад алдаа гарлаа." };
  }

  const stats: ProductionOrderStats = {
    total: data.length,
    pending: 0,
    in_progress: 0,
    completed: 0,
    cancelled: 0,
    total_cost: 0,
  };

  for (const order of data) {
    stats.total_cost += order.estimated_cost_snapshot ?? 0;
    if (order.status in stats) {
      stats[
        order.status as keyof Omit<ProductionOrderStats, "total" | "total_cost">
      ]++;
    }
  }

  return { data: stats };
}
