import { describe, expect, it, vi } from "vitest";
import { createMockSupabaseClient } from "@/test/mocks/supabase";
import {
  createCustomerNote,
  deleteCustomerNote,
  getCustomerNotes,
} from "./customer-note-service";

vi.mock("@/lib/audit", () => ({
  createAuditLog: vi.fn().mockResolvedValue({ success: true, id: "audit-1" }),
  logAuditAfter: vi.fn(),
}));
vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));

describe("customer-note-service", () => {
  describe("getCustomerNotes", () => {
    it("returns an array of customer notes", async () => {
      const rawClient = createMockSupabaseClient();
      const db = rawClient as any;

      rawClient.__qb.resolveWith({
        data: [
          {
            id: "note-1",
            organization_id: "org-1",
            customer_id: "cust-1",
            content: "Test note",
            type: "general",
            created_by: "user-1",
            created_at: "2026-06-01T00:00:00Z",
            updated_at: "2026-06-01T00:00:00Z",
          },
        ],
        error: null,
      });

      const result = await getCustomerNotes(db, "org-1", "cust-1");
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("createCustomerNote", () => {
    it("creates and returns a customer note", async () => {
      const rawClient = createMockSupabaseClient();
      const db = rawClient as any;
      rawClient.auth.getUser.mockResolvedValue({
        data: { user: { id: "user-1" } },
        error: null,
      });

      rawClient.from("customer_notes").single.mockResolvedValue({
        data: {
          id: "note-1",
          organization_id: "org-1",
          customer_id: "cust-1",
          content: "Test note",
          type: "general",
          created_by: "user-1",
          created_at: "2026-06-01T00:00:00Z",
          updated_at: "2026-06-01T00:00:00Z",
        },
        error: null,
      });

      // The factory also calls then() for audit log
      rawClient.__qb.resolveWith({ data: null, error: null });

      const result = await createCustomerNote(
        db,
        "org-1",
        "cust-1",
        { content: "Test note" },
        "user-1",
      );
      expect(result).toHaveProperty("id");
      expect(result).toHaveProperty("content");
    });
  });

  describe("deleteCustomerNote", () => {
    it("soft-deletes a customer note", async () => {
      const rawClient = createMockSupabaseClient();
      const db = rawClient as any;

      rawClient.from("customer_notes").single.mockResolvedValue({
        data: { id: "note-1" },
        error: null,
      });

      await expect(
        deleteCustomerNote(db, "org-1", "cust-1", "note-1", "user-1"),
      ).resolves.toBeUndefined();
    });
  });
});
