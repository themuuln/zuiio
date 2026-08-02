import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Module mocks (server action deps) ──────────────────────────

vi.mock("@sentry/nextjs", () => ({
  startSpan: vi.fn((_name: unknown, callback: (span: unknown) => unknown) => {
    const span = {
      setAttribute: vi.fn(),
      setAttributes: vi.fn(),
      setStatus: vi.fn(),
    };
    return callback(span);
  }),
}));

vi.mock("@zuiio/capture", () => ({
  capture: vi.fn(),
  withDbCapture: async (_label: unknown, promise: Promise<unknown>) => promise,
}));

vi.mock("@/lib/action-utils", () => ({
  requireAppContext: vi.fn(),
  requireWriteAction: vi.fn(),
}));

vi.mock("@/lib/contact-utils", () => ({
  findOrCreateContact: vi.fn(),
}));

vi.mock("@/lib/invoicing", () => ({
  createInvoiceFromSale: vi.fn(async () => {}),
}));

vi.mock("@/lib/revalidate", () => ({
  revalidateEntity: vi.fn(),
  revalidateEntityTag: vi.fn(),
}));

vi.mock("@/lib/webhooks", () => ({
  deliverWebhookEvent: vi.fn(async () => {}),
}));

import { requireWriteAction } from "@/lib/action-utils";
import { createShopSale } from "../actions";

const CURRENT_USER_ID = "user-1";

function makeSupabaseMock() {
  const updateEq = vi.fn().mockResolvedValue({ error: null });
  const update = vi.fn().mockReturnValue({ eq: updateEq });
  const rpc = vi.fn().mockResolvedValue({
    data: { success: true, sale_id: "sale-123", total_amount: 10000 },
    error: null,
  });
  const getClaims = vi.fn().mockResolvedValue({
    data: { claims: { sub: CURRENT_USER_ID, email: "buyer@example.com" } },
    error: null,
  });
  const from = vi.fn((table: string) => {
    if (table === "sales") return { update };
    return {};
  });
  return {
    supabase: {
      auth: { getClaims },
      rpc,
      from,
    } as never,
    update,
    updateEq,
    rpc,
    getClaims,
    from,
  };
}

function makeFormData(storeAccountId?: string): FormData {
  const fd = new FormData();
  fd.set(
    "items",
    JSON.stringify([
      {
        productId: "p1",
        name: "Бараа",
        quantity: 2,
        unitPrice: 5000,
        variantId: null,
      },
    ]),
  );
  fd.set("payment_method", "card");
  fd.set("paid_amount", "10000");
  if (storeAccountId) {
    fd.set("store_account_id", storeAccountId);
  }
  return fd;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createShopSale store_account_id handling", () => {
  it("sets store_account_id on the sale when it matches auth.uid()", async () => {
    const mocks = makeSupabaseMock();
    vi.mocked(requireWriteAction).mockResolvedValue({
      supabase: mocks.supabase,
      organizationId: "org-1",
      userId: CURRENT_USER_ID,
      branchId: "branch-1",
      roleId: null,
      permissions: ["sales.create"],
      isBranchScoped: false,
      user: { id: CURRENT_USER_ID, email: "buyer@example.com" },
    } as never);

    const result = await createShopSale(
      undefined,
      makeFormData(CURRENT_USER_ID),
    );

    expect(result).toEqual({ saleId: "sale-123" });
    expect(mocks.rpc).toHaveBeenCalledWith(
      "process_shop_sale",
      expect.anything(),
    );
    // Buyer linkage happens via a scoped update after the RPC succeeds.
    expect(mocks.from).toHaveBeenCalledWith("sales");
    expect(mocks.update).toHaveBeenCalledWith({
      store_account_id: CURRENT_USER_ID,
    });
    expect(mocks.updateEq).toHaveBeenCalledWith("id", "sale-123");
  });

  it("rejects a store_account_id that does not match auth.uid()", async () => {
    const mocks = makeSupabaseMock();
    vi.mocked(requireWriteAction).mockResolvedValue({
      supabase: mocks.supabase,
      organizationId: "org-1",
      userId: CURRENT_USER_ID,
      branchId: "branch-1",
      roleId: null,
      permissions: ["sales.create"],
      isBranchScoped: false,
      user: { id: CURRENT_USER_ID, email: "staff@example.com" },
    } as never);

    const result = await createShopSale(undefined, makeFormData("attacker-id"));

    expect(result).toEqual({
      error: "Хэрэглэгчийн бүртгэл баталгаажаагүй байна. Дахин нэвтэрнэ үү.",
    });
    expect(mocks.rpc).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("leaves store_account_id untouched when the field is absent", async () => {
    const mocks = makeSupabaseMock();
    vi.mocked(requireWriteAction).mockResolvedValue({
      supabase: mocks.supabase,
      organizationId: "org-1",
      userId: CURRENT_USER_ID,
      branchId: "branch-1",
      roleId: null,
      permissions: ["sales.create"],
      isBranchScoped: false,
      user: { id: CURRENT_USER_ID, email: "staff@example.com" },
    } as never);

    const result = await createShopSale(undefined, makeFormData());

    expect(result).toEqual({ saleId: "sale-123" });
    expect(mocks.rpc).toHaveBeenCalledWith(
      "process_shop_sale",
      expect.anything(),
    );
    expect(mocks.update).not.toHaveBeenCalled();
  });
});
