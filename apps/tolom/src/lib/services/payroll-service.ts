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

  let query = supabase
    .from("mechanic_pay_rates")
    .select(
      "id, organization_id, mechanic_id, hourly_rate, effective_from, effective_to",
    )
    .eq("organization_id", orgId)
    .is("effective_to", null);

  if (branchId) {
    // Get mechanic IDs in the selected branch, then filter pay rates
    const { data: branchMechanics } = await supabase
      .from("profiles")
      .select("id")
      .eq("organization_id", orgId)
      .eq("branch_id", branchId);
    const mechanicIds = (branchMechanics ?? []).map((p) => p.id);
    if (mechanicIds.length === 0) return [];
    query = query.in("mechanic_id", mechanicIds);
  }

  const { data, error } = await query;

  if (error) throw error;

  const rates = (data ?? []) as PayRate[];

  // Enrich with mechanic names
  const mechanicIds = rates.map((r) => r.mechanic_id);
  if (mechanicIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", mechanicIds);
    const nameMap = new Map(profiles?.map((p) => [p.id, p.full_name]) ?? []);
    return rates.map((r) => ({
      ...r,
      mechanic_name: nameMap.get(r.mechanic_id) ?? null,
    })) as PayRate[];
  }

  return rates;
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

  const records: PayrollRecord[] = [];

  for (const mechanicId of mechanicIds) {
    const totalHours = hoursMap.get(mechanicId) ?? 0;

    // Get the effective hourly rate for this period
    const { data: rateData } = await supabase
      .from("mechanic_pay_rates")
      .select("hourly_rate")
      .eq("organization_id", orgId)
      .eq("mechanic_id", mechanicId)
      .lte("effective_from", periodEnd)
      .or(`effective_to.gte.${periodStart},effective_to.is.null`)
      .order("effective_from", { ascending: false })
      .limit(1)
      .maybeSingle();

    const hourlyRate = Number(rateData?.hourly_rate ?? 0);
    const grossPay = Math.round(totalHours * hourlyRate * 100) / 100;

    // Check if a record already exists (to preserve status/paid_at)
    const { data: existing } = await supabase
      .from("payroll_records")
      .select("id, status, paid_at")
      .eq("organization_id", orgId)
      .eq("mechanic_id", mechanicId)
      .eq("period_start", periodStart)
      .maybeSingle();

    let record: PayrollRecord | null;
    if (existing) {
      // Update computed fields only — preserve status and paid_at
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
      // Insert new record with draft status
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

  let query = supabase
    .from("payroll_records")
    .select(
      "id, organization_id, mechanic_id, period_start, period_end, total_hours, hourly_rate, gross_pay, status, paid_at, notes",
    )
    .eq("organization_id", orgId)
    .eq("period_start", periodStart)
    .eq("period_end", periodEnd);

  if (branchId) {
    // Get mechanic IDs in the selected branch, then filter records
    const { data: branchMechanics } = await supabase
      .from("profiles")
      .select("id")
      .eq("organization_id", orgId)
      .eq("branch_id", branchId);
    const mechanicIds = (branchMechanics ?? []).map((p) => p.id);
    if (mechanicIds.length === 0) return [];
    query = query.in("mechanic_id", mechanicIds);
  }

  const { data } = await query;

  const records = (data ?? []) as PayrollRecord[];

  // Enrich with mechanic names
  const mechanicIds = records.map((r) => r.mechanic_id);
  if (mechanicIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", mechanicIds);
    const nameMap = new Map(profiles?.map((p) => [p.id, p.full_name]) ?? []);
    return records.map((r) => ({
      ...r,
      mechanic_name: nameMap.get(r.mechanic_id) ?? null,
    })) as PayrollRecord[];
  }

  return records;
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
