/**
 * React Query hooks for the mechanic dashboard page.
 *
 * Uses createOrgQuery for offline IndexedDB caching on data hooks.
 * Clock hooks use raw fetch (real-time data, no offline value).
 */
import {
  type UseQueryResult,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { createOrgQuery } from "./factory";
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
  started_at: string | null;
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

// ── Fetchers (offline-cached via createOrgQuery) ───

const fetchReports = createOrgQuery<{
  mechanics?: MechanicEodSummary[];
  data?: unknown;
}>("/reports");

// ── EOD Summary ────────────────────────────────────

/**
 * End-of-day summary for a mechanic (today's completed orders, revenue, etc).
 * Auto-refetches every 30s. Cached to IndexedDB for offline use.
 */
export function useMechanicEod(
  orgId: string | undefined,
  userId: string | undefined,
): UseQueryResult<MechanicEodSummary | null, Error> {
  return useQuery({
    queryKey: mechanicKeys.eod(orgId ?? "", userId ?? ""),
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const data = await fetchReports(orgId!, {
        params: { type: "eod", date: today, mechanic: userId! },
        cacheKeyParams: { type: "eod", mechanic: userId! },
      });
      const mechanic = (data?.mechanics ?? []).find(
        (m: { mechanic_id: string }) => m.mechanic_id === userId!,
      );
      return mechanic ?? null;
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
 * Auto-refetches every 30s. Cached to IndexedDB for offline use.
 */
export function useMechanicWorkOrders(
  orgId: string | undefined,
  userId: string | undefined,
): UseQueryResult<WorkOrderRow[], Error> {
  return useQuery({
    queryKey: mechanicKeys.workOrders(orgId ?? "", userId ?? ""),
    queryFn: async () => {
      // Build status params manually (factory doesn't support arrays)
      const statuses = ["In Progress", "Diagnosing", "New", "Ready for Pickup"];
      const statusParams = new URLSearchParams();
      statusParams.set("mechanic", userId!);
      for (const s of statuses) statusParams.append("status", s);
      const res = await fetch(
        `/api/organizations/${orgId}/work-orders?${statusParams.toString()}`,
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          body.error?.message ?? `Request failed (${res.status})`,
        );
      }
      const json = await res.json();
      return (json.data as WorkOrderRow[]) ?? [];
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
 * Auto-refetches every 5min. Cached to IndexedDB for offline use.
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
      const data = await fetchReports(orgId!, {
        params: {
          type: "mechanic-trend",
          mechanic: userId!,
          period: "weekly",
          startDate: eightWeeksAgo,
          endDate: today,
        },
        cacheKeyParams: { type: "mechanic-trend", mechanic: userId! },
      });
      return (data as unknown as MechanicTrend) ?? null;
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
 * Auto-refetches every 15s. Not cached (real-time data).
 */
export function useClockStatus(
  orgId: string | undefined,
): UseQueryResult<ClockStatus | null, Error> {
  return useQuery({
    queryKey: clockKeys.status(orgId ?? ""),
    queryFn: async () => {
      const res = await fetch(`/api/organizations/${orgId}/me/time/status`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          body.error?.message ?? `Request failed (${res.status})`,
        );
      }
      const json = await res.json();
      return (json.data as ClockStatus) ?? null;
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
      const res = await fetch(`/api/organizations/${orgId}/me/time/${action}`, {
        method: "POST",
      });
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
  avatar_url: string | null;
}

/**
 * Fetch the list of mechanics for admin dashboard selector.
 * Stale after 5min. Cached to IndexedDB for offline use.
 */
export function useMechanicsList(
  orgId: string | undefined,
): UseQueryResult<MechanicItem[], Error> {
  return useQuery({
    queryKey: mechanicKeys.list(orgId ?? ""),
    queryFn: () =>
      fetchReports(orgId!, {
        params: { type: "mechanics" },
        cacheKeyParams: { type: "mechanics" },
      }) as Promise<MechanicItem[]>,
    enabled: !!orgId,
    staleTime: 300_000,
    placeholderData: (prev) => prev,
  });
}
