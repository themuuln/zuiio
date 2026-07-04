import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import {
  useInvoiceStats,
  useInvoices,
  invoiceKeys,
  type InvoiceStats,
  type Invoice,
} from "../use-invoices";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

function createWrapper() {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("useInvoiceStats", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  it("returns invoice stats on success", async () => {
    const stats: InvoiceStats = {
      total_revenue: 5000,
      paid_count: 10,
      pending_count: 3,
      overdue_count: 1,
      avg_job_value: 357.14,
    };

    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: stats }),
    } as Response);

    const { result } = renderHook(() => useInvoiceStats("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(stats);
  });

  it("does not fetch when orgId is undefined", async () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(() => useInvoiceStats(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("handles fetch error", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useInvoiceStats("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeDefined();
  });
});

describe("useInvoices", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  it("returns invoices on success", async () => {
    const invoices: Invoice[] = [
      {
        id: "inv-1",
        invoice_number: "INV-001",
        status: "paid",
        total_amount: 200,
        paid_amount: 200,
        customer_name: "John",
        vehicle_plate: "ABC-123",
        issued_at: "2024-01-15T00:00:00Z",
        paid_at: "2024-01-16T00:00:00Z",
      },
    ];

    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: { data: invoices } }),
    } as Response);

    const { result } = renderHook(() => useInvoices("org-1", "paid"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(invoices);
  });

  it("does not fetch when orgId is undefined", async () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(() => useInvoices(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("handles error response", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: false,
      status: 500,
    } as Response);

    const { result } = renderHook(() => useInvoices("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("invoiceKeys", () => {
  it("constructs correct key shapes", () => {
    expect(invoiceKeys.all("org-1")).toEqual([
      "organizations",
      "org-1",
      "invoices",
    ]);
    expect(invoiceKeys.stats("org-1")).toEqual([
      "organizations",
      "org-1",
      "invoices",
      "stats",
    ]);
    expect(invoiceKeys.list("org-1", "paid")).toEqual([
      "organizations",
      "org-1",
      "invoices",
      "list",
      "paid",
    ]);
    expect(invoiceKeys.list("org-1")).toEqual([
      "organizations",
      "org-1",
      "invoices",
      "list",
      "",
    ]);
  });
});
