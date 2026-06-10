import { revalidateTag } from "next/cache";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import {
  cancelRefund,
  getInvoiceRefunds,
  getRefundStats,
  getRefunds,
  recordRefund,
} from "./refund-service";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
}));

// Mock Supabase client
function createMockSupabaseClient() {
  const mockSelect = vi.fn().mockReturnThis();
  const mockInsert = vi.fn().mockReturnThis();
  const mockUpdate = vi.fn().mockReturnThis();
  const mockEq = vi.fn().mockReturnThis();
  const mockIs = vi.fn().mockReturnThis();
  const mockOrder = vi.fn().mockReturnThis();
  const mockSingle = vi.fn();
  const mockLimit = vi.fn().mockReturnThis();
  const mockRange = vi.fn().mockReturnThis();
  const mockGetUser = vi.fn();

  return {
    from: vi.fn().mockReturnValue({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      eq: mockEq,
      is: mockIs,
      order: mockOrder,
      single: mockSingle,
      limit: mockLimit,
      range: mockRange,
    }),
    auth: {
      getUser: mockGetUser,
    },
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    // Expose for assertions
    _select: mockSelect,
    _insert: mockInsert,
    _update: mockUpdate,
    _eq: mockEq,
    _is: mockIs,
    _order: mockOrder,
    _single: mockSingle,
    _limit: mockLimit,
    _range: mockRange,
  };
}

describe("RefundService", () => {
  let mockDb: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDb = createMockSupabaseClient();
    vi.mocked(createClient).mockResolvedValue(mockDb as never);
    vi.mocked(revalidateTag).mockImplementation(() => {});
  });

  describe("recordRefund", () => {
    const mockInvoice = {
      id: "inv-123",
      total: 100000,
      status: "paid",
      amount_paid: 100000,
      amount_refunded: 0,
    };

    const mockUser = { id: "user-123" };

    it("records a full refund successfully", async () => {
      mockDb.auth.getUser.mockResolvedValue({ data: { user: mockUser } });
      mockDb._single.mockResolvedValue({ data: mockInvoice, error: null });
      mockDb._insert.mockResolvedValue({ error: null });
      mockDb._eq.mockResolvedValue({ data: [{ amount: 100000 }], error: null });
      mockDb._single.mockResolvedValue({
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

      const result = await recordRefund("inv-123", "org-123", {
        amount: 100000,
        method: "cash",
      });

      expect(result).toBeDefined();
      expect(mockDb.from).toHaveBeenCalledWith("invoice_refunds");
      expect(mockDb.from).toHaveBeenCalledWith("invoices");
    });

    it("records a partial refund successfully", async () => {
      mockDb.auth.getUser.mockResolvedValue({ data: { user: mockUser } });
      mockDb._single.mockResolvedValue({
        data: { ...mockInvoice, amount_refunded: 0 },
        error: null,
      });
      mockDb._insert.mockResolvedValue({ error: null });
      mockDb._eq.mockResolvedValue({ data: [{ amount: 100000 }], error: null });

      const result = await recordRefund("inv-123", "org-123", {
        amount: 50000,
        method: "cash",
      });

      expect(result).toBeDefined();
    });

    it("throws error when refund exceeds paid amount", async () => {
      mockDb.auth.getUser.mockResolvedValue({ data: { user: mockUser } });
      mockDb._single.mockResolvedValue({
        data: { ...mockInvoice, amount_refunded: 80000 },
        error: null,
      });

      await expect(
        recordRefund("inv-123", "org-123", {
          amount: 50000,
          method: "cash",
        }),
      ).rejects.toThrow(ValidationError);
    });

    it("throws error for non-refundable invoice status", async () => {
      mockDb.auth.getUser.mockResolvedValue({ data: { user: mockUser } });
      mockDb._single.mockResolvedValue({
        data: { ...mockInvoice, status: "draft" },
        error: null,
      });

      await expect(
        recordRefund("inv-123", "org-123", {
          amount: 100000,
          method: "cash",
        }),
      ).rejects.toThrow(ValidationError);
    });

    it("throws error when invoice not found", async () => {
      mockDb.auth.getUser.mockResolvedValue({ data: { user: mockUser } });
      mockDb._single.mockResolvedValue({ data: null, error: null });

      await expect(
        recordRefund("inv-123", "org-123", {
          amount: 100000,
          method: "cash",
        }),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("getRefunds", () => {
    it("returns refunds list", async () => {
      const mockRefunds = [
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
      ];

      mockDb._eq.mockResolvedValue({ data: mockRefunds, error: null });

      const result = await getRefunds("org-123");

      expect(result).toHaveLength(1);
      expect(result[0].invoice_number).toBe("INV-2026-00001");
      expect(result[0].invoice_total).toBe(100000);
    });

    it("applies status filter", async () => {
      mockDb._eq.mockResolvedValue({ data: [], error: null });

      await getRefunds("org-123", { status: "completed" });

      expect(mockDb._eq).toHaveBeenCalledWith("status", "completed");
    });
  });

  describe("getInvoiceRefunds", () => {
    it("returns refunds for specific invoice", async () => {
      const mockRefunds = [
        {
          id: "refund-123",
          invoice_id: "inv-123",
          amount: 50000,
          method: "cash",
          status: "completed",
        },
      ];

      mockDb._eq.mockResolvedValue({ data: mockRefunds, error: null });

      const result = await getInvoiceRefunds("inv-123");

      expect(result).toHaveLength(1);
      expect(result[0].invoice_id).toBe("inv-123");
    });
  });

  describe("cancelRefund", () => {
    it("cancels a pending refund", async () => {
      mockDb.auth.getUser.mockResolvedValue({
        data: { user: { id: "user-123" } },
      });
      mockDb._single
        .mockResolvedValueOnce({
          data: {
            id: "refund-123",
            status: "pending",
            invoice_id: "inv-123",
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: {
            id: "refund-123",
            status: "cancelled",
            invoice_id: "inv-123",
          },
          error: null,
        });

      const result = await cancelRefund("refund-123", "org-123");

      expect(result.status).toBe("cancelled");
    });

    it("throws error when trying to cancel completed refund", async () => {
      mockDb.auth.getUser.mockResolvedValue({
        data: { user: { id: "user-123" } },
      });
      mockDb._single.mockResolvedValue({
        data: {
          id: "refund-123",
          status: "completed",
          invoice_id: "inv-123",
        },
        error: null,
      });

      await expect(cancelRefund("refund-123", "org-123")).rejects.toThrow(
        ValidationError,
      );
    });

    it("throws error when refund not found", async () => {
      mockDb.auth.getUser.mockResolvedValue({
        data: { user: { id: "user-123" } },
      });
      mockDb._single.mockResolvedValue({ data: null, error: null });

      await expect(cancelRefund("refund-123", "org-123")).rejects.toThrow(
        NotFoundError,
      );
    });
  });

  describe("getRefundStats", () => {
    it("returns aggregated stats", async () => {
      mockDb._eq.mockResolvedValue({
        data: [
          { amount: 50000, status: "completed" },
          { amount: 30000, status: "completed" },
          { amount: 20000, status: "pending" },
        ],
        error: null,
      });

      const result = await getRefundStats("org-123");

      expect(result.totalRefunded).toBe(80000);
      expect(result.refundCount).toBe(2);
      expect(result.pendingAmount).toBe(20000);
    });

    it("returns zero stats when no refunds", async () => {
      mockDb._eq.mockResolvedValue({ data: [], error: null });

      const result = await getRefundStats("org-123");

      expect(result.totalRefunded).toBe(0);
      expect(result.refundCount).toBe(0);
      expect(result.pendingAmount).toBe(0);
    });
  });
});
