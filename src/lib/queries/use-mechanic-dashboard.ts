/**
 * React Query hooks for the mechanic dashboard page.
 *
 * Replaces raw fetch() + useState with:
 * - Automatic caching (staleTime)
 * - Deduplication of concurrent requests
 * - Background refetching via refetchInterval
 * - Stale-while-revalidate (placeholderData from previous)
 * - Optimistic updates for clock toggle
 */
import {
  type UseQueryResult,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { clockKeys, mechanicKeys } from "./keys";

// ── Types ──────────────────────────────────────────

export interface MechanicEodSummary {
  mechanic_id: string;
  mechanic_name: string;
  work_orders_completed: number;
  services_count: number;
  parts_count: number;
  total_revenue: number;
}

export interface WorkOrderRow {
  id: string;
  status: string;
  description: string | null;
  total: number;
  customer_name: string | null;
  vehicle_plate: string | null;
  vehicle_id: string | null;
  created_at: string;
}

export interface MechanicTrend {
  avgJobValue: number;
  jobsPerDay: number;
  weeklyTrend: { week: string; orders: number; revenue: number }[];
}

export interface ClockStatus {
  clockedIn: boolean;
  since: string | null;
  todayHours: number;
}

// ── Helpers ─────────────────────────────────────────

function apiUrl(orgId: string, path: string): string {
  return `/api/organizations/${orgId}${path}`;
}

async function fetchJson<T>(url: string): Promise<T | null> {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error?.message ?? `Request failed (${res.status})`);
  }
  const json = await res.json();
  return (json.data as T) ?? null;
}

// ── EOD Summary ────────────────────────────────────

/**
 * End-of-day summary for a mechanic (today's completed orders, revenue, etc).
 * Auto-refetches every 30s while the page is active.
 */
export function useMechanicEod(
  orgId: string | undefined,
  userId: string | undefined,
): UseQueryResult<MechanicEodSummary | null, Error> {
  return useQuery({
    queryKey: mechanicKeys.eod(orgId ?? "", userId ?? ""),
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const url = `${apiUrl(orgId!, "/reports")}?type=eod&date=${today}&mechanic=${userId!}`;
      const data = await fetchJson<{ mechanics: MechanicEodSummary[] }>(url);
      return data?.mechanics?.[0] ?? null;
    },
    enabled: !!orgId && !!userId,
    staleTime: 15_000,
    refetchInterval: 30_000,
    placeholderData: (prev) => prev,
  });
}

// ── Active Work Orders ─────────────────────────────

/**
 * Active work orders assigned to a mechanic.
 * Fetches orders in New, Diagnosing, In Progress, Ready for Pickup statuses.
 * Auto-refetches every 30s.
 */
export function useMechanicWorkOrders(
  orgId: string | undefined,
  userId: string | undefined,
): UseQueryResult<WorkOrderRow[], Error> {
  return useQuery({
    queryKey: mechanicKeys.workOrders(orgId ?? "", userId ?? ""),
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("mechanic", userId!);
      params.append("status", "In Progress");
      params.append("status", "Diagnosing");
      params.append("status", "New");
      params.append("status", "Ready for Pickup");
      const url = `${apiUrl(orgId!, "/work-orders")}?${params.toString()}`;
      return (await fetchJson<WorkOrderRow[]>(url)) ?? [];
    },
    enabled: !!orgId && !!userId,
    staleTime: 15_000,
    refetchInterval: 30_000,
    placeholderData: (prev) => prev,
  });
}

// ── Mechanic Trend ─────────────────────────────────

/**
 * Mechanic trend data (avg job value, jobs per day, weekly trend chart).
 * Auto-refetches every 5min — trends change slowly.
 */
export function useMechanicTrend(
  orgId: string | undefined,
  userId: string | undefined,
): UseQueryResult<MechanicTrend | null, Error> {
  return useQuery({
    queryKey: mechanicKeys.trend(orgId ?? "", userId ?? "", "", ""),
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const eightWeeksAgo = new Date(Date.now() - 56 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];
      const url = `${apiUrl(orgId!, "/reports")}?type=mechanic-trend&mechanic=${userId!}&period=weekly&startDate=${eightWeeksAgo}&endDate=${today}`;
      return fetchJson<MechanicTrend>(url);
    },
    enabled: !!orgId && !!userId,
    staleTime: 120_000,
    refetchInterval: 300_000,
    placeholderData: (prev) => prev,
  });
}

// ── Clock Status ───────────────────────────────────

/**
 * Current clock-in/out status for the authenticated user.
 * Auto-refetches every 15s to keep elapsed time accurate.
 */
export function useClockStatus(
  orgId: string | undefined,
): UseQueryResult<ClockStatus | null, Error> {
  return useQuery({
    queryKey: clockKeys.status(orgId ?? ""),
    queryFn: async () => {
      const url = apiUrl(orgId!, "/me/time/status");
      return fetchJson<ClockStatus>(url);
    },
    enabled: !!orgId,
    staleTime: 5000,
    refetchInterval: 15_000,
    placeholderData: (prev) => prev,
  });
}

// ── Clock Toggle Mutation ─────────────────────────

/**
 * Mutation to clock in or out. Invalidates the clock status query on success
 * so the next poll picks up the new state immediately.
 */
export function useClockToggle(orgId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (action: "clock-in" | "clock-out") => {
      const url = apiUrl(orgId!, `/me/time/${action}`);
      const res = await fetch(url, { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error?.message ?? `Failed to ${action}`);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: clockKeys.status(orgId ?? ""),
      });
    },
  });
}

// ── Mechanics List (Admin view) ────────────────────

export interface MechanicItem {
  id: string;
  full_name: string | null;
}

/**
 * Fetch the list of mechanics for admin dashboard selector.
 * Stale after 5min — mechanics list rarely changes.
 */
export function useMechanicsList(
  orgId: string | undefined,
): UseQueryResult<MechanicItem[], Error> {
  return useQuery({
    queryKey: mechanicKeys.list(orgId ?? ""),
    queryFn: async () => {
      const url = `${apiUrl(orgId!, "/reports")}?type=mechanics`;
      return (await fetchJson<MechanicItem[]>(url)) ?? [];
    },
    enabled: !!orgId,
    staleTime: 300_000,
    placeholderData: (prev) => prev,
  });
}
