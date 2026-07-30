import type { UseQueryResult } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { useOrgMutation } from "@zuiio/query";
import { createOrgQuery } from "./factory";
import { itpKeys } from "./keys";

// ── Types ──────────────────────────────────────────────────────

export interface ItpRecordItem {
  vehicle_id: string;
  plate_number: string;
  make: string;
  model: string;
  year: number | null;
  itp_expiry_date: string | null;
  itp_last_passed_date: string | null;
  itp_notes: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  days_until_expiry: number | null;
  itp_status: "valid" | "expiring_soon" | "expired" | "unknown";
}

export interface ItpStatsData {
  total: number;
  valid: number;
  expiring_soon: number;
  expired: number;
  unknown: number;
}

export interface ItpHistoryItem {
  id: string;
  organization_id: string;
  vehicle_id: string;
  branch_id: string | null;
  user_id: string | null;
  previous_expiry_date: string | null;
  new_expiry_date: string | null;
  previous_status: string | null;
  new_status: string | null;
  notes: string | null;
  action_type: "record_inspection" | "update_expiry" | "reminder_sent" | "system_update";
  created_at: string;
}

// ── Query fetchers ──────────────────────────────────────────────

const fetchItpRecords = createOrgQuery<ItpRecordItem[]>("/itp");
const fetchItpStats = createOrgQuery<ItpStatsData>("/itp");
const fetchExpiringItpRecords = createOrgQuery<ItpRecordItem[]>("/itp");
const fetchItpRecord = createOrgQuery<ItpRecordItem>(`/itp`);
const fetchItpHistoryItems = createOrgQuery<ItpHistoryItem[]>(`/itp`);

// ── Hooks ───────────────────────────────────────────────────────

/**
 * Get ITP records for an organization with optional filters.
 */
export function useItpRecords(
  orgId: string | undefined,
  filters?: {
    status?: "valid" | "expiring_soon" | "expired" | "unknown";
    search?: string;
    branchId?: string | null;
    limit?: number;
    offset?: number;
  },
): UseQueryResult<{ data: ItpRecordItem[]; total: number }, Error> {
  return useQuery({
    queryKey: itpKeys.list(orgId ?? "", filters?.status),
    queryFn: () => {
      if (!orgId) throw new Error("orgId required");
      return fetchItpRecords(orgId, {
        params: {
          ...(filters?.status ? { status: filters.status } : {}),
          ...(filters?.search ? { search: filters.search } : {}),
          ...(filters?.branchId ? { branch_id: filters.branchId } : {}),
          ...(filters?.limit ? { limit: filters.limit } : {}),
          ...(filters?.offset ? { offset: filters.offset } : {}),
        },
      }) as unknown as Promise<{ data: ItpRecordItem[]; total: number }>;
    },
    enabled: !!orgId,
    staleTime: 30_000,
  });
}

/**
 * Get ITP stats for the dashboard widget.
 */
export function useItpStats(
  orgId: string | undefined,
  branchId?: string | null,
): UseQueryResult<ItpStatsData, Error> {
  return useQuery({
    queryKey: itpKeys.stats(orgId ?? "", branchId ?? undefined),
    queryFn: () => {
      if (!orgId) throw new Error("orgId required");
      return fetchItpStats(orgId, {
        params: {
          stats: true,
          ...(branchId ? { branch_id: branchId } : {}),
        },
      });
    },
    enabled: !!orgId,
    staleTime: 60_000,
  });
}

/**
 * Get expiring ITP records for the dashboard widget.
 */
export function useExpiringItpRecords(
  orgId: string | undefined,
  branchId?: string | null,
): UseQueryResult<ItpRecordItem[], Error> {
  return useQuery({
    queryKey: itpKeys.expiring(orgId ?? "", branchId ?? undefined),
    queryFn: () => {
      if (!orgId) throw new Error("orgId required");
      return fetchExpiringItpRecords(orgId, {
        params: {
          expiring: true,
          ...(branchId ? { branch_id: branchId } : {}),
        },
      });
    },
    enabled: !!orgId,
    staleTime: 60_000,
  });
}

/**
 * Get a single vehicle's ITP record.
 */
export function useItpRecord(
  orgId: string | undefined,
  vehicleId: string,
): UseQueryResult<ItpRecordItem, Error> {
  return useQuery({
    queryKey: itpKeys.detail(orgId ?? "", vehicleId),
    queryFn: () => {
      if (!orgId) throw new Error("orgId required");
      return fetchItpRecord(orgId);
    },
    enabled: !!orgId && !!vehicleId,
    staleTime: 30_000,
  });
}

/**
 * Get ITP history (audit trail) for a specific vehicle.
 */
export function useItpHistory(
  orgId: string | undefined,
  vehicleId: string,
): UseQueryResult<ItpHistoryItem[], Error> {
  return useQuery({
    queryKey: itpKeys.history(orgId ?? "", vehicleId),
    queryFn: () => {
      if (!orgId) throw new Error("orgId required");
      return fetchItpHistoryItems(orgId, {
        params: { include_history: true },
      });
    },
    enabled: !!orgId && !!vehicleId,
    staleTime: 30_000,
  });
}

// ── Mutations ───────────────────────────────────────────────────

/**
 * Record a new ITP inspection for a vehicle.
 */
export function useRecordItpInspection(orgId: string | undefined) {
  return useOrgMutation<
    ItpRecordItem,
    {
      vehicle_id: string;
      itp_expiry_date: string;
      itp_last_passed_date: string;
      itp_notes?: string | null;
      branch_id?: string | null;
    }
  >({
    endpoint: `/api/organizations/${orgId}/itp`,
    method: "POST",
    queryKey: itpKeys.all(orgId ?? ""),
    successMessage: "ITP inspection recorded",
  });
}

/**
 * Update ITP fields on a vehicle (manual correction).
 */
export function useUpdateItpRecord(orgId: string | undefined) {
  return useOrgMutation<
    ItpRecordItem,
    {
      vehicle_id: string;
      itp_expiry_date?: string | null;
      itp_last_passed_date?: string | null;
      itp_notes?: string | null;
    }
  >({
    endpoint: ({ vehicle_id }) =>
      `/api/organizations/${orgId}/itp/${vehicle_id}`,
    method: "PATCH",
    queryKey: itpKeys.all(orgId ?? ""),
    bodyFn: ({ vehicle_id: _id, ...payload }) => payload,
    successMessage: "ITP record updated",
  });
}

/**
 * Send ITP reminder for a vehicle.
 */
export function useSendItpReminder(orgId: string | undefined) {
  return useOrgMutation<
    { sent: boolean },
    string
  >({
    endpoint: (vehicleId) =>
      `/api/organizations/${orgId}/itp/${vehicleId}/reminder`,
    method: "POST",
    queryKey: itpKeys.all(orgId ?? ""),
    successMessage: "ITP reminder sent",
  });
}
