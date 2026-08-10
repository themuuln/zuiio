import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  testEbarimtConnection,
  validateEbarimtConfig,
} from "@/lib/services/ebarimt-integration-service";
import {
  getEInvoiceSettings,
  updateEInvoiceSettings,
} from "@/lib/services/einvoice-service";
import { createClient } from "@/lib/supabase/server";
import {
  createMockSupabaseClient,
  type MockSupabaseClient,
} from "@/test/mocks/supabase";
import {
  readEbarimtSettings,
  testCurrentEbarimtConnection,
  updateEbarimtSettings,
  validateEbarimtSettings,
} from "../actions/ebarimt-settings";

vi.mock("@/lib/services/ebarimt-integration-service", () => ({
  validateEbarimtConfig: vi.fn(),
  testEbarimtConnection: vi.fn(),
}));
vi.mock("@/lib/services/einvoice-service", () => ({
  getEInvoiceSettings: vi.fn(),
  updateEInvoiceSettings: vi.fn(),
}));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

const mockValidateEbarimtConfig = vi.mocked(validateEbarimtConfig);
const mockTestEbarimtConnection = vi.mocked(testEbarimtConnection);
const mockGetEInvoiceSettings = vi.mocked(getEInvoiceSettings);
const mockUpdateEInvoiceSettings = vi.mocked(updateEInvoiceSettings);
const mockCreateClient = vi.mocked(createClient);

const ORG_ID = "org-1";

let db: MockSupabaseClient;

beforeEach(() => {
  vi.clearAllMocks();
  db = createMockSupabaseClient();
  mockCreateClient.mockResolvedValue(db as never);
});

describe("readEbarimtSettings", () => {
  it("returns the settings fetched by the service", async () => {
    const settings = {
      enabled: true,
      apiKey: "key-1",
      merchantId: "merchant-1",
      endpoint: "https://ebarimt.mn/api",
    };
    mockGetEInvoiceSettings.mockResolvedValue(settings);

    await expect(readEbarimtSettings(ORG_ID)).resolves.toEqual(settings);
    expect(mockGetEInvoiceSettings).toHaveBeenCalledWith(db, ORG_ID);
  });

  it("propagates service errors", async () => {
    mockGetEInvoiceSettings.mockRejectedValue(new Error("db down"));

    await expect(readEbarimtSettings(ORG_ID)).rejects.toThrow("db down");
  });
});

describe("validateEbarimtSettings", () => {
  it("returns the config status from the service", async () => {
    const status = {
      configured: true,
      enabled: true,
      hasApiKey: true,
      missing: [],
    };
    mockValidateEbarimtConfig.mockResolvedValue(status);

    await expect(validateEbarimtSettings(ORG_ID)).resolves.toEqual(status);
    expect(mockValidateEbarimtConfig).toHaveBeenCalledWith(db, ORG_ID);
  });
});

describe("updateEbarimtSettings", () => {
  it("forwards settings to the service and returns the updated settings", async () => {
    const settings = {
      enabled: false,
      apiKey: "new-key",
      merchantId: "m",
      endpoint: "e",
    };
    const updated = { ...settings };
    mockUpdateEInvoiceSettings.mockResolvedValue(updated);

    await expect(updateEbarimtSettings(ORG_ID, settings)).resolves.toEqual(
      updated,
    );
    expect(mockUpdateEInvoiceSettings).toHaveBeenCalledWith(
      db,
      ORG_ID,
      settings,
    );
  });

  it("passes through partial settings objects", async () => {
    mockUpdateEInvoiceSettings.mockResolvedValue({
      enabled: true,
      apiKey: "key",
      merchantId: null,
      endpoint: "https://ebarimt.mn/api",
    });

    await updateEbarimtSettings(ORG_ID, { enabled: true });

    expect(mockUpdateEInvoiceSettings).toHaveBeenCalledWith(db, ORG_ID, {
      enabled: true,
    });
  });
});

describe("testCurrentEbarimtConnection", () => {
  it("returns the connection test result from the service", async () => {
    const result = { success: true, message: "Connected" };
    mockTestEbarimtConnection.mockResolvedValue(result);

    await expect(testCurrentEbarimtConnection(ORG_ID)).resolves.toEqual(result);
    expect(mockTestEbarimtConnection).toHaveBeenCalledWith(db, ORG_ID);
  });

  it("propagates service errors", async () => {
    mockTestEbarimtConnection.mockRejectedValue(
      new Error("connection refused"),
    );

    await expect(testCurrentEbarimtConnection(ORG_ID)).rejects.toThrow(
      "connection refused",
    );
  });
});
