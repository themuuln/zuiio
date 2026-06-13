/**
 * React Query hooks for report data.
 *
 * Replaces raw fetch() + useState in the reports page with:
 * - Automatic caching (staleTime)
 * - Background refetching
 * - Deduplication of concurrent requests
 * - Retry on failure
 * - Shared cache between tabs
 */
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import type {
  CustomerRetentionData,
  PnLSummary,
  ReportForecast,
  ReportInsight,
  ReportTarget,
  ServiceBreakdown,
} from "@/lib/types";
import { createOrgQuery } from "./factory";
import { reportKeys } from "./keys";

// ── Fetchers ────────────────────────────────────────────────

const fetchReport = createOrgQuery<unknown>("/reports");
const fetchInsights = createOrgQuery<ReportInsight[]>("/reports");
const fetchForecast = createOrgQuery<ReportForecast>("/reports");
const fetchTargets = createOrgQuery<ReportTarget[]>("/reports");
const fetchRetention = createOrgQuery<CustomerRetentionData>("/reports");
const fetchPnl = createOrgQuery<PnLSummary>("/reports");
const fetchServiceBreakdown = createOrgQuery<ServiceBreakdown[]>("/reports");
const fetchMechanics =
  createOrgQuery<Array<{ id: string; full_name: string | null }>>("/reports");

// ── Hooks ──────────────────────────────────────────────────

/**
 * Core report data (daily/weekly/monthly/eod).
 * Uses reportType + selectedMechanic + date as cache key.
 */
export function useReport(
  orgId: string | undefined,
  reportType: string,
  params: Record<string, string>,
  branchId?: string | null,
): UseQueryResult<unknown, Error> {
  const paramKey = JSON.stringify({
    type: reportType,
    branch: branchId ?? "all",
    ...params,
  });
  return useQuery({
    queryKey: reportKeys.summary(orgId ?? "", reportType, paramKey, branchId),
    queryFn: async () => {
      if (!orgId) {
        throw new Error("Organization is required");
      }
      return fetchReport(orgId, {
        params: { type: reportType, branch: branchId ?? "all", ...params },
      });
    },
    enabled: !!orgId,
    staleTime: 60_000,
    retry: 1,
  });
}

/** Mechanic list for the filter dropdown. */
export function useMechanics(
  orgId: string | undefined,
  branchId?: string | null,
): UseQueryResult<Array<{ id: string; full_name: string | null }>, Error> {
  return useQuery({
    queryKey: reportKeys.mechanics(orgId ?? "", branchId),
    queryFn: async () => {
      if (!orgId) {
        throw new Error("Organization is required");
      }
      return fetchMechanics(orgId, {
        params: { type: "mechanics", branch: branchId ?? "all" },
      });
    },
    enabled: !!orgId,
    staleTime: 300_000,
    retry: 1,
  });
}

/** Automated insights for a date range. */
export function useReportInsights(
  orgId: string | undefined,
  dateFrom: string,
  dateTo: string,
  enabled = true,
  branchId?: string | null,
): UseQueryResult<ReportInsight[], Error> {
  return useQuery({
    queryKey: reportKeys.insights(orgId ?? "", dateFrom, dateTo, branchId),
    queryFn: async () => {
      if (!orgId) {
        throw new Error("Organization is required");
      }
      return fetchInsights(orgId, {
        params: {
          type: "insights",
          date_from: dateFrom,
          date_to: dateTo,
          branch: branchId ?? "all",
        },
      });
    },
    enabled: !!orgId && enabled,
    staleTime: 120_000,
    retry: 1,
  });
}

/** Revenue forecast / projection. */
export function useReportForecast(
  orgId: string | undefined,
  periodType: string,
  date: string,
  enabled = true,
  branchId?: string | null,
): UseQueryResult<ReportForecast, Error> {
  return useQuery({
    queryKey: reportKeys.forecast(orgId ?? "", periodType, date, branchId),
    queryFn: async () => {
      if (!orgId) {
        throw new Error("Organization is required");
      }
      return fetchForecast(orgId, {
        params: {
          type: "forecast",
          period_type: periodType,
          date,
          branch: branchId ?? "all",
        },
      });
    },
    enabled: !!orgId && enabled,
    staleTime: 120_000,
    retry: 1,
  });
}

/** Revenue targets. */
export function useReportTargets(
  orgId: string | undefined,
  periodType: string,
  date: string,
  enabled = true,
  branchId?: string | null,
): UseQueryResult<ReportTarget[], Error> {
  return useQuery({
    queryKey: reportKeys.targets(orgId ?? "", periodType, date, branchId),
    queryFn: async () => {
      if (!orgId) {
        throw new Error("Organization is required");
      }
      return fetchTargets(orgId, {
        params: {
          type: "targets",
          period_type: periodType,
          date,
          branch: branchId ?? "all",
        },
      });
    },
    enabled: !!orgId && enabled,
    staleTime: 60_000,
    retry: 1,
  });
}

/** Customer retention analytics. */
export function useReportRetention(
  orgId: string | undefined,
  dateFrom: string,
  dateTo: string,
  enabled = true,
  branchId?: string | null,
): UseQueryResult<CustomerRetentionData, Error> {
  return useQuery({
    queryKey: reportKeys.retention(orgId ?? "", dateFrom, dateTo, branchId),
    queryFn: async () => {
      if (!orgId) {
        throw new Error("Organization is required");
      }
      return fetchRetention(orgId, {
        params: {
          type: "retention",
          date_from: dateFrom,
          date_to: dateTo,
          branch: branchId ?? "all",
        },
      });
    },
    enabled: !!orgId && enabled,
    staleTime: 120_000,
    retry: 1,
  });
}

/** P&L summary. */
export function useReportPnl(
  orgId: string | undefined,
  dateFrom: string,
  dateTo: string,
  enabled = true,
  branchId?: string | null,
): UseQueryResult<PnLSummary, Error> {
  return useQuery({
    queryKey: reportKeys.pnl(orgId ?? "", dateFrom, dateTo, branchId),
    queryFn: async () => {
      if (!orgId) {
        throw new Error("Organization is required");
      }
      return fetchPnl(orgId, {
        params: {
          type: "pnl",
          date_from: dateFrom,
          date_to: dateTo,
          branch: branchId ?? "all",
        },
      });
    },
    enabled: !!orgId && enabled,
    staleTime: 120_000,
    retry: 1,
  });
}

/** Revenue by service type breakdown. */
export function useReportServiceBreakdown(
  orgId: string | undefined,
  dateFrom: string,
  dateTo: string,
  enabled = true,
  branchId?: string | null,
): UseQueryResult<ServiceBreakdown[], Error> {
  return useQuery({
    queryKey: reportKeys.serviceBreakdown(
      orgId ?? "",
      dateFrom,
      dateTo,
      branchId,
    ),
    queryFn: async () => {
      if (!orgId) {
        throw new Error("Organization is required");
      }
      return fetchServiceBreakdown(orgId, {
        params: {
          type: "service-breakdown",
          date_from: dateFrom,
          date_to: dateTo,
          branch: branchId ?? "all",
        },
      });
    },
    enabled: !!orgId && enabled,
    staleTime: 120_000,
    retry: 1,
  });
}
