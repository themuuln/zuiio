import type { SupabaseClient } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabaseClient } from "@/test/mocks/supabase";

// ── Mocks ─────────────────────────────────────────────────────

vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));

const mockClient = createMockSupabaseClient();

// Helper to make a chain resolve like a Supabase query
function chainableResolve(obj: Record<string, any>, result: unknown) {
  for (const key of [
    "select",
    "insert",
    "update",
    "delete",
    "upsert",
    "eq",
    "neq",
    "gt",
    "gte",
    "lt",
    "lte",
    "is",
    "in",
    "contains",
    "or",
    "and",
    "not",
    "order",
    "limit",
    "range",
  ]) {
    obj[key] = vi.fn().mockReturnValue(obj);
  }
  obj.single = vi.fn().mockResolvedValue({ data: result, error: null });
  obj.maybeSingle = vi.fn().mockResolvedValue({ data: result, error: null });
  obj.then = vi.fn().mockImplementation((resolve: (v: unknown) => unknown) =>
    resolve({
      data: result,
      count: Array.isArray(result) ? result.length : 0,
      error: null,
    }),
  );
  return obj;
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ── Tests ─────────────────────────────────────────────────────

describe("Tax Report Service", () => {
  describe("getTaxReport", () => {
    it("generates a tax report with invoices and expenses", async () => {
      const { getTaxReport } = await import("./tax-report-service");

      // Mock invoices
      vi.mocked(mockClient.from).mockReturnValueOnce(
        chainableResolve({}, [
          {
            id: "inv-1",
            invoice_number: "INV-001",
            total: 100000,
            tax_total: 10000,
            issued_at: "2026-01-15",
            status: "paid",
          },
          {
            id: "inv-2",
            invoice_number: "INV-002",
            total: 50000,
            tax_total: 5000,
            issued_at: "2026-01-20",
            status: "sent",
          },
        ]) as never,
      );

      // Mock expenses
      vi.mocked(mockClient.from).mockReturnValueOnce(
        chainableResolve({}, [
          {
            id: "exp-1",
            description: "Oil purchase",
            amount: 20000,
            tax_amount: 2000,
            expense_date: "2026-01-10",
            vendor_name: "Supplier A",
          },
        ]) as never,
      );

      const result = await getTaxReport(
        mockClient as unknown as SupabaseClient,
        "org-1",
        { startDate: "2026-01-01", endDate: "2026-01-31" },
      );

      expect(result.summary.totalSalesWithTax).toBe(150000);
      expect(result.summary.totalTaxCollected).toBe(15000);
      expect(result.summary.totalPurchasesWithTax).toBe(22000);
      expect(result.summary.totalTaxPaid).toBe(2000);
      expect(result.summary.netTaxPayable).toBe(13000);
      expect(result.summary.invoiceCount).toBe(2);
      expect(result.summary.expenseCount).toBe(1);
      expect(result.items).toHaveLength(3);
    });

    it("handles empty period with no data", async () => {
      const { getTaxReport } = await import("./tax-report-service");

      vi.mocked(mockClient.from).mockReturnValueOnce(
        chainableResolve({}, []) as never,
      );

      vi.mocked(mockClient.from).mockReturnValueOnce(
        chainableResolve({}, []) as never,
      );

      const result = await getTaxReport(
        mockClient as unknown as SupabaseClient,
        "org-1",
        { startDate: "2026-01-01", endDate: "2026-01-31" },
      );

      expect(result.summary.totalSalesWithTax).toBe(0);
      expect(result.summary.totalTaxCollected).toBe(0);
      expect(result.summary.netTaxPayable).toBe(0);
      expect(result.items).toHaveLength(0);
    });

    it("excludes cancelled invoices from query filter", async () => {
      const { getTaxReport } = await import("./tax-report-service");

      // Mock returns only non-cancelled invoices (Supabase filters cancelled)
      vi.mocked(mockClient.from).mockReturnValueOnce(
        chainableResolve({}, [
          {
            id: "inv-2",
            invoice_number: "INV-002",
            total: 50000,
            tax_total: 5000,
            issued_at: "2026-01-20",
            status: "paid",
          },
        ]) as never,
      );

      vi.mocked(mockClient.from).mockReturnValueOnce(
        chainableResolve({}, []) as never,
      );

      const result = await getTaxReport(
        mockClient as unknown as SupabaseClient,
        "org-1",
        { startDate: "2026-01-01", endDate: "2026-01-31" },
      );

      // Only the paid invoice should be counted
      expect(result.summary.totalSalesWithTax).toBe(50000);
      expect(result.summary.invoiceCount).toBe(1);
    });
  });

  describe("formatTaxReport", () => {
    it("formats report in Mongolian", async () => {
      const { formatTaxReport } = await import("./tax-report-service");

      const summary = {
        totalSalesWithTax: 1000000,
        totalTaxCollected: 100000,
        totalPurchasesWithTax: 500000,
        totalTaxPaid: 50000,
        netTaxPayable: 50000,
        invoiceCount: 10,
        expenseCount: 5,
        period: { startDate: "2026-01-01", endDate: "2026-01-31" },
      };

      const result = formatTaxReport(summary, "mn");

      expect(result).toContain("НӨАТ Тайлан");
      expect(result).toContain("НӨАТ цуглурсан");
      expect(result).toContain("НӨАТ төлбөр");
    });

    it("formats report in English", async () => {
      const { formatTaxReport } = await import("./tax-report-service");

      const summary = {
        totalSalesWithTax: 1000000,
        totalTaxCollected: 100000,
        totalPurchasesWithTax: 500000,
        totalTaxPaid: 50000,
        netTaxPayable: 50000,
        invoiceCount: 10,
        expenseCount: 5,
        period: { startDate: "2026-01-01", endDate: "2026-01-31" },
      };

      const result = formatTaxReport(summary, "en");

      expect(result).toContain("VAT Report");
      expect(result).toContain("VAT collected");
      expect(result).toContain("Net VAT payable");
    });
  });
});
