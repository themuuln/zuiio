import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
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
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      invoice_id: string;
      amount: number;
      method: "cash" | "card" | "bank_transfer" | "store_credit";
      reason?: string;
      reference?: string;
      notes?: string;
    }) => {
      const res = await fetch(`/api/organizations/${orgId}/refunds`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });

      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      return json.data;
    },
    onMutate: async (params) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: refundKeys.list(orgId),
      });

      // Snapshot previous value
      const previousRefunds = queryClient.getQueryData(refundKeys.list(orgId));

      // Optimistically update the refund list
      queryClient.setQueryData(
        refundKeys.list(orgId),
        (old: RefundWithInvoice[] | undefined) => {
          if (!old) return old;
          // Add optimistic refund entry
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
          return [optimisticRefund, ...old];
        },
      );

      return { previousRefunds };
    },
    onError: (err, _params, context) => {
      // Rollback on error
      if (context?.previousRefunds) {
        queryClient.setQueryData(
          refundKeys.list(orgId),
          context.previousRefunds,
        );
      }
      toast.error(err.message || "Failed to record refund");
    },
    onSettled: () => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: refundKeys.all(orgId) });
      queryClient.invalidateQueries({
        queryKey: ["organizations", orgId, "invoices"],
      });
    },
    onSuccess: () => {
      toast.success("Refund recorded successfully");
    },
  });
}

export function useCancelRefund(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (refundId: string) => {
      const res = await fetch(
        `/api/organizations/${orgId}/refunds/${refundId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "cancel" }),
        },
      );

      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      return json.data;
    },
    onMutate: async (refundId) => {
      await queryClient.cancelQueries({
        queryKey: refundKeys.list(orgId),
      });

      const previousRefunds = queryClient.getQueryData(refundKeys.list(orgId));

      // Optimistically update status to cancelled
      queryClient.setQueryData(
        refundKeys.list(orgId),
        (old: RefundWithInvoice[] | undefined) => {
          if (!old) return old;
          return old.map((r) =>
            r.id === refundId ? { ...r, status: "cancelled" as const } : r,
          );
        },
      );

      return { previousRefunds };
    },
    onError: (err, _refundId, context) => {
      if (context?.previousRefunds) {
        queryClient.setQueryData(
          refundKeys.list(orgId),
          context.previousRefunds,
        );
      }
      toast.error(err.message || "Failed to cancel refund");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: refundKeys.all(orgId) });
    },
    onSuccess: () => {
      toast.success("Refund cancelled");
    },
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
