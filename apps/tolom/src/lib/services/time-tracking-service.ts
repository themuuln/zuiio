import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidateTag } from "next/cache";
import { createAuditLog } from "@/lib/audit";
import { cacheTags } from "@/lib/cache/keys";
import { withDbCapture } from "@/lib/supabase/query";

export interface TimeLog {
  id: string;
  organization_id: string;
  mechanic_id: string;
  clock_in: string;
  clock_out: string | null;
  date: string;
  notes: string | null;
}

export interface ClockStatus {
  clockedIn: boolean;
  since: string | null;
  todayHours: number;
}

/**
 * Clock in — inserts a new time log with clock_in = now().
 */
export async function clockIn(
  db: SupabaseClient,
  orgId: string,
  mechanicId: string,
): Promise<TimeLog> {
  const supabase = db;

  const { data, error } = await supabase
    .from("mechanic_time_logs")
    .insert({
      organization_id: orgId,
      mechanic_id: mechanicId,
      clock_in: new Date().toISOString(),
      date: new Date().toISOString().split("T")[0],
    })
    .select()
    .single();

  if (error) throw error;

  await createAuditLog({
    supabase,
    action: "create",
    table_name: "mechanic_time_logs",
    record_id: data.id,
    user_id: mechanicId,
    organization_id: orgId,
    new_data: data as unknown as Record<string, unknown>,
  });

  revalidateTag(cacheTags.timeTracking(orgId, mechanicId), "default");
  return data;
}

/**
 * Clock out — closes the latest open log, updates mechanic_daily_reports.
 */
export async function clockOut(
  db: SupabaseClient,
  orgId: string,
  mechanicId: string,
): Promise<TimeLog> {
  const supabase = db;
  const today = new Date().toISOString().split("T")[0];

  // Find the latest open log for today
  const { data: openLog, error: findError } = await supabase
    .from("mechanic_time_logs")
    .select(
      "id, organization_id, mechanic_id, clock_in, clock_out, date, notes",
    )
    .eq("mechanic_id", mechanicId)
    .eq("organization_id", orgId)
    .eq("date", today)
    .is("clock_out", null)
    .order("clock_in", { ascending: false })
    .limit(1)
    .single();

  if (findError || !openLog) {
    throw new Error("No open time log found");
  }

  const clockOutTime = new Date().toISOString();

  const { data, error: updateError } = await supabase
    .from("mechanic_time_logs")
    .update({ clock_out: clockOutTime })
    .eq("id", openLog.id)
    .select()
    .single();

  if (updateError) throw updateError;

  await createAuditLog({
    supabase,
    action: "update",
    table_name: "mechanic_time_logs",
    record_id: data.id,
    user_id: mechanicId,
    organization_id: orgId,
    old_data: openLog as unknown as Record<string, unknown>,
    new_data: data as unknown as Record<string, unknown>,
  });

  await upsertDailyHours(supabase, orgId, mechanicId, today);

  revalidateTag(cacheTags.timeTracking(orgId, mechanicId), "default");
  return data;
}

/**
 * Get today's open time log (null if clocked out).
 */
export async function getTodayLog(
  db: SupabaseClient,
  orgId: string,
  mechanicId: string,
): Promise<TimeLog | null> {
  const supabase = db;
  const today = new Date().toISOString().split("T")[0];

  const { data, error } = await withDbCapture(
    "getTodayLog",
    supabase
      .from("mechanic_time_logs")
      .select(
        "id, organization_id, mechanic_id, clock_in, clock_out, date, notes",
      )
      .eq("mechanic_id", mechanicId)
      .eq("organization_id", orgId)
      .eq("date", today)
      .is("clock_out", null)
      .order("clock_in", { ascending: false })
      .limit(1)
      .maybeSingle(),
  );
  if (error) return null;

  return data;
}

/**
 * Get total hours worked today.
 */
export async function getTodayHours(
  db: SupabaseClient,
  orgId: string,
  mechanicId: string,
): Promise<number> {
  const supabase = db;
  const today = new Date().toISOString().split("T")[0];

  const { data, error } = await withDbCapture(
    "getTodayHours",
    supabase
      .from("mechanic_daily_reports")
      .select("hours_worked")
      .eq("mechanic_id", mechanicId)
      .eq("organization_id", orgId)
      .eq("report_date", today)
      .maybeSingle(),
  );
  if (error) return 0;

  return data?.hours_worked ?? 0;
}

/**
 * Get today's clock status (clocked in + hours).
 */
export async function getClockStatus(
  db: SupabaseClient,
  orgId: string,
  mechanicId: string,
): Promise<ClockStatus> {
  const [openLog, todayHours] = await Promise.all([
    getTodayLog(db, orgId, mechanicId),
    getTodayHours(db, orgId, mechanicId),
  ]);

  return {
    clockedIn: openLog !== null,
    since: openLog?.clock_in ?? null,
    todayHours,
  };
}

// ── Helpers ──────────────────────────────────────────

/**
 * Recalculate and upsert mechanic_daily_reports.hours_worked for today.
 */
async function upsertDailyHours(
  supabase: SupabaseClient,
  orgId: string,
  mechanicId: string,
  date: string,
): Promise<void> {
  const { data: logs } = await supabase
    .from("mechanic_time_logs")
    .select("clock_in, clock_out")
    .eq("mechanic_id", mechanicId)
    .eq("organization_id", orgId)
    .eq("date", date)
    .not("clock_out", "is", null);

  let totalHours = 0;
  if (logs) {
    for (const log of logs) {
      const start = new Date(log.clock_in).getTime();
      const end = new Date(log.clock_out!).getTime();
      totalHours += (end - start) / (1000 * 60 * 60);
    }
  }

  totalHours = Math.round(totalHours * 10) / 10;

  const { error: upsertError } = await supabase
    .from("mechanic_daily_reports")
    .upsert(
      {
        organization_id: orgId,
        mechanic_id: mechanicId,
        report_date: date,
        hours_worked: totalHours,
      },
      {
        onConflict: "mechanic_id, report_date",
        ignoreDuplicates: false,
      },
    );

  if (upsertError) throw upsertError;
}
