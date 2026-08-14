import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createMockSupabaseClient,
  type MockSupabaseClient,
} from "@/test/mocks/supabase";

// ── Module-level mocks ───────────────────────────────────────

vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));
vi.mock("@/lib/errors", () => ({
  ValidationError: class extends Error {
    constructor(msg: string) {
      super(msg);
      this.name = "ValidationError";
    }
  },
}));
vi.mock("@/lib/sentry-report-server", () => ({
  reportServerError: vi.fn(),
}));

// Mock the underlying einvoice-service module
vi.mock("../einvoice-service", () => ({
  getEInvoiceSettings: vi.fn(),
  registerEInvoice: vi.fn(),
}));

import { revalidateTag } from "next/cache";
import { getEInvoiceSettings, registerEInvoice } from "../einvoice-service";

const mockRevalidateTag = vi.mocked(revalidateTag);
const mockGetSettings = vi.mocked(getEInvoiceSettings);
const mockRegisterEInvoice = vi.mocked(registerEInvoice);

import {
  createEbarimtInvoice,
  getEbarimtStatusForInvoice,
  testEbarimtConnection,
  validateEbarimtConfig,
} from "../ebarimt-integration-service";

// ── Constants ────────────────────────────────────────────────

const ORG_ID = "org-1";
const INVOICE_ID = "inv-1";
const API_KEY = "test-api-key-12345";
const MERCHANT_ID = "merchant-001";

let db: MockSupabaseClient;

// ── Helpers ──────────────────────────────────────────────────

function makeSettings(overrides: Record<string, unknown> = {}) {
  return {
    enabled: true,
    apiKey: API_KEY,
    merchantId: MERCHANT_ID,
    endpoint: "https://ebarimt.mn/api",
    ...overrides,
  };
}

function makeInvoiceRow(overrides: Record<string, unknown> = {}) {
  return {
    id: INVOICE_ID,
    invoice_number: "INV-001",
    issued_at: "2026-07-30T00:00:00Z",
    total: 150000,
    tax_total: 15000,
    customer_name: "Test Customer",
    customer_email: null,
    einvoice_status: null,
    einvoice_registration_id: null,
    einvoice_qr_code: null,
    einvoice_registered_at: null,
    ...overrides,
  };
}

// ── Setup ────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  db = createMockSupabaseClient();
  // The default mock resolves `await qb` to { data: null, error: null }.
  // Override with a useful default for our tests.
  db.__qb.resolveWith({ data: null, error: null });
});

// ── Tests ────────────────────────────────────────────────────

describe("validateEbarimtConfig", () => {
  it("returns configured=true when all settings are present", async () => {
    mockGetSettings.mockResolvedValue(makeSettings());

    const result = await validateEbarimtConfig(db as never, ORG_ID);

    expect(result.configured).toBe(true);
    expect(result.enabled).toBe(true);
    expect(result.hasApiKey).toBe(true);
    expect(result.hasMerchantId).toBe(true);
    expect(result.missing).toHaveLength(0);
  });

  it("returns configured=false when e-barimt is disabled", async () => {
    mockGetSettings.mockResolvedValue(
      makeSettings({ enabled: false, apiKey: null, merchantId: null }),
    );

    const result = await validateEbarimtConfig(db as never, ORG_ID);

    expect(result.configured).toBe(false);
    expect(result.enabled).toBe(false);
    expect(result.hasApiKey).toBe(false);
    expect(result.hasMerchantId).toBe(false);
    expect(result.missing).toContain("e-barimt is disabled");
    expect(result.missing).toContain("API key is not set");
    expect(result.missing).toContain("Merchant ID is not set");
  });

  it("returns configured=false when API key is missing", async () => {
    mockGetSettings.mockResolvedValue(
      makeSettings({ apiKey: null, hasApiKey: false }),
    );

    const result = await validateEbarimtConfig(db as never, ORG_ID);

    expect(result.configured).toBe(false);
    expect(result.hasApiKey).toBe(false);
    expect(result.missing).toContain("API key is not set");
  });

  it("returns configured=false when merchant ID is missing", async () => {
    mockGetSettings.mockResolvedValue(
      makeSettings({ merchantId: null, hasMerchantId: false }),
    );

    const result = await validateEbarimtConfig(db as never, ORG_ID);

    expect(result.configured).toBe(false);
    expect(result.hasMerchantId).toBe(false);
    expect(result.missing).toContain("Merchant ID is not set");
  });

  it("returns the configured endpoint URL", async () => {
    const customEndpoint = "https://custom-ebarimt.gov.mn/api";
    mockGetSettings.mockResolvedValue(
      makeSettings({ endpoint: customEndpoint }),
    );

    const result = await validateEbarimtConfig(db as never, ORG_ID);

    expect(result.endpoint).toBe(customEndpoint);
  });
});

describe("getEbarimtStatusForInvoice", () => {
  it("returns status fields from invoice", async () => {
    db.__qb.resolveOnce({
      data: makeInvoiceRow({
        einvoice_status: "registered",
        einvoice_registration_id: "REG-001",
        einvoice_qr_code: "qr-data-abc",
        einvoice_registered_at: "2026-07-30T12:00:00Z",
      }),
      error: null,
    });

    const result = await getEbarimtStatusForInvoice(db as never, INVOICE_ID);

    expect(result.einvoiceStatus).toBe("registered");
    expect(result.einvoiceRegistrationId).toBe("REG-001");
    expect(result.einvoiceQrCode).toBe("qr-data-abc");
    expect(result.einvoiceRegisteredAt).toBe("2026-07-30T12:00:00Z");
  });

  it("returns null fields when invoice has not been sent", async () => {
    db.__qb.resolveOnce({
      data: makeInvoiceRow(),
      error: null,
    });

    const result = await getEbarimtStatusForInvoice(db as never, INVOICE_ID);

    expect(result.einvoiceStatus).toBeNull();
    expect(result.einvoiceRegistrationId).toBeNull();
    expect(result.einvoiceQrCode).toBeNull();
    expect(result.einvoiceRegisteredAt).toBeNull();
  });

  it("throws ValidationError when invoice not found", async () => {
    // single() returns error via the resolved value
    // The mock qb is thenable and resolves to { data: null, error: null } by default.
    // throwOnError doesn't throw because error is null.
    // To simulate a real error, we need the chain to resolve with an error.
    db.__qb.resolveOnce({
      data: null,
      error: { message: "Invoice not found", code: "PGRST116" },
    });

    // throwOnError returns qb again, so the chain continues and awaits qb
    // Since we pushed a resolveOnce, it's used. But single() mock returns qb
    // and the qb.then will use the resolveOnce queue.
    await expect(
      getEbarimtStatusForInvoice(db as never, INVOICE_ID),
    ).rejects.toThrow("Invoice not found");
  });
});

describe("createEbarimtInvoice", () => {
  it("returns skipped when e-barimt is not configured", async () => {
    mockGetSettings.mockResolvedValue(
      makeSettings({ enabled: false, apiKey: null, merchantId: null }),
    );

    const result = await createEbarimtInvoice(db as never, INVOICE_ID, ORG_ID);

    expect(result.status).toBe("skipped");
    expect(result.error).toContain("not configured");
    expect(mockRegisterEInvoice).not.toHaveBeenCalled();
  });

  it("returns existing registration when already registered", async () => {
    mockGetSettings.mockResolvedValue(makeSettings());

    // getEbarimtStatusForInvoice awaits db query — push one resolveOnce
    db.__qb.resolveOnce({
      data: makeInvoiceRow({
        einvoice_status: "registered",
        einvoice_registration_id: "REG-001",
        einvoice_qr_code: "qr-data",
        einvoice_registered_at: "2026-07-30T12:00:00Z",
      }),
      error: null,
    });

    const result = await createEbarimtInvoice(db as never, INVOICE_ID, ORG_ID);

    expect(result.status).toBe("registered");
    expect(result.registrationId).toBe("REG-001");
    expect(mockRegisterEInvoice).not.toHaveBeenCalled();
  });

  it("calls registerEInvoice and returns success", async () => {
    mockGetSettings.mockResolvedValue(makeSettings());

    // First await: getEbarimtStatusForInvoice (not registered)
    db.__qb.resolveOnce({
      data: makeInvoiceRow(),
      error: null,
    });

    // Second await (inside registerEInvoice mock): registerEInvoice calls db
    // But we mock registerEInvoice entirely, so no DB call needed
    mockRegisterEInvoice.mockResolvedValue({
      registrationId: "REG-123",
      qrCode: "qr-data-xyz",
      status: "registered",
    });

    const result = await createEbarimtInvoice(db as never, INVOICE_ID, ORG_ID);

    expect(result.status).toBe("registered");
    expect(result.registrationId).toBe("REG-123");
    expect(result.qrCode).toBe("qr-data-xyz");
    expect(mockRegisterEInvoice).toHaveBeenCalledWith(
      expect.anything(),
      INVOICE_ID,
      ORG_ID,
    );
    expect(mockRevalidateTag).toHaveBeenCalled();
  });

  it("handles registration failure", async () => {
    mockGetSettings.mockResolvedValue(makeSettings());

    // getEbarimtStatusForInvoice (not registered)
    db.__qb.resolveOnce({
      data: makeInvoiceRow(),
      error: null,
    });

    mockRegisterEInvoice.mockResolvedValue({
      registrationId: "",
      qrCode: "",
      status: "failed",
      error: "API returned 500",
    });

    const result = await createEbarimtInvoice(db as never, INVOICE_ID, ORG_ID);

    expect(result.status).toBe("failed");
    expect(result.error).toBe("API returned 500");
  });
});

describe("testEbarimtConnection", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns failure when endpoint is missing", async () => {
    mockGetSettings.mockResolvedValue(
      makeSettings({ endpoint: "", apiKey: null, merchantId: null }),
    );

    const result = await testEbarimtConnection(db as never, ORG_ID);

    expect(result.success).toBe(false);
    expect(result.message).toContain("endpoint");
  });

  it("returns failure when API key is missing", async () => {
    mockGetSettings.mockResolvedValue(makeSettings({ apiKey: null }));

    const result = await testEbarimtConnection(db as never, ORG_ID);

    expect(result.success).toBe(false);
    expect(result.message).toContain("API key");
  });

  it("returns failure when merchant ID is missing", async () => {
    mockGetSettings.mockResolvedValue(
      makeSettings({ apiKey: API_KEY, merchantId: null }),
    );

    const result = await testEbarimtConnection(db as never, ORG_ID);

    expect(result.success).toBe(false);
    expect(result.message).toContain("merchant ID");
  });

  it("returns success when the API responds OK", async () => {
    mockGetSettings.mockResolvedValue(makeSettings());
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
    } as Response);

    const result = await testEbarimtConnection(db as never, ORG_ID);

    expect(result.success).toBe(true);
    expect(result.message).toBe("Connection successful");
    expect(fetch).toHaveBeenCalledWith(
      "https://ebarimt.mn/api/info",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: `Bearer ${API_KEY}`,
          "X-Merchant-ID": MERCHANT_ID,
        }),
      }),
    );
  });

  it("returns failure on 401", async () => {
    mockGetSettings.mockResolvedValue(makeSettings());
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 401,
    } as Response);

    const result = await testEbarimtConnection(db as never, ORG_ID);

    expect(result.success).toBe(false);
    expect(result.message).toContain("Authentication failed");
  });

  it("returns failure on 403", async () => {
    mockGetSettings.mockResolvedValue(makeSettings());
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 403,
    } as Response);

    const result = await testEbarimtConnection(db as never, ORG_ID);

    expect(result.success).toBe(false);
    expect(result.message).toContain("Authentication failed");
  });

  it("returns failure on unexpected status", async () => {
    mockGetSettings.mockResolvedValue(makeSettings());
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 500,
    } as Response);

    const result = await testEbarimtConnection(db as never, ORG_ID);

    expect(result.success).toBe(false);
    expect(result.message).toContain("status 500");
  });

  it("returns failure on network error", async () => {
    mockGetSettings.mockResolvedValue(makeSettings());
    vi.mocked(fetch).mockRejectedValue(new Error("Network failure"));

    const result = await testEbarimtConnection(db as never, ORG_ID);

    expect(result.success).toBe(false);
    expect(result.message).toBe("Network failure");
  });

  it("returns failure on timeout", async () => {
    mockGetSettings.mockResolvedValue(makeSettings());
    // Simulate a DOMException-style TimeoutError (what AbortSignal.timeout throws)
    const timeoutError = new DOMException(
      "The operation was aborted due to timeout",
      "TimeoutError",
    );
    vi.mocked(fetch).mockRejectedValue(timeoutError);

    const result = await testEbarimtConnection(db as never, ORG_ID);

    expect(result.success).toBe(false);
    expect(result.message).toContain("timed out");
  });
});
