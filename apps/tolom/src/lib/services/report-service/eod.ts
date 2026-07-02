// ── End-of-day summary functions ────────────────────────────

import type { SupabaseClient } from "@supabase/supabase-js";

import { cacheDurations, cacheTags } from "@/lib/cache/keys";
import { withCache } from "@/lib/cache/with-cache";
import { withBranchFilter } from "@/lib/supabase/with-branch";

import type { EndOfDaySummary } from "@/lib/types";

export async function getEndOfDaySummary(
  db: SupabaseClient,
  orgId: string,
  date: string,
  branchId: string | null = null,
  mechanicId: string | null = null,
): Promise<EndOfDaySummary> {
  const supabase = db;

  return withCache(
    ["getEndOfDaySummary", orgId, date, branchId ?? "all", mechanicId ?? "all"],
    async () => {
      let query = supabase
        .from("work_orders")
        .select("id, mechanic_id")
        .eq("organization_id", orgId)
        .gte("completed_at", `${date}T00:00:00`)
        .lte("completed_at", `${date}T23:59:59`)
        .eq("status", "Completed")
        .is("deleted_at", null);

      if (mechanicId) {
        query = query.eq("mechanic_id", mechanicId);
      }

      const { data: workOrders } = await withBranchFilter(query, branchId);

      return getEndOfDaySummaryFromScopedWorkOrders(
        supabase,
        orgId,
        date,
        branchId,
        (workOrders ?? []) as Array<{
          id: string;
          mechanic_id: string | null;
        }>,
      );
    },
    {
      tags: [cacheTags.reports(orgId)],
      revalidate: cacheDurations.reports,
    },
  );
}

async function getEndOfDaySummaryFromScopedWorkOrders(
  supabase: SupabaseClient,
  orgId: string,
  date: string,
  branchId: string | null,
  workOrders: Array<{ id: string; mechanic_id: string | null }>,
): Promise<EndOfDaySummary> {
  if (!workOrders.length) {
    // Still fetch open_work_orders, unpaid_invoices, issues for empty-day case
    const [openWoEmpty, unpaidInvEmpty, biggestIssueEmpty] = await Promise.all([
      branchId
        ? supabase
            .from("work_orders")
            .select("id")
            .eq("organization_id", orgId)
            .eq("branch_id", branchId)
            .neq("status", "Completed")
            .neq("status", "Cancelled")
            .is("deleted_at", null)
        : supabase
            .from("work_orders")
            .select("id", { count: "exact", head: true })
            .eq("organization_id", orgId)
            .neq("status", "Completed")
            .neq("status", "Cancelled")
            .is("deleted_at", null),
      branchId
        ? supabase
            .from("invoices")
            .select("balance_due")
            .eq("organization_id", orgId)
            .eq("branch_id", branchId)
            .in("status", ["sent", "overdue", "partial"])
            .is("deleted_at", null)
        : supabase
            .from("invoices")
            .select("balance_due")
            .eq("organization_id", orgId)
            .in("status", ["sent", "overdue", "partial"])
            .is("deleted_at", null),
      branchId
        ? supabase
            .from("work_orders")
            .select(
              "id, description, created_at, customer_id, customers!inner(full_name)",
            )
            .eq("organization_id", orgId)
            .eq("branch_id", branchId)
            .neq("status", "Completed")
            .neq("status", "Cancelled")
            .is("deleted_at", null)
            .order("created_at", { ascending: true })
            .limit(1)
            .maybeSingle()
        : supabase
            .from("work_orders")
            .select(
              "id, description, created_at, customer_id, customers!inner(full_name)",
            )
            .eq("organization_id", orgId)
            .neq("status", "Completed")
            .neq("status", "Cancelled")
            .is("deleted_at", null)
            .order("created_at", { ascending: true })
            .limit(1)
            .maybeSingle(),
    ]);
    const biEmptyData = biggestIssueEmpty.data;
    const daysOpen = biEmptyData?.created_at
      ? Math.floor(
          (Date.now() - new Date(biEmptyData.created_at).getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : 0;
    const unpaidInvEmptyData = unpaidInvEmpty.data ?? [];
    return {
      date,
      mechanics: [],
      total_work_orders: 0,
      total_revenue: 0,
      total_commission: 0,
      open_work_orders: branchId
        ? ((openWoEmpty as { data?: unknown[] }).data?.length ?? 0)
        : ((openWoEmpty as { count?: number }).count ?? 0),
      payment_breakdown: { cash: 0, card: 0, bank_transfer: 0, other: 0 },
      unpaid_invoices: {
        count: unpaidInvEmptyData.length,
        total: unpaidInvEmptyData.reduce(
          (s: number, inv: any) => s + Number(inv.balance_due ?? 0),
          0,
        ),
      },
      best_mechanic: null,
      biggest_issue:
        biEmptyData && !Array.isArray(biEmptyData)
          ? {
              description: biEmptyData.description ?? "Open work order",
              work_order_id: biEmptyData.id,
              customer: (biEmptyData as any).customers?.full_name ?? "",
              days_open: daysOpen,
            }
          : null,
    };
  }

  const mechanicMap = new Map<
    string,
    {
      mechanic_id: string;
      mechanic_name: string;
      work_orders_completed: number;
      services_count: number;
      parts_count: number;
      total_revenue: number;
      total_commission: number;
    }
  >();

  const mechanicIds = [
    ...new Set(
      workOrders.flatMap((w) =>
        w.mechanic_id ? [w.mechanic_id] : [],
      ) as string[],
    ),
  ];

  const { data: profilesData } =
    mechanicIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", mechanicIds)
      : { data: [] as any[] };

  const profileMap = new Map<string, string>();
  for (const p of profilesData ?? []) {
    profileMap.set(p.id, p.full_name ?? "Unknown");
  }

  const woIds = workOrders.map((w) => w.id);

  // ── Extra EOD queries ──────────────────────────────────────
  const [
    servicesData,
    partsData,
    commissionsData,
    openWoResult,
    paymentsResult,
    unpaidInvoicesResult,
    biggestIssueResult,
  ] = await Promise.all([
    woIds.length > 0
      ? supabase
          .from("work_order_services")
          .select("final_price, work_order_id")
          .in("work_order_id", woIds)
      : { data: [] as any[] },
    woIds.length > 0
      ? supabase
          .from("work_order_parts")
          .select("final_price, work_order_id")
          .in("work_order_id", woIds)
      : { data: [] as any[] },
    woIds.length > 0
      ? supabase
          .from("work_order_commissions")
          .select("mechanic_id, commission_amount")
          .in("work_order_id", woIds)
      : { data: [] as any[] },
    // Open work orders count
    branchId
      ? supabase
          .from("work_orders")
          .select("id")
          .eq("organization_id", orgId)
          .eq("branch_id", branchId)
          .neq("status", "Completed")
          .neq("status", "Cancelled")
          .is("deleted_at", null)
      : supabase
          .from("work_orders")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", orgId)
          .neq("status", "Completed")
          .neq("status", "Cancelled")
          .is("deleted_at", null),
    // Payment method breakdown (payments on today's work orders)
    woIds.length > 0
      ? supabase
          .from("payments")
          .select("payment_method, amount")
          .in("work_order_id", woIds)
      : { data: [] as any[] },
    // Unpaid invoices (balance_due)
    branchId
      ? supabase
          .from("invoices")
          .select("balance_due")
          .eq("organization_id", orgId)
          .eq("branch_id", branchId)
          .in("status", ["sent", "overdue", "partial"])
          .is("deleted_at", null)
      : supabase
          .from("invoices")
          .select("balance_due")
          .eq("organization_id", orgId)
          .in("status", ["sent", "overdue", "partial"])
          .is("deleted_at", null),
    // Biggest issue: oldest open work order with customer name
    branchId
      ? supabase
          .from("work_orders")
          .select(
            "id, description, created_at, customer_id, customers!inner(full_name)",
          )
          .eq("organization_id", orgId)
          .eq("branch_id", branchId)
          .neq("status", "Completed")
          .neq("status", "Cancelled")
          .is("deleted_at", null)
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle()
      : supabase
          .from("work_orders")
          .select(
            "id, description, created_at, customer_id, customers!inner(full_name)",
          )
          .eq("organization_id", orgId)
          .neq("status", "Completed")
          .neq("status", "Cancelled")
          .is("deleted_at", null)
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle(),
  ]);

  const woDataMap = new Map<string, { services: any[]; parts: any[] }>();
  for (const s of servicesData.data ?? []) {
    const entry = woDataMap.get(s.work_order_id) ?? { services: [], parts: [] };
    entry.services.push(s);
    woDataMap.set(s.work_order_id, entry);
  }
  for (const p of partsData.data ?? []) {
    const entry = woDataMap.get(p.work_order_id) ?? { services: [], parts: [] };
    entry.parts.push(p);
    woDataMap.set(p.work_order_id, entry);
  }

  // Aggregate commissions per mechanic
  const commissionMap = new Map<string, number>();
  for (const c of commissionsData.data ?? []) {
    const mid = c.mechanic_id;
    const current = commissionMap.get(mid) ?? 0;
    commissionMap.set(mid, current + Number(c.commission_amount));
  }

  for (const wo of workOrders) {
    const mid = wo.mechanic_id;
    if (!mid) continue;

    if (!mechanicMap.has(mid)) {
      mechanicMap.set(mid, {
        mechanic_id: mid,
        mechanic_name: profileMap.get(mid) ?? "Unknown",
        work_orders_completed: 0,
        services_count: 0,
        parts_count: 0,
        total_revenue: 0,
        total_commission: 0,
      });
    }

    const entry = mechanicMap.get(mid);
    if (!entry) continue;

    entry.work_orders_completed++;

    const data = woDataMap.get(wo.id);
    if (!data) continue;

    entry.services_count += data.services.length;
    entry.parts_count += data.parts.length;

    for (const s of data.services) entry.total_revenue += Number(s.final_price);
    for (const p of data.parts) entry.total_revenue += Number(p.final_price);
  }

  // Add commission totals to mechanic entries
  for (const [mid, amount] of commissionMap) {
    const entry = mechanicMap.get(mid);
    if (entry) {
      entry.total_commission = amount;
    }
  }

  const mechanics = Array.from(mechanicMap.values());
  const totalWorkOrders = mechanics.reduce(
    (sum, m) => sum + m.work_orders_completed,
    0,
  );
  const totalRevenue = mechanics.reduce((sum, m) => sum + m.total_revenue, 0);
  const totalCommission = mechanics.reduce(
    (sum, m) => sum + (m.total_commission ?? 0),
    0,
  );

  // ── Process extra EOD data ──────────────────────────────────
  const paymentBreakdown = { cash: 0, card: 0, bank_transfer: 0, other: 0 };
  for (const p of (paymentsResult as any)?.data ?? []) {
    const method = (p.payment_method ?? "other")
      .toLowerCase()
      .replace(/[^a-z_]/g, "");
    if (method in paymentBreakdown) {
      paymentBreakdown[method as keyof typeof paymentBreakdown] += Number(
        p.amount ?? 0,
      );
    } else {
      paymentBreakdown.other += Number(p.amount ?? 0);
    }
  }

  // Unpaid invoices total (balance_due)
  const unpaidInvData = (unpaidInvoicesResult as any)?.data ?? [];
  const unpaidInvCount = unpaidInvData.length;
  const unpaidInvTotal = unpaidInvData.reduce(
    (sum: number, inv: any) => sum + Number(inv.balance_due ?? 0),
    0,
  );

  // Best mechanic (highest revenue)
  const sortedMechanics = [...mechanics].sort(
    (a, b) => b.total_revenue - a.total_revenue,
  );
  const bestMechanic =
    sortedMechanics.length > 0 && sortedMechanics[0].total_revenue > 0
      ? {
          id: sortedMechanics[0].mechanic_id,
          name: sortedMechanics[0].mechanic_name,
          revenue: sortedMechanics[0].total_revenue,
          jobs: sortedMechanics[0].work_orders_completed,
        }
      : null;

  // Biggest issue: oldest open work order with customer info
  const biData = (biggestIssueResult as any)?.data;
  const biggestIssue =
    biData && !Array.isArray(biData) && biData?.id
      ? {
          description: biData.description ?? "Open work order",
          work_order_id: biData.id,
          customer: (biData as any).customers?.full_name ?? "",
          days_open: Math.floor(
            (Date.now() - new Date(biData.created_at).getTime()) /
              (1000 * 60 * 60 * 24),
          ),
        }
      : null;

  return {
    date,
    mechanics,
    total_work_orders: totalWorkOrders,
    total_revenue: totalRevenue,
    total_commission: totalCommission,
    open_work_orders: branchId
      ? ((openWoResult as { data?: unknown[] }).data?.length ?? 0)
      : ((openWoResult as { count?: number }).count ?? 0),
    payment_breakdown: paymentBreakdown,
    unpaid_invoices: {
      count: unpaidInvCount,
      total: unpaidInvTotal,
    },
    best_mechanic: bestMechanic,
    biggest_issue: biggestIssue,
  };
}
