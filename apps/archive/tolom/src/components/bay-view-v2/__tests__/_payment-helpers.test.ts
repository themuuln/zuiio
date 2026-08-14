import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ResolvedTransferBank } from "@/lib/payments/org-bank-accounts";
import { createInvoiceAndRecordPayment } from "../_payment-helpers";

const TRANSFER_BANK: ResolvedTransferBank = {
  id: "khanbank",
  nameEn: "Khan Bank",
  nameMn: "Хаан банк",
  logo: "/khanbank-logo.png",
  brandColor: "#00A651",
  accountNumber: "1234 5678 9012",
  accountHolder: "Zui LLC",
  isDefault: false,
};

function jsonResponse(body: unknown, ok = true): Response {
  return {
    ok,
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response;
}

describe("createInvoiceAndRecordPayment", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("creates the invoice via POST and records the full payment", async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({ data: { id: "inv-1", balance_due: 100_000 } }),
      )
      .mockResolvedValueOnce(jsonResponse({ data: {} }));

    await createInvoiceAndRecordPayment("org-1", "wo-1", "cash");

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "/api/organizations/org-1/invoices",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ work_order_id: "wo-1" }),
      },
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/api/organizations/org-1/invoices/inv-1/payments",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: 100_000,
          method: "cash",
          notes: undefined,
          reference: undefined,
        }),
      },
    );
  });

  it("throws when the invoice endpoint returns an error", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ error: { message: "Invoice failed" } }),
    );

    await expect(
      createInvoiceAndRecordPayment("org-1", "wo-1", "cash"),
    ).rejects.toThrow("Invoice failed");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("skips the payment when the invoice has no balance due", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ data: { id: "inv-1", balance_due: 0 } }),
    );

    await createInvoiceAndRecordPayment("org-1", "wo-1", "cash");

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("adds the processing fee to the payment amount and notes", async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({ data: { id: "inv-1", total: 200_000 } }),
      )
      .mockResolvedValueOnce(jsonResponse({ data: {} }));

    await createInvoiceAndRecordPayment("org-1", "wo-1", "card", 1.5);

    const payBody = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(payBody.amount).toBe(203_000); // 200_000 + 1.5%
    expect(payBody.notes).toContain("Processing fee (1.5%)");
  });

  it("resolves the transfer bank and sends reference + bank note for bank_transfer", async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({ data: { id: "inv-1", balance_due: 50_000 } }),
      )
      .mockResolvedValueOnce(jsonResponse({ data: {} }));

    await createInvoiceAndRecordPayment(
      "org-1",
      "wo-1",
      "bank_transfer",
      0,
      [TRANSFER_BANK],
      "khanbank",
    );

    const payBody = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(payBody.reference).toBe("1234 5678 9012");
    expect(payBody.notes).toContain("Khan Bank — 1234 5678 9012 (Zui LLC)");
  });

  it("omits bank details when the transfer bank id is not found", async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({ data: { id: "inv-1", balance_due: 50_000 } }),
      )
      .mockResolvedValueOnce(jsonResponse({ data: {} }));

    await createInvoiceAndRecordPayment(
      "org-1",
      "wo-1",
      "bank_transfer",
      0,
      [TRANSFER_BANK],
      "unknown-bank",
    );

    const payBody = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(payBody.reference).toBeUndefined();
    expect(payBody.notes).toBeUndefined();
  });

  it("throws when the payment endpoint fails", async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({ data: { id: "inv-1", balance_due: 50_000 } }),
      )
      .mockResolvedValueOnce(
        jsonResponse({ error: { message: "Pay failed" } }, false),
      );

    await expect(
      createInvoiceAndRecordPayment("org-1", "wo-1", "cash"),
    ).rejects.toThrow("Pay failed");
  });
});
