/**
 * React Query hooks for payroll — pay rates and payroll records.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PayRate, PayrollRecord } from "@/lib/services/payroll-service";
import { createOrgQuery } from "./factory";
import { payrollKeys } from "./keys";

// ── Fetchers ─────────────────────────────────────────

const fetchPayRates = createOrgQuery<PayRate[]>("/payroll/pay-rates");
const fetchRecords = createOrgQuery<PayrollRecord[]>("/payroll/records");

// ── Hooks ────────────────────────────────────────────

/**
 * List all mechanics with their current pay rate.
 */
export function usePayRates(orgId: string | undefined) {
  return useQuery({
    queryKey: payrollKeys.payRates(orgId ?? ""),
    queryFn: () => fetchPayRates(orgId!),
    enabled: !!orgId,
    staleTime: 60_000,
  });
}

/**
 * Get payroll records for a specific period.
 */
export function usePayrollRecords(
  orgId: string | undefined,
  year: number,
  month: number,
) {
  return useQuery({
    queryKey: payrollKeys.records(orgId ?? "", year, month),
    queryFn: () =>
      fetchRecords(orgId!, {
        params: { year: String(year), month: String(month) },
      }),
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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: payrollKeys.payRates(orgId ?? ""),
      });
    },
  });
}

/**
 * Calculate monthly payroll. Invalidates records on success.
 */
export function useCalculatePayroll(orgId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      year,
      month,
    }: {
      year: number;
      month: number;
    }) => {
      const res = await fetch(
        `/api/organizations/${orgId}/payroll/calculate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ year, month }),
        },
      );
      const json = await res.json();
      if (!res.ok)
        throw new Error(json.error?.message ?? "Payroll calculation failed");
      return json.data as PayrollRecord[];
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: payrollKeys.records(orgId ?? "", variables.year, variables.month),
      });
    },
  });
}

/**
 * Update payroll record status (approve or mark paid).
 */
export function useUpdatePayrollRecord(orgId: string | undefined) {
  const queryClient = useQueryClient();

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
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: payrollKeys.records(orgId ?? "", variables.year, variables.month),
      });
    },
  });
}
