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

describe("E-Invoice Service", () => {
  describe("getEInvoiceSettings", () => {
    it("returns E-Invoice settings from org", async () => {
      const { getEInvoiceSettings } = await import("./einvoice-service");

      vi.mocked(mockClient.from).mockReturnValue(
        chainableResolve(
          {},
          {
            einvoice_enabled: true,
            einvoice_api_key: "test-key",
            einvoice_merchant_id: "merchant-123",
            einvoice_endpoint: "https://ebarimt.mn/api",
          },
        ) as never,
      );

      const result = await getEInvoiceSettings(
        mockClient as unknown as SupabaseClient,
        "org-1",
      );

      expect(result.enabled).toBe(true);
      expect(result.apiKey).toBe("test-key");
      expect(result.merchantId).toBe("merchant-123");
      expect(result.endpoint).toBe("https://ebarimt.mn/api");
    });

    it("returns defaults when settings not found", async () => {
      const { getEInvoiceSettings } = await import("./einvoice-service");

      vi.mocked(mockClient.from).mockReturnValue(
        chainableResolve({}, null) as never,
      );

      const result = await getEInvoiceSettings(
        mockClient as unknown as SupabaseClient,
        "org-1",
      );

      expect(result.enabled).toBe(false);
      expect(result.apiKey).toBeNull();
      expect(result.merchantId).toBeNull();
      expect(result.endpoint).toBe("https://ebarimt.mn/api");
    });
  });

  describe("registerEInvoice", () => {
    it("returns null when E-Invoice is disabled", async () => {
      const { registerEInvoice } = await import("./einvoice-service");

      vi.mocked(mockClient.from).mockReturnValue(
        chainableResolve(
          {},
          {
            einvoice_enabled: false,
            einvoice_api_key: null,
            einvoice_merchant_id: null,
            einvoice_endpoint: "https://ebarimt.mn/api",
          },
        ) as never,
      );

      const result = await registerEInvoice(
        mockClient as unknown as SupabaseClient,
        "inv-1",
        "org-1",
      );

      expect(result).toBeNull();
    });

    it("returns existing registration if already registered", async () => {
      const { registerEInvoice } = await import("./einvoice-service");

      // Mock settings
      vi.mocked(mockClient.from).mockReturnValueOnce(
        chainableResolve(
          {},
          {
            einvoice_enabled: true,
            einvoice_api_key: "test-key",
            einvoice_merchant_id: "merchant-123",
            einvoice_endpoint: "https://ebarimt.mn/api",
          },
        ) as never,
      );

      // Mock invoice already registered
      vi.mocked(mockClient.from).mockReturnValueOnce(
        chainableResolve(
          {},
          {
            id: "inv-1",
            invoice_number: "INV-001",
            issued_at: "2026-01-15",
            total: 100000,
            tax_total: 10000,
            customer_name: "Test Customer",
            customer_email: null,
            einvoice_registration_id: "REG-123",
            einvoice_qr_code: "qr-data",
            einvoice_status: "registered",
          },
        ) as never,
      );

      const result = await registerEInvoice(
        mockClient as unknown as SupabaseClient,
        "inv-1",
        "org-1",
      );

      expect(result).not.toBeNull();
      expect(result?.status).toBe("registered");
      expect(result?.registrationId).toBe("REG-123");
    });
  });
});
