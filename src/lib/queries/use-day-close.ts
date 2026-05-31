/**
 * React Query hooks for day-close operations.
 *
 * Replaces raw fetch() in the EOD close page with proper caching,
 * background refetching, and mutation support.
 */

import {
  type UseMutationResult,
  type UseQueryResult,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toastRetry } from "@/lib/toast-utils";
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
): UseQueryResult<EndOfDaySummary, Error> {
  return useQuery({
    queryKey: reportKeys.summary(orgId ?? "", "eod", date),
    queryFn: () => fetchEodReport(orgId!, { params: { type: "eod", date } }),
    enabled: !!orgId,
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
    queryFn: () => fetchDayCloseStatus(orgId!, { params: { date } }),
    enabled: !!orgId,
    staleTime: 10_000,
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
): UseMutationResult<CloseDayResponse, Error, void> {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      if (!orgId) throw new Error("No org selected");
      const res = await fetch(`/api/organizations/${orgId}/day-close`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? err.message ?? "Failed to close day");
      }
      const json = await res.json();
      return json.data as CloseDayResponse;
    },
    onSuccess: () => {
      // Invalidate both caches so page refreshes with latest state
      if (orgId) {
        queryClient.invalidateQueries({
          queryKey: dayCloseKeys.status(orgId, date),
        });
        queryClient.invalidateQueries({
          queryKey: reportKeys.summary(orgId, "eod", date),
        });
      }
    },
    onError: (error) => {
      toastRetry(error.message, () => mutation.mutateAsync());
    },
  });

  return mutation;
}
