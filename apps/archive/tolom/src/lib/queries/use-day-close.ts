/**
 * React Query hooks for day-close operations.
 *
 * Replaces raw fetch() in the EOD close page with proper caching,
 * background refetching, and mutation support.
 */

import {
  keepPreviousData,
  type UseQueryResult,
  useQuery,
} from "@tanstack/react-query";
import { useOrgMutation } from "@zuiio/query";
import type { EndOfDaySummary } from "@/lib/types";
import { createOrgQuery } from "./factory";
import { dayCloseKeys, reportKeys } from "./keys";

// ── Types ──────────────────────────────────────────────────

export interface DayCloseStatus {
  isClosed: boolean;
  streak: number;
}

export interface CloseDayResponse {
  success: boolean;
  streak: number;
}

// ── Fetchers ───────────────────────────────────────────────

const fetchEodReport = createOrgQuery<EndOfDaySummary>("/reports");
const fetchDayCloseStatus = createOrgQuery<DayCloseStatus>("/day-close");

// ── Hooks ──────────────────────────────────────────────────

/**
 * Fetch the EOD summary for a given date.
 */
export function useEodReport(
  orgId: string | undefined,
  date: string,
  branchId?: string | null,
): UseQueryResult<EndOfDaySummary, Error> {
  return useQuery({
    queryKey: reportKeys.summary(orgId ?? "", "eod", date, branchId),
    queryFn: async () => {
      if (!orgId) {
        throw new Error("Organization is required");
      }
      return fetchEodReport(orgId, {
        params: {
          type: "eod",
          date,
          ...(branchId ? { branch_id: branchId } : {}),
        },
      });
    },
    enabled: !!orgId,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    retry: 1,
  });
}

/**
 * Fetch day-close status (isClosed + streak) for a given date.
 */
export function useDayCloseStatus(
  orgId: string | undefined,
  date: string,
): UseQueryResult<DayCloseStatus, Error> {
  return useQuery({
    queryKey: dayCloseKeys.status(orgId ?? "", date),
    queryFn: async () => {
      if (!orgId) {
        throw new Error("Organization is required");
      }
      return fetchDayCloseStatus(orgId, { params: { date } });
    },
    enabled: !!orgId,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    retry: 1,
  });
}

/**
 * Mutation to close the day.
 * Invalidates both the EOD report and day-close status caches on success.
 */
export function useCloseDay(
  orgId: string | undefined,
  date: string,
  branchId?: string | null,
) {
  return useOrgMutation<CloseDayResponse, void>({
    endpoint: `/api/organizations/${orgId}/day-close`,
    method: "POST",
    queryKey: dayCloseKeys.status(orgId ?? "", date),
    invalidateKeys: [reportKeys.summary(orgId ?? "", "eod", date, branchId)],
    // No success toast — the UI updates via cache invalidation
  });
}
