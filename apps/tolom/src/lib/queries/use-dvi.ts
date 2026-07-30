import type { UseQueryResult } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { useOrgMutation } from "@zuiio/query";
import { createOrgQuery } from "./factory";
import { dviKeys } from "./keys";

// ── Types ──────────────────────────────────────────────────────

export interface DVInspection {
  id: string;
  organization_id: string;
  vehicle_id?: string;
  customer_id?: string;
  branch_id?: string;
  status:
    | "draft"
    | "ready"
    | "sent"
    | "partially_approved"
    | "approved"
    | "declined"
    | "converted";
  created_by: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  total_estimated_cost?: number;
  sent_at?: string;
  customer_viewed_at?: string;
  converted_work_order_id?: string;
}

export interface DVIItem {
  id: string;
  inspection_id: string;
  category:
    | "exterior"
    | "interior"
    | "tires"
    | "brakes"
    | "under_hood"
    | "under_vehicle"
    | "lights"
    | "fluids"
    | "battery"
    | "belts_hoses";
  condition: "good" | "fair" | "poor" | "fail" | "not_checked";
  severity: "info" | "monitor" | "recommend" | "urgent" | "critical";
  title: string;
  description?: string;
  image_url?: string;
  estimated_cost?: number;
  position: number;
  created_at: string;
}

export interface CreateDVInspectionInput {
  vehicle_id?: string;
  customer_id?: string;
  branch_id?: string;
  notes?: string;
}

export interface UpdateDVInspectionInput {
  id: string;
  vehicle_id?: string;
  notes?: string;
}

export interface AddDVIItemInput {
  inspection_id: string;
  category: string;
  condition: string;
  severity: string;
  title: string;
  description?: string;
  image_url?: string;
  estimated_cost?: number;
  position?: number;
}

export interface UpdateDVIItemInput {
  inspection_id: string;
  item_id: string;
  category?: string;
  condition?: string;
  severity?: string;
  title?: string;
  description?: string;
  image_url?: string;
  estimated_cost?: number;
  position?: number;
}

export interface RemoveDVIItemInput {
  inspection_id: string;
  item_id: string;
}

export interface SendDVInspectionInput {
  id: string;
}

export interface ConvertDVInspectionInput {
  id: string;
}

// ── Query fetchers ──────────────────────────────────────────────

const fetchDVInspections = createOrgQuery<DVInspection[]>("/dv-inspections");
const fetchDVInspection = createOrgQuery<DVInspection>("/dv-inspections");

// ── Hooks ───────────────────────────────────────────────────────

/**
 * Get DVI inspections for an organization with optional filters.
 */
export function useDVInspections(
  orgId: string | undefined,
  filters?: {
    status?: string;
    vehicleId?: string;
    branchId?: string | null;
  },
): UseQueryResult<DVInspection[], Error> {
  return useQuery({
    queryKey: dviKeys.list(orgId ?? "", filters?.status),
    queryFn: () => {
      if (!orgId) throw new Error("orgId required");
      return fetchDVInspections(orgId, {
        params: {
          ...(filters?.status ? { status: filters.status } : {}),
          ...(filters?.vehicleId ? { vehicle_id: filters.vehicleId } : {}),
          ...(filters?.branchId ? { branch_id: filters.branchId } : {}),
        },
      });
    },
    enabled: !!orgId,
    staleTime: 30_000,
  });
}

/**
 * Get a single DVI inspection by ID.
 */
export function useDVInspection(
  orgId: string | undefined,
  id: string,
): UseQueryResult<DVInspection, Error> {
  return useQuery({
    queryKey: dviKeys.detail(orgId ?? "", id),
    queryFn: () => {
      if (!orgId) throw new Error("orgId required");
      return fetchDVInspection(orgId, {
        params: { id },
      });
    },
    enabled: !!orgId && !!id,
    staleTime: 30_000,
  });
}

// ── Mutations ───────────────────────────────────────────────────

/**
 * Create a new DVI inspection.
 */
export function useCreateDVInspection(orgId: string | undefined) {
  return useOrgMutation<DVInspection, CreateDVInspectionInput>({
    endpoint: `/api/organizations/${orgId}/dv-inspections`,
    method: "POST",
    queryKey: dviKeys.all(orgId ?? ""),
    successMessage: "DVI inspection created",
  });
}

/**
 * Update a DVI inspection.
 */
export function useUpdateDVInspection(orgId: string | undefined) {
  return useOrgMutation<DVInspection, UpdateDVInspectionInput>({
    endpoint: (vars) => `/api/organizations/${orgId}/dv-inspections/${vars.id}`,
    method: "PATCH",
    queryKey: dviKeys.all(orgId ?? ""),
    bodyFn: ({ id: _id, ...payload }) => payload,
    successMessage: "DVI inspection updated",
  });
}

/**
 * Add an item to a DVI inspection.
 */
export function useAddDVIItem(orgId: string | undefined) {
  return useOrgMutation<DVIItem, AddDVIItemInput>({
    endpoint: (vars) =>
      `/api/organizations/${orgId}/dv-inspections/${vars.inspection_id}/items`,
    method: "POST",
    queryKey: dviKeys.all(orgId ?? ""),
    bodyFn: ({ inspection_id: _id, ...payload }) => payload,
    successMessage: "DVI item added",
  });
}

/**
 * Update a DVI inspection item.
 */
export function useUpdateDVIItem(orgId: string | undefined) {
  return useOrgMutation<DVIItem, UpdateDVIItemInput>({
    endpoint: (vars) =>
      `/api/organizations/${orgId}/dv-inspections/${vars.inspection_id}/items/${vars.item_id}`,
    method: "PATCH",
    queryKey: dviKeys.all(orgId ?? ""),
    bodyFn: ({ inspection_id: _id, item_id: _itemId, ...payload }) => payload,
    successMessage: "DVI item updated",
  });
}

/**
 * Remove an item from a DVI inspection.
 */
export function useRemoveDVIItem(orgId: string | undefined) {
  return useOrgMutation<void, RemoveDVIItemInput>({
    endpoint: (vars) =>
      `/api/organizations/${orgId}/dv-inspections/${vars.inspection_id}/items/${vars.item_id}`,
    method: "DELETE",
    queryKey: dviKeys.all(orgId ?? ""),
    successMessage: "DVI item removed",
  });
}

/**
 * Send a DVI inspection to the customer.
 */
export function useSendDVInspection(orgId: string | undefined) {
  return useOrgMutation<{ sent: boolean }, SendDVInspectionInput>({
    endpoint: (vars) =>
      `/api/organizations/${orgId}/dv-inspections/${vars.id}/send`,
    method: "POST",
    queryKey: dviKeys.all(orgId ?? ""),
    successMessage: "DVI inspection sent",
  });
}

/**
 * Convert a DVI inspection to a work order.
 */
export function useConvertDVInspection(orgId: string | undefined) {
  return useOrgMutation<{ work_order_id: string }, ConvertDVInspectionInput>({
    endpoint: (vars) =>
      `/api/organizations/${orgId}/dv-inspections/${vars.id}/convert`,
    method: "POST",
    queryKey: dviKeys.all(orgId ?? ""),
    successMessage: "DVI inspection converted to work order",
  });
}
