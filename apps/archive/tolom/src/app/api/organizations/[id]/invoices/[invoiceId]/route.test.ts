import type { SupabaseClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getInvoiceMock = vi.fn();
const sendInvoiceAndMarkEmailedMock = vi.fn();
const markInvoiceEmailedMock = vi.fn();
const updateInvoiceStatusMock = vi.fn();
const recordPaymentMock = vi.fn();
const addInvoiceItemMock = vi.fn();
const updateInvoiceItemMock = vi.fn();
const removeInvoiceItemMock = vi.fn();
const deleteInvoiceMock = vi.fn();

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

vi.mock("@/lib/services/invoice-service", () => ({
  getInvoice: getInvoiceMock,
  sendInvoiceAndMarkEmailed: sendInvoiceAndMarkEmailedMock,
  markInvoiceEmailed: markInvoiceEmailedMock,
  updateInvoiceStatus: updateInvoiceStatusMock,
  recordPayment: recordPaymentMock,
  addInvoiceItem: addInvoiceItemMock,
  updateInvoiceItem: updateInvoiceItemMock,
  removeInvoiceItem: removeInvoiceItemMock,
  deleteInvoice: deleteInvoiceMock,
}));

const { GET, PATCH, DELETE } = await import("./route");

interface HandlerContext {
  request?: NextRequest;
  supabase: SupabaseClient;
  orgId?: string;
  params: Record<string, string>;
  user?: { id: string };
}

// Valid UUID v4 for item IDs in Zod schemas
const ITEM_UUID = "00000000-0000-4000-8000-000000000001";

describe("organizations/[id]/invoices/[invoiceId] route", () => {
  const orgId = "org-1";
  const invoiceId = "inv-1";
  const user = { id: "user-1" };
  const baseUrl = `http://localhost/api/organizations/${orgId}/invoices/${invoiceId}`;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET", () => {
    it("returns invoice", async () => {
      const invoice = { id: invoiceId, status: "pending" };
      getInvoiceMock.mockResolvedValue(invoice);

      const context: HandlerContext = {
        supabase: {} as SupabaseClient,
        params: { invoiceId },
      };
      const response = await GET(context);
      const body = await response.json();

      expect(getInvoiceMock).toHaveBeenCalledWith({}, invoiceId);
      expect(body.data).toEqual(invoice);
    });

    it("handles service error", async () => {
      getInvoiceMock.mockRejectedValue(new Error("Fetch error"));

      const context: HandlerContext = {
        supabase: {} as SupabaseClient,
        params: { invoiceId },
      };
      await expect(GET(context)).rejects.toThrow("Fetch error");
    });
  });

  describe("PATCH", () => {
    it("sends email when action=send_email", async () => {
      const result = { sent: true };
      sendInvoiceAndMarkEmailedMock.mockResolvedValue(result);

      const req = new NextRequest(new URL(baseUrl), {
        method: "PATCH",
        body: JSON.stringify({ action: "send_email" }),
      });
      const context: HandlerContext = {
        request: req,
        supabase: {} as SupabaseClient,
        orgId,
        params: { invoiceId },
      };
      const response = await PATCH(context);
      const body = await response.json();

      expect(sendInvoiceAndMarkEmailedMock).toHaveBeenCalledWith(
        {},
        invoiceId,
        orgId,
      );
      expect(body.data).toEqual(result);
    });

    it("marks emailed when action=mark_emailed", async () => {
      const invoice = { id: invoiceId, emailed: true };
      markInvoiceEmailedMock.mockResolvedValue(invoice);

      const req = new NextRequest(new URL(baseUrl), {
        method: "PATCH",
        body: JSON.stringify({ action: "mark_emailed" }),
      });
      const context: HandlerContext = {
        request: req,
        supabase: {} as SupabaseClient,
        orgId,
        params: { invoiceId },
        user,
      };
      const response = await PATCH(context);
      const body = await response.json();

      expect(markInvoiceEmailedMock).toHaveBeenCalledWith(
        {},
        invoiceId,
        orgId,
        user.id,
      );
      expect(body.data).toEqual(invoice);
    });

    it("updates status when status provided", async () => {
      const invoice = { id: invoiceId, status: "paid" };
      updateInvoiceStatusMock.mockResolvedValue(invoice);

      const req = new NextRequest(new URL(baseUrl), {
        method: "PATCH",
        body: JSON.stringify({ status: "paid", notes: "Paid in full" }),
      });
      const context: HandlerContext = {
        request: req,
        supabase: {} as SupabaseClient,
        orgId,
        params: { invoiceId },
        user,
      };
      const response = await PATCH(context);
      const body = await response.json();

      expect(updateInvoiceStatusMock).toHaveBeenCalledWith(
        {},
        invoiceId,
        orgId,
        "paid",
        "Paid in full",
        user.id,
      );
      expect(body.data).toEqual(invoice);
    });

    it("records payment when action=record_payment", async () => {
      const payments = [{ id: "pmt-1", amount: 100 }];
      recordPaymentMock.mockResolvedValue(payments);

      const req = new NextRequest(new URL(baseUrl), {
        method: "PATCH",
        body: JSON.stringify({
          action: "record_payment",
          amount: 100,
          method: "cash",
        }),
      });
      const context: HandlerContext = {
        request: req,
        supabase: {} as SupabaseClient,
        orgId,
        params: { invoiceId },
        user,
      };
      const response = await PATCH(context);
      const body = await response.json();

      expect(recordPaymentMock).toHaveBeenCalledWith(
        {},
        invoiceId,
        orgId,
        {
          amount: 100,
          method: "cash",
          reference: undefined,
          notes: undefined,
        },
        user.id,
      );
      expect(body.data).toEqual(payments);
    });

    it("adds item when action=add_item", async () => {
      const item = { id: "item-1", description: "Brake pads" };
      addInvoiceItemMock.mockResolvedValue(item);

      const req = new NextRequest(new URL(baseUrl), {
        method: "PATCH",
        body: JSON.stringify({
          action: "add_item",
          item: {
            description: "Brake pads",
            item_type: "part",
            quantity: 2,
            unit_price: 50000,
          },
        }),
      });
      const context: HandlerContext = {
        request: req,
        supabase: {} as SupabaseClient,
        orgId,
        params: { invoiceId },
      };
      const response = await PATCH(context);
      const body = await response.json();

      expect(addInvoiceItemMock).toHaveBeenCalled();
      expect(body.data).toEqual(item);
    });

    it("updates item when action=update_item", async () => {
      const updatedItem = {
        id: ITEM_UUID,
        description: "Updated",
        quantity: 3,
      };
      updateInvoiceItemMock.mockResolvedValue(updatedItem);

      const req = new NextRequest(new URL(baseUrl), {
        method: "PATCH",
        body: JSON.stringify({
          action: "update_item",
          itemId: ITEM_UUID,
          item: {
            description: "Updated",
            quantity: 3,
            unit_price: 50000,
            item_type: "part",
          },
        }),
      });
      const context: HandlerContext = {
        request: req,
        supabase: {} as SupabaseClient,
        orgId,
        params: { invoiceId },
      };
      const response = await PATCH(context);
      const body = await response.json();

      expect(updateInvoiceItemMock).toHaveBeenCalled();
      expect(body.data).toEqual(updatedItem);
    });

    it("removes item when action=remove_item", async () => {
      removeInvoiceItemMock.mockResolvedValue(undefined);

      const req = new NextRequest(new URL(baseUrl), {
        method: "PATCH",
        body: JSON.stringify({ action: "remove_item", itemId: ITEM_UUID }),
      });
      const context: HandlerContext = {
        request: req,
        supabase: {} as SupabaseClient,
        orgId,
        params: { invoiceId },
      };
      const response = await PATCH(context);
      const body = await response.json();

      expect(removeInvoiceItemMock).toHaveBeenCalledWith(
        {},
        ITEM_UUID,
        invoiceId,
        orgId,
      );
      expect(body.data).toBeNull();
    });

    it("sets tax when action=set_tax", async () => {
      const updatedInvoice = {
        id: invoiceId,
        subtotal: 1000,
        tax_total: 100,
        total: 1100,
      };

      // The set_tax action makes two supabase calls:
      // 1. .from("invoices").select("subtotal, total").eq("id", invoiceId).single()
      // 2. .from("invoices").update(...).eq("id", x).eq("organization_id", orgId).select(...).single()
      const firstSingle = vi.fn().mockResolvedValueOnce({
        data: { subtotal: 1000, total: 1000 },
        error: null,
      });
      const secondSingle = vi
        .fn()
        .mockResolvedValueOnce({ data: updatedInvoice, error: null });
      const _selectFn = vi.fn(() => ({
        single: vi.fn().mockResolvedValueOnce({
          data: { subtotal: 1000, total: 1000 },
          error: null,
        }),
      }));

      let callCount = 0;
      const supabase = {
        from: vi.fn(() => {
          callCount++;
          if (callCount === 1) {
            // First call: select subquery
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: firstSingle,
                })),
              })),
            };
          }
          // Second call: update + eq + eq + select + single
          return {
            update: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  select: vi.fn(() => ({
                    single: secondSingle,
                  })),
                })),
              })),
            })),
          };
        }),
      } as unknown as SupabaseClient;

      const req = new NextRequest(new URL(baseUrl), {
        method: "PATCH",
        body: JSON.stringify({ action: "set_tax", tax_total: 100 }),
      });
      const context: HandlerContext = {
        request: req,
        supabase,
        orgId,
        params: { invoiceId },
      };
      const response = await PATCH(context);
      const body = await response.json();

      expect(body.data).toEqual(updatedInvoice);
    });

    it("returns 400 for unknown action", async () => {
      const req = new NextRequest(new URL(baseUrl), {
        method: "PATCH",
        body: JSON.stringify({ action: "unknown" }),
      });
      const context: HandlerContext = {
        request: req,
        supabase: {} as SupabaseClient,
        orgId,
        params: { invoiceId },
      };
      const response = await PATCH(context);

      expect(response.status).toBe(400);
    });

    it("handles service error", async () => {
      updateInvoiceStatusMock.mockRejectedValue(new Error("Update error"));

      const req = new NextRequest(new URL(baseUrl), {
        method: "PATCH",
        body: JSON.stringify({ status: "paid" }),
      });
      const context: HandlerContext = {
        request: req,
        supabase: {} as SupabaseClient,
        orgId,
        params: { invoiceId },
        user,
      };
      await expect(PATCH(context)).rejects.toThrow("Update error");
    });
  });

  describe("DELETE", () => {
    it("deletes invoice and returns ok(null)", async () => {
      deleteInvoiceMock.mockResolvedValue(undefined);

      const context: HandlerContext = {
        supabase: {} as SupabaseClient,
        orgId,
        params: { invoiceId },
        user,
      };
      const response = await DELETE(context);
      const body = await response.json();

      expect(deleteInvoiceMock).toHaveBeenCalledWith(
        {},
        invoiceId,
        orgId,
        user.id,
      );
      expect(body.data).toBeNull();
    });

    it("handles service error", async () => {
      deleteInvoiceMock.mockRejectedValue(new Error("Delete error"));

      const context: HandlerContext = {
        supabase: {} as SupabaseClient,
        orgId,
        params: { invoiceId },
        user,
      };
      await expect(DELETE(context)).rejects.toThrow("Delete error");
    });
  });
});
