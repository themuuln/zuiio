import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabaseClient } from "@/test/mocks/supabase";

vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));
vi.mock("@/lib/audit", () => ({ logAuditAfter: vi.fn() }));
vi.mock("@/lib/cache/keys", () => ({
  cacheTags: {
    invoices: (orgId: string) => `invoices:${orgId}`,
    invoice: (id: string) => `invoice:${id}`,
  },
}));
vi.mock("@/lib/errors", () => {
  class NotFoundError extends Error {
    constructor(msg: string) {
      super(msg);
      this.name = "NotFoundError";
    }
  }
  class ValidationError extends Error {
    constructor(msg: string) {
      super(msg);
      this.name = "ValidationError";
    }
  }
  return { NotFoundError, ValidationError };
});
vi.mock("@/lib/sentry-report-server", () => ({
  reportServerError: vi.fn(),
}));
vi.mock("@/lib/services/email-service", () => ({
  sendInvoiceEmail: vi.fn().mockResolvedValue({ id: "email-1" }),
}));
vi.mock("@/lib/services/push-triggers", () => ({
  notifyInvoiceSent: vi.fn().mockResolvedValue(undefined),
  notifyPaymentReceived: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/lib/services/tax-service", () => ({
  getOrgTaxSettings: vi.fn(() =>
    Promise.resolve({ nuatEnabled: false, taxRate: 0.1 }),
  ),
  calculateTax: vi.fn(
    (amt: number, rate: number, _nuat: boolean) =>
      Math.round(amt * rate * 100) / 100,
  ),
}));
vi.mock("@/lib/supabase/with-branch", () => ({
  withBranchFilter: vi.fn((q: unknown) => q),
}));

import { revalidateTag } from "next/cache";
import { logAuditAfter } from "@/lib/audit";
import { reportServerError } from "@/lib/sentry-report-server";
import { sendInvoiceEmail } from "@/lib/services/email-service";
import {
  notifyInvoiceSent,
  notifyPaymentReceived,
} from "@/lib/services/push-triggers";
import { calculateTax, getOrgTaxSettings } from "@/lib/services/tax-service";

import {
  addInvoiceItem,
  createInvoiceFromWorkOrder,
  createStandaloneInvoice,
  deleteInvoice,
  generateInvoiceNumber,
  getInvoice,
  getInvoiceByPublicToken,
  getInvoiceStats,
  getInvoices,
  markInvoiceEmailed,
  recordPayment,
  removeInvoiceItem,
  sendInvoiceAndMarkEmailed,
  updateInvoiceItem,
  updateInvoiceStatus,
} from "../invoice-service";

const ORG_ID = "org-1";
const USER_ID = "user-1";
const INVOICE_ID = "inv-1";

let db: ReturnType<typeof createMockSupabaseClient>;

function makeInvoice(overrides: Record<string, unknown> = {}) {
  return {
    id: INVOICE_ID,
    organization_id: ORG_ID,
    branch_id: "branch-1",
    invoice_number: "INV-2026-00001",
    status: "draft",
    subtotal: 100000,
    discount_total: 0,
    tax_total: 10000,
    total: 110000,
    amount_paid: 0,
    balance_due: 110000,
    issued_at: "2026-01-15T10:00:00Z",
    due_at: "2026-01-22T10:00:00Z",
    customer_id: "cust-1",
    customer_name: "John Doe",
    customer_phone: "+976-99111111",
    customer_email: "john@example.com",
    customer_address: "UB, Mongolia",
    vehicle_id: "veh-1",
    vehicle_plate: "0015УБА",
    vehicle_details: "Toyota Prius 2020",
    work_order_id: "wo-1",
    notes: null,
    terms: "Payment due upon receipt.",
    footer: null,
    public_token: "public-token-1",
    email_sent_at: null,
    paid_at: null,
    created_at: "2026-01-15T10:00:00Z",
    updated_at: "2026-01-15T10:00:00Z",
    created_by: USER_ID,
    updated_by: USER_ID,
    deleted_at: null,
    ...overrides,
  };
}

function makeInvoiceItem(overrides: Record<string, unknown> = {}) {
  return {
    id: "item-1",
    invoice_id: INVOICE_ID,
    item_type: "service",
    description: "Oil Change",
    quantity: 1,
    unit_price: 60000,
    discount_amount: 0,
    total_price: 60000,
    sort_order: 0,
    created_at: "2026-01-15T10:00:00Z",
    ...overrides,
  };
}

function makePayment(overrides: Record<string, unknown> = {}) {
  return {
    id: "pay-1",
    invoice_id: INVOICE_ID,
    amount: 110000,
    method: "cash",
    reference: null,
    notes: null,
    paid_at: "2026-01-15T10:30:00Z",
    created_at: "2026-01-15T10:30:00Z",
    created_by: USER_ID,
    ...overrides,
  };
}

function makeRefund(overrides: Record<string, unknown> = {}) {
  return {
    id: "ref-1",
    invoice_id: INVOICE_ID,
    organization_id: ORG_ID,
    amount: 50000,
    method: "cash",
    status: "completed",
    reason: "Customer returned",
    reference: null,
    notes: null,
    refunded_at: "2026-01-16T10:00:00Z",
    created_at: "2026-01-16T10:00:00Z",
    updated_at: "2026-01-16T10:00:00Z",
    created_by: USER_ID,
    ...overrides,
  };
}

const mockRevalidateTag = vi.mocked(revalidateTag);
const mockLogAudit = vi.mocked(logAuditAfter);
const mockReportServerError = vi.mocked(reportServerError);
const mockSendInvoiceEmail = vi.mocked(sendInvoiceEmail);
const mockNotifyInvoiceSent = vi.mocked(notifyInvoiceSent);
const _mockNotifyPaymentReceived = vi.mocked(notifyPaymentReceived);
const mockGetOrgTaxSettings = vi.mocked(getOrgTaxSettings);
const mockCalculateTax = vi.mocked(calculateTax);

beforeEach(() => {
  vi.clearAllMocks();
  db = createMockSupabaseClient();
});

/**
 * Helper: set up resolveOnce values for getInvoice()
 * Flow: invoice .single() + Promise.all(items, payments, refunds) = 4 awaits
 */
function setupGetInvoiceMocks(
  inv?: Record<string, unknown>,
  items?: Record<string, unknown>[],
  payments?: Record<string, unknown>[],
  refunds?: Record<string, unknown>[],
) {
  db.__qb.resolveOnce({
    data: makeInvoice(inv),
    error: null,
  });
  db.__qb.resolveOnce({
    data: (items ?? [makeInvoiceItem()]).map((o) => makeInvoiceItem(o)),
    error: null,
  });
  db.__qb.resolveOnce({
    data: (payments ?? [makePayment()]).map((o) => makePayment(o)),
    error: null,
  });
  db.__qb.resolveOnce({
    data: (refunds ?? []).map((o) => makeRefund(o)),
    error: null,
  });
}

// ── generateInvoiceNumber ──────────────────────────────────────
describe("generateInvoiceNumber", () => {
  it("generates number from prefix and latest invoice", async () => {
    // Promise.all inside genInvoiceNumber:
    //   1. org_settings.maybeSingle  → must use mockResolvedValueOnce
    //   2. invoices.single()         → uses resolveOnce queue
    vi.mocked(
      db.from("organization_settings").maybeSingle,
    ).mockResolvedValueOnce({ data: { invoice_prefix: "INV" }, error: null });
    db.__qb.resolveOnce({
      data: { invoice_number: "INV-2026-00001" },
      error: null,
    });
    db.__qb.resolveWith({ data: null, error: null });

    const result = await generateInvoiceNumber(db as never, ORG_ID);

    expect(result).toMatch(/^INV-2026-00002$/);
  });

  it("uses default prefix when org settings missing prefix", async () => {
    vi.mocked(
      db.from("organization_settings").maybeSingle,
    ).mockResolvedValueOnce({ data: { invoice_prefix: null }, error: null });
    db.__qb.resolveOnce({
      data: { invoice_number: "INV-2026-00042" },
      error: null,
    });
    db.__qb.resolveWith({ data: null, error: null });

    const result = await generateInvoiceNumber(db as never, ORG_ID);

    expect(result).toMatch(/^INV-2026-00043$/);
  });

  it("starts at 1 when no invoices exist", async () => {
    vi.mocked(
      db.from("organization_settings").maybeSingle,
    ).mockResolvedValueOnce({ data: { invoice_prefix: "SVC" }, error: null });
    db.__qb.resolveOnce({ data: null, error: new Error("PGRST116") });
    db.__qb.resolveWith({ data: null, error: null });

    const result = await generateInvoiceNumber(db as never, ORG_ID);

    expect(result).toMatch(/^SVC-2026-00001$/);
  });

  it("throws on org settings fetch error", async () => {
    vi.mocked(
      db.from("organization_settings").maybeSingle,
    ).mockResolvedValueOnce({
      data: null,
      error: new Error("settings fetch failed"),
    });
    db.__qb.resolveWith({ data: null, error: null });

    await expect(generateInvoiceNumber(db as never, ORG_ID)).rejects.toThrow(
      "Failed to fetch org settings",
    );
    expect(mockReportServerError).toHaveBeenCalled();
  });
});

// ── getInvoices ────────────────────────────────────────────────
describe("getInvoices", () => {
  it("returns all invoices for an org", async () => {
    db.__qb.resolveWith({
      data: [makeInvoice({ id: "inv-1" }), makeInvoice({ id: "inv-2" })],
      error: null,
    });

    const result = await getInvoices(db as never, ORG_ID);

    expect(result).toHaveLength(2);
  });

  it("returns empty array when no invoices", async () => {
    db.__qb.resolveWith({ data: null, error: null });

    const result = await getInvoices(db as never, ORG_ID);

    expect(result).toEqual([]);
  });

  it("throws on DB error", async () => {
    db.__qb.resolveWith({
      data: null,
      error: new Error("DB error"),
    });

    // The function throws error.message directly: `error.message ?? "Failed to fetch invoices"`
    await expect(getInvoices(db as never, ORG_ID)).rejects.toThrow("DB error");
  });
});

// ── getInvoice ─────────────────────────────────────────────────
describe("getInvoice", () => {
  it("returns invoice with items, payments, and refunds", async () => {
    setupGetInvoiceMocks();
    db.__qb.resolveWith({ data: null, error: null });

    const result = await getInvoice(db as never, INVOICE_ID);

    expect(result.id).toBe(INVOICE_ID);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].description).toBe("Oil Change");
    expect(result.payments).toHaveLength(1);
    expect(result.refunds).toHaveLength(0);
  });

  it("throws NotFoundError when invoice missing", async () => {
    db.__qb.resolveOnce({ data: null, error: null });
    db.__qb.resolveWith({ data: null, error: null });

    await expect(getInvoice(db as never, "missing-id")).rejects.toThrow(
      "not found",
    );
  });

  it("throws on items fetch error", async () => {
    db.__qb.resolveOnce({ data: makeInvoice(), error: null });
    db.__qb.resolveOnce({
      data: null,
      error: new Error("items error"),
    });
    // items fetch had error, code throws before reaching payments/refunds
    db.__qb.resolveWith({ data: null, error: null });

    await expect(getInvoice(db as never, INVOICE_ID)).rejects.toThrow(
      "Failed to fetch invoice items",
    );
  });
});

// ── getInvoiceByPublicToken ────────────────────────────────────
describe("getInvoiceByPublicToken", () => {
  it("returns invoice by public token", async () => {
    db.__qb.resolveOnce({ data: makeInvoice(), error: null });
    // Promise.all(items, payments)
    db.__qb.resolveOnce({ data: [makeInvoiceItem()], error: null });
    db.__qb.resolveOnce({ data: [makePayment()], error: null });
    db.__qb.resolveWith({ data: null, error: null });

    const result = await getInvoiceByPublicToken(db as never, "public-token-1");

    expect(result.id).toBe(INVOICE_ID);
    expect(result.items).toHaveLength(1);
  });

  it("throws NotFoundError when not found", async () => {
    db.__qb.resolveOnce({ data: null, error: null });
    db.__qb.resolveWith({ data: null, error: null });

    await expect(
      getInvoiceByPublicToken(db as never, "invalid-token"),
    ).rejects.toThrow("not found");
  });
});

// ── createInvoiceFromWorkOrder ─────────────────────────────────
describe("createInvoiceFromWorkOrder", () => {
  const workOrder = {
    id: "wo-1",
    organization_id: ORG_ID,
    status: "Completed",
    branch_id: "branch-1",
    customer_id: "cust-1",
    vehicle_id: "veh-1",
    discount_amount: 0,
    nuat_enabled: false,
  };

  const customer = {
    id: "cust-1",
    first_name: "John",
    last_name: "Doe",
    company_name: null,
    phone: "+976-99111111",
    email: "john@example.com",
    address: "UB, Mongolia",
  };

  const vehicle = {
    id: "veh-1",
    make: "Toyota",
    model: "Prius",
    year: 2020,
    plate_number: "0015УБА",
  };

  const workOrderService = {
    id: "ws-1",
    service_name: "Oil Change",
    quantity: 1,
    unit_price: 60000,
    discount_amount: 0,
    final_price: 60000,
  };

  const workOrderPart = {
    id: "wp-1",
    part_name: "Oil Filter",
    quantity: 1,
    unit_price: 15000,
    discount_amount: 0,
    final_price: 15000,
  };

  it("creates invoice from completed work order", async () => {
    // Step 1: Promise.all(work_orders.single(), invoices.maybeSingle())
    db.__qb.resolveOnce({ data: workOrder, error: null });
    // maybeSingle for existing invoice check — default returns null (no existing)

    // Step 2: Promise.all(customer.single(), vehicle.single(), wos, wop)
    db.__qb.resolveOnce({ data: customer, error: null });
    db.__qb.resolveOnce({ data: vehicle, error: null });
    db.__qb.resolveOnce({ data: [workOrderService], error: null });
    db.__qb.resolveOnce({ data: [workOrderPart], error: null });

    // Step 3: retryInsertInvoice → generateInvoiceNumber
    //   generateInvoiceNumber: Promise.all(maybeSingle(settings), .single(invoices))
    //   NOTE: maybeSingle(settings) uses the default mockResolvedValue({ data: null, error: null })
    //   which means prefix falls back to default "INV" — that's fine.
    //   We do NOT set a mockResolvedValueOnce here because the first maybeSingle call
    //   (existing invoice check in step 1) would consume it (shared qb mock).
    db.__qb.resolveOnce({
      data: { invoice_number: "INV-2026-00001" },
      error: null,
    });
    //   retryInsertInvoice: insert.single()
    db.__qb.resolveOnce({ data: { id: INVOICE_ID }, error: null });

    // Step 4: invoice_items batch insert (no .single())
    db.__qb.resolveOnce({ data: undefined, error: null });
    db.__qb.resolveWith({ data: null, error: null });

    await createInvoiceFromWorkOrder(db as never, ORG_ID, "wo-1", {
      dueDays: 7,
      userId: USER_ID,
    });

    expect(mockLogAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "create",
        table_name: "invoices",
        record_id: INVOICE_ID,
        organization_id: ORG_ID,
      }),
    );
    expect(mockRevalidateTag).toHaveBeenCalledWith(`invoices:${ORG_ID}`, "max");
    expect(mockGetOrgTaxSettings).toHaveBeenCalled();
    expect(mockCalculateTax).toHaveBeenCalled();
  });

  it("rejects work order not in Completed or Ready for Pickup status", async () => {
    db.__qb.resolveOnce({
      data: { ...workOrder, status: "In Progress" },
      error: null,
    });
    db.__qb.resolveWith({ data: null, error: null });

    await expect(
      createInvoiceFromWorkOrder(db as never, ORG_ID, "wo-1"),
    ).rejects.toThrow("must be Completed or Ready for Pickup");
  });

  it("throws NotFoundError when work order missing", async () => {
    db.__qb.resolveOnce({ data: null, error: null });
    db.__qb.resolveWith({ data: null, error: null });

    await expect(
      createInvoiceFromWorkOrder(db as never, ORG_ID, "nonexistent"),
    ).rejects.toThrow("not found");
  });

  it("returns existing invoice when one already exists", async () => {
    // Step 1: work_orders.single() + invoices.maybeSingle()
    db.__qb.resolveOnce({ data: workOrder, error: null });
    vi.mocked(db.from("invoices").maybeSingle).mockResolvedValueOnce({
      data: { id: INVOICE_ID, invoice_number: "INV-2026-00001" },
      error: null,
    });

    // getInvoice called internally: 4 sequential awaits
    db.__qb.resolveOnce({
      data: makeInvoice({ work_order_id: "wo-1" }),
      error: null,
    });
    db.__qb.resolveOnce({ data: [makeInvoiceItem()], error: null });
    db.__qb.resolveOnce({ data: [makePayment()], error: null });
    db.__qb.resolveOnce({ data: [], error: null });
    db.__qb.resolveWith({ data: null, error: null });

    const result = await createInvoiceFromWorkOrder(
      db as never,
      ORG_ID,
      "wo-1",
      { userId: USER_ID },
    );

    expect(result.id).toBe(INVOICE_ID);
    expect(result.work_order_id).toBe("wo-1");
  });
});

// ── createStandaloneInvoice ────────────────────────────────────
describe("createStandaloneInvoice", () => {
  const params = {
    customer_name: "Jane Doe",
    customer_phone: "+976-99222222",
    items: [
      {
        description: "Brake Pad Replacement",
        item_type: "service",
        quantity: 1,
        unit_price: 80000,
      },
      {
        description: "Brake Pads",
        item_type: "part",
        quantity: 2,
        unit_price: 25000,
      },
    ],
    notes: null,
    terms: "Payment due upon receipt.",
    dueDays: 7,
  };

  it("creates standalone invoice with items", async () => {
    // genInvoiceNumber: maybeSingle(settings)
    vi.mocked(
      db.from("organization_settings").maybeSingle,
    ).mockResolvedValueOnce({ data: { invoice_prefix: "INV" }, error: null });
    // genInvoiceNumber: .single(invoices)
    db.__qb.resolveOnce({
      data: { invoice_number: "INV-2026-00001" },
      error: null,
    });
    // retryInsertInvoice: insert.single()
    db.__qb.resolveOnce({ data: { id: INVOICE_ID }, error: null });
    // items insert (no .single())
    db.__qb.resolveOnce({ data: undefined, error: null });

    // getInvoice(invoice.id): 4 awaits
    db.__qb.resolveOnce({ data: makeInvoice(), error: null });
    db.__qb.resolveOnce({ data: [makeInvoiceItem()], error: null });
    db.__qb.resolveOnce({ data: [makePayment()], error: null });
    db.__qb.resolveOnce({ data: [], error: null });
    db.__qb.resolveWith({ data: null, error: null });

    const result = await createStandaloneInvoice(
      db as never,
      ORG_ID,
      params,
      USER_ID,
    );

    expect(result.id).toBe(INVOICE_ID);
    expect(mockRevalidateTag).toHaveBeenCalledWith(`invoices:${ORG_ID}`, "max");
  });

  it("throws ValidationError when no items provided", async () => {
    await expect(
      createStandaloneInvoice(
        db as never,
        ORG_ID,
        { ...params, items: [] },
        USER_ID,
      ),
    ).rejects.toThrow("At least one invoice item is required");
  });

  it("rolls back on items insert failure", async () => {
    // genInvoiceNumber: maybeSingle(settings)
    vi.mocked(
      db.from("organization_settings").maybeSingle,
    ).mockResolvedValueOnce({ data: { invoice_prefix: "INV" }, error: null });
    // genInvoiceNumber: .single(invoices)
    db.__qb.resolveOnce({
      data: { invoice_number: "INV-2026-00001" },
      error: null,
    });
    // retryInsertInvoice: insert.single()
    db.__qb.resolveOnce({ data: { id: INVOICE_ID }, error: null });
    // items insert fails
    db.__qb.resolveOnce({
      data: null,
      error: new Error("items insert failed"),
    });
    // rollback: invoices.delete()
    db.__qb.resolveWith({ data: null, error: null });

    await expect(
      createStandaloneInvoice(db as never, ORG_ID, params, USER_ID),
    ).rejects.toThrow("items insert failed");

    expect(mockReportServerError).toHaveBeenCalled();
  });
});

// ── updateInvoiceStatus ────────────────────────────────────────
describe("updateInvoiceStatus", () => {
  beforeEach(() => {
    db.auth.getUser.mockResolvedValue({
      data: { user: { id: USER_ID } },
      error: null,
    });
  });

  it("updates status to paid", async () => {
    // Fetch old invoice .single()
    db.__qb.resolveOnce({
      data: makeInvoice({ status: "draft" }),
      error: null,
    });
    // Update .single() (no refund check for "paid")
    db.__qb.resolveOnce({
      data: makeInvoice({
        status: "paid",
        amount_paid: 110000,
        balance_due: 0,
        paid_at: "2026-01-15T11:00:00Z",
      }),
      error: null,
    });
    // Notification: organization_users owner lookup .single() for "paid" status
    db.__qb.resolveOnce({ data: { user_id: USER_ID }, error: null });
    db.__qb.resolveWith({ data: null, error: null });

    const result = await updateInvoiceStatus(
      db as never,
      INVOICE_ID,
      ORG_ID,
      "paid",
    );

    expect(result.status).toBe("paid");
    expect(mockLogAudit).toHaveBeenCalled();
    expect(mockRevalidateTag).toHaveBeenCalledWith(
      `invoice:${INVOICE_ID}`,
      "max",
    );
    expect(mockRevalidateTag).toHaveBeenCalledWith(`invoices:${ORG_ID}`, "max");
  });

  it("updates status to sent", async () => {
    db.__qb.resolveOnce({
      data: makeInvoice({ status: "draft" }),
      error: null,
    });
    db.__qb.resolveOnce({ data: makeInvoice({ status: "sent" }), error: null });
    // owner lookup for sent notification
    db.__qb.resolveOnce({ data: { user_id: USER_ID }, error: null });
    db.__qb.resolveWith({ data: null, error: null });

    await updateInvoiceStatus(db as never, INVOICE_ID, ORG_ID, "sent");

    expect(mockNotifyInvoiceSent).toHaveBeenCalled();
  });

  it("updates status to cancelled when no completed refunds", async () => {
    db.__qb.resolveOnce({
      data: makeInvoice({ status: "draft" }),
      error: null,
    });
    // Refund check (only for "cancelled")
    db.__qb.resolveOnce({ data: [], error: null });
    db.__qb.resolveOnce({
      data: makeInvoice({ status: "cancelled" }),
      error: null,
    });
    db.__qb.resolveWith({ data: null, error: null });

    const result = await updateInvoiceStatus(
      db as never,
      INVOICE_ID,
      ORG_ID,
      "cancelled",
    );

    expect(result.status).toBe("cancelled");
  });

  it("throws ValidationError when cancelling with completed refunds", async () => {
    db.__qb.resolveOnce({ data: makeInvoice(), error: null });
    // Refunds exist (completed)
    db.__qb.resolveOnce({ data: [{ id: "ref-1" }], error: null });
    db.__qb.resolveWith({ data: null, error: null });

    await expect(
      updateInvoiceStatus(db as never, INVOICE_ID, ORG_ID, "cancelled"),
    ).rejects.toThrow("Cannot cancel");
  });

  it("throws NotFoundError when invoice not found", async () => {
    db.__qb.resolveOnce({
      data: null,
      error: new Error("not found"),
    });
    db.__qb.resolveWith({ data: null, error: null });

    await expect(
      updateInvoiceStatus(db as never, "missing", ORG_ID, "paid"),
    ).rejects.toThrow("not found");
  });
});

// ── markInvoiceEmailed ─────────────────────────────────────────
describe("markInvoiceEmailed", () => {
  beforeEach(() => {
    db.auth.getUser.mockResolvedValue({
      data: { user: { id: USER_ID } },
      error: null,
    });
  });

  it("marks invoice as emailed", async () => {
    db.__qb.resolveOnce({
      data: makeInvoice({
        email_sent_at: "2026-01-15T11:00:00Z",
        status: "sent",
      }),
      error: null,
    });
    db.__qb.resolveWith({ data: null, error: null });

    const result = await markInvoiceEmailed(db as never, INVOICE_ID, ORG_ID);

    expect(result.email_sent_at).toBe("2026-01-15T11:00:00Z");
    expect(mockRevalidateTag).toHaveBeenCalledWith(
      `invoice:${INVOICE_ID}`,
      "max",
    );
    expect(mockRevalidateTag).toHaveBeenCalledWith(`invoices:${ORG_ID}`, "max");
  });

  it("throws NotFoundError when update fails", async () => {
    db.__qb.resolveOnce({ data: null, error: null });
    db.__qb.resolveWith({ data: null, error: null });

    await expect(
      markInvoiceEmailed(db as never, "missing", ORG_ID),
    ).rejects.toThrow("not found");
  });
});

// ── sendInvoiceAndMarkEmailed ──────────────────────────────────
describe("sendInvoiceAndMarkEmailed", () => {
  it("sends email and marks as emailed", async () => {
    // getInvoice: 4 awaits
    setupGetInvoiceMocks({ customer_email: "john@example.com" });

    // org .single()
    db.__qb.resolveOnce({ data: { name: "Test Shop" }, error: null });
    // branch .maybeSingle() — default (null) is fine
    // markInvoiceEmailed: update .single()
    db.__qb.resolveOnce({
      data: makeInvoice({
        email_sent_at: "2026-01-15T11:00:00Z",
        status: "sent",
      }),
      error: null,
    });
    db.__qb.resolveWith({ data: null, error: null });

    const result = await sendInvoiceAndMarkEmailed(
      db as never,
      INVOICE_ID,
      ORG_ID,
    );

    expect(result.emailed).toBe(true);
    expect(mockSendInvoiceEmail).toHaveBeenCalled();
  });

  it("throws ValidationError when invoice has no customer email", async () => {
    // getInvoice: invoice .single() with no email
    setupGetInvoiceMocks({ customer_email: null });

    await expect(
      sendInvoiceAndMarkEmailed(db as never, INVOICE_ID, ORG_ID),
    ).rejects.toThrow("no customer email");
  });
});

// ── recordPayment ──────────────────────────────────────────────
describe("recordPayment", () => {
  beforeEach(() => {
    db.auth.getUser.mockResolvedValue({
      data: { user: { id: USER_ID } },
      error: null,
    });
  });

  it("records a cash payment with session lookup", async () => {
    // 1. Get invoice .single()
    db.__qb.resolveOnce({
      data: makeInvoice({ amount_paid: 0, balance_due: 110000 }),
      error: null,
    });
    // 2. Cash session lookup (.maybeSingle)
    vi.mocked(
      db.from("cash_register_sessions").maybeSingle,
    ).mockResolvedValueOnce({
      data: { id: "session-1" },
      error: null,
    });
    // 3. Insert payment (no .single())
    db.__qb.resolveOnce({ data: undefined, error: null });
    // 4. Fetch new payment .single()
    db.__qb.resolveOnce({
      data: makePayment({ id: "pay-new" }),
      error: null,
    });
    // 5. Cash register entry insert (no .single())
    db.__qb.resolveOnce({ data: undefined, error: null });
    // 6. Fetch all payments (no .single())
    db.__qb.resolveOnce({
      data: [makePayment({ id: "pay-new", amount: 110000 })],
      error: null,
    });
    // 7. Update invoice (no .single())
    db.__qb.resolveWith({ data: null, error: null });

    const result = await recordPayment(db as never, INVOICE_ID, ORG_ID, {
      amount: 110000,
      method: "cash",
    });

    expect(result).toHaveLength(1);
    expect(mockLogAudit).toHaveBeenCalled();
    expect(mockRevalidateTag).toHaveBeenCalledWith(
      `invoice:${INVOICE_ID}`,
      "max",
    );
    expect(mockRevalidateTag).toHaveBeenCalledWith(`invoices:${ORG_ID}`, "max");
  });

  it("records an electronic payment (no session)", async () => {
    db.__qb.resolveOnce({
      data: makeInvoice({ amount_paid: 0, balance_due: 110000 }),
      error: null,
    });
    // non-cash: no session query or cash register entry inserts
    // Insert payment
    db.__qb.resolveOnce({ data: undefined, error: null });
    // Fetch new payment .single()
    db.__qb.resolveOnce({
      data: makePayment({ id: "pay-new", method: "card" }),
      error: null,
    });
    // Fetch all payments
    db.__qb.resolveOnce({
      data: [makePayment({ id: "pay-new", amount: 110000, method: "card" })],
      error: null,
    });
    // Update invoice
    db.__qb.resolveWith({ data: null, error: null });

    const result = await recordPayment(db as never, INVOICE_ID, ORG_ID, {
      amount: 110000,
      method: "card",
      reference: "txn-123",
    });

    expect(result).toHaveLength(1);
    expect(mockLogAudit).toHaveBeenCalled();
  });

  it("throws NotFoundError when invoice not found", async () => {
    db.__qb.resolveOnce({ data: null, error: new Error("not found") });
    db.__qb.resolveWith({ data: null, error: null });

    await expect(
      recordPayment(db as never, "missing", ORG_ID, { amount: 1000 }),
    ).rejects.toThrow("not found");
  });
});

// ── getInvoiceStats ────────────────────────────────────────────
describe("getInvoiceStats", () => {
  it("calculates stats from all invoices", async () => {
    db.__qb.resolveWith({
      data: [
        { status: "paid", total: 110000, balance_due: 0 },
        { status: "paid", total: 55000, balance_due: 0 },
        { status: "draft", total: 30000, balance_due: 30000 },
        { status: "sent", total: 20000, balance_due: 20000 },
        { status: "overdue", total: 40000, balance_due: 40000 },
      ],
      error: null,
    });

    const stats = await getInvoiceStats(db as never, ORG_ID);

    expect(stats.total).toBe(5);
    expect(stats.paid).toBe(2);
    expect(stats.draft).toBe(1);
    expect(stats.sent).toBe(1);
    expect(stats.overdue).toBe(1);
    expect(stats.totalRevenue).toBe(165000);
    expect(stats.outstanding).toBe(90000);
  });

  it("returns zeros when no invoices exist", async () => {
    db.__qb.resolveWith({ data: null, error: null });

    const stats = await getInvoiceStats(db as never, ORG_ID);

    expect(stats.total).toBe(0);
    expect(stats.paid).toBe(0);
    expect(stats.totalRevenue).toBe(0);
    expect(stats.outstanding).toBe(0);
  });
});

// ── addInvoiceItem ─────────────────────────────────────────────
describe("addInvoiceItem", () => {
  it("adds item and recalculates totals", async () => {
    // Insert .single()
    db.__qb.resolveOnce({
      data: makeInvoiceItem({ id: "new-item" }),
      error: null,
    });
    // recalculateInvoiceTotals: Promise.all(items select, invoice .single())
    db.__qb.resolveOnce({
      data: [makeInvoiceItem({ total_price: 60000 })],
      error: null,
    });
    db.__qb.resolveOnce({
      data: { discount_total: 0, tax_total: 10000 },
      error: null,
    });
    // recalculate: update invoice (no .single())
    db.__qb.resolveWith({ data: null, error: null });

    const result = await addInvoiceItem(db as never, INVOICE_ID, ORG_ID, {
      description: "Oil Change",
      item_type: "service",
      quantity: 1,
      unit_price: 60000,
    });

    expect(result.description).toBe("Oil Change");
    expect(mockRevalidateTag).toHaveBeenCalledWith(
      `invoice:${INVOICE_ID}`,
      "max",
    );
    expect(mockRevalidateTag).toHaveBeenCalledWith(`invoices:${ORG_ID}`, "max");
  });

  it("throws ValidationError for empty description", async () => {
    await expect(
      addInvoiceItem(db as never, INVOICE_ID, ORG_ID, {
        description: "",
        item_type: "service",
      }),
    ).rejects.toThrow("Item description is required");
  });
});

// ── updateInvoiceItem ──────────────────────────────────────────
describe("updateInvoiceItem", () => {
  it("updates item description only", async () => {
    // No quantity/unit_price/discount change → skip current fetch
    // Update .single()
    db.__qb.resolveOnce({
      data: makeInvoiceItem({ description: "Updated Service" }),
      error: null,
    });
    // recalculateInvoiceTotals: Promise.all(items, invoice .single())
    db.__qb.resolveOnce({
      data: [makeInvoiceItem({ total_price: 60000 })],
      error: null,
    });
    db.__qb.resolveOnce({
      data: { discount_total: 0, tax_total: 10000 },
      error: null,
    });
    // recalculate: update invoice
    db.__qb.resolveWith({ data: null, error: null });

    const result = await updateInvoiceItem(
      db as never,
      "item-1",
      INVOICE_ID,
      ORG_ID,
      { description: "Updated Service" },
    );

    expect(result.description).toBe("Updated Service");
    expect(mockRevalidateTag).toHaveBeenCalledWith(
      `invoice:${INVOICE_ID}`,
      "max",
    );
  });

  it("recalculates total price when quantity changes", async () => {
    // Current item fetch .single() (quantity/unit_price/discount changed)
    db.__qb.resolveOnce({
      data: makeInvoiceItem({
        quantity: 1,
        unit_price: 60000,
        discount_amount: 0,
      }),
      error: null,
    });
    // Update .single()
    db.__qb.resolveOnce({
      data: makeInvoiceItem({ quantity: 3, total_price: 180000 }),
      error: null,
    });
    // recalculateInvoiceTotals: items select, invoice .single()
    db.__qb.resolveOnce({
      data: [makeInvoiceItem({ total_price: 180000 })],
      error: null,
    });
    db.__qb.resolveOnce({
      data: { discount_total: 0, tax_total: 10000 },
      error: null,
    });
    // recalculate: update invoice
    db.__qb.resolveWith({ data: null, error: null });

    const result = await updateInvoiceItem(
      db as never,
      "item-1",
      INVOICE_ID,
      ORG_ID,
      { quantity: 3 },
    );

    expect(result.total_price).toBe(180000);
  });

  it("throws ValidationError for empty description", async () => {
    await expect(
      updateInvoiceItem(db as never, "item-1", INVOICE_ID, ORG_ID, {
        description: "",
      }),
    ).rejects.toThrow("cannot be empty");
  });

  it("throws ValidationError when no fields to update", async () => {
    await expect(
      updateInvoiceItem(db as never, "item-1", INVOICE_ID, ORG_ID, {}),
    ).rejects.toThrow("No fields to update");
  });

  it("throws NotFoundError when current item not found", async () => {
    // Current item fetch fails (insufficient fields → doesn't trigger current fetch branch)
    // Actually for quantity change, we attempt current item fetch
    db.__qb.resolveOnce({
      data: null,
      error: new Error("not found"),
    });
    db.__qb.resolveWith({ data: null, error: null });

    await expect(
      updateInvoiceItem(db as never, "missing", INVOICE_ID, ORG_ID, {
        quantity: 1,
      }),
    ).rejects.toThrow("not found");
  });
});

// ── removeInvoiceItem ──────────────────────────────────────────
describe("removeInvoiceItem", () => {
  it("removes item and recalculates", async () => {
    // Delete (no .single())
    db.__qb.resolveOnce({ data: undefined, error: null });
    // recalculateInvoiceTotals: items select, invoice .single()
    db.__qb.resolveOnce({ data: [], error: null });
    db.__qb.resolveOnce({
      data: { discount_total: 0, tax_total: 0 },
      error: null,
    });
    // recalculate: update invoice
    db.__qb.resolveWith({ data: null, error: null });

    await removeInvoiceItem(db as never, "item-1", INVOICE_ID, ORG_ID);

    expect(mockRevalidateTag).toHaveBeenCalledWith(
      `invoice:${INVOICE_ID}`,
      "max",
    );
    expect(mockRevalidateTag).toHaveBeenCalledWith(`invoices:${ORG_ID}`, "max");
  });

  it("throws NotFoundError when item not found", async () => {
    db.__qb.resolveOnce({
      data: null,
      error: new Error("not found"),
    });
    db.__qb.resolveWith({ data: null, error: null });

    await expect(
      removeInvoiceItem(db as never, "missing", INVOICE_ID, ORG_ID),
    ).rejects.toThrow("not found");
  });
});

// ── deleteInvoice ──────────────────────────────────────────────
describe("deleteInvoice", () => {
  beforeEach(() => {
    db.auth.getUser.mockResolvedValue({
      data: { user: { id: USER_ID } },
      error: null,
    });
  });

  it("soft-deletes invoice and invalidates cache", async () => {
    db.__qb.resolveWith({ data: null, error: null });

    await deleteInvoice(db as never, INVOICE_ID, ORG_ID);

    expect(mockRevalidateTag).toHaveBeenCalledWith(
      `invoice:${INVOICE_ID}`,
      "max",
    );
    expect(mockRevalidateTag).toHaveBeenCalledWith(`invoices:${ORG_ID}`, "max");
  });

  it("throws NotFoundError when delete fails", async () => {
    db.__qb.resolveWith({
      data: null,
      error: new Error("not found"),
    });

    await expect(deleteInvoice(db as never, "missing", ORG_ID)).rejects.toThrow(
      "not found",
    );
  });
});
