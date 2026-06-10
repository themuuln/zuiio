// ── Revenue forecast, targets, and management ───────────────

import { createClient } from "@/lib/supabase/server";
import { withBranchFilter } from "@/lib/supabase/with-branch";

import type { ReportForecast, ReportTarget } from "@/lib/types";

/**
 * Revenue forecast — projects end-of-period revenue based on current pace.
 */
export async function getRevenueForecast(
  orgId: string,
  periodType: "daily" | "weekly" | "monthly",
  date: string,
  branchId: string | null = null,
): Promise<ReportForecast> {
  const supabase = await createClient();

  // Determine period boundaries
  let periodStart: string;
  let periodEnd: string;
  let totalDays: number;
  let daysElapsed: number;

  const now = new Date();
  const today = now.toISOString().split("T")[0];

  if (periodType === "daily") {
    periodStart = date;
    periodEnd = date;
    totalDays = 1;
    daysElapsed = date === today ? now.getHours() / 24 : 1;
  } else if (periodType === "weekly") {
    const ws = new Date(date);
    const we = new Date(ws);
    we.setDate(we.getDate() + 6);
    periodStart = ws.toISOString().split("T")[0];
    periodEnd = we.toISOString().split("T")[0];
    totalDays = 7;
    const wsTime = ws.getTime();
    daysElapsed = Math.min(
      totalDays,
      Math.max(1, Math.ceil((now.getTime() - wsTime) / 86400000)),
    );
  } else {
    // monthly
    const [y, m] = date.split("-").map(Number);
    periodStart = `${y}-${String(m).padStart(2, "0")}-01`;
    const lastDay = new Date(y, m, 0).getDate();
    periodEnd = `${y}-${String(m).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
    totalDays = lastDay;
    daysElapsed = Math.min(totalDays, Math.max(1, now.getDate()));
  }

  // Fetch revenue to date
  const { data: wos } = await withBranchFilter(
    supabase
      .from("work_orders")
      .select("id")
      .eq("organization_id", orgId)
      .eq("status", "Completed")
      .gte("created_at", `${periodStart}T00:00:00`)
      .lte("created_at", `${periodEnd}T23:59:59`)
      .is("deleted_at", null),
    branchId,
  );

  const woIds = (wos ?? []).map((w) => w.id);
  let currentRevenue = 0;

  if (woIds.length > 0) {
    const [svcs, parts] = await Promise.all([
      supabase
        .from("work_order_services")
        .select("final_price")
        .in("work_order_id", woIds),
      supabase
        .from("work_order_parts")
        .select("final_price")
        .in("work_order_id", woIds),
    ]);
    currentRevenue =
      (svcs.data ?? []).reduce((s, r) => s + Number(r.final_price), 0) +
      (parts.data ?? []).reduce((s, r) => s + Number(r.final_price), 0);
  }

  const dailyRunRate = daysElapsed > 0 ? currentRevenue / daysElapsed : 0;
  const projectedRevenue =
    totalDays > 0 ? dailyRunRate * totalDays : currentRevenue;

  // Fetch previous period revenue for comparison
  const prevDuration =
    new Date(periodEnd).getTime() - new Date(periodStart).getTime();
  const prevEndMs = new Date(periodStart).getTime() - 86400000;
  const prevStartMs = prevEndMs - prevDuration;
  const prevStart = new Date(prevStartMs).toISOString().split("T")[0];
  const prevEnd = new Date(prevEndMs).toISOString().split("T")[0];

  const { data: prevWOs } = await withBranchFilter(
    supabase
      .from("work_orders")
      .select("id")
      .eq("organization_id", orgId)
      .eq("status", "Completed")
      .gte("created_at", `${prevStart}T00:00:00`)
      .lte("created_at", `${prevEnd}T23:59:59`)
      .is("deleted_at", null),
    branchId,
  );

  const prevWoIds = (prevWOs ?? []).map((w) => w.id);
  let prevRevenue = 0;
  if (prevWoIds.length > 0) {
    const [svcs, parts] = await Promise.all([
      supabase
        .from("work_order_services")
        .select("final_price")
        .in("work_order_id", prevWoIds),
      supabase
        .from("work_order_parts")
        .select("final_price")
        .in("work_order_id", prevWoIds),
    ]);
    prevRevenue =
      (svcs.data ?? []).reduce((s, r) => s + Number(r.final_price), 0) +
      (parts.data ?? []).reduce((s, r) => s + Number(r.final_price), 0);
  }

  const projectedChangePct =
    prevRevenue > 0
      ? Math.round(((projectedRevenue - prevRevenue) / prevRevenue) * 1000) / 10
      : null;

  const onTrack = prevRevenue > 0 ? projectedRevenue >= prevRevenue : true;

  return {
    current_revenue: currentRevenue,
    days_elapsed: Math.round(daysElapsed),
    total_days: totalDays,
    projected_revenue: Math.round(projectedRevenue),
    previous_period_revenue: prevRevenue > 0 ? prevRevenue : null,
    projected_change_pct: projectedChangePct,
    daily_run_rate: Math.round(dailyRunRate),
    on_track: onTrack,
    target_revenue: null,
    target_progress_pct: null,
  };
}

/**
 * Revenue target management — get or set targets.
 * Stored in organization settings JSONB to avoid new tables.
 */
export async function getRevenueTargets(
  orgId: string,
  periodType: "daily" | "weekly" | "monthly",
  _date: string,
  branchId: string | null = null,
): Promise<ReportTarget[]> {
  const supabase = await createClient();

  const { data: org } = await supabase
    .from("organizations")
    .select("settings")
    .eq("id", orgId)
    .single();

  const settings = (org?.settings as Record<string, unknown>) ?? {};
  const targets = (
    (settings.report_targets as Array<Record<string, unknown>>) ?? []
  ).filter((t) => t.period_type === periodType);

  if (targets.length === 0) return [];

  // For each target, calculate progress
  const results: ReportTarget[] = [];
  for (const t of targets) {
    const targetRevenue = Number(t.target_revenue ?? 0);
    const periodStart = String(t.period_start ?? "");
    const periodEnd = String(t.period_end ?? "");

    if (!periodStart || !periodEnd) continue;

    // Fetch actual revenue for this period
    const { data: wos } = await withBranchFilter(
      supabase
        .from("work_orders")
        .select("id")
        .eq("organization_id", orgId)
        .eq("status", "Completed")
        .gte("created_at", `${periodStart}T00:00:00`)
        .lte("created_at", `${periodEnd}T23:59:59`)
        .is("deleted_at", null),
      branchId,
    );

    const woIds = (wos ?? []).map((w) => w.id);
    let actualRevenue = 0;
    if (woIds.length > 0) {
      const [svcs, parts] = await Promise.all([
        supabase
          .from("work_order_services")
          .select("final_price")
          .in("work_order_id", woIds),
        supabase
          .from("work_order_parts")
          .select("final_price")
          .in("work_order_id", woIds),
      ]);
      actualRevenue =
        (svcs.data ?? []).reduce((s, r) => s + Number(r.final_price), 0) +
        (parts.data ?? []).reduce((s, r) => s + Number(r.final_price), 0);
    }

    results.push({
      id: String(t.id ?? ""),
      organization_id: orgId,
      period_type: periodType,
      target_revenue: targetRevenue,
      actual_revenue: actualRevenue,
      progress_pct:
        targetRevenue > 0
          ? Math.round((actualRevenue / targetRevenue) * 1000) / 10
          : 0,
      achieved: actualRevenue >= targetRevenue,
      period_start: periodStart,
      period_end: periodEnd,
    });
  }

  return results;
}

/** Set or update a revenue target */
export async function setRevenueTarget(
  orgId: string,
  periodType: "daily" | "weekly" | "monthly",
  periodStart: string,
  periodEnd: string,
  targetRevenue: number,
): Promise<ReportTarget> {
  const supabase = await createClient();

  const { data: org } = await supabase
    .from("organizations")
    .select("settings")
    .eq("id", orgId)
    .single();

  const settings = (org?.settings as Record<string, unknown>) ?? {};
  const existingTargets = (
    (settings.report_targets as Array<Record<string, unknown>>) ?? []
  ).filter(
    (t) => !(t.period_type === periodType && t.period_start === periodStart),
  );

  const newTarget = {
    id: `target-${Date.now()}`,
    period_type: periodType,
    period_start: periodStart,
    period_end: periodEnd,
    target_revenue: targetRevenue,
  };

  existingTargets.push(newTarget);

  await supabase
    .from("organizations")
    .update({ settings: { ...settings, report_targets: existingTargets } })
    .eq("id", orgId);

  return {
    id: newTarget.id,
    organization_id: orgId,
    period_type: periodType,
    target_revenue: targetRevenue,
    actual_revenue: 0,
    progress_pct: 0,
    achieved: false,
    period_start: periodStart,
    period_end: periodEnd,
  };
}
