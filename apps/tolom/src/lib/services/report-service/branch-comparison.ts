// ── Branch Comparison Service ────────────────────────────────
// Returns per-branch KPI summaries for cross-branch comparison.
// Used by dashboard branch comparison section and reports comparison tab.

import type { SupabaseClient } from "@supabase/supabase-js";

import { cacheDurations, cacheTags } from "@/lib/cache/keys";
import { withCache } from "@/lib/cache/with-cache";

import type { BranchComparisonData, BranchKpiSummary } from "@/lib/types";

/**
 * Get KPI comparison data across all branches for an organization.
 *
 * @param db - Supabase client
 * @param orgId - Organization ID
 * @param dateFrom - Period start date (YYYY-MM-DD)
 * @param dateTo - Period end date (YYYY-MM-DD)
 * @returns BranchComparisonData with per-branch metrics and totals
 */
export async function getBranchComparison(
  db: SupabaseClient,
  orgId: string,
  dateFrom: string,
  dateTo: string,
): Promise<BranchComparisonData> {
  const supabase = db;

  return withCache(
    ["getBranchComparison", orgId, dateFrom, dateTo],
    async () => {
      // ── 1. Fetch branches ──
      const { data: branches } = await supabase
        .from("branches")
        .select("id, name, is_main")
        .eq("organization_id", orgId)
        .is("deleted_at", null)
        .order("name");

      const branchList = branches ?? [];
      const branchIds = branchList.map((b) => b.id);

      if (branchIds.length === 0) {
        return {
          branches: [],
          totals: emptyTotals(),
          periodLabel: `${dateFrom} – ${dateTo}`,
        };
      }

      // ── 2. Fetch completed WOs per branch in date range ──
      const { data: completedWos } = await supabase
        .from("work_orders")
        .select("id, branch_id")
        .eq("organization_id", orgId)
        .eq("status", "Completed")
        .gte("created_at", `${dateFrom}T00:00:00`)
        .lte("created_at", `${dateTo}T23:59:59`)
        .is("deleted_at", null)
        .in("branch_id", branchIds);

      // ── 3. Fetch active WOs per branch ──
      const { data: activeWos } = await supabase
        .from("work_orders")
        .select("branch_id")
        .eq("organization_id", orgId)
        .not("status", "in", '("Completed","Cancelled")')
        .is("deleted_at", null)
        .in("branch_id", branchIds);

      // ── 4. Fetch total customers per branch ──
      const { data: customerCounts } = await supabase
        .from("customers")
        .select("branch_id")
        .eq("organization_id", orgId)
        .is("deleted_at", null)
        .in("branch_id", branchIds);

      // ── 5. Group WO IDs by branch for revenue calculation ──
      const woByBranch = new Map<string, string[]>();
      for (const wo of completedWos ?? []) {
        const bid = wo.branch_id as string;
        if (!bid) continue;
        if (!woByBranch.has(bid)) woByBranch.set(bid, []);
        woByBranch.get(bid)?.push(wo.id);
      }

      // ── 6. Fetch services + parts revenue per branch ──
      const allWoIds = (completedWos ?? []).map((w) => w.id);
      const [servicesData, partsData] = await Promise.all([
        allWoIds.length > 0
          ? supabase
              .from("work_order_services")
              .select("final_price, unit_cost, quantity, work_order_id")
              .in("work_order_id", allWoIds)
          : { data: [] as any[] },
        allWoIds.length > 0
          ? supabase
              .from("work_order_parts")
              .select("final_price, unit_cost, quantity, work_order_id")
              .in("work_order_id", allWoIds)
          : { data: [] as any[] },
      ]);

      // Build WO→branch map
      const woBranchMap = new Map<string, string>();
      for (const wo of completedWos ?? []) {
        woBranchMap.set(wo.id, wo.branch_id as string);
      }

      // Aggregate revenue by branch
      const branchRevenue = new Map<
        string,
        {
          serviceRev: number;
          partsRev: number;
          serviceCost: number;
          partsCost: number;
        }
      >();
      for (const bid of branchIds) {
        branchRevenue.set(bid, {
          serviceRev: 0,
          partsRev: 0,
          serviceCost: 0,
          partsCost: 0,
        });
      }

      for (const s of servicesData.data ?? []) {
        const bid = woBranchMap.get(s.work_order_id);
        if (!bid) continue;
        const rev = branchRevenue.get(bid)!;
        rev.serviceRev += Number(s.final_price);
        rev.serviceCost += Number(s.unit_cost ?? 0) * Number(s.quantity);
      }
      for (const p of partsData.data ?? []) {
        const bid = woBranchMap.get(p.work_order_id);
        if (!bid) continue;
        const rev = branchRevenue.get(bid)!;
        rev.partsRev += Number(p.final_price);
        rev.partsCost += Number(p.unit_cost ?? 0) * Number(p.quantity);
      }

      // ── 7. Build per-branch summaries ──
      const activeByBranch = new Map<string, number>();
      for (const wo of activeWos ?? []) {
        const bid = wo.branch_id as string;
        if (!bid) continue;
        activeByBranch.set(bid, (activeByBranch.get(bid) ?? 0) + 1);
      }

      const customersByBranch = new Map<string, number>();
      for (const c of customerCounts ?? []) {
        const bid = c.branch_id as string;
        if (!bid) continue;
        customersByBranch.set(bid, (customersByBranch.get(bid) ?? 0) + 1);
      }

      const summaries: BranchKpiSummary[] = branchList.map((branch) => {
        const rev = branchRevenue.get(branch.id) ?? {
          serviceRev: 0,
          partsRev: 0,
          serviceCost: 0,
          partsCost: 0,
        };
        const totalRevenue = rev.serviceRev + rev.partsRev;
        const totalCost = rev.serviceCost + rev.partsCost;
        const grossProfit = totalRevenue - totalCost;
        const woCount = woByBranch.get(branch.id)?.length ?? 0;

        return {
          branchId: branch.id,
          branchName: branch.name,
          isMain: branch.is_main ?? false,
          totalRevenue,
          serviceRevenue: rev.serviceRev,
          partsRevenue: rev.partsRev,
          grossProfit,
          marginPercent:
            totalRevenue > 0
              ? Math.round((grossProfit / totalRevenue) * 1000) / 10
              : 0,
          activeWorkOrders: activeByBranch.get(branch.id) ?? 0,
          completedWorkOrders: woCount,
          totalCustomers: customersByBranch.get(branch.id) ?? 0,
          avgRepairOrderValue:
            woCount > 0 ? Math.round((totalRevenue / woCount) * 100) / 100 : 0,
          serviceMix:
            totalRevenue > 0
              ? Math.round((rev.serviceRev / totalRevenue) * 1000) / 10
              : 0,
        };
      });

      // ── 8. Compute totals ──
      const totals = {
        totalRevenue: summaries.reduce((s, b) => s + b.totalRevenue, 0),
        serviceRevenue: summaries.reduce((s, b) => s + b.serviceRevenue, 0),
        partsRevenue: summaries.reduce((s, b) => s + b.partsRevenue, 0),
        grossProfit: summaries.reduce((s, b) => s + b.grossProfit, 0),
        marginPercent: 0,
        activeWorkOrders: summaries.reduce((s, b) => s + b.activeWorkOrders, 0),
        completedWorkOrders: summaries.reduce(
          (s, b) => s + b.completedWorkOrders,
          0,
        ),
        totalCustomers: summaries.reduce((s, b) => s + b.totalCustomers, 0),
        avgRepairOrderValue: 0,
        serviceMix: 0,
      };

      totals.marginPercent =
        totals.totalRevenue > 0
          ? Math.round((totals.grossProfit / totals.totalRevenue) * 1000) / 10
          : 0;
      totals.avgRepairOrderValue =
        totals.completedWorkOrders > 0
          ? Math.round(
              (totals.totalRevenue / totals.completedWorkOrders) * 100,
            ) / 100
          : 0;
      totals.serviceMix =
        totals.totalRevenue > 0
          ? Math.round((totals.serviceRevenue / totals.totalRevenue) * 1000) /
            10
          : 0;

      return {
        branches: summaries,
        totals,
        periodLabel: `${dateFrom} – ${dateTo}`,
      };
    },
    {
      tags: [cacheTags.reports(orgId)],
      revalidate: cacheDurations.reports,
    },
  );
}

function emptyTotals(): BranchComparisonData["totals"] {
  return {
    totalRevenue: 0,
    serviceRevenue: 0,
    partsRevenue: 0,
    grossProfit: 0,
    marginPercent: 0,
    activeWorkOrders: 0,
    completedWorkOrders: 0,
    totalCustomers: 0,
    avgRepairOrderValue: 0,
    serviceMix: 0,
  };
}
