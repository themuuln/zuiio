/**
 * Payroll service — pay rate management and monthly payroll calculation.
 *
 * Built on top of mechanic_time_logs and mechanic_daily_reports.
 * Monthly calculation is idempotent — re-running recalculates.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidateTag } from "next/cache";
import { logAuditAfter } from "@/lib/audit";
import { cacheTags } from "@/lib/cache/keys";
import { withDbCapture } from "@/lib/supabase/query";

// ── Types ──────────────────────────────────────────

export interface PayRate {
  id: string;
  organization_id: string;
  mechanic_id: string;
  hourly_rate: number;
  effective_from: string;
  effective_to: string | null;
  mechanic_name?: string | null;
}

export interface PayrollRecord {
  id: string;
  organization_id: string;
  mechanic_id: string;
  period_start: string;
  period_end: string;
  total_hours: number;
  hourly_rate: number;
  gross_pay: number;
  status: "draft" | "approved" | "paid";
  paid_at: string | null;
  notes: string | null;
  mechanic_name?: string | null;
  /** НДШ (Mongolian social insurance) — computed on read from org settings. */
  ndsh_enabled: boolean;
  ndsh_employer_rate: number;
  ndsh_employee_rate: number;
  ndsh_employer_amount: number;
  ndsh_employee_amount: number;
}

// ── Pay Rate Management ────────────────────────────

/**
 * Get the current effective pay rate for a mechanic.
 */
export async function getPayRate(
  db: SupabaseClient,
  orgId: string,
  mechanicId: string,
): Promise<PayRate | null> {
  const supabase = db;

  const { data, error } = await withDbCapture(
    "getPayRate",
    supabase
      .from("mechanic_pay_rates")
      .select(
        "id, organization_id, mechanic_id, hourly_rate, effective_from, effective_to",
      )
      .eq("organization_id", orgId)
      .eq("mechanic_id", mechanicId)
      .is("effective_to", null)
      .maybeSingle(),
  );
  if (error) return null;

  return data as PayRate | null;
}

/**
 * Set (or update) a mechanic's hourly pay rate.
 * Ends the previous rate and inserts a new one.
 */
export async function upsertPayRate(
  db: SupabaseClient,
  orgId: string,
  mechanicId: string,
  hourlyRate: number,
  effectiveFrom: string,
): Promise<PayRate> {
  const supabase = db;

  // End the previous active rate the day before the new effective date
  const prevDate = new Date(effectiveFrom);
  prevDate.setDate(prevDate.getDate() - 1);
  const prevDateStr = prevDate.toISOString().split("T")[0];

  await supabase
    .from("mechanic_pay_rates")
    .update({ effective_to: prevDateStr })
    .eq("organization_id", orgId)
    .eq("mechanic_id", mechanicId)
    .is("effective_to", null);

  const { data, error } = await supabase
    .from("mechanic_pay_rates")
    .insert({
      organization_id: orgId,
      mechanic_id: mechanicId,
      hourly_rate: hourlyRate,
      effective_from: effectiveFrom,
    })
    .select()
    .single();

  if (error) throw error;

  logAuditAfter({
    supabase,
    action: "create",
    table_name: "mechanic_pay_rates",
    record_id: data.id,
    organization_id: orgId,
    new_data: data as unknown as Record<string, unknown>,
  });

  revalidateTag(cacheTags.reports(orgId), "default");
  return data as PayRate;
}

/**
 * List all mechanics with their current pay rate.
 * Optionally filtered by branch (via profile branch assignment).
 * Joins with profiles for mechanic names.
 */
export async function listPayRates(
  db: SupabaseClient,
  orgId: string,
  branchId?: string | null,
): Promise<PayRate[]> {
  const supabase = db;

  if (branchId) {
    // Get branch mechanics with names in one query, then filter pay rates
    const { data: branchProfiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("organization_id", orgId)
      .eq("branch_id", branchId);
    const mechanicIds = (branchProfiles ?? []).map((p) => p.id);
    if (mechanicIds.length === 0) return [];

    const nameMap = new Map(
      (branchProfiles ?? []).map((p) => [p.id, p.full_name]),
    );

    const { data, error } = await supabase
      .from("mechanic_pay_rates")
      .select(
        "id, organization_id, mechanic_id, hourly_rate, effective_from, effective_to",
      )
      .eq("organization_id", orgId)
      .is("effective_to", null)
      .in("mechanic_id", mechanicIds);

    if (error) throw error;

    return ((data ?? []) as PayRate[]).map((r) => ({
      ...r,
      mechanic_name: nameMap.get(r.mechanic_id) ?? null,
    })) as PayRate[];
  }

  // No branch filter — use a join to fetch profile names in one query
  const { data, error } = await supabase
    .from("mechanic_pay_rates")
    .select(
      "id, organization_id, mechanic_id, hourly_rate, effective_from, effective_to, profiles(full_name)",
    )
    .eq("organization_id", orgId)
    .is("effective_to", null);

  if (error) throw error;

  return ((data ?? []) as Array<Record<string, unknown>>).map((r) => {
    const profile = r.profiles as { full_name?: string } | null;
    const { profiles: _p, ...rest } = r;
    return { ...rest, mechanic_name: profile?.full_name ?? null } as PayRate;
  });
}

// ── НДШ Settings ────────────────────────────────────

export const DEFAULT_NDSH_EMPLOYER_RATE = 11.5;
export const DEFAULT_NDSH_EMPLOYEE_RATE = 10;

interface NdshSettings {
  enabled: boolean;
  employerRate: number;
  employeeRate: number;
}

/**
 * Fetch НДШ (Mongolian social insurance) settings for an organization.
 * Returns defaults when the settings row is missing.
 */
async function getOrgNdshSettings(
  db: SupabaseClient,
  orgId: string,
): Promise<NdshSettings> {
  const { data, error } = await withDbCapture(
    "getOrgNdshSettings",
    db
      .from("organization_settings")
      .select("ndsh_enabled, ndsh_employer_rate, ndsh_employee_rate")
      .eq("organization_id", orgId)
      .maybeSingle(),
  );
  if (error || !data) {
    return {
      enabled: false,
      employerRate: DEFAULT_NDSH_EMPLOYER_RATE,
      employeeRate: DEFAULT_NDSH_EMPLOYEE_RATE,
    };
  }
  return {
    enabled: data.ndsh_enabled ?? false,
    employerRate: Number(data.ndsh_employer_rate ?? DEFAULT_NDSH_EMPLOYER_RATE),
    employeeRate: Number(data.ndsh_employee_rate ?? DEFAULT_NDSH_EMPLOYEE_RATE),
  };
}

/**
 * Compute the НДШ fields for a payroll record from gross pay and org settings.
 * Amounts are rounded to the nearest whole MNT; both are 0 when disabled.
 */
function withNdsh(
  grossPay: number,
  settings: NdshSettings,
): Pick<
  PayrollRecord,
  | "ndsh_enabled"
  | "ndsh_employer_rate"
  | "ndsh_employee_rate"
  | "ndsh_employer_amount"
  | "ndsh_employee_amount"
> {
  return {
    ndsh_enabled: settings.enabled,
    ndsh_employer_rate: settings.employerRate,
    ndsh_employee_rate: settings.employeeRate,
    ndsh_employer_amount: settings.enabled
      ? Math.round((grossPay * settings.employerRate) / 100)
      : 0,
    ndsh_employee_amount: settings.enabled
      ? Math.round((grossPay * settings.employeeRate) / 100)
      : 0,
  };
}

// ── Payroll Calculation ────────────────────────────

/**
 * Calculate monthly payroll for all mechanics.
 *
 * Idempotent — re-running recalculates and upserts existing records.
 * Optionally filtered by branch (via profile branch assignment).
 * Returns the created/updated payroll records.
 */
export async function calculateMonthlyPayroll(
  db: SupabaseClient,
  orgId: string,
  year: number,
  month: number,
  branchId?: string | null,
): Promise<PayrollRecord[]> {
  const supabase = db;

  const periodStart = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const periodEnd = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  // If branch is specified, get mechanic IDs in that branch first
  let branchMechanicIds: string[] | undefined;
  if (branchId) {
    const { data: branchMechanics } = await supabase
      .from("profiles")
      .select("id")
      .eq("organization_id", orgId)
      .eq("branch_id", branchId);
    branchMechanicIds = (branchMechanics ?? []).map((p) => p.id);
    if (branchMechanicIds.length === 0) return [];
  }

  // Get all mechanics with hours worked in this period
  let hoursQuery = supabase
    .from("mechanic_daily_reports")
    .select("mechanic_id, hours_worked")
    .eq("organization_id", orgId)
    .gte("report_date", periodStart)
    .lte("report_date", periodEnd);

  if (branchMechanicIds) {
    hoursQuery = hoursQuery.in("mechanic_id", branchMechanicIds);
  }

  const { data: hoursData } = await hoursQuery;

  if (!hoursData || hoursData.length === 0) return [];

  // Read НДШ settings once for the whole run
  const ndshSettings = await getOrgNdshSettings(supabase, orgId);

  // Aggregate hours per mechanic
  const hoursMap = new Map<string, number>();
  for (const row of hoursData) {
    const current = hoursMap.get(row.mechanic_id) ?? 0;
    hoursMap.set(row.mechanic_id, current + Number(row.hours_worked ?? 0));
  }

  // Get names and rates for all mechanics with hours
  const mechanicIds = [...hoursMap.keys()];

  const { data: profilesData } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", mechanicIds);

  const nameMap = new Map<string, string>();
  for (const p of profilesData ?? []) {
    nameMap.set(p.id, p.full_name ?? "Unknown");
  }

  // Batch-fetch pay rates for all mechanics (1 query instead of N)
  const { data: ratesData } = await supabase
    .from("mechanic_pay_rates")
    .select("mechanic_id, hourly_rate, effective_from")
    .eq("organization_id", orgId)
    .in("mechanic_id", mechanicIds)
    .lte("effective_from", periodEnd)
    .or(`effective_to.gte.${periodStart},effective_to.is.null`)
    .order("effective_from", { ascending: false });

  // Pick the latest rate per mechanic (first seen = most recent due to ordering)
  const rateMap = new Map<string, number>();
  for (const r of ratesData ?? []) {
    if (!rateMap.has(r.mechanic_id)) {
      rateMap.set(r.mechanic_id, Number(r.hourly_rate));
    }
  }

  // Batch-fetch existing payroll records (1 query instead of N)
  const { data: existingRecords } = await supabase
    .from("payroll_records")
    .select("id, mechanic_id, status, paid_at")
    .eq("organization_id", orgId)
    .in("mechanic_id", mechanicIds)
    .eq("period_start", periodStart);

  const existingMap = new Map<
    string,
    { id: string; status: string; paid_at: string | null }
  >();
  for (const rec of existingRecords ?? []) {
    existingMap.set(rec.mechanic_id, rec);
  }

  // Build records — per-mechanic upserts still need individual writes
  const records: PayrollRecord[] = [];
  for (const mechanicId of mechanicIds) {
    const totalHours = hoursMap.get(mechanicId) ?? 0;
    const hourlyRate = rateMap.get(mechanicId) ?? 0;
    const grossPay = Math.round(totalHours * hourlyRate * 100) / 100;
    const existing = existingMap.get(mechanicId);

    let record: PayrollRecord | null;
    if (existing) {
      const { data: updated } = await supabase
        .from("payroll_records")
        .update({
          period_end: periodEnd,
          total_hours: totalHours,
          hourly_rate: hourlyRate,
          gross_pay: grossPay,
        })
        .eq("id", existing.id)
        .select()
        .single();
      record = updated;
    } else {
      const { data: inserted } = await supabase
        .from("payroll_records")
        .insert({
          organization_id: orgId,
          mechanic_id: mechanicId,
          period_start: periodStart,
          period_end: periodEnd,
          total_hours: totalHours,
          hourly_rate: hourlyRate,
          gross_pay: grossPay,
          status: "draft",
        })
        .select()
        .single();
      record = inserted;
    }

    if (record) {
      records.push({
        ...record,
        mechanic_name: nameMap.get(mechanicId) ?? null,
        ...withNdsh(grossPay, ndshSettings),
      } as PayrollRecord);
    }
  }

  revalidateTag(cacheTags.reports(orgId), "default");
  return records;
}

// ── Payroll Record Queries ─────────────────────────

/**
 * Get payroll records for a given period.
 * Optionally filtered by branch (via profile branch assignment).
 */
export async function getPayrollRecords(
  db: SupabaseClient,
  orgId: string,
  year: number,
  month: number,
  branchId?: string | null,
): Promise<PayrollRecord[]> {
  const supabase = db;

  const periodStart = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const periodEnd = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  // Read НДШ settings once — recomputed on read so historical records show НДШ too
  const ndshSettings = await getOrgNdshSettings(supabase, orgId);

  if (branchId) {
    // Get branch mechanics with names in one query, then filter records
    const { data: branchProfiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("organization_id", orgId)
      .eq("branch_id", branchId);
    const mechanicIds = (branchProfiles ?? []).map((p) => p.id);
    if (mechanicIds.length === 0) return [];

    const nameMap = new Map(
      (branchProfiles ?? []).map((p) => [p.id, p.full_name]),
    );

    const { data } = await supabase
      .from("payroll_records")
      .select(
        "id, organization_id, mechanic_id, period_start, period_end, total_hours, hourly_rate, gross_pay, status, paid_at, notes",
      )
      .eq("organization_id", orgId)
      .eq("period_start", periodStart)
      .eq("period_end", periodEnd)
      .in("mechanic_id", mechanicIds);

    return ((data ?? []) as PayrollRecord[]).map((r) => ({
      ...r,
      mechanic_name: nameMap.get(r.mechanic_id) ?? null,
      ...withNdsh(Number(r.gross_pay ?? 0), ndshSettings),
    })) as PayrollRecord[];
  }

  // No branch filter — use a join for profile names
  const { data } = await supabase
    .from("payroll_records")
    .select(
      "id, organization_id, mechanic_id, period_start, period_end, total_hours, hourly_rate, gross_pay, status, paid_at, notes, profiles(full_name)",
    )
    .eq("organization_id", orgId)
    .eq("period_start", periodStart)
    .eq("period_end", periodEnd);

  return ((data ?? []) as Array<Record<string, unknown>>).map((r) => {
    const profile = r.profiles as { full_name?: string } | null;
    const { profiles: _p, ...rest } = r;
    return {
      ...rest,
      mechanic_name: profile?.full_name ?? null,
      ...withNdsh(Number(rest.gross_pay ?? 0), ndshSettings),
    } as PayrollRecord;
  });
}

/**
 * Update a payroll record's status.
 */
export async function updatePayrollRecordStatus(
  db: SupabaseClient,
  orgId: string,
  recordId: string,
  status: "draft" | "approved" | "paid",
): Promise<PayrollRecord> {
  const supabase = db;

  const updateData: Record<string, string | null> = { status };
  if (status === "paid") {
    updateData.paid_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("payroll_records")
    .update(updateData)
    .eq("id", recordId)
    .eq("organization_id", orgId)
    .select()
    .single();

  if (error) throw error;

  revalidateTag(cacheTags.reports(orgId), "default");
  return data as PayrollRecord;
}
