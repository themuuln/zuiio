import { useQuery } from "@tanstack/react-query";
import { createOrgQuery } from "@/lib/queries/factory";
import { inventoryKeys } from "@/lib/queries/keys";
import { useOrgMutation } from "@zuiio/query";
import type {
  CreateTransferParams,
  PaginatedResponse,
  StockTransfer,
  StockTransferRow,
  StockTransferStatus,
} from "@/lib/types";

// ── Fetchers ──────────────────────────────────────────────────

const fetchTransfers = createOrgQuery<PaginatedResponse<StockTransferRow>>(
  "/inventory/transfers",
  { unwrap: "direct" },
);

const fetchTransfer = createOrgQuery<StockTransferRow>("/inventory/transfers", {
  unwrap: "direct",
});

// ── Queries ───────────────────────────────────────────────────

export function useTransfers(
  orgId: string | undefined,
  options?: { status?: StockTransferStatus | "all"; branchId?: string | null },
) {
  return useQuery({
    queryKey: inventoryKeys.transfers(orgId ?? "", options?.status),
    queryFn: async () => {
      if (!orgId) throw new Error("Organization ID required");
      return fetchTransfers(orgId, {
        params: {
          status:
            options?.status && options.status !== "all"
              ? options.status
              : undefined,
          branch_id: options?.branchId ?? undefined,
        },
      });
    },
    enabled: !!orgId,
    staleTime: 30_000,
  });
}

export function useTransfer(
  orgId: string | undefined,
  transferId: string | undefined,
) {
  return useQuery({
    queryKey: inventoryKeys.transferDetail(orgId ?? "", transferId ?? ""),
    queryFn: async () => {
      if (!orgId) throw new Error("Organization ID required");
      return fetchTransfer(orgId, { params: undefined });
    },
    enabled: !!orgId && !!transferId,
    staleTime: 30_000,
  });
}

// ── Mutations ─────────────────────────────────────────────────

export function useCreateTransfer(orgId: string) {
  return useOrgMutation<StockTransfer, CreateTransferParams>({
    endpoint: `/api/organizations/${orgId}/inventory/transfers`,
    method: "POST",
    queryKey: inventoryKeys.transfers(orgId),
    optimisticUpdate: (old, vars) => {
      const tempTransfer = {
        id: `temp-${Date.now()}`,
        organization_id: orgId,
        from_branch_id: vars.from_branch_id ?? null,
        to_branch_id: vars.to_branch_id,
        status: "pending" as StockTransferStatus,
        notes: vars.notes ?? null,
        created_by: "current-user",
        approved_by: null,
        received_by: null,
        created_at: new Date().toISOString(),
        completed_at: null,
        cancelled_at: null,
        item_count: vars.items.length,
        to_branch_name: "",
        from_branch_name: null,
        created_by_name: null,
      } as unknown as StockTransferRow;
      return [tempTransfer, ...old];
    },
    successMessage: "Transfer created",
    invalidateKeys: inventoryKeys.transferInvalidations(orgId),
  });
}

export function useApproveTransfer(orgId: string) {
  return useOrgMutation<StockTransfer, string>({
    endpoint: (transferId) =>
      `/api/organizations/${orgId}/inventory/transfers/${transferId}/approve`,
    method: "POST",
    queryKey: inventoryKeys.transfers(orgId),
    optimisticUpdate: (old, transferId) =>
      old.map((t) => (t.id === transferId ? { ...t, status: "approved" } : t)),
    successMessage: "Transfer approved",
    invalidateKeys: inventoryKeys.transferInvalidations(orgId),
  });
}

export function useMarkInTransit(orgId: string) {
  return useOrgMutation<StockTransfer, string>({
    endpoint: (transferId) =>
      `/api/organizations/${orgId}/inventory/transfers/${transferId}/transit`,
    method: "POST",
    queryKey: inventoryKeys.transfers(orgId),
    optimisticUpdate: (old, transferId) =>
      old.map((t) =>
        t.id === transferId ? { ...t, status: "in_transit" } : t,
      ),
    successMessage: "Transfer in transit",
    invalidateKeys: inventoryKeys.transferInvalidations(orgId),
  });
}

export function useReceiveTransfer(orgId: string) {
  return useOrgMutation<StockTransfer, string>({
    endpoint: (transferId) =>
      `/api/organizations/${orgId}/inventory/transfers/${transferId}/receive`,
    method: "POST",
    queryKey: inventoryKeys.transfers(orgId),
    optimisticUpdate: (old, transferId) =>
      old.map((t) => (t.id === transferId ? { ...t, status: "completed" } : t)),
    successMessage: "Transfer received",
    invalidateKeys: inventoryKeys.transferInvalidations(orgId),
  });
}

export function useCancelTransfer(orgId: string) {
  return useOrgMutation<StockTransfer, string>({
    endpoint: (transferId) =>
      `/api/organizations/${orgId}/inventory/transfers/${transferId}/cancel`,
    method: "POST",
    queryKey: inventoryKeys.transfers(orgId),
    optimisticUpdate: (old, transferId) =>
      old.map((t) => (t.id === transferId ? { ...t, status: "cancelled" } : t)),
    successMessage: "Transfer cancelled",
    invalidateKeys: inventoryKeys.transferInvalidations(orgId),
  });
}
