"use client";

import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useOrgMutation } from "@zuiio/query";
import { createOrgQuery } from "./factory";

// ── Types ──────────────────────────────────────────────────────────

export interface InvoiceStats {
  total_revenue: number;
  paid_count: number;
  pending_count: number;
  overdue_count: number;
  avg_job_value: number;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  status: string;
  total_amount: number;
  paid_amount: number;
  customer_name: string | null;
  vehicle_plate: string | null;
  issued_at: string;
  paid_at: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // biome-ignore lint/suspicious/noExplicitAny: Invoice API returns dynamic fields
  [key: string]: any;
}

// ── Fetchers ───────────────────────────────────────────────────────

const fetchInvoiceStats = createOrgQuery<InvoiceStats>("/invoices");

const fetchInvoices = createOrgQuery<Invoice[]>("/invoices", {
  unwrap: "paginated",
});

// ── Keys ───────────────────────────────────────────────────────────

export const invoiceKeys = {
  all: (orgId: string) => ["organizations", orgId, "invoices"] as const,
  stats: (orgId: string) => [...invoiceKeys.all(orgId), "stats"] as const,
  list: (orgId: string, status?: string) =>
    [...invoiceKeys.all(orgId), "list", status ?? ""] as const,
};

// ── Hooks ──────────────────────────────────────────────────────────

export function useInvoiceStats(
  orgId: string | undefined,
): UseQueryResult<InvoiceStats, Error> {
  return useQuery({
    queryKey: invoiceKeys.stats(orgId ?? ""),
    queryFn: () => fetchInvoiceStats(orgId!, { params: { type: "stats" } }),
    enabled: !!orgId,
    staleTime: 60_000,
  });
}

export function useInvoices(
  orgId: string | undefined,
  status?: string,
): UseQueryResult<Invoice[], Error> {
  return useQuery({
    queryKey: invoiceKeys.list(orgId ?? "", status),
    queryFn: () =>
      fetchInvoices(orgId!, {
        params: status ? { status } : undefined,
      }),
    enabled: !!orgId,
    staleTime: 30_000,
  });
}

// ── Mutations ──────────────────────────────────────────────────────

interface SendEmailVariables {
  invoiceId: string;
}

export function useSendInvoiceEmail(orgId: string | undefined) {
  return useOrgMutation<unknown, SendEmailVariables>({
    endpoint: (vars) =>
      `/api/organizations/${orgId}/invoices/${vars.invoiceId}`,
    method: "PATCH",
    queryKey: invoiceKeys.all(orgId ?? ""),
    successMessage: "Invoice email sent",
  });
}
