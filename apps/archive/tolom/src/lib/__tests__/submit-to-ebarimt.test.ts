import { revalidateTag } from "next/cache";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { logAuditAfter } from "@/lib/audit";
import { cacheTags } from "@/lib/cache/keys";
import { createEbarimtInvoice } from "@/lib/services/ebarimt-integration-service";
import { createClient } from "@/lib/supabase/server";
import {
  createMockSupabaseClient,
  type MockSupabaseClient,
} from "@/test/mocks/supabase";
import {
  submitInvoicesToEbarimt,
  submitInvoiceToEbarimt,
} from "../actions/submit-to-ebarimt";

vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));
vi.mock("@/lib/services/ebarimt-integration-service", () => ({
  createEbarimtInvoice: vi.fn(),
}));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

const mockRevalidateTag = vi.mocked(revalidateTag);
const mockLogAudit = vi.mocked(logAuditAfter);
const mockCreateEbarimtInvoice = vi.mocked(createEbarimtInvoice);
const mockCreateClient = vi.mocked(createClient);

const INVOICE_ID = "inv-1";
const ORG_ID = "org-1";
const USER_ID = "user-1";

let db: MockSupabaseClient;

beforeEach(() => {
  vi.clearAllMocks();
  db = createMockSupabaseClient();
  mockCreateClient.mockResolvedValue(db as never);
});

describe("submitInvoiceToEbarimt", () => {
  it("creates a server client and delegates to the integration service", async () => {
    const result = {
      status: "skipped" as const,
      registrationId: "",
      qrCode: "",
    };
    mockCreateEbarimtInvoice.mockResolvedValue(result);

    const returned = await submitInvoiceToEbarimt(INVOICE_ID, ORG_ID, USER_ID);

    expect(mockCreateClient).toHaveBeenCalledTimes(1);
    expect(mockCreateEbarimtInvoice).toHaveBeenCalledWith(
      db,
      INVOICE_ID,
      ORG_ID,
    );
    expect(returned).toEqual(result);
  });

  it("audits and revalidates cache tags when the invoice is registered", async () => {
    mockCreateEbarimtInvoice.mockResolvedValue({
      status: "registered",
      registrationId: "reg-1",
      qrCode: "qr-code-1",
    });

    const result = await submitInvoiceToEbarimt(INVOICE_ID, ORG_ID, USER_ID);

    expect(result.status).toBe("registered");
    expect(mockLogAudit).toHaveBeenCalledWith({
      supabase: db,
      action: "update",
      table_name: "invoices",
      record_id: INVOICE_ID,
      user_id: USER_ID,
      organization_id: ORG_ID,
      old_data: { einvoice_status: null },
      new_data: {
        einvoice_status: "registered",
        einvoice_registration_id: "reg-1",
      },
    });
    expect(mockRevalidateTag).toHaveBeenCalledWith(
      cacheTags.invoice(INVOICE_ID),
      "max",
    );
    expect(mockRevalidateTag).toHaveBeenCalledWith(
      cacheTags.invoices(ORG_ID),
      "max",
    );
  });

  it("does not audit or revalidate when the result is skipped", async () => {
    mockCreateEbarimtInvoice.mockResolvedValue({
      status: "skipped",
      registrationId: "",
      qrCode: "",
    });

    const result = await submitInvoiceToEbarimt(INVOICE_ID, ORG_ID, USER_ID);

    expect(result.status).toBe("skipped");
    expect(mockLogAudit).not.toHaveBeenCalled();
    expect(mockRevalidateTag).not.toHaveBeenCalled();
  });

  it("does not audit or revalidate when the result is failed", async () => {
    mockCreateEbarimtInvoice.mockResolvedValue({
      status: "failed",
      registrationId: "",
      qrCode: "",
      error: "API down",
    });

    const result = await submitInvoiceToEbarimt(INVOICE_ID, ORG_ID, USER_ID);

    expect(result.status).toBe("failed");
    expect(mockLogAudit).not.toHaveBeenCalled();
    expect(mockRevalidateTag).not.toHaveBeenCalled();
  });

  it("propagates errors thrown by the integration service", async () => {
    mockCreateEbarimtInvoice.mockRejectedValue(
      new Error("e-barimt unreachable"),
    );

    await expect(
      submitInvoiceToEbarimt(INVOICE_ID, ORG_ID, USER_ID),
    ).rejects.toThrow("e-barimt unreachable");
    expect(mockLogAudit).not.toHaveBeenCalled();
    expect(mockRevalidateTag).not.toHaveBeenCalled();
  });
});

describe("submitInvoicesToEbarimt", () => {
  it("submits each invoice sequentially and returns per-invoice results", async () => {
    const registered = {
      status: "registered" as const,
      registrationId: "reg-1",
      qrCode: "qr-1",
    };
    const skipped = {
      status: "skipped" as const,
      registrationId: "",
      qrCode: "",
    };
    mockCreateEbarimtInvoice
      .mockResolvedValueOnce(registered)
      .mockResolvedValueOnce(skipped);

    const results = await submitInvoicesToEbarimt(
      ["inv-1", "inv-2"],
      ORG_ID,
      USER_ID,
    );

    expect(mockCreateEbarimtInvoice).toHaveBeenCalledTimes(2);
    expect(mockCreateEbarimtInvoice).toHaveBeenNthCalledWith(
      1,
      db,
      "inv-1",
      ORG_ID,
    );
    expect(mockCreateEbarimtInvoice).toHaveBeenNthCalledWith(
      2,
      db,
      "inv-2",
      ORG_ID,
    );
    expect(results).toEqual({ "inv-1": registered, "inv-2": skipped });
  });

  it("audits only the registered invoices in a batch", async () => {
    mockCreateEbarimtInvoice.mockResolvedValue({
      status: "registered",
      registrationId: "reg-1",
      qrCode: "qr-1",
    });

    await submitInvoicesToEbarimt(["inv-1", "inv-2"], ORG_ID, USER_ID);

    expect(mockLogAudit).toHaveBeenCalledTimes(2);
    expect(mockRevalidateTag).toHaveBeenCalledTimes(4);
  });

  it("rejects the whole batch when one submission fails", async () => {
    mockCreateEbarimtInvoice
      .mockResolvedValueOnce({
        status: "skipped",
        registrationId: "",
        qrCode: "",
      })
      .mockRejectedValueOnce(new Error("boom"));

    await expect(
      submitInvoicesToEbarimt(["inv-1", "inv-2"], ORG_ID, USER_ID),
    ).rejects.toThrow("boom");
  });
});
