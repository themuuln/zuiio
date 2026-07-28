import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Mocks ──────────────────────────────────────────────────────

const receivePurchaseOrderMock = vi.fn();

vi.mock("@/lib/api-handler", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/api-response", () => ({
  apiError: vi.fn(
    (type: string, message: string, status: number) =>
      new Response(JSON.stringify({ error: { code: type, message } }), {
        status,
      }),
  ),
  ok: vi.fn(
    (data: unknown) => new Response(JSON.stringify({ data }), { status: 200 }),
  ),
}));

vi.mock("@/lib/services/inventory-service", () => ({
  receivePurchaseOrder: receivePurchaseOrderMock,
}));

vi.mock("@/lib/errors", () => ({
  ValidationError: class ValidationError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "ValidationError";
    }
  },
}));

const { GET, PATCH, POST } = await import("./route");

// ── Helpers ────────────────────────────────────────────────────

function makeChain(resolvedValue: unknown) {
  const chain: Record<string, unknown> = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    is: vi.fn(() => chain),
    update: vi.fn(() => chain),
    single: vi.fn(() => chain),
    then: vi.fn((onFulfilled: (v: unknown) => unknown) =>
      Promise.resolve(resolvedValue).then(onFulfilled),
    ),
    catch: vi.fn(),
  };
  return chain;
}

// ── Tests ──────────────────────────────────────────────────────

describe("organizations/[id]/purchase-orders/[purchaseOrderId] route", () => {
  const orgId = "org-1";
  const user = { id: "user-1" };
  const purchaseOrderId = "po-1";
  const baseUrl = `http://localhost/api/organizations/${orgId}/purchase-orders/${purchaseOrderId}`;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── GET ───────────────────────────────────────────

  describe("GET", () => {
    it("returns a purchase order with joins", async () => {
      const po = { id: purchaseOrderId, status: "pending" };
      const chain = makeChain({ data: po, error: null });
      const supabase = { from: vi.fn(() => chain) };

      const request = new NextRequest(baseUrl);
      const response = await (GET as any)({
        supabase,
        params: { purchaseOrderId },
        orgId,
        request,
      });
      const body = await response.json();

      expect(supabase.from).toHaveBeenCalledWith("purchase_orders");
      expect(body.data).toEqual(po);
    });

    it("returns 404 when purchase order not found", async () => {
      const chain = makeChain({ data: null, error: { message: "Not found" } });
      const supabase = { from: vi.fn(() => chain) };

      const request = new NextRequest(baseUrl);
      const response = await (GET as any)({
        supabase,
        params: { purchaseOrderId },
        orgId,
        request,
      });

      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body.error.code).toBe("NOT_FOUND");
    });

    it("throws on supabase error", async () => {
      const chain = makeChain({ data: null, error: null });
      const supabase = { from: vi.fn(() => chain) };

      const request = new NextRequest(baseUrl);
      const response = await (GET as any)({
        supabase,
        params: { purchaseOrderId },
        orgId,
        request,
      });

      expect(response.status).toBe(404);
    });
  });

  // ── PATCH ─────────────────────────────────────────

  describe("PATCH", () => {
    it("updates a purchase order status", async () => {
      const po = { id: purchaseOrderId, status: "received" };
      const chain = makeChain({ data: po, error: null });
      const supabase = { from: vi.fn(() => chain) };

      const request = new NextRequest(baseUrl, {
        method: "PATCH",
        body: JSON.stringify({ status: "received" }),
        headers: { "content-type": "application/json" },
      });
      const response = await (PATCH as any)({
        supabase,
        params: { purchaseOrderId },
        orgId,
        request,
        user,
      });
      const body = await response.json();

      expect(supabase.from).toHaveBeenCalledWith("purchase_orders");
      expect(body.data).toEqual(po);
    });

    it("sets updated_by on update", async () => {
      const po = { id: purchaseOrderId };
      const chain = makeChain({ data: po, error: null });
      const supabase = { from: vi.fn(() => chain) };

      const request = new NextRequest(baseUrl, {
        method: "PATCH",
        body: JSON.stringify({ notes: "Updated notes" }),
        headers: { "content-type": "application/json" },
      });
      await (PATCH as any)({
        supabase,
        params: { purchaseOrderId },
        orgId,
        request,
        user,
      });

      expect(chain.update).toHaveBeenCalledWith(
        expect.objectContaining({ updated_by: user.id }),
      );
    });

    it("throws ValidationError when no valid fields provided", async () => {
      const chain = makeChain(null);
      const supabase = { from: vi.fn(() => chain) };

      const request = new NextRequest(baseUrl, {
        method: "PATCH",
        body: JSON.stringify({}),
        headers: { "content-type": "application/json" },
      });
      await expect(
        (PATCH as any)({
          supabase,
          params: { purchaseOrderId },
          orgId,
          request,
          user,
        }),
      ).rejects.toThrow("No valid fields to update");
      expect(chain.update).not.toHaveBeenCalled();
    });

    it("returns 404 when PO not found for update", async () => {
      const chain = makeChain({ data: null, error: { message: "Not found" } });
      const supabase = { from: vi.fn(() => chain) };

      const request = new NextRequest(baseUrl, {
        method: "PATCH",
        body: JSON.stringify({ status: "received" }),
        headers: { "content-type": "application/json" },
      });
      const response = await (PATCH as any)({
        supabase,
        params: { purchaseOrderId },
        orgId,
        request,
        user,
      });

      expect(response.status).toBe(404);
    });
  });

  // ── POST ──────────────────────────────────────────

  describe("POST", () => {
    it("receives a purchase order via action=receive", async () => {
      const po = { id: purchaseOrderId, status: "received" };
      receivePurchaseOrderMock.mockResolvedValue(po);

      const supabase = { from: vi.fn() };
      const request = new NextRequest(baseUrl, {
        method: "POST",
        body: JSON.stringify({ action: "receive" }),
        headers: { "content-type": "application/json" },
      });
      const response = await (POST as any)({
        supabase,
        params: { purchaseOrderId },
        orgId,
        request,
        user,
      });
      const body = await response.json();

      expect(receivePurchaseOrderMock).toHaveBeenCalledWith(
        supabase,
        purchaseOrderId,
        orgId,
        user.id,
      );
      expect(body.data).toEqual(po);
    });

    it("throws ValidationError for unsupported action", async () => {
      const supabase = { from: vi.fn() };
      const request = new NextRequest(baseUrl, {
        method: "POST",
        body: JSON.stringify({ action: "delete" }),
        headers: { "content-type": "application/json" },
      });
      await expect(
        (POST as any)({
          supabase,
          params: { purchaseOrderId },
          orgId,
          request,
          user,
        }),
      ).rejects.toThrow("Unsupported action");
    });
  });
});
