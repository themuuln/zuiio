import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { createMockSupabaseClient } from "@/test/mocks/supabase";
import {
  cancelRefund,
  getInvoiceRefunds,
  getRefundStats,
  getRefunds,
  recordRefund,
} from "./refund-service";

vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
}));
vi.mock("@/lib/audit", () => ({
  createAuditLog: vi.fn().mockResolvedValue({ success: true, id: "audit-1" }),
}));

describe("RefundService", () => {
  const rawClient = createMockSupabaseClient();
  const db = rawClient as unknown as SupabaseClient;

  describe("recordRefund", () => {
    it("records a full refund successfully", async () => {
      // rpc call succeeds
      rawClient.rpc.mockResolvedValue({ data: null, error: null });
      // 1st single: fetch the new refund
      rawClient.from("invoice_refunds").single.mockResolvedValueOnce({
        data: {
          id: "refund-123",
          invoice_id: "inv-123",
          amount: 100000,
          method: "cash",
          status: "completed",
        },
        error: null,
      });
      // Awaited query: return updated refunds list
      rawClient.__qb.resolveWith({
        data: [
          {
            id: "refund-123",
            invoice_id: "inv-123",
            amount: 100000,
            method: "cash",
            status: "completed",
          },
        ],
        error: null,
      });

      const result = await recordRefund(db, "inv-123", "org-123", {
        amount: 100000,
        method: "cash",
      });

      expect(result).toBeDefined();
      expect(rawClient.rpc).toHaveBeenCalledWith(
        "record_refund_atomically",
        expect.objectContaining({ p_invoice_id: "inv-123" }),
      );
      expect(rawClient.from).toHaveBeenCalledWith("invoice_refunds");
    });

    it("records a partial refund successfully", async () => {
      rawClient.rpc.mockResolvedValue({ data: null, error: null });
      rawClient.from("invoice_refunds").single.mockResolvedValueOnce({
        data: { id: "refund-123", amount: 50000, status: "completed" },
        error: null,
      });
      rawClient.__qb.resolveWith({ data: [], error: null });

      const result = await recordRefund(db, "inv-123", "org-123", {
        amount: 50000,
        method: "cash",
      });

      expect(result).toBeDefined();
    });

    it("throws error when rpc fails", async () => {
      rawClient.rpc.mockResolvedValue({
        data: null,
        error: { message: "Refund exceeds paid amount" },
      });

      await expect(
        recordRefund(db, "inv-123", "org-123", {
          amount: 50000,
          method: "cash",
        }),
      ).rejects.toThrow("Refund exceeds paid amount");
    });

    it("throws error when refund exceeds paid amount", async () => {
      rawClient.rpc.mockResolvedValue({
        data: null,
        error: { message: "Refund amount exceeds available balance" },
      });

      await expect(
        recordRefund(db, "inv-123", "org-123", {
          amount: 50000,
          method: "cash",
        }),
      ).rejects.toThrow();
    });

    it("throws error for non-refundable invoice status", async () => {
      rawClient.rpc.mockResolvedValue({
        data: null,
        error: { message: "Invoice status does not allow refunds" },
      });

      await expect(
        recordRefund(db, "inv-123", "org-123", {
          amount: 100000,
          method: "cash",
        }),
      ).rejects.toThrow();
    });

    it("throws error when invoice not found", async () => {
      rawClient.rpc.mockResolvedValue({
        data: null,
        error: { message: "Invoice not found" },
      });

      await expect(
        recordRefund(db, "inv-123", "org-123", {
          amount: 100000,
          method: "cash",
        }),
      ).rejects.toThrow();
    });
  });

  describe("getRefunds", () => {
    it("returns refunds list", async () => {
      rawClient.__qb.resolveWith({
        data: [
          {
            id: "refund-123",
            invoice_id: "inv-123",
            amount: 50000,
            invoices: {
              invoice_number: "INV-2026-00001",
              total: 100000,
              customer_name: "Test Customer",
            },
          },
        ],
        error: null,
      });

      const result = await getRefunds(db, "org-123");

      expect(result).toHaveLength(1);
      expect(result[0].invoice_number).toBe("INV-2026-00001");
      expect(result[0].invoice_total).toBe(100000);
    });

    it("applies status filter", async () => {
      rawClient.__qb.resolveWith({ data: [], error: null });

      await getRefunds(db, "org-123", { status: "completed" });

      expect(rawClient.from("invoice_refunds").eq).toHaveBeenCalledWith(
        "status",
        "completed",
      );
    });
  });

  describe("getInvoiceRefunds", () => {
    it("returns refunds for specific invoice", async () => {
      rawClient.__qb.resolveWith({
        data: [
          {
            id: "refund-123",
            invoice_id: "inv-123",
            amount: 50000,
            method: "cash",
            status: "completed",
          },
        ],
        error: null,
      });

      const result = await getInvoiceRefunds(db, "inv-123");

      expect(result).toHaveLength(1);
      expect(result[0].invoice_id).toBe("inv-123");
    });
  });

  describe("cancelRefund", () => {
    it("cancels a pending refund", async () => {
      // 1st single: fetch existing refund
      rawClient.from("invoice_refunds").single.mockResolvedValueOnce({
        data: {
          id: "refund-123",
          status: "pending",
          invoice_id: "inv-123",
        },
        error: null,
      });
      // 2nd single: update result
      rawClient.from("invoice_refunds").single.mockResolvedValueOnce({
        data: {
          id: "refund-123",
          status: "cancelled",
          invoice_id: "inv-123",
        },
        error: null,
      });

      const result = await cancelRefund(db, "refund-123", "org-123");

      expect(result.status).toBe("cancelled");
    });

    it("throws error when trying to cancel completed refund", async () => {
      rawClient.from("invoice_refunds").single.mockResolvedValue({
        data: {
          id: "refund-123",
          status: "completed",
          invoice_id: "inv-123",
        },
        error: null,
      });

      await expect(cancelRefund(db, "refund-123", "org-123")).rejects.toThrow(
        ValidationError,
      );
    });

    it("throws error when refund not found", async () => {
      rawClient.from("invoice_refunds").single.mockResolvedValue({
        data: null,
        error: null,
      });

      await expect(cancelRefund(db, "refund-123", "org-123")).rejects.toThrow(
        NotFoundError,
      );
    });
  });

  describe("getRefundStats", () => {
    it("returns aggregated stats", async () => {
      rawClient.__qb.resolveWith({
        data: [
          { amount: 50000, status: "completed" },
          { amount: 30000, status: "completed" },
          { amount: 20000, status: "pending" },
        ],
        error: null,
      });

      const result = await getRefundStats(db, "org-123");

      expect(result.totalRefunded).toBe(80000);
      expect(result.refundCount).toBe(2);
      expect(result.pendingAmount).toBe(20000);
    });

    it("returns zero stats when no refunds", async () => {
      rawClient.__qb.resolveWith({ data: [], error: null });

      const result = await getRefundStats(db, "org-123");

      expect(result.totalRefunded).toBe(0);
      expect(result.refundCount).toBe(0);
      expect(result.pendingAmount).toBe(0);
    });
  });
});
