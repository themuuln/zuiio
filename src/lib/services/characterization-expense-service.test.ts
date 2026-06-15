import type { SupabaseClient } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabaseClient } from "@/test/mocks/supabase";
import {
  createExpense,
  createExpenseCategory,
  deleteExpense,
  deleteExpenseCategory,
  getExpense,
  getExpenseCategories,
  getExpenses,
  updateExpense,
  updateExpenseCategory,
} from "./expense-service";

vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));
vi.mock("@/lib/audit", () => ({
  createAuditLog: vi.fn().mockResolvedValue({ success: true, id: "audit-1" }),
}));

/**
 * Characterization tests for expense-service CRUD functions.
 * These verify function signatures, return types, and basic behavior
 * to detect any behavioral drift after migration.
 */
describe("expense-service characterization", () => {
  let db: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    vi.clearAllMocks();
    db = createMockSupabaseClient();
  });

  describe("getExpenses", () => {
    it("returns an array of expenses with optional category data", async () => {
      db.__qb.resolveWith({
        data: [],
        error: null,
      });

      const result = await getExpenses(
        db as unknown as SupabaseClient,
        "org-1",
      );

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("getExpense", () => {
    it("returns a single expense with category mapping", async () => {
      db.__qb.resolveWith({
        data: {
          id: "exp-1",
          amount: 50000,
          expense_categories: { id: "cat-1", name: "Rent" },
        },
        error: null,
      });

      const result = await getExpense(
        db as unknown as SupabaseClient,
        "exp-1",
        "org-1",
      );

      expect(result).toHaveProperty("id");
      expect(result).toHaveProperty("category");
    });
  });

  describe("createExpense", () => {
    it("creates expense with description and amount", async () => {
      db.__qb.resolveWith({
        data: {
          id: "exp-1",
          description: "Office supplies",
          amount: 25000,
        },
        error: null,
      });

      const result = await createExpense(
        db as unknown as SupabaseClient,
        "org-1",
        { description: "Office supplies", amount: 25000 },
        "user-1",
      );

      expect(result).toHaveProperty("id");
      expect(result.description).toBe("Office supplies");
    });
  });

  describe("updateExpense", () => {
    it("updates and returns expense", async () => {
      const existing = {
        id: "exp-1",
        organization_id: "org-1",
        description: "Old",
        amount: 10000,
      };

      // Force two separate chain resolutions
      let callCount = 0;
      db.from("expenses").single.mockImplementation(() => {
        callCount++;
        return {
          then: (res: any) =>
            Promise.resolve(
              callCount === 1
                ? { data: existing, error: null }
                : { data: { ...existing, description: "New" }, error: null },
            ).then(res),
        };
      });

      const result = await updateExpense(
        db as unknown as SupabaseClient,
        "exp-1",
        "org-1",
        { description: "New" },
        "user-1",
      );

      expect(result.description).toBe("New");
    });
  });

  describe("deleteExpense", () => {
    it("soft deletes expense without throwing", async () => {
      db.__qb.resolveWith({ data: { id: "exp-1" }, error: null });

      await expect(
        deleteExpense(
          db as unknown as SupabaseClient,
          "exp-1",
          "org-1",
          "user-1",
        ),
      ).resolves.toBeUndefined();
    });
  });

  describe("getExpenseCategories", () => {
    it("returns array of categories", async () => {
      db.__qb.resolveWith({
        data: [{ id: "cat-1", name: "Rent" }],
        error: null,
      });

      const result = await getExpenseCategories(
        db as unknown as SupabaseClient,
        "org-1",
      );

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("createExpenseCategory", () => {
    it("creates a category and returns it", async () => {
      db.from("expense_categories").maybeSingle.mockReturnValue({
        then: (res: any) =>
          Promise.resolve({ data: null, error: null }).then(res),
      });
      db.__qb.resolveWith({
        data: { id: "cat-1", name: "Fuel" },
        error: null,
      });

      const result = await createExpenseCategory(
        db as unknown as SupabaseClient,
        "org-1",
        { name: "Fuel" },
        "user-1",
      );

      expect(result).toHaveProperty("id");
      expect(result.name).toBe("Fuel");
    });
  });

  describe("updateExpenseCategory", () => {
    it("updates a category and returns it", async () => {
      db.__qb.resolveWith({
        data: { id: "cat-1", name: "Updated" },
        error: null,
      });

      const result = await updateExpenseCategory(
        db as unknown as SupabaseClient,
        "cat-1",
        "org-1",
        { name: "Updated" },
        "user-1",
      );

      expect(result.name).toBe("Updated");
    });
  });

  describe("deleteExpenseCategory", () => {
    it("soft deletes a category without throwing", async () => {
      db.__qb.resolveWith({ data: { id: "cat-1" }, error: null });

      await expect(
        deleteExpenseCategory(
          db as unknown as SupabaseClient,
          "cat-1",
          "org-1",
          "user-1",
        ),
      ).resolves.toBeUndefined();
    });
  });
});
