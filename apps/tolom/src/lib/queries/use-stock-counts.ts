import {
  keepPreviousData,
  type UseQueryResult,
  useQuery,
} from "@tanstack/react-query";
import { useOrgMutation } from "@zuiio/query";
import { createOrgQuery } from "./factory";
import { inventoryKeys, stockCountKeys } from "./keys";

// ── Types ──────────────────────────────────────────────────────

export interface StockCountSession {
  id: string;
  organization_id: string;
  branch_id?: string;
  status: "in_progress" | "completed" | "cancelled";
  counted_by: string;
  total_items: number;
  total_variance: number;
  notes?: string;
  started_at: string;
  completed_at?: string;
}

export interface StockCountItem {
  id: string;
  session_id: string;
  part_id: string;
  system_quantity: number;
  physical_quantity: number;
  variance: number;
  notes?: string;
  part_name?: string | null;
  part_number?: string | null;
}

export interface StockCountSessionWithItems extends StockCountSession {
  items: StockCountItem[];
}

export interface CreateStockCountSessionInput {
  branch_id?: string;
  notes?: string;
}

export interface AddCountItemInput {
  sessionId: string;
  part_id: string;
  physical_quantity: number;
  notes?: string;
}

export interface RemoveCountItemInput {
  sessionId: string;
  itemId: string;
}

export interface ReconcileSessionInput {
  sessionId: string;
}

export interface CancelSessionInput {
  sessionId: string;
}

// ── Query fetchers ──────────────────────────────────────────────

const fetchStockCountSessions = createOrgQuery<StockCountSession[]>(
  "/inventory/stock-counts/sessions",
);

const fetchStockCountSession = createOrgQuery<StockCountSessionWithItems>(
  "/inventory/stock-counts/sessions",
);

// ── Hooks ───────────────────────────────────────────────────────

/**
 * Get stock count sessions for an organization with optional status filter.
 */
export function useStockCountSessions(
  orgId: string | undefined,
  status?: string,
): UseQueryResult<StockCountSession[], Error> {
  return useQuery({
    queryKey: stockCountKeys.sessions(orgId ?? "", status),
    queryFn: () => {
      if (!orgId) throw new Error("orgId required");
      return fetchStockCountSessions(orgId, {
        params: {
          ...(status ? { status } : {}),
        },
      });
    },
    enabled: !!orgId,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

/**
 * Get a single stock count session with its items.
 */
export function useStockCountSession(
  orgId: string | undefined,
  sessionId: string,
): UseQueryResult<StockCountSessionWithItems, Error> {
  return useQuery({
    queryKey: stockCountKeys.session(orgId ?? "", sessionId),
    queryFn: () => {
      if (!orgId) throw new Error("orgId required");
      return fetchStockCountSession(orgId, {
        params: { sessionId },
      });
    },
    enabled: !!orgId && !!sessionId,
    staleTime: 30_000,
  });
}

// ── Mutations ───────────────────────────────────────────────────

/**
 * Create a new stock count session.
 */
export function useCreateStockCountSession(orgId: string | undefined) {
  return useOrgMutation<StockCountSession, CreateStockCountSessionInput>({
    endpoint: `/api/organizations/${orgId}/inventory/stock-counts/sessions`,
    method: "POST",
    queryKey: stockCountKeys.sessions(orgId ?? ""),
    successMessage: "Stock count session created",
  });
}

/**
 * Add a counted item to a stock count session.
 */
export function useAddCountItem(orgId: string | undefined) {
  return useOrgMutation<StockCountItem, AddCountItemInput>({
    endpoint: (vars) =>
      `/api/organizations/${orgId}/inventory/stock-counts/sessions/${vars.sessionId}/items`,
    method: "POST",
    queryKey: stockCountKeys.all(orgId ?? ""),
    bodyFn: ({ sessionId: _sessionId, ...payload }) => payload,
    successMessage: "Count item added",
  });
}

/**
 * Remove a counted item from a stock count session.
 */
export function useRemoveCountItem(orgId: string | undefined) {
  return useOrgMutation<void, RemoveCountItemInput>({
    endpoint: (vars) =>
      `/api/organizations/${orgId}/inventory/stock-counts/sessions/${vars.sessionId}/items?itemId=${vars.itemId}`,
    method: "DELETE",
    queryKey: stockCountKeys.all(orgId ?? ""),
    successMessage: "Count item removed",
  });
}

/**
 * Reconcile a stock count session — creates count_adjustment movements
 * for all items with variance != 0, then marks session as completed.
 * Invalidates inventory balances since movements are created.
 */
export function useReconcileSession(orgId: string | undefined) {
  return useOrgMutation<StockCountSession, ReconcileSessionInput>({
    endpoint: (vars) =>
      `/api/organizations/${orgId}/inventory/stock-counts/sessions/${vars.sessionId}`,
    method: "PATCH",
    queryKey: stockCountKeys.session(orgId ?? "", ""),
    bodyFn: () => ({ action: "reconcile" }),
    invalidateKeys: [inventoryKeys.all(orgId ?? "")],
    successMessage: "Stock count reconciled",
  });
}

/**
 * Cancel a stock count session.
 */
export function useCancelSession(orgId: string | undefined) {
  return useOrgMutation<StockCountSession, CancelSessionInput>({
    endpoint: (vars) =>
      `/api/organizations/${orgId}/inventory/stock-counts/sessions/${vars.sessionId}`,
    method: "PATCH",
    queryKey: stockCountKeys.sessions(orgId ?? ""),
    bodyFn: () => ({ action: "cancel" }),
    successMessage: "Stock count cancelled",
  });
}
