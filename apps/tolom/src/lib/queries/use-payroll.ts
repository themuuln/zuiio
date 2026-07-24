/**
 * React Query hooks for payroll — pay rates and payroll records.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useOnlineStatus } from "@zuiio/hooks";
import { toast } from "sonner";
import { useMutationQueue } from "@/lib/offline/mutation-queue-provider";
import type { PayRate, PayrollRecord } from "@/lib/services/payroll-service";
import { createOrgQuery } from "./factory";
import { payrollKeys } from "./keys";

// ── Fetchers ─────────────────────────────────────────

const fetchPayRates = createOrgQuery<PayRate[]>("/payroll/pay-rates");
const fetchRecords = createOrgQuery<PayrollRecord[]>("/payroll/records");

// ── Hooks ────────────────────────────────────────────

/**
 * List all mechanics with their current pay rate.
 * Optionally filtered by branch.
 */
export function usePayRates(
  orgId: string | undefined,
  branchId?: string | null,
) {
  return useQuery({
    queryKey: payrollKeys.payRates(orgId ?? "", branchId ?? "all"),
    queryFn: () => {
      if (!orgId) throw new Error("orgId required");
      return fetchPayRates(orgId, {
        params: branchId ? { branch_id: branchId } : undefined,
      });
    },
    enabled: !!orgId,
    staleTime: 60_000,
  });
}

/**
 * Get payroll records for a specific period.
 * Optionally filtered by branch.
 */
export function usePayrollRecords(
  orgId: string | undefined,
  year: number,
  month: number,
  branchId?: string | null,
) {
  return useQuery({
    queryKey: payrollKeys.records(orgId ?? "", year, month, branchId ?? "all"),
    queryFn: () => {
      if (!orgId) throw new Error("orgId required");
      return fetchRecords(orgId, {
        params: {
          year: String(year),
          month: String(month),
          ...(branchId ? { branch_id: branchId } : {}),
        },
      });
    },
    enabled: !!orgId && year > 0 && month >= 1 && month <= 12,
    staleTime: 30_000,
  });
}

// ── Mutations ─────────────────────────────────────────

/**
 * Upsert a mechanic's pay rate. Invalidates pay rates list on success.
 */
export function usePayRateUpsert(orgId: string | undefined) {
  const queryClient = useQueryClient();
  const isOnline = useOnlineStatus();
  const queue = useMutationQueue();

  return useMutation({
    mutationFn: async ({
      mechanicId,
      hourlyRate,
      effectiveFrom,
    }: {
      mechanicId: string;
      hourlyRate: number;
      effectiveFrom: string;
    }) => {
      if (isOnline) {
        const res = await fetch(
          `/api/organizations/${orgId}/payroll/pay-rates`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ mechanicId, hourlyRate, effectiveFrom }),
          },
        );
        const json = await res.json();
        if (!res.ok)
          throw new Error(json.error?.message ?? "Failed to save pay rate");
        return json.data as PayRate;
      }

      await queue.enqueue({
        endpoint: `/api/organizations/${orgId}/payroll/pay-rates`,
        method: "PUT",
        body: { mechanicId, hourlyRate, effectiveFrom },
        queryKeysToInvalidate: [[...payrollKeys.payRatesRoot(orgId ?? "")]],
      });
      return { queued: true } as unknown as PayRate;
    },
    onMutate: async (variables) => {
      const key = payrollKeys.payRatesRoot(orgId ?? "");
      await queryClient.cancelQueries({ queryKey: key });

      const snapshots = queryClient.getQueriesData<PayRate[]>({
        queryKey: key,
      });

      for (const [queryKey, current] of snapshots) {
        queryClient.setQueryData<PayRate[]>(queryKey, (old) => {
          const list = old ?? current ?? [];
          const existing = list.find(
            (rate) => rate.mechanic_id === variables.mechanicId,
          );

          if (existing) {
            return list.map((rate) =>
              rate.mechanic_id === variables.mechanicId
                ? {
                    ...rate,
                    hourly_rate: variables.hourlyRate,
                    effective_from: variables.effectiveFrom,
                    effective_to: null,
                  }
                : rate,
            );
          }

          return [
            ...list,
            {
              id: `temp-${variables.mechanicId}`,
              organization_id: orgId ?? "",
              mechanic_id: variables.mechanicId,
              mechanic_name: null,
              hourly_rate: variables.hourlyRate,
              effective_from: variables.effectiveFrom,
              effective_to: null,
            },
          ];
        });
      }

      return { snapshots };
    },
    onError: (_error, _variables, context) => {
      for (const [queryKey, data] of context?.snapshots ?? []) {
        queryClient.setQueryData(queryKey, data);
      }
    },
    onSuccess: (data) => {
      const d = data as unknown as Record<string, unknown>;
      if (d?.queued) {
        toast.info("Saved offline — will sync when connected");
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: payrollKeys.payRatesRoot(orgId ?? ""),
      });
    },
  });
}

/**
 * Calculate monthly payroll. Invalidates records on success.
 */
export function useCalculatePayroll(
  orgId: string | undefined,
  branchId?: string | null,
) {
  const queryClient = useQueryClient();
  const isOnline = useOnlineStatus();
  const queue = useMutationQueue();

  return useMutation({
    mutationFn: async ({ year, month }: { year: number; month: number }) => {
      if (isOnline) {
        const res = await fetch(
          `/api/organizations/${orgId}/payroll/calculate`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              year,
              month,
              branch_id: branchId ?? null,
            }),
          },
        );
        const json = await res.json();
        if (!res.ok)
          throw new Error(json.error?.message ?? "Payroll calculation failed");
        return json.data as PayrollRecord[];
      }

      await queue.enqueue({
        endpoint: `/api/organizations/${orgId}/payroll/calculate`,
        method: "POST",
        body: { year, month, branch_id: branchId ?? null },
        queryKeysToInvalidate: [
          [...payrollKeys.records(orgId ?? "", year, month, branchId ?? "all")],
        ],
      });
      return { queued: true } as unknown as PayrollRecord[];
    },
    onSuccess: (data, _variables) => {
      const d = data as unknown as Record<string, unknown>;
      if (d?.queued) {
        toast.info("Saved offline — will sync when connected");
      }
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({
        queryKey: payrollKeys.recordsPeriod(
          orgId ?? "",
          variables.year,
          variables.month,
        ),
      });
    },
  });
}

/**
 * Update payroll record status (approve or mark paid).
 */
export function useUpdatePayrollRecord(
  orgId: string | undefined,
  branchId?: string | null,
) {
  const queryClient = useQueryClient();
  const isOnline = useOnlineStatus();
  const queue = useMutationQueue();

  return useMutation({
    mutationFn: async ({
      recordId,
      action,
      year,
      month,
    }: {
      recordId: string;
      action: "approve" | "pay";
      year: number;
      month: number;
    }) => {
      if (isOnline) {
        const res = await fetch(
          `/api/organizations/${orgId}/payroll/records/${recordId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action }),
          },
        );
        const json = await res.json();
        if (!res.ok)
          throw new Error(json.error?.message ?? "Failed to update record");
        return json.data as PayrollRecord;
      }

      await queue.enqueue({
        endpoint: `/api/organizations/${orgId}/payroll/records/${recordId}`,
        method: "PATCH",
        body: { action },
        queryKeysToInvalidate: [
          [...payrollKeys.records(orgId ?? "", year, month, branchId ?? "all")],
        ],
      });
      return { queued: true } as unknown as PayrollRecord;
    },
    onMutate: async (variables) => {
      const key = payrollKeys.records(
        orgId ?? "",
        variables.year,
        variables.month,
        branchId ?? "all",
      );

      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<PayrollRecord[]>(key);

      queryClient.setQueryData<PayrollRecord[]>(key, (old) =>
        (old ?? []).map((record) =>
          record.id === variables.recordId
            ? {
                ...record,
                status: variables.action === "pay" ? "paid" : "approved",
                paid_at:
                  variables.action === "pay"
                    ? new Date().toISOString()
                    : record.paid_at,
              }
            : record,
        ),
      );

      return { key, previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.key) {
        queryClient.setQueryData(context.key, context.previous);
      }
    },
    onSuccess: (data, _variables) => {
      const d = data as unknown as Record<string, unknown>;
      if (d?.queued) {
        toast.info("Saved offline — will sync when connected");
      }
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({
        queryKey: payrollKeys.recordsPeriod(
          orgId ?? "",
          variables.year,
          variables.month,
        ),
      });
    },
  });
}
