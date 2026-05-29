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
import { createOrgQuery } from "./factory";
import { reportKeys } from "./keys";
import type {
  CustomerRetentionData,
  PnLSummary,
  ReportForecast,
  ReportInsight,
  ReportMechanicKpi,
  ReportTarget,
  ServiceBreakdown,
} from "@/lib/types";

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
): UseQueryResult<unknown, Error> {
  const paramKey = JSON.stringify({ type: reportType, ...params });
  return useQuery({
    queryKey: reportKeys.summary(orgId ?? "", reportType, paramKey),
    queryFn: () =>
      fetchReport(orgId!, { params: { type: reportType, ...params } }),
    enabled: !!orgId,
    staleTime: 60_000,
    retry: 1,
  });
}

/** Mechanic list for the filter dropdown. */
export function useMechanics(
  orgId: string | undefined,
): UseQueryResult<Array<{ id: string; full_name: string | null }>, Error> {
  return useQuery({
    queryKey: reportKeys.mechanics(orgId ?? ""),
    queryFn: () => fetchMechanics(orgId!, { params: { type: "mechanics" } }),
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
): UseQueryResult<ReportInsight[], Error> {
  return useQuery({
    queryKey: reportKeys.insights(orgId ?? "", dateFrom, dateTo),
    queryFn: () =>
      fetchInsights(orgId!, {
        params: { type: "insights", date_from: dateFrom, date_to: dateTo },
      }),
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
): UseQueryResult<ReportForecast, Error> {
  return useQuery({
    queryKey: reportKeys.forecast(orgId ?? "", periodType, date),
    queryFn: () =>
      fetchForecast(orgId!, {
        params: { type: "forecast", period_type: periodType, date },
      }),
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
): UseQueryResult<ReportTarget[], Error> {
  return useQuery({
    queryKey: reportKeys.targets(orgId ?? "", periodType, date),
    queryFn: () =>
      fetchTargets(orgId!, {
        params: { type: "targets", period_type: periodType, date },
      }),
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
): UseQueryResult<CustomerRetentionData, Error> {
  return useQuery({
    queryKey: reportKeys.retention(orgId ?? "", dateFrom, dateTo),
    queryFn: () =>
      fetchRetention(orgId!, {
        params: { type: "retention", date_from: dateFrom, date_to: dateTo },
      }),
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
): UseQueryResult<PnLSummary, Error> {
  return useQuery({
    queryKey: reportKeys.pnl(orgId ?? "", dateFrom, dateTo),
    queryFn: () =>
      fetchPnl(orgId!, {
        params: { type: "pnl", date_from: dateFrom, date_to: dateTo },
      }),
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
): UseQueryResult<ServiceBreakdown[], Error> {
  return useQuery({
    queryKey: reportKeys.serviceBreakdown(orgId ?? "", dateFrom, dateTo),
    queryFn: () =>
      fetchServiceBreakdown(orgId!, {
        params: {
          type: "service-breakdown",
          date_from: dateFrom,
          date_to: dateTo,
        },
      }),
    enabled: !!orgId && enabled,
    staleTime: 120_000,
    retry: 1,
  });
}
