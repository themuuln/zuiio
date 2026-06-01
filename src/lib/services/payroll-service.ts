/**
 * Payroll service — pay rate management and monthly payroll calculation.
 *
 * Built on top of mechanic_time_logs and mechanic_daily_reports.
 * Monthly calculation is idempotent — re-running recalculates.
 */
import { revalidateTag } from "next/cache";
import { cacheTags } from "@/lib/cache/keys";
import { createClient } from "@/lib/supabase/server";

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
  orgId: string,
  mechanicId: string,
): Promise<PayRate | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("mechanic_pay_rates")
    .select("*")
    .eq("organization_id", orgId)
    .eq("mechanic_id", mechanicId)
    .is("effective_to", null)
    .maybeSingle();

  return data as PayRate | null;
}

/**
 * Set (or update) a mechanic's hourly pay rate.
 * Ends the previous rate and inserts a new one.
 */
export async function upsertPayRate(
  orgId: string,
  mechanicId: string,
  hourlyRate: number,
  effectiveFrom: string,
): Promise<PayRate> {
  const supabase = await createClient();

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

  revalidateTag(cacheTags.reports(orgId), "default");
  return data as PayRate;
}

/**
 * List all mechanics with their current pay rate.
 * Joins with profiles for mechanic names.
 */
export async function listPayRates(
  orgId: string,
): Promise<PayRate[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("mechanic_pay_rates")
    .select("*, profiles!inner(full_name)")
    .eq("organization_id", orgId)
    .is("effective_to", null);

  return ((data ?? []) as any[]).map((r) => ({
    ...r,
    mechanic_name: (r as any).profiles?.full_name ?? null,
  })) as PayRate[];
}

// ── Payroll Calculation ────────────────────────────

/**
 * Calculate monthly payroll for all mechanics.
 *
 * Idempotent — re-running recalculates and upserts existing records.
 * Returns the created/updated payroll records.
 */
export async function calculateMonthlyPayroll(
  orgId: string,
  year: number,
  month: number,
): Promise<PayrollRecord[]> {
  const supabase = await createClient();

  const periodStart = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const periodEnd = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  // Get all mechanics with hours worked in this period
  const { data: hoursData } = await supabase
    .from("mechanic_daily_reports")
    .select("mechanic_id, hours_worked")
    .eq("organization_id", orgId)
    .gte("report_date", periodStart)
    .lte("report_date", periodEnd);

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

    // UPSERT — idempotent
    const { data: record } = await supabase
      .from("payroll_records")
      .upsert(
        {
          organization_id: orgId,
          mechanic_id: mechanicId,
          period_start: periodStart,
          period_end: periodEnd,
          total_hours: totalHours,
          hourly_rate: hourlyRate,
          gross_pay: grossPay,
          status: "draft",
        },
        {
          onConflict: "mechanic_id, period_start",
          ignoreDuplicates: false,
        },
      )
      .select()
      .single();

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
 */
export async function getPayrollRecords(
  orgId: string,
  year: number,
  month: number,
): Promise<PayrollRecord[]> {
  const supabase = await createClient();

  const periodStart = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const periodEnd = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const { data } = await supabase
    .from("payroll_records")
    .select("*, profiles!inner(full_name)")
    .eq("organization_id", orgId)
    .eq("period_start", periodStart)
    .eq("period_end", periodEnd);

  return ((data ?? []) as any[]).map((r) => ({
    ...r,
    mechanic_name: (r as any).profiles?.full_name ?? null,
  })) as PayrollRecord[];
}

/**
 * Update a payroll record's status.
 */
export async function updatePayrollRecordStatus(
  orgId: string,
  recordId: string,
  status: "draft" | "approved" | "paid",
): Promise<PayrollRecord> {
  const supabase = await createClient();

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
