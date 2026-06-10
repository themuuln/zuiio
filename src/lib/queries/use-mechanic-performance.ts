/**
 * React Query hooks for the mechanic performance page.
 *
 * Three independent queries — one per API endpoint — following the
 * createOrgQuery pattern from use-mechanic-dashboard.ts.
 */
import { type UseQueryResult, useQuery } from "@tanstack/react-query";

import { mechanicPerfKeys } from "./keys";
import { createOrgQuery } from "./factory";

// ── Types ──────────────────────────────────────────

/** Shape returned by the reports API with type=custom */
export interface ReportMechanicKpi {
  mechanic_id: string;
  mechanic_name: string;
  work_orders_completed: number;
  services_count: number;
  parts_count: number;
  total_revenue: number;
  avg_revenue_per_wo: number;
  avg_satisfaction: number | null;
  total_reviews: number;
  recent_reviews: import("@/lib/types/service-params").MechanicReview[];
}

export interface ReportsResponse {
  mechanic_kpis: ReportMechanicKpi[];
}

export interface MechanicHoursRow {
  mechanic_id: string;
  total_hours: number;
}

export interface MechanicCommissionsRow {
  mechanic_id: string;
  total_commission: number;
}

// ── Fetchers (offline-cached via createOrgQuery) ───

const fetchReports = createOrgQuery<ReportsResponse>("/reports");
const fetchMechanicHours =
  createOrgQuery<MechanicHoursRow[]>("/mechanic-hours");
const fetchMechanicCommissions = createOrgQuery<MechanicCommissionsRow[]>(
  "/mechanic-commissions",
);

// ── Date range parameter type ──────────────────────

export interface DateRangeParams {
  start: string;
  end: string;
}

// ── Hook: Mechanic KPIs ────────────────────────────

/**
 * Mechanic KPIs from the reports API (type=custom).
 * Includes revenue, jobs completed, satisfaction, and reviews.
 */
export function useMechanicKpis(
  orgId: string | undefined,
  dateRange: DateRangeParams | null,
  branchFilter?: string | null,
): UseQueryResult<ReportsResponse, Error> {
  return useQuery({
    queryKey: mechanicPerfKeys.kpis(
      orgId ?? "",
      dateRange?.start ?? "",
      dateRange?.end ?? "",
      branchFilter,
    ),
    queryFn: async () => {
      const params: Record<string, string> = {
        type: "custom",
        date_from: dateRange!.start,
        date_to: dateRange!.end,
      };
      if (branchFilter) params.branch_id = branchFilter;
      return fetchReports(orgId!, {
        params,
        cacheKeyParams: {
          type: "custom",
          date_from: dateRange!.start,
          date_to: dateRange!.end,
        },
      });
    },
    enabled: !!orgId && !!dateRange,
    staleTime: 120_000,
    placeholderData: (prev) => prev,
  });
}

// ── Hook: Mechanic Hours ───────────────────────────

/**
 * Hours worked per mechanic for a date range.
 * Used to compute revenue-per-hour metrics.
 */
export function useMechanicHours(
  orgId: string | undefined,
  dateRange: DateRangeParams | null,
): UseQueryResult<MechanicHoursRow[], Error> {
  return useQuery({
    queryKey: mechanicPerfKeys.hours(
      orgId ?? "",
      dateRange?.start ?? "",
      dateRange?.end ?? "",
    ),
    queryFn: () =>
      fetchMechanicHours(orgId!, {
        params: {
          startDate: dateRange!.start,
          endDate: dateRange!.end,
        },
        cacheKeyParams: {
          startDate: dateRange!.start,
          endDate: dateRange!.end,
        },
      }) as Promise<MechanicHoursRow[]>,
    enabled: !!orgId && !!dateRange,
    staleTime: 120_000,
    placeholderData: (prev) => prev,
  });
}

// ── Hook: Mechanic Commissions ─────────────────────

/**
 * Commissions earned per mechanic for a date range.
 * Falls back gracefully if the endpoint doesn't exist yet.
 */
export function useMechanicCommissions(
  orgId: string | undefined,
  dateRange: DateRangeParams | null,
): UseQueryResult<MechanicCommissionsRow[], Error> {
  return useQuery({
    queryKey: mechanicPerfKeys.commissions(
      orgId ?? "",
      dateRange?.start ?? "",
      dateRange?.end ?? "",
    ),
    queryFn: () =>
      fetchMechanicCommissions(orgId!, {
        params: {
          startDate: dateRange!.start,
          endDate: dateRange!.end,
        },
        cacheKeyParams: {
          startDate: dateRange!.start,
          endDate: dateRange!.end,
        },
      }) as Promise<MechanicCommissionsRow[]>,
    enabled: !!orgId && !!dateRange,
    staleTime: 120_000,
    placeholderData: (prev) => prev,
  });
}
