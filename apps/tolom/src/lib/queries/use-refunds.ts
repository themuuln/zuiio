import { useQuery } from "@tanstack/react-query";
import { useOrgMutation } from "@zuiio/query";
import type { RefundStats, RefundWithInvoice } from "@/lib/types";
import { createOrgQuery } from "./factory";
import { refundKeys } from "./keys";

// ── Fetchers ─────────────────────────────────────────────────

const fetchRefunds = createOrgQuery<RefundWithInvoice[]>("/refunds", {
  unwrap: "paginated",
});

const fetchRefundStats = createOrgQuery<RefundStats>("/refunds", {
  unwrap: "direct",
});

// ── Query Hooks ──────────────────────────────────────────────

export function useRefundList(
  orgId: string | undefined,
  status?: "pending" | "completed" | "failed" | "cancelled",
) {
  return useQuery({
    queryKey: refundKeys.list(orgId ?? "", status),
    queryFn: () =>
      fetchRefunds(orgId ?? "", {
        params: status ? { status } : undefined,
      }),
    enabled: !!orgId,
    staleTime: 60_000, // 1 minute
  });
}

export function useRefundStats(orgId: string | undefined) {
  return useQuery({
    queryKey: refundKeys.stats(orgId ?? ""),
    queryFn: () =>
      fetchRefundStats(orgId ?? "", { params: { action: "stats" } }),
    enabled: !!orgId,
    staleTime: 60_000, // 1 minute
  });
}

// ── Mutation Hooks ───────────────────────────────────────────

export function useRecordRefund(orgId: string) {
  return useOrgMutation<
    RefundWithInvoice,
    {
      invoice_id: string;
      amount: number;
      method: "cash" | "card" | "bank_transfer" | "store_credit";
      reason?: string;
      reference?: string;
      notes?: string;
    }
  >({
    endpoint: `/api/organizations/${orgId}/refunds`,
    method: "POST",
    queryKey: refundKeys.all(orgId),
    optimisticQueryKey: refundKeys.list(orgId),
    invalidateKeys: [
      ["organizations", orgId, "invoices"],
      refundKeys.stats(orgId),
    ],
    optimisticUpdate: (cached, params) => {
      const optimisticRefund: RefundWithInvoice = {
        id: `optimistic-${Date.now()}`,
        invoice_id: params.invoice_id,
        organization_id: orgId,
        amount: params.amount,
        method: params.method,
        status: "completed",
        reason: params.reason ?? null,
        reference: params.reference ?? null,
        notes: params.notes ?? null,
        refunded_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: null,
        invoice_number: "",
        invoice_total: 0,
        customer_name: null,
      };
      return [optimisticRefund, ...cached];
    },
    successMessage: "Refund recorded successfully",
  });
}

export function useCancelRefund(orgId: string) {
  return useOrgMutation<RefundWithInvoice, string>({
    endpoint: (refundId) => `/api/organizations/${orgId}/refunds/${refundId}`,
    method: "PATCH",
    queryKey: refundKeys.all(orgId),
    optimisticQueryKey: refundKeys.list(orgId),
    invalidateKeys: [refundKeys.stats(orgId)],
    bodyFn: () => ({ action: "cancel" }),
    optimisticUpdate: (cached, refundId) =>
      cached.map((r) =>
        r.id === refundId ? { ...r, status: "cancelled" as const } : r,
      ),
    successMessage: "Refund cancelled",
  });
}

// ── Store Credit Hooks ──────────────────────────────────────

export function useStoreCreditBalance(
  orgId: string | undefined,
  customerId: string | undefined,
) {
  return useQuery({
    queryKey: ["organizations", orgId, "store-credits", customerId],
    queryFn: async (): Promise<number> => {
      if (!orgId || !customerId) return 0;
      const res = await fetch(
        `/api/organizations/${orgId}/store-credits?customer_id=${customerId}`,
      );
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      return json.data?.balance ?? 0;
    },
    enabled: !!orgId && !!customerId,
    staleTime: 60_000,
  });
}
