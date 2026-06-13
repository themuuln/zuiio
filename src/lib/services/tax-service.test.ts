import type { SupabaseClient } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabaseClient } from "@/test/mocks/supabase";

// ── Mocks ─────────────────────────────────────────────────────

vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));

const mockClient = createMockSupabaseClient();

// Helper to make a chain resolve like a Supabase query
function chainableResolve(
  // biome-ignore lint/suspicious/noExplicitAny: test mock
  obj: Record<string, any>,
  result: unknown,
) {
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
  // biome-ignore lint/suspicious/noThenProperty: intentional thenable for Supabase mock chain
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

describe("Tax Service", () => {
  describe("getOrgTaxSettings", () => {
    it("returns nuat_enabled and default_tax_rate from org settings", async () => {
      const { getOrgTaxSettings } = await import("./tax-service");

      vi.mocked(mockClient.from).mockReturnValue(
        chainableResolve(
          {},
          {
            nuat_enabled: true,
            default_tax_rate: 10,
          },
        ) as never,
      );

      const result = await getOrgTaxSettings(
        mockClient as unknown as SupabaseClient,
        "org-1",
      );

      expect(result.nuatEnabled).toBe(true);
      expect(result.taxRate).toBe(10);
    });

    it("returns default values when settings are null", async () => {
      const { getOrgTaxSettings } = await import("./tax-service");

      vi.mocked(mockClient.from).mockReturnValue(
        chainableResolve({}, null) as never,
      );

      const result = await getOrgTaxSettings(
        mockClient as unknown as SupabaseClient,
        "org-1",
      );

      expect(result.nuatEnabled).toBe(false);
      expect(result.taxRate).toBe(10);
    });
  });

  describe("calculateTax", () => {
    it("calculates tax when НӨАТ is enabled", async () => {
      const { calculateTax } = await import("./tax-service");

      const result = calculateTax(100000, 10, true);

      expect(result).toBe(10000);
    });

    it("returns 0 when НӨАТ is disabled", async () => {
      const { calculateTax } = await import("./tax-service");

      const result = calculateTax(100000, 10, false);

      expect(result).toBe(0);
    });

    it("rounds tax to nearest integer", async () => {
      const { calculateTax } = await import("./tax-service");

      const result = calculateTax(100000, 8, true);

      // 100000 * 8 / 100 = 8000
      expect(result).toBe(8000);
    });

    it("handles decimal tax rates correctly", async () => {
      const { calculateTax } = await import("./tax-service");

      // 100000 * 7.5 / 100 = 7500
      const result = calculateTax(100000, 7.5, true);

      expect(result).toBe(7500);
    });

    it("handles zero subtotal", async () => {
      const { calculateTax } = await import("./tax-service");

      const result = calculateTax(0, 10, true);

      expect(result).toBe(0);
    });
  });

  describe("calculateWorkOrderTax", () => {
    it("reads nuat_enabled from work order and calculates tax", async () => {
      const { calculateWorkOrderTax } = await import("./tax-service");

      // First call: get work order
      vi.mocked(mockClient.from).mockReturnValueOnce(
        chainableResolve({}, { nuat_enabled: true }) as never,
      );

      // Second call: get org settings
      vi.mocked(mockClient.from).mockReturnValueOnce(
        chainableResolve({}, { default_tax_rate: 10 }) as never,
      );

      const result = await calculateWorkOrderTax(
        mockClient as unknown as SupabaseClient,
        "wo-1",
        "org-1",
        200000,
        0,
      );

      expect(result.taxTotal).toBe(20000);
      expect(result.taxEnabled).toBe(true);
    });

    it("returns 0 tax when work order has НӨАТ disabled", async () => {
      const { calculateWorkOrderTax } = await import("./tax-service");

      vi.mocked(mockClient.from).mockReturnValueOnce(
        chainableResolve({}, { nuat_enabled: false }) as never,
      );

      vi.mocked(mockClient.from).mockReturnValueOnce(
        chainableResolve({}, { default_tax_rate: 10 }) as never,
      );

      const result = await calculateWorkOrderTax(
        mockClient as unknown as SupabaseClient,
        "wo-1",
        "org-1",
        200000,
        0,
      );

      expect(result.taxTotal).toBe(0);
      expect(result.taxEnabled).toBe(false);
    });

    it("applies discount before calculating tax", async () => {
      const { calculateWorkOrderTax } = await import("./tax-service");

      vi.mocked(mockClient.from).mockReturnValueOnce(
        chainableResolve({}, { nuat_enabled: true }) as never,
      );

      vi.mocked(mockClient.from).mockReturnValueOnce(
        chainableResolve({}, { default_tax_rate: 10 }) as never,
      );

      // Subtotal: 200000, Discount: 50000, Taxable: 150000, Tax: 15000
      const result = await calculateWorkOrderTax(
        mockClient as unknown as SupabaseClient,
        "wo-1",
        "org-1",
        200000,
        50000,
      );

      expect(result.taxTotal).toBe(15000);
    });

    it("defaults to 10% tax rate when org settings have no rate", async () => {
      const { calculateWorkOrderTax } = await import("./tax-service");

      vi.mocked(mockClient.from).mockReturnValueOnce(
        chainableResolve({}, { nuat_enabled: true }) as never,
      );

      vi.mocked(mockClient.from).mockReturnValueOnce(
        chainableResolve({}, { default_tax_rate: null }) as never,
      );

      const result = await calculateWorkOrderTax(
        mockClient as unknown as SupabaseClient,
        "wo-1",
        "org-1",
        100000,
        0,
      );

      // 100000 * 10 / 100 = 10000
      expect(result.taxTotal).toBe(10000);
    });
  });

  describe("updateWorkOrderNuat", () => {
    it("updates nuat_enabled on work order", async () => {
      const { updateWorkOrderNuat } = await import("./tax-service");

      vi.mocked(mockClient.from).mockReturnValue(
        chainableResolve({}, { id: "wo-1", nuat_enabled: true }) as never,
      );

      const result = await updateWorkOrderNuat(
        mockClient as unknown as SupabaseClient,
        "wo-1",
        "org-1",
        true,
      );

      expect(result).toBe(true);
    });
  });

  describe("updateOrgNuatSettings", () => {
    it("updates nuat_enabled and default_tax_rate on org settings", async () => {
      const { updateOrgNuatSettings } = await import("./tax-service");

      vi.mocked(mockClient.from).mockReturnValue(
        chainableResolve(
          {},
          { nuat_enabled: true, default_tax_rate: 10 },
        ) as never,
      );

      const result = await updateOrgNuatSettings(
        mockClient as unknown as SupabaseClient,
        "org-1",
        { nuatEnabled: true, taxRate: 10 },
      );

      expect(result.nuatEnabled).toBe(true);
      expect(result.taxRate).toBe(10);
    });
  });

  describe("calculateItemTax", () => {
    it("calculates tax for a normal item", async () => {
      const { calculateItemTax } = await import("./tax-service");

      const result = calculateItemTax({ total_price: 50000 }, 10);

      expect(result.taxAmount).toBe(5000);
      expect(result.isExempt).toBe(false);
      expect(result.effectiveRate).toBe(10);
    });

    it("returns 0 tax for exempt items", async () => {
      const { calculateItemTax } = await import("./tax-service");

      const result = calculateItemTax(
        { total_price: 50000, is_tax_exempt: true },
        10,
      );

      expect(result.taxAmount).toBe(0);
      expect(result.isExempt).toBe(true);
      expect(result.effectiveRate).toBe(0);
    });

    it("uses custom tax rate when set on item", async () => {
      const { calculateItemTax } = await import("./tax-service");

      const result = calculateItemTax({ total_price: 100000, tax_rate: 5 }, 10);

      // 100000 * 5% = 5000
      expect(result.taxAmount).toBe(5000);
      expect(result.effectiveRate).toBe(5);
    });

    it("ignores custom rate when item is exempt", async () => {
      const { calculateItemTax } = await import("./tax-service");

      const result = calculateItemTax(
        { total_price: 100000, is_tax_exempt: true, tax_rate: 5 },
        10,
      );

      expect(result.taxAmount).toBe(0);
      expect(result.isExempt).toBe(true);
    });
  });

  describe("calculateItemsTax", () => {
    it("calculates total tax for mixed exempt and non-exempt items", async () => {
      const { calculateItemsTax } = await import("./tax-service");

      const items = [
        { total_price: 50000, is_tax_exempt: false }, // Tax: 5000
        { total_price: 30000, is_tax_exempt: true }, // Tax: 0
        { total_price: 20000, is_tax_exempt: false }, // Tax: 2000
      ];

      const result = calculateItemsTax(items, 10);

      expect(result.totalTaxable).toBe(70000); // 50000 + 20000
      expect(result.totalTax).toBe(7000); // 5000 + 2000
    });

    it("returns 0 when all items are exempt", async () => {
      const { calculateItemsTax } = await import("./tax-service");

      const items = [
        { total_price: 50000, is_tax_exempt: true },
        { total_price: 30000, is_tax_exempt: true },
      ];

      const result = calculateItemsTax(items, 10);

      expect(result.totalTaxable).toBe(0);
      expect(result.totalTax).toBe(0);
    });

    it("handles empty items array", async () => {
      const { calculateItemsTax } = await import("./tax-service");

      const result = calculateItemsTax([], 10);

      expect(result.totalTaxable).toBe(0);
      expect(result.totalTax).toBe(0);
    });
  });
});
