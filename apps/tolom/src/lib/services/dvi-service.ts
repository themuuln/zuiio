import crypto from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidateTag } from "next/cache";
import { logAuditAfter } from "@/lib/audit";
import { cacheTags } from "@/lib/cache/keys";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { reportServerError } from "@/lib/sentry-report-server";
import type { Database } from "@/lib/types";

// ── Types ────────────────────────────────────────────────────

export type DVInspectionStatus =
  | "draft"
  | "sent"
  | "approved"
  | "declined"
  | "partially_approved"
  | "converted";

export type DVIItemCategory =
  | "safety"
  | "engine"
  | "transmission"
  | "electrical"
  | "body"
  | "interior"
  | "suspension"
  | "brakes"
  | "tires"
  | "other";

export type DVIItemCondition =
  | "good"
  | "fair"
  | "poor"
  | "needs_replacement";

export type DVIItemSeverity =
  | "minor"
  | "major"
  | "critical";

export interface DVIInspection {
  id: string;
  organization_id: string;
  vehicle_id: string;
  status: DVInspectionStatus;
  customer_token_hash: string | null;
  work_order_id: string | null;
  odometer: number | null;
  fuel_level: number | null;
  technician_notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface DVIInspectionItem {
  id: string;
  inspection_id: string;
  category: DVIItemCategory;
  item_name: string;
  condition: DVIItemCondition | null;
  severity: DVIItemSeverity | null;
  notes: string | null;
  customer_approved: boolean | null;
  created_at: string;
}

export interface CreateDVIInspectionParams {
  vehicle_id: string;
  odometer?: number | null;
  fuel_level?: number | null;
  technician_notes?: string | null;
}

export interface AddDVIItemParams {
  category: string;
  item_name: string;
  condition?: string | null;
  severity?: string | null;
  notes?: string | null;
}

export interface UpdateDVIItemParams {
  category?: string | null;
  item_name?: string | null;
  condition?: string | null;
  severity?: string | null;
  notes?: string | null;
}

export interface DVISendParams {
  customer_phone: string;
}

export interface CustomerApprovalParams {
  item_ids: string[];
  approved: boolean;
}

// ── Table Name Constants ──────────────────────────────────────

const INSPECTIONS_TABLE = "digital_vehicle_inspections" as const;
const ITEMS_TABLE = "dvi_inspection_items" as const;

// ── Query Helpers ─────────────────────────────────────────────

/**
 * Wrapped query builder for tables not in generated Supabase types.
 * This is the thenable builder returned by db.from(tableName) —
 * we use it as a forwarding type so callers can chain .select(),
 * .eq(), .order(), .single(), etc., then await the result.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface DviQueryBuilder extends PromiseLike<unknown> {
  select(columns: string): this;
  eq(column: string, value: unknown): this;
  order(column: string, opts?: { ascending?: boolean }): this;
  limit(n: number): this;
  range(start: number, end: number): this;
  single(): this;
  insert(row: Record<string, unknown>): this;
  update(row: Record<string, unknown>): this;
  delete(): this;
  in(column: string, values: unknown[]): this;
}

/**
 * Build a query on the inspections table.
 */
function inspectionsQuery(db: SupabaseClient<Database>): DviQueryBuilder {
  return db.from(INSPECTIONS_TABLE) as unknown as DviQueryBuilder;
}

/**
 * Build a query on the items table.
 */
function itemsQuery(db: SupabaseClient<Database>): DviQueryBuilder {
  return db.from(ITEMS_TABLE) as unknown as DviQueryBuilder;
}

/**
 * Execute a chained query builder and destructure { data, error }.
 * The real Supabase builder is thenable — this just provides type-safety
 * for the destructured result.
 */
async function execQuery<T>(
  q: DviQueryBuilder,
): Promise<{ data: T; error: unknown }> {
  const result = await (q as unknown as Promise<{
    data: T;
    error: unknown;
  }>);
  return result;
}

// ── Queries ───────────────────────────────────────────────────

/**
 * Get DVI inspections for an organization with optional filtering.
 */
export async function getInspections(
  db: SupabaseClient<Database>,
  orgId: string,
  opts?: {
    status?: string;
    vehicleId?: string;
    limit?: number;
    offset?: number;
  },
): Promise<DVIInspection[]> {
  let built = inspectionsQuery(db)
    .select("*")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });

  if (opts?.status) {
    built = built.eq("status", opts.status);
  }

  if (opts?.vehicleId) {
    built = built.eq("vehicle_id", opts.vehicleId);
  }

  if (opts?.limit !== undefined && opts?.offset !== undefined) {
    built = built.range(opts.offset, opts.offset + opts.limit - 1);
  } else if (opts?.limit !== undefined) {
    built = built.limit(opts.limit);
  }

  const { data, error } = await execQuery<DVIInspection[]>(built);

  if (error) {
    reportServerError("getInspections", error);
    throw error;
  }

  return data ?? [];
}

/**
 * Get a single DVI inspection with its items.
 */
export async function getInspection(
  db: SupabaseClient<Database>,
  inspectionId: string,
  orgId: string,
): Promise<{ inspection: DVIInspection; items: DVIInspectionItem[] }> {
  const { data, error } = await execQuery<
    DVIInspection & { items: DVIInspectionItem[] }
  >(
    inspectionsQuery(db)
      .select(
        `
        *,
        items:dvi_inspection_items(*)
      `,
      )
      .eq("id", inspectionId)
      .eq("organization_id", orgId)
      .single(),
  );

  if (error || !data) {
    throw new NotFoundError(`DV Inspection not found: ${inspectionId}`);
  }

  return {
    inspection: data,
    items: data.items ?? [],
  };
}

/**
 * Create a new DVI inspection.
 */
export async function createInspection(
  db: SupabaseClient<Database>,
  orgId: string,
  userId: string,
  params: {
    vehicle_id: string;
    odometer?: number | null;
    fuel_level?: number | null;
    technician_notes?: string | null;
  },
): Promise<DVIInspection> {
  if (!params.vehicle_id?.trim()) {
    throw new ValidationError("Vehicle ID is required");
  }

  const { data, error } = await execQuery<DVIInspection>(
    inspectionsQuery(db)
      .insert({
        organization_id: orgId,
        vehicle_id: params.vehicle_id,
        odometer: params.odometer ?? null,
        fuel_level: params.fuel_level ?? null,
        technician_notes: params.technician_notes?.trim() ?? null,
        status: "draft",
        created_by: userId,
      })
      .select("*")
      .single(),
  );

  if (error) {
    reportServerError("createInspection", error);
    throw error;
  }

  logAuditAfter({
    supabase: db,
    action: "create",
    table_name: INSPECTIONS_TABLE,
    record_id: data.id,
    user_id: userId,
    organization_id: orgId,
  });

  revalidateTag(cacheTags.workOrders(orgId), "max");

  return data;
}

/**
 * Update a DVI inspection.
 */
export async function updateInspection(
  db: SupabaseClient<Database>,
  inspectionId: string,
  orgId: string,
  userId: string,
  params: {
    status?: string;
    odometer?: number | null;
    fuel_level?: number | null;
    technician_notes?: string | null;
  },
): Promise<DVIInspection> {
  // Verify inspection exists
  const existing = await execQuery<DVIInspection>(
    inspectionsQuery(db)
      .select("id")
      .eq("id", inspectionId)
      .eq("organization_id", orgId)
      .single(),
  );

  if (existing.error || !existing.data) {
    throw new NotFoundError(`DV Inspection not found: ${inspectionId}`);
  }

  // Build updates, skipping undefined fields
  const updates: Record<string, unknown> = {};
  if (params.status !== undefined) updates.status = params.status;
  if (params.odometer !== undefined) updates.odometer = params.odometer;
  if (params.fuel_level !== undefined) updates.fuel_level = params.fuel_level;
  if (params.technician_notes !== undefined) {
    const trimmed = String(params.technician_notes).trim();
    updates.technician_notes = trimmed || null;
  }

  if (Object.keys(updates).length === 0) {
    const r = await getInspection(db, inspectionId, orgId);
    return r.inspection;
  }

  const { data, error } = await execQuery<DVIInspection>(
    inspectionsQuery(db)
      .update(updates)
      .eq("id", inspectionId)
      .eq("organization_id", orgId)
      .select("*")
      .single(),
  );

  if (error) {
    reportServerError("updateInspection", error);
    throw error;
  }

  revalidateTag(cacheTags.workOrders(orgId), "max");

  return data;
}

/**
 * Add an item to a DVI inspection.
 */
export async function addInspectionItem(
  db: SupabaseClient<Database>,
  inspectionId: string,
  orgId: string,
  _userId: string,
  params: {
    category: string;
    item_name: string;
    condition?: string | null;
    severity?: string | null;
    notes?: string | null;
  },
): Promise<DVIInspectionItem> {
  // Verify inspection exists
  const existing = await execQuery<DVIInspection>(
    inspectionsQuery(db)
      .select("id")
      .eq("id", inspectionId)
      .eq("organization_id", orgId)
      .single(),
  );

  if (existing.error || !existing.data) {
    throw new NotFoundError(`DV Inspection not found: ${inspectionId}`);
  }

  if (!params.category?.trim()) {
    throw new ValidationError("Category is required");
  }

  if (!params.item_name?.trim()) {
    throw new ValidationError("Item name is required");
  }

  const { data, error } = await execQuery<DVIInspectionItem>(
    itemsQuery(db)
      .insert({
        inspection_id: inspectionId,
        category: params.category,
        item_name: params.item_name.trim(),
        condition: params.condition ?? null,
        severity: params.severity ?? null,
        notes: params.notes?.trim() ?? null,
      })
      .select("*")
      .single(),
  );

  if (error) {
    reportServerError("addInspectionItem", error);
    throw error;
  }

  return data;
}

/**
 * Update a DVI inspection item.
 */
export async function updateInspectionItem(
  db: SupabaseClient<Database>,
  inspectionId: string,
  itemId: string,
  orgId: string,
  _userId: string,
  params: {
    category?: string | null;
    item_name?: string | null;
    condition?: string | null;
    severity?: string | null;
    notes?: string | null;
  },
): Promise<DVIInspectionItem> {
  // Verify inspection exists
  const existing = await execQuery<DVIInspection>(
    inspectionsQuery(db)
      .select("id")
      .eq("id", inspectionId)
      .eq("organization_id", orgId)
      .single(),
  );

  if (existing.error || !existing.data) {
    throw new NotFoundError(`DV Inspection not found: ${inspectionId}`);
  }

  // Build updates, skipping undefined fields
  const updates: Record<string, unknown> = {};
  if (params.category !== undefined) updates.category = params.category;
  if (params.item_name !== undefined) {
    updates.item_name = String(params.item_name).trim() || null;
  }
  if (params.condition !== undefined) updates.condition = params.condition;
  if (params.severity !== undefined) updates.severity = params.severity;
  if (params.notes !== undefined) {
    updates.notes = String(params.notes).trim() || null;
  }

  if (Object.keys(updates).length === 0) {
    const found = await execQuery<DVIInspectionItem>(
      itemsQuery(db)
        .select("*")
        .eq("id", itemId)
        .eq("inspection_id", inspectionId)
        .single(),
    );
    return found.data as DVIInspectionItem;
  }

  const { data, error } = await execQuery<DVIInspectionItem>(
    itemsQuery(db)
      .update(updates)
      .eq("id", itemId)
      .eq("inspection_id", inspectionId)
      .select("*")
      .single(),
  );

  if (error) {
    reportServerError("updateInspectionItem", error);
    throw error;
  }

  return data;
}

/**
 * Remove an item from a DVI inspection.
 */
export async function removeInspectionItem(
  db: SupabaseClient<Database>,
  inspectionId: string,
  itemId: string,
  orgId: string,
): Promise<void> {
  // Verify inspection exists
  const existing = await execQuery<DVIInspection>(
    inspectionsQuery(db)
      .select("id")
      .eq("id", inspectionId)
      .eq("organization_id", orgId)
      .single(),
  );

  if (existing.error || !existing.data) {
    throw new NotFoundError(`DV Inspection not found: ${inspectionId}`);
  }

  const q = itemsQuery(db).delete().eq("id", itemId).eq("inspection_id", inspectionId);
  const { error } = await execQuery(q);

  if (error) {
    reportServerError("removeInspectionItem", error);
    throw error;
  }
}

/**
 * Send a DVI inspection to the customer.
 * Generates a unique token, stores its hash, and returns the token.
 */
export async function sendInspectionToCustomer(
  db: SupabaseClient<Database>,
  inspectionId: string,
  orgId: string,
  _userId: string,
  _customerPhone: string,
): Promise<{ token: string }> {
  // Verify inspection exists
  const existing = await execQuery<DVIInspection>(
    inspectionsQuery(db)
      .select("id")
      .eq("id", inspectionId)
      .eq("organization_id", orgId)
      .single(),
  );

  if (existing.error || !existing.data) {
    throw new NotFoundError(`DV Inspection not found: ${inspectionId}`);
  }

  const token = crypto.randomBytes(32).toString("hex");
  const hash = crypto.createHash("sha256").update(token).digest("hex");

  const q = inspectionsQuery(db)
    .update({
      customer_token_hash: hash,
      status: "sent",
    })
    .eq("id", inspectionId)
    .eq("organization_id", orgId);
  const { error } = await execQuery(q);

  if (error) {
    reportServerError("sendInspectionToCustomer", error);
    throw error;
  }

  revalidateTag(cacheTags.workOrders(orgId), "max");

  return { token };
}

/**
 * Submit customer approval for DVI inspection items.
 * Uses the customer token to find the inspection.
 */
export async function submitCustomerApproval(
  db: SupabaseClient<Database>,
  token: string,
  params: CustomerApprovalParams,
): Promise<{
  status: DVInspectionStatus;
  approved_count: number;
  declined_count: number;
}> {
  const hash = crypto.createHash("sha256").update(token).digest("hex");

  // Find the inspection by token hash
  const { data: inspection, error: inspError } = await execQuery<
    DVIInspection
  >(
    inspectionsQuery(db)
      .select("id")
      .eq("customer_token_hash", hash)
      .single(),
  );

  if (inspError || !inspection) {
    throw new NotFoundError("DV Inspection not found for this token");
  }

  // Update the specified items
  const q = itemsQuery(db)
    .update({ customer_approved: params.approved })
    .eq("inspection_id", inspection.id)
    .in("id", params.item_ids);
  const { error: updateError } = await execQuery(q);

  if (updateError) {
    reportServerError("submitCustomerApproval:items", updateError);
    throw updateError;
  }

  // Count item approvals to determine overall status
  const { data: items, error: countError } = await execQuery<
    { customer_approved: boolean | null }[]
  >(itemsQuery(db).select("customer_approved").eq("inspection_id", inspection.id));

  if (countError) {
    reportServerError("submitCustomerApproval:count", countError);
    throw countError;
  }

  const allItems = items ?? [];
  const approvedCount = allItems.filter(
    (i) => i.customer_approved === true,
  ).length;
  const declinedCount = allItems.filter(
    (i) => i.customer_approved === false,
  ).length;
  const unsetCount = allItems.filter(
    (i) => i.customer_approved === null,
  ).length;

  let status: DVInspectionStatus;
  if (approvedCount > 0 && declinedCount === 0 && unsetCount === 0) {
    status = "approved";
  } else if (declinedCount > 0 && approvedCount === 0 && unsetCount === 0) {
    status = "declined";
  } else {
    status = "partially_approved";
  }

  // Update inspection status
  await execQuery(
    inspectionsQuery(db).update({ status }).eq("id", inspection.id),
  );

  return {
    status,
    approved_count: approvedCount,
    declined_count: declinedCount,
  };
}

/**
 * Convert an approved DVI inspection to a work order.
 * Creates a minimal work order and links the inspection to it.
 */
export async function convertInspectionToWorkOrder(
  db: SupabaseClient<Database>,
  inspectionId: string,
  orgId: string,
  userId: string,
): Promise<{ work_order_id: string }> {
  // Fetch the inspection
  const { data: inspection, error: inspError } = await execQuery<DVIInspection>(
    inspectionsQuery(db)
      .select("id, organization_id, vehicle_id")
      .eq("id", inspectionId)
      .eq("organization_id", orgId)
      .single(),
  );

  if (inspError || !inspection) {
    throw new NotFoundError(`DV Inspection not found: ${inspectionId}`);
  }

  // Create a minimal work order
  const { data: wo, error: woError } = await db
    .from("work_orders")
    .insert({
      organization_id: inspection.organization_id,
      vehicle_id: inspection.vehicle_id,
      status: "New",
      created_by: userId,
      updated_by: userId,
    })
    .select("id")
    .single();

  if (woError || !wo) {
    reportServerError("convertInspectionToWorkOrder:create", woError);
    throw new Error(woError?.message ?? "Failed to create work order");
  }

  const woRow = wo as unknown as { id: string };
  const workOrderId = woRow.id;

  // Update the inspection with the work order reference and status
  await execQuery(
    inspectionsQuery(db)
      .update({
        work_order_id: workOrderId,
        status: "converted",
      })
      .eq("id", inspectionId),
  );

  // Audit log
  logAuditAfter({
    supabase: db,
    action: "update",
    table_name: INSPECTIONS_TABLE,
    record_id: inspectionId,
    user_id: userId,
    organization_id: orgId,
    new_data: {
      work_order_id: workOrderId,
      status: "converted",
    },
  });

  revalidateTag(cacheTags.workOrders(orgId), "max");

  return { work_order_id: workOrderId };
}
