import { describe, expect, it, vi } from "vitest";
import { createMockSupabaseClient } from "@/test/mocks/supabase";
import {
  getStoreCreditBalance,
  getStoreCreditBalanceByInvoice,
  getStoreCreditTransactions,
} from "./store-credit-service";

vi.mock("@/lib/audit", () => ({
  createAuditLog: vi.fn().mockResolvedValue({ success: true, id: "audit-1" }),
}));

describe("store-credit-service", () => {
  describe("getStoreCreditBalance", () => {
    it("returns a number balance for a customer", async () => {
      const rawClient = createMockSupabaseClient();
      const db = rawClient as any;

      rawClient.from("store_credit_balances").single.mockResolvedValue({
        data: { balance: 150.0 },
        error: null,
      });

      const result = await getStoreCreditBalance(db, "cust-1", "org-1");
      expect(typeof result).toBe("number");
      expect(result).toBe(150.0);
    });

    it("returns 0 when no balance record exists", async () => {
      const rawClient = createMockSupabaseClient();
      const db = rawClient as any;

      rawClient.from("store_credit_balances").single.mockResolvedValue({
        data: null,
        error: null,
      });

      const result = await getStoreCreditBalance(db, "cust-1", "org-1");
      expect(result).toBe(0);
    });
  });

  describe("getStoreCreditBalanceByInvoice", () => {
    it("returns balance and customer name for a valid invoice", async () => {
      const rawClient = createMockSupabaseClient();
      const db = rawClient as any;

      rawClient
        .from("invoices")
        .single.mockResolvedValueOnce({
          data: { customer_id: "cust-1", customer_name: "John Doe" },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { balance: 200.0 },
          error: null,
        });

      const result = await getStoreCreditBalanceByInvoice(db, "inv-1", "org-1");
      expect(result).not.toBeNull();
      expect(result?.balance).toBe(200.0);
      expect(result?.customerName).toBe("John Doe");
    });

    it("returns null when invoice has no customer", async () => {
      const rawClient = createMockSupabaseClient();
      const db = rawClient as any;

      rawClient.from("invoices").single.mockResolvedValue({
        data: { customer_id: null, customer_name: null },
        error: null,
      });

      const result = await getStoreCreditBalanceByInvoice(db, "inv-1", "org-1");
      expect(result).toBeNull();
    });
  });

  describe("getStoreCreditTransactions", () => {
    it("returns an array of transactions", async () => {
      const rawClient = createMockSupabaseClient();
      const db = rawClient as any;

      rawClient.__qb.resolveWith({
        data: [
          {
            id: "tx-1",
            amount: 50,
            type: "credit",
            reference_type: "payment",
            notes: null,
            created_at: "2026-06-01T00:00:00Z",
          },
        ],
        error: null,
      });

      const result = await getStoreCreditTransactions(db, "cust-1", "org-1");
      expect(Array.isArray(result)).toBe(true);
      if (result.length > 0) {
        expect(result[0]).toHaveProperty("id");
        expect(result[0]).toHaveProperty("amount");
      }
    });

    it("returns empty array when no data", async () => {
      const rawClient = createMockSupabaseClient();
      const db = rawClient as any;

      rawClient.__qb.resolveWith({
        data: null,
        error: null,
      });

      const result = await getStoreCreditTransactions(db, "cust-1", "org-1");
      expect(result).toEqual([]);
    });
  });
});
