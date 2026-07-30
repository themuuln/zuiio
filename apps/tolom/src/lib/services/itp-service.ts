import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidateTag } from "next/cache";
import { logAuditAfter } from "@/lib/audit";
import { cacheTags } from "@/lib/cache/keys";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { reportServerError } from "@/lib/sentry-report-server";
import type { Database, VehicleItpHistory, VehicleWithItp } from "@/lib/types";
import { buildUpdates, type FieldMap } from "./build-updates";

// ── Types ────────────────────────────────────────────────────

export interface ItpRecordInput {
  itp_expiry_date?: string | null;
  itp_last_passed_date?: string | null;
  itp_notes?: string | null;
}

export interface ItpRecordResult extends ItpRecordInput {
  vehicle_id: string;
  plate_number: string;
  make: string;
  model: string;
  year: number | null;
  customer_name: string | null;
  customer_phone: string | null;
  days_until_expiry: number | null;
  itp_status: "valid" | "expiring_soon" | "expired" | "unknown";
}

export interface ItpInspectionParams {
  vehicle_id: string;
  itp_expiry_date: string;
  itp_last_passed_date: string;
  itp_notes?: string | null;
  branch_id?: string | null;
}

export interface ItpStats {
  total: number;
  valid: number;
  expiring_soon: number;
  expired: number;
  unknown: number;
}

// ── Constants ─────────────────────────────────────────────────

const EXPIRING_SOON_DAYS = 30; // Warn when ITP expires within 30 days

// ── Field Map for Updates ─────────────────────────────────────

type ItpUpdateParams = {
  itp_expiry_date?: string | null;
  itp_last_passed_date?: string | null;
  itp_reminder_sent_at?: string | null;
  itp_notes?: string | null;
};

const itpFieldMap: FieldMap<ItpUpdateParams> = {
  columns: {
    itp_expiry_date: "itp_expiry_date",
    itp_last_passed_date: "itp_last_passed_date",
    itp_reminder_sent_at: "itp_reminder_sent_at",
    itp_notes: "itp_notes",
  },
  transforms: {
    itp_notes: (v: unknown) => {
      if (v == null) return null;
      const trimmed = String(v).trim();
      return trimmed || null;
    },
  },
};

// ── Types for Supabase Query Results ────────────────────────

/**
 * Shape returned by our enriched vehicle queries.
 * ITP fields are not in auto-generated types (migration not yet pushed),
 * so we define them here and cast results.
 */
type VehicleWithCustomerRow = Pick<
  VehicleWithItp,
  | "id"
  | "plate_number"
  | "make"
  | "model"
  | "year"
  | "itp_expiry_date"
  | "itp_last_passed_date"
  | "itp_notes"
  | "itp_reminder_sent_at"
> & {
  customer?: {
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
  } | null;
};

type VehicleItpRow = Pick<
  VehicleWithItp,
  | "itp_expiry_date"
  | "itp_last_passed_date"
  | "itp_notes"
  | "itp_reminder_sent_at"
>;

/**
 * Cast enriched vehicle query results to the expected type.
 * Required because ITP fields aren't in auto-generated Supabase types yet.
 */
function _castVehicleRows(raw: unknown): VehicleWithCustomerRow[] {
  return (raw ?? []) as VehicleWithCustomerRow[];
}

function _castVehicleRow(raw: unknown): VehicleWithCustomerRow | null {
  return (raw ?? null) as VehicleWithCustomerRow | null;
}

function _castVehicleItpRow(raw: unknown): VehicleItpRow | null {
  return (raw ?? null) as VehicleItpRow | null;
}

// ── Helpers ───────────────────────────────────────────────────

function computeItpStatus(
  itpExpiryDate: string | null,
): ItpRecordResult["itp_status"] {
  if (!itpExpiryDate) return "unknown";

  const expiry = new Date(itpExpiryDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "expired";
  if (diffDays <= EXPIRING_SOON_DAYS) return "expiring_soon";
  return "valid";
}

function computeDaysUntilExpiry(itpExpiryDate: string | null): number | null {
  if (!itpExpiryDate) return null;

  const expiry = new Date(itpExpiryDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffTime = expiry.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function enrichVehicleWithItp(
  vehicle: VehicleWithCustomerRow,
): ItpRecordResult {
  return {
    vehicle_id: vehicle.id,
    plate_number: vehicle.plate_number,
    make: vehicle.make,
    model: vehicle.model,
    year: vehicle.year,
    itp_expiry_date: vehicle.itp_expiry_date,
    itp_last_passed_date: vehicle.itp_last_passed_date,
    itp_notes: vehicle.itp_notes,
    customer_name: vehicle.customer
      ? [vehicle.customer.first_name, vehicle.customer.last_name]
          .filter(Boolean)
          .join(" ") || null
      : null,
    customer_phone: vehicle.customer?.phone ?? null,
    days_until_expiry: computeDaysUntilExpiry(vehicle.itp_expiry_date),
    itp_status: computeItpStatus(vehicle.itp_expiry_date),
  };
}

// ── Main Service Functions ────────────────────────────────────

/**
 * Get all vehicles with ITP data for an organization.
 * Includes computed status (valid/expiring_soon/expired/unknown).
 */
export async function getItpRecords(
  db: SupabaseClient<Database>,
  orgId: string,
  options?: {
    status?: ItpRecordResult["itp_status"];
    branchId?: string | null;
    search?: string;
    limit?: number;
    offset?: number;
  },
): Promise<{ data: ItpRecordResult[]; total: number }> {
  let query = db
    .from("vehicles")
    .select(
      `
      id,
      plate_number,
      make,
      model,
      year,
      itp_expiry_date,
      itp_last_passed_date,
      itp_notes,
      customer:customers(id, first_name, last_name, phone)
    `,
      { count: "exact" },
    )
    .eq("organization_id", orgId)
    .is("deleted_at", null);

  // Branch filter
  if (options?.branchId) {
    query = query.eq("branch_id", options.branchId);
  }

  // Search by plate number or customer name
  if (options?.search) {
    const term = `%${options.search}%`;
    query = query.or(
      `plate_number.ilike.${term},customer.first_name.ilike.${term},customer.last_name.ilike.${term}`,
    );
  }

  // Status filter (computed — we filter in-memory after fetching)
  // For status filtering, we fetch all and filter post-query since
  // itp_status is a computed field. We limit to a reasonable batch.
  const effectiveLimit = options?.limit ?? 50;
  const effectiveOffset = options?.offset ?? 0;

  query = query
    .order("itp_expiry_date", { ascending: true, nullsFirst: false })
    .range(effectiveOffset, effectiveOffset + effectiveLimit - 1);

  const { data, error, count } = await query;

  if (error) {
    reportServerError("getItpRecords", error);
    throw error;
  }

  // Cast: ITP columns exist in DB but not in generated Supabase types
  const rows = data as unknown as VehicleWithCustomerRow[];
  let records = rows.map(enrichVehicleWithItp);

  // Filter by computed status if specified
  if (options?.status) {
    records = records.filter((r) => r.itp_status === options.status);
  }

  return {
    data: records,
    total: count ?? records.length,
  };
}

/**
 * Get ITP records that are expiring soon (within EXPIRING_SOON_DAYS).
 * Used for the dashboard notification widget and reminder cron.
 */
export async function getExpiringItpRecords(
  db: SupabaseClient<Database>,
  orgId: string,
  branchId?: string | null,
): Promise<ItpRecordResult[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const futureDate = new Date(today);
  futureDate.setDate(futureDate.getDate() + EXPIRING_SOON_DAYS);

  const _todayStr = today.toISOString().split("T")[0];
  const futureStr = futureDate.toISOString().split("T")[0];

  let query = db
    .from("vehicles")
    .select(
      `
      id,
      plate_number,
      make,
      model,
      year,
      itp_expiry_date,
      itp_last_passed_date,
      itp_notes,
      customer:customers(id, first_name, last_name, phone)
    `,
    )
    .eq("organization_id", orgId)
    .is("deleted_at", null)
    .not("itp_expiry_date", "is", null)
    .lte("itp_expiry_date", futureStr)
    .order("itp_expiry_date", { ascending: true });

  if (branchId) {
    query = query.eq("branch_id", branchId);
  }

  const { data, error } = await query;

  if (error) {
    reportServerError("getExpiringItpRecords", error);
    throw error;
  }

  // Cast: ITP columns exist in DB but not in generated Supabase types
  const rows = data as unknown as VehicleWithCustomerRow[];
  return rows.map(enrichVehicleWithItp);
}

/**
 * Get a single vehicle's ITP record.
 */
export async function getItpRecord(
  db: SupabaseClient<Database>,
  vehicleId: string,
  orgId: string,
): Promise<ItpRecordResult> {
  const { data, error } = await db
    .from("vehicles")
    .select(
      `
      id,
      plate_number,
      make,
      model,
      year,
      itp_expiry_date,
      itp_last_passed_date,
      itp_notes,
      customer:customers(id, first_name, last_name, phone)
    `,
    )
    .eq("id", vehicleId)
    .eq("organization_id", orgId)
    .is("deleted_at", null)
    .single();

  if (error || !data) {
    throw new NotFoundError(`Vehicle not found: ${vehicleId}`);
  }

  // Cast: ITP columns exist in DB but not in generated Supabase types
  return enrichVehicleWithItp(data as unknown as VehicleWithCustomerRow);
}

/**
 * Record an ITP inspection pass.
 * Updates the vehicle's ITP fields and creates a history entry.
 */
export async function recordItpInspection(
  db: SupabaseClient<Database>,
  orgId: string,
  userId: string,
  params: ItpInspectionParams,
): Promise<ItpRecordResult> {
  const {
    vehicle_id,
    itp_expiry_date,
    itp_last_passed_date,
    itp_notes,
    branch_id,
  } = params;

  // Validation
  if (!vehicle_id?.trim()) {
    throw new ValidationError("Vehicle ID is required");
  }

  const expiryDate = new Date(itp_expiry_date);
  if (Number.isNaN(expiryDate.getTime())) {
    throw new ValidationError("Valid ITP expiry date is required");
  }

  const passedDate = new Date(itp_last_passed_date);
  if (Number.isNaN(passedDate.getTime())) {
    throw new ValidationError("Valid ITP last passed date is required");
  }

  if (expiryDate <= passedDate) {
    throw new ValidationError("ITP expiry date must be after the passed date");
  }

  // Get the previous state for the audit log
  const { data: prevVehicle } = (await db
    .from("vehicles")
    .select("itp_expiry_date, itp_last_passed_date, itp_notes")
    .eq("id", vehicle_id)
    .eq("organization_id", orgId)
    .single()) as unknown as { data: VehicleItpRow | null; error: unknown };

  const prevData = prevVehicle;

  // Update the vehicle
  const updates: ItpUpdateParams = {
    itp_expiry_date,
    itp_last_passed_date,
    itp_reminder_sent_at: null, // Reset reminder flag — new inspection cycle
    itp_notes: itp_notes?.trim() ?? null,
  };

  const { error: updateError } = await db
    .from("vehicles")
    .update(updates)
    .eq("id", vehicle_id)
    .eq("organization_id", orgId);

  if (updateError) {
    reportServerError("recordItpInspection", updateError);
    throw updateError;
  }

  // Create history entry
  const itpHistoryQuery = db.from("vehicle_itp_history");
  const itpHistoryInsert = itpHistoryQuery as unknown as {
    insert: (row: Record<string, unknown>) => Promise<{ error: unknown }>;
  };
  const { error: historyError } = await itpHistoryInsert.insert({
    organization_id: orgId,
    vehicle_id,
    branch_id: branch_id ?? null,
    user_id: userId,
    previous_expiry_date: prevData?.itp_expiry_date ?? null,
    new_expiry_date: itp_expiry_date,
    previous_status: prevData?.itp_expiry_date
      ? computeItpStatus(prevData.itp_expiry_date)
      : null,
    new_status: "valid",
    notes: itp_notes?.trim() ?? null,
    action_type: "record_inspection",
  });

  if (historyError) {
    reportServerError("recordItpInspection:history", historyError);
    // Non-fatal — don't throw, just log
  }

  // Audit log
  logAuditAfter({
    supabase: db,
    action: "update",
    table_name: "vehicles",
    record_id: vehicle_id,
    user_id: userId,
    organization_id: orgId,
    branch_id: branch_id ?? undefined,
    old_data: prevData ?? undefined,
    new_data: updates,
  });

  // Invalidate cache
  revalidateTag(cacheTags.vehicles(orgId), "max");

  // Return the updated record
  return getItpRecord(db, vehicle_id, orgId);
}

/**
 * Update ITP fields on a vehicle (without recording an inspection event).
 * Used for manual corrections or admin edits.
 */
export async function updateItpRecord(
  db: SupabaseClient<Database>,
  vehicleId: string,
  orgId: string,
  userId: string,
  params: ItpRecordInput,
): Promise<ItpRecordResult> {
  const oldData = (await db
    .from("vehicles")
    .select(
      "itp_expiry_date, itp_last_passed_date, itp_notes, itp_reminder_sent_at",
    )
    .eq("id", vehicleId)
    .eq("organization_id", orgId)
    .single()
    .then((r) => r.data)) as unknown as {
    itp_expiry_date: string | null;
    itp_last_passed_date: string | null;
    itp_notes: string | null;
    itp_reminder_sent_at: string | null;
  } | null;

  if (!oldData) {
    throw new NotFoundError(`Vehicle not found: ${vehicleId}`);
  }

  const updates = buildUpdates(params, itpFieldMap);

  if (Object.keys(updates).length === 0) {
    return getItpRecord(db, vehicleId, orgId);
  }

  const { error } = await db
    .from("vehicles")
    // @ts-expect-error — buildUpdates returns Record<string, unknown> not assignable to vehicle type
    .update(updates)
    .eq("id", vehicleId)
    .eq("organization_id", orgId);

  if (error) {
    reportServerError("updateItpRecord", error);
    throw error;
  }

  // Log history entry for system update
  if (params.itp_expiry_date !== undefined) {
    const itpInsertBuilder = db.from("vehicle_itp_history") as unknown as {
      insert: (row: Record<string, unknown>) => Promise<{ error: unknown }>;
    };
    await itpInsertBuilder.insert({
      organization_id: orgId,
      vehicle_id: vehicleId,
      user_id: userId,
      previous_expiry_date: oldData.itp_expiry_date,
      new_expiry_date: params.itp_expiry_date ?? null,
      action_type: "update_expiry",
      notes: params.itp_notes?.trim() ?? null,
    });
  }

  logAuditAfter({
    supabase: db,
    action: "update",
    table_name: "vehicles",
    record_id: vehicleId,
    user_id: userId,
    organization_id: orgId,
    old_data: oldData ?? undefined,
    new_data: updates,
  });

  revalidateTag(cacheTags.vehicles(orgId), "max");

  return getItpRecord(db, vehicleId, orgId);
}

/**
 * Send ITP reminder for a vehicle. Marks reminder_sent_at to avoid duplicates.
 */
export async function sendItpReminder(
  db: SupabaseClient<Database>,
  vehicleId: string,
  orgId: string,
  userId: string,
): Promise<void> {
  const now = new Date().toISOString();

  const { error } = await db
    .from("vehicles")
    .update({ itp_reminder_sent_at: now })
    .eq("id", vehicleId)
    .eq("organization_id", orgId);

  if (error) {
    reportServerError("sendItpReminder", error);
    throw error;
  }

  // Record in history
  const sendReminderBuilder = db.from("vehicle_itp_history") as unknown as {
    insert: (row: Record<string, unknown>) => Promise<{ error: unknown }>;
  };
  await sendReminderBuilder.insert({
    organization_id: orgId,
    vehicle_id: vehicleId,
    user_id: userId,
    action_type: "reminder_sent",
    notes: `ITP reminder sent at ${now}`,
  });

  logAuditAfter({
    supabase: db,
    action: "update",
    table_name: "vehicles",
    record_id: vehicleId,
    user_id: userId,
    organization_id: orgId,
  });

  revalidateTag(cacheTags.vehicles(orgId), "max");
}

/**
 * Get ITP statistics for an organization dashboard widget.
 */
export async function getItpStats(
  db: SupabaseClient<Database>,
  orgId: string,
  branchId?: string | null,
): Promise<ItpStats> {
  let query = db
    .from("vehicles")
    .select("itp_expiry_date")
    .eq("organization_id", orgId)
    .is("deleted_at", null);

  if (branchId) {
    query = query.eq("branch_id", branchId);
  }

  const { data, error } = await query;

  if (error) {
    reportServerError("getItpStats", error);
    throw error;
  }

  // Cast: itp_expiry_date column exists in DB but not in generated types
  const rows = (data ?? []) as unknown as { itp_expiry_date: string | null }[];

  const stats: ItpStats = {
    total: rows.length,
    valid: 0,
    expiring_soon: 0,
    expired: 0,
    unknown: 0,
  };

  for (const vehicle of rows) {
    const status = computeItpStatus(vehicle.itp_expiry_date);
    stats[status]++;
  }

  return stats;
}

/**
 * Get ITP history for a specific vehicle.
 */
export async function getItpHistory(
  db: SupabaseClient<Database>,
  vehicleId: string,
  orgId: string,
  limit = 20,
): Promise<VehicleItpHistory[]> {
  const itpHistoryBuilder = db.from("vehicle_itp_history") as unknown as {
    select: (cols: string) => {
      eq: (
        col: string,
        val: string,
      ) => {
        eq: (
          col: string,
          val: string,
        ) => {
          order: (
            col: string,
            opts: { ascending: boolean },
          ) => {
            limit: (
              n: number,
            ) => Promise<{ data: VehicleItpHistory[] | null; error: unknown }>;
          };
        };
      };
    };
  };
  const { data, error } = await itpHistoryBuilder
    .select("*")
    .eq("vehicle_id", vehicleId)
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    reportServerError("getItpHistory", error);
    throw error;
  }

  return data ?? [];
}

/**
 * Check for vehicles whose ITP is expiring soon and that haven't
 * received a reminder yet. Returns them grouped by org for batch
 * reminder processing.
 */
export async function getVehiclesNeedingReminder(
  db: SupabaseClient<Database>,
  orgId: string,
): Promise<ItpRecordResult[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const futureDate = new Date(today);
  futureDate.setDate(futureDate.getDate() + EXPIRING_SOON_DAYS);

  const _todayStr = today.toISOString().split("T")[0];
  const futureStr = futureDate.toISOString().split("T")[0];

  // Only vehicles where:
  // 1. ITP is expiring within EXPIRING_SOON_DAYS
  // 2. No reminder has been sent yet (or last reminder was before the current expiry was set)
  // 3. Not already expired for too long (expired > 90 days)
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 90);
  const minDateStr = thirtyDaysAgo.toISOString().split("T")[0];

  const { data, error } = await db
    .from("vehicles")
    .select(
      `
      id,
      plate_number,
      make,
      model,
      year,
      itp_expiry_date,
      itp_last_passed_date,
      itp_notes,
      itp_reminder_sent_at,
      customer:customers(id, first_name, last_name, phone)
    `,
    )
    .eq("organization_id", orgId)
    .is("deleted_at", null)
    .not("itp_expiry_date" as "plate_number", "is", null)
    .gte("itp_expiry_date" as "plate_number", minDateStr)
    .lte("itp_expiry_date" as "plate_number", futureStr)
    .order("itp_expiry_date" as "plate_number", { ascending: true });

  if (error) {
    reportServerError("getVehiclesNeedingReminder", error);
    throw error;
  }

  const rows = data as unknown as (VehicleWithCustomerRow & {
    itp_reminder_sent_at: string | null;
  })[];
  const records = rows.map(enrichVehicleWithItp);

  // Filter to only those that haven't had a reminder sent for this expiry cycle
  return records.filter((r) => {
    if (!r.itp_expiry_date) return false;

    // If no reminder has ever been sent, include it
    const vehicle = rows.find((v) => v.id === r.vehicle_id);
    if (!vehicle?.itp_reminder_sent_at) return true;

    // If reminder was sent before the last expiry date change, re-send
    const reminderDate = new Date(vehicle.itp_reminder_sent_at);
    const _expiryDate = new Date(r.itp_expiry_date);

    // Only re-send if the expiry was updated after the last reminder
    // (meaning the reminder was for a different cycle)
    if (r.itp_last_passed_date) {
      const lastPassedDate = new Date(r.itp_last_passed_date);
      return reminderDate < lastPassedDate;
    }

    return false;
  });
}
