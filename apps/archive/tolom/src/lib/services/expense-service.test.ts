import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidateTag } from "next/cache";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { logAuditAfter } from "@/lib/audit";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors";
import { createMockSupabaseClient } from "@/test/mocks/supabase";
import {
  createExpense,
  createExpenseCategory,
  deleteExpense,
  deleteExpenseCategory,
  getExpense,
  getExpenseCategories,
  getExpenseStats,
  getExpenses,
  seedDefaultExpenseCategories,
  updateExpense,
  updateExpenseCategory,
} from "./expense-service";

vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));
vi.mock("@/lib/audit", () => ({
  createAuditLog: vi.fn().mockResolvedValue({ success: true, id: "audit-1" }),
  logAuditAfter: vi.fn(),
}));

describe("expense-service", () => {
  let db: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    vi.clearAllMocks();
    db = createMockSupabaseClient();
  });

  // ── seedDefaultExpenseCategories ──────────────────
  describe("seedDefaultExpenseCategories", () => {
    it("skips seeding when categories already exist", async () => {
      db.__qb.resolveWith({ count: 5, error: null });

      await seedDefaultExpenseCategories(
        db as unknown as SupabaseClient,
        "org-1",
        "user-1",
      );

      expect(db.from).toHaveBeenCalledWith("expense_categories");
      expect(db.from("expense_categories").insert).not.toHaveBeenCalled();
    });

    it("inserts 10 default categories when none exist", async () => {
      db.__qb.resolveWith({ count: 0, error: null });

      await seedDefaultExpenseCategories(
        db as unknown as SupabaseClient,
        "org-1",
        "user-1",
      );

      expect(db.from("expense_categories").insert).toHaveBeenCalled();
      expect(revalidateTag).toHaveBeenCalled();
    });

    it("throws on insert error", async () => {
      // First chain (select.count): resolves with { count: 0, error: null }
      db.__qb.resolveWith({ count: 0, error: null });

      // Second chain (insert): resolves with an error
      db.from("expense_categories").insert.mockReturnValueOnce({
        then: (res: any) =>
          Promise.resolve({ data: null, error: { message: "DB error" } }).then(
            res,
          ),
      });

      await expect(
        seedDefaultExpenseCategories(
          db as unknown as SupabaseClient,
          "org-1",
          "user-1",
        ),
      ).rejects.toThrow(expect.objectContaining({ message: "DB error" }));
    });
  });

  // ── getExpenses ───────────────────────────────────
  describe("getExpenses", () => {
    it("returns mapped expenses with category", async () => {
      db.__qb.resolveWith({
        data: [
          {
            id: "exp-1",
            organization_id: "org-1",
            amount: 50000,
            expense_categories: {
              id: "cat-1",
              name: "Rent",
              color: "#3b82f6",
              icon: "building2",
            },
          },
        ],
        error: null,
      });

      const result = await getExpenses(
        db as unknown as SupabaseClient,
        "org-1",
      );

      expect(result).toHaveLength(1);
      expect(result[0].category).toEqual({
        id: "cat-1",
        name: "Rent",
        color: "#3b82f6",
        icon: "building2",
      });
    });

    it("sets category to null when expense_categories is null", async () => {
      db.__qb.resolveWith({
        data: [
          {
            id: "exp-2",
            organization_id: "org-1",
            amount: 10000,
            expense_categories: null,
          },
        ],
        error: null,
      });

      const result = await getExpenses(
        db as unknown as SupabaseClient,
        "org-1",
      );

      expect(result[0].category).toBeNull();
    });

    it("maps aliased category relation data", async () => {
      db.__qb.resolveWith({
        data: [
          {
            id: "exp-3",
            organization_id: "org-1",
            amount: 25000,
            category: {
              id: "cat-2",
              name: "Fuel",
              color: "#10b981",
              icon: "truck",
            },
          },
        ],
        error: null,
      });

      const result = await getExpenses(
        db as unknown as SupabaseClient,
        "org-1",
      );

      expect(result[0].category).toEqual({
        id: "cat-2",
        name: "Fuel",
        color: "#10b981",
        icon: "truck",
      });
    });

    it("applies search filter with ilike", async () => {
      db.__qb.resolveWith({ data: [], error: null });

      await getExpenses(db as unknown as SupabaseClient, "org-1", {
        search: "office",
      });

      expect(db.from("expenses").or).toHaveBeenCalledWith(
        expect.stringContaining("description.ilike.%office%"),
      );
    });

    it("applies paid filter", async () => {
      db.__qb.resolveWith({ data: [], error: null });

      await getExpenses(db as unknown as SupabaseClient, "org-1", {
        paid: true,
      });

      expect(db.from("expenses").not).toHaveBeenCalledWith(
        "paid_at",
        "is",
        null,
      );
    });

    it("applies unpaid filter", async () => {
      db.__qb.resolveWith({ data: [], error: null });

      await getExpenses(db as unknown as SupabaseClient, "org-1", {
        paid: false,
      });

      expect(db.from("expenses").is).toHaveBeenCalledWith("paid_at", null);
    });

    it("applies overdue filter", async () => {
      db.__qb.resolveWith({ data: [], error: null });

      await getExpenses(db as unknown as SupabaseClient, "org-1", {
        overdue: true,
      });

      expect(db.from("expenses").is).toHaveBeenCalledWith("paid_at", null);
      expect(db.from("expenses").lt).toHaveBeenCalledWith(
        "due_date",
        expect.any(String),
      );
    });

    it("applies limit and offset", async () => {
      db.__qb.resolveWith({ data: [], error: null });

      await getExpenses(db as unknown as SupabaseClient, "org-1", {
        limit: 10,
        offset: 20,
      });

      expect(db.from("expenses").limit).toHaveBeenCalledWith(10);
      expect(db.from("expenses").range).toHaveBeenCalledWith(20, 29);
    });

    it("returns empty array when data is null", async () => {
      db.__qb.resolveWith({ data: null, error: null });

      const result = await getExpenses(
        db as unknown as SupabaseClient,
        "org-1",
      );

      expect(result).toEqual([]);
    });
  });

  // ── getExpense ────────────────────────────────────
  describe("getExpense", () => {
    it("returns a single expense with category", async () => {
      db.__qb.resolveWith({
        data: {
          id: "exp-1",
          organization_id: "org-1",
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

      expect(result.id).toBe("exp-1");
      expect(result.category).toEqual({ id: "cat-1", name: "Rent" });
    });

    it("throws NotFoundError when expense does not exist", async () => {
      db.__qb.resolveWith({ data: null, error: { message: "not found" } });

      await expect(
        getExpense(db as unknown as SupabaseClient, "missing", "org-1"),
      ).rejects.toThrow(NotFoundError);
    });
  });

  // ── getExpenseStats ───────────────────────────────
  describe("getExpenseStats", () => {
    it("returns zeros for empty expenses", async () => {
      db.__qb.resolveWith({ data: [], error: null });

      const stats = await getExpenseStats(
        db as unknown as SupabaseClient,
        "org-1",
      );

      expect(stats.totalExpenses).toBe(0);
      expect(stats.totalAmount).toBe(0);
      expect(stats.paidAmount).toBe(0);
      expect(stats.unpaidAmount).toBe(0);
      expect(stats.overdueCount).toBe(0);
      expect(stats.byCategory).toEqual([]);
    });

    it("applies branch filter when branchId is provided", async () => {
      db.__qb.resolveWith({ data: [], error: null });

      await getExpenseStats(
        db as unknown as SupabaseClient,
        "org-1",
        "branch-1",
      );

      expect(db.from("expenses").eq).toHaveBeenCalledWith(
        "branch_id",
        "branch-1",
      );
    });

    it("aggregates amounts and counts by category", async () => {
      db.__qb.resolveWith({
        data: [
          {
            id: "e1",
            amount: 100000,
            tax_amount: 10000,
            paid_at: "2026-06-01",
            due_date: null,
            expense_date: "2026-06-01",
            category_id: "cat-1",
            expense_categories: { name: "Rent" },
          },
          {
            id: "e2",
            amount: 50000,
            tax_amount: 5000,
            paid_at: "2026-06-05",
            due_date: null,
            expense_date: "2026-06-05",
            category_id: "cat-2",
            expense_categories: { name: "Parts" },
          },
          {
            id: "e3",
            amount: 30000,
            tax_amount: 3000,
            paid_at: null,
            due_date: "2026-06-10",
            expense_date: "2026-06-10",
            category_id: "cat-1",
            expense_categories: { name: "Rent" },
          },
        ],
        error: null,
      });

      const stats = await getExpenseStats(
        db as unknown as SupabaseClient,
        "org-1",
      );

      expect(stats.totalExpenses).toBe(3);
      expect(stats.totalAmount).toBe(180000);
      expect(stats.totalTax).toBe(18000);
      expect(stats.paidAmount).toBe(150000);
      expect(stats.unpaidAmount).toBe(30000);
      expect(stats.byCategory[0].category_name).toBe("Rent");
      expect(stats.byCategory[0].total).toBe(130000);
      expect(stats.byCategory[0].count).toBe(2);
    });

    it("counts overdue expenses (unpaid with past due_date)", async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().slice(0, 10);

      db.__qb.resolveWith({
        data: [
          {
            id: "e1",
            amount: 10000,
            tax_amount: 0,
            paid_at: null,
            due_date: yesterdayStr,
            expense_date: "2026-06-01",
            category_id: null,
            expense_categories: null,
          },
          {
            id: "e2",
            amount: 20000,
            tax_amount: 0,
            paid_at: null,
            due_date: "2099-01-01",
            expense_date: "2026-06-01",
            category_id: null,
            expense_categories: null,
          },
        ],
        error: null,
      });

      const stats = await getExpenseStats(
        db as unknown as SupabaseClient,
        "org-1",
      );

      expect(stats.overdueCount).toBe(1);
    });

    it("handles null category gracefully as Uncategorized", async () => {
      db.__qb.resolveWith({
        data: [
          {
            id: "e1",
            amount: 5000,
            tax_amount: 0,
            paid_at: null,
            due_date: null,
            expense_date: "2026-06-01",
            category_id: null,
            expense_categories: null,
          },
        ],
        error: null,
      });

      const stats = await getExpenseStats(
        db as unknown as SupabaseClient,
        "org-1",
      );

      expect(stats.byCategory[0].category_name).toBe("Uncategorized");
      expect(stats.byCategory[0].category_id).toBeNull();
    });
  });

  // ── createExpense ─────────────────────────────────
  describe("createExpense", () => {
    it("throws ValidationError when description is empty", async () => {
      await expect(
        createExpense(
          db as unknown as SupabaseClient,
          "org-1",
          {
            description: "",
            amount: 10000,
          },
          "user-1",
        ),
      ).rejects.toThrow(ValidationError);
    });

    it("throws ValidationError when amount is 0", async () => {
      await expect(
        createExpense(
          db as unknown as SupabaseClient,
          "org-1",
          {
            description: "Test",
            amount: 0,
          },
          "user-1",
        ),
      ).rejects.toThrow(ValidationError);
    });

    it("throws ValidationError when amount is negative", async () => {
      await expect(
        createExpense(
          db as unknown as SupabaseClient,
          "org-1",
          {
            description: "Test",
            amount: -100,
          },
          "user-1",
        ),
      ).rejects.toThrow(ValidationError);
    });

    it("creates expense with valid data", async () => {
      db.__qb.resolveWith({
        data: {
          id: "exp-new",
          organization_id: "org-1",
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

      expect(result.id).toBe("exp-new");
      expect(logAuditAfter).toHaveBeenCalled();
      expect(revalidateTag).toHaveBeenCalled();
    });
  });

  // ── updateExpense ─────────────────────────────────
  describe("updateExpense", () => {
    it("throws NotFoundError when expense does not exist", async () => {
      db.__qb.resolveWith({ data: null, error: { message: "not found" } });

      await expect(
        updateExpense(
          db as unknown as SupabaseClient,
          "exp-1",
          "org-1",
          { description: "Updated" },
          "user-1",
        ),
      ).rejects.toThrow(NotFoundError);
    });

    it("throws ValidationError when no fields to update", async () => {
      db.__qb.resolveWith({
        data: { id: "exp-1", organization_id: "org-1", description: "Test" },
        error: null,
      });

      await expect(
        updateExpense(
          db as unknown as SupabaseClient,
          "exp-1",
          "org-1",
          {},
          "user-1",
        ),
      ).rejects.toThrow(ValidationError);
    });

    it("updates expense with valid data", async () => {
      // First chain (select): returns existing expense
      // Second chain (update): returns updated expense
      const existing = {
        id: "exp-1",
        organization_id: "org-1",
        description: "Old",
        amount: 10000,
      };
      const updated = { ...existing, description: "New" };

      // Use separate calls for the two sequential chains
      db.from("expenses")
        .select.mockReturnValueOnce(db.from("expenses") as any) // first select returns qb
        .mockReturnValueOnce(db.from("expenses") as any); // second select returns qb

      // First chain resolves with existing
      let callCount = 0;
      db.from("expenses").single.mockImplementation(() => {
        callCount++;
        return {
          then: (res: any) =>
            Promise.resolve(
              callCount === 1
                ? { data: existing, error: null }
                : { data: updated, error: null },
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
      expect(logAuditAfter).toHaveBeenCalled();
    });
  });

  // ── deleteExpense ─────────────────────────────────
  describe("deleteExpense", () => {
    it("throws NotFoundError when expense does not exist", async () => {
      db.__qb.resolveWith({ data: null, error: null });

      await expect(
        deleteExpense(
          db as unknown as SupabaseClient,
          "exp-1",
          "org-1",
          "user-1",
        ),
      ).rejects.toThrow(NotFoundError);
    });

    it("soft-deletes an existing expense", async () => {
      // Default resolveWith is { data: null, error: null } — that's fine for
      // the select (existing check passes because data is null but error is null,
      // so !existing is true → throws NotFoundError).
      // We need to provide data for the existence check:
      db.__qb.resolveWith({ data: { id: "exp-1" }, error: null });

      await deleteExpense(
        db as unknown as SupabaseClient,
        "exp-1",
        "org-1",
        "user-1",
      );

      expect(db.from("expenses").update).toHaveBeenCalled();
      expect(logAuditAfter).toHaveBeenCalledWith(
        expect.objectContaining({ action: "soft_delete" }),
      );
      expect(revalidateTag).toHaveBeenCalled();
    });
  });

  // ── getExpenseCategories ──────────────────────────
  describe("getExpenseCategories", () => {
    it("returns categories ordered by sort_order", async () => {
      db.__qb.resolveWith({
        data: [
          { id: "cat-1", name: "Rent", sort_order: 1 },
          { id: "cat-2", name: "Parts", sort_order: 2 },
        ],
        error: null,
      });

      const result = await getExpenseCategories(
        db as unknown as SupabaseClient,
        "org-1",
      );

      expect(result).toHaveLength(2);
      expect(db.from("expense_categories").order).toHaveBeenCalledWith(
        "sort_order",
        { ascending: true },
      );
    });
  });

  // ── createExpenseCategory ─────────────────────────
  describe("createExpenseCategory", () => {
    it("throws ValidationError when name is empty", async () => {
      await expect(
        createExpenseCategory(
          db as unknown as SupabaseClient,
          "org-1",
          { name: "" },
          "user-1",
        ),
      ).rejects.toThrow(ValidationError);
    });

    it("throws ConflictError when category name already exists", async () => {
      // Duplicate check chain resolves with existing category
      db.from("expense_categories").maybeSingle.mockReturnValueOnce({
        then: (res: any) =>
          Promise.resolve({ data: { id: "existing-cat" }, error: null }).then(
            res,
          ),
      });

      await expect(
        createExpenseCategory(
          db as unknown as SupabaseClient,
          "org-1",
          { name: "Rent" },
          "user-1",
        ),
      ).rejects.toThrow(ConflictError);
    });

    it("creates category with valid data", async () => {
      // Duplicate check: no existing category
      db.from("expense_categories").maybeSingle.mockReturnValueOnce({
        then: (res: any) =>
          Promise.resolve({ data: null, error: null }).then(res),
      });

      // Insert succeeds — chain resolves with the new category
      db.__qb.resolveWith({
        data: { id: "cat-new", name: "Fuel", color: "#f97316", icon: "truck" },
        error: null,
      });

      const result = await createExpenseCategory(
        db as unknown as SupabaseClient,
        "org-1",
        { name: "Fuel", color: "#f97316", icon: "truck" },
        "user-1",
      );

      expect(result.name).toBe("Fuel");
      expect(revalidateTag).toHaveBeenCalled();
    });
  });

  // ── updateExpenseCategory ─────────────────────────
  describe("updateExpenseCategory", () => {
    it("updates a category", async () => {
      db.__qb.resolveWith({
        data: { id: "cat-1", name: "Updated Name", color: "#ff0000" },
        error: null,
      });

      const result = await updateExpenseCategory(
        db as unknown as SupabaseClient,
        "cat-1",
        "org-1",
        { name: "Updated Name", color: "#ff0000" },
        "user-1",
      );

      expect(result.name).toBe("Updated Name");
      expect(revalidateTag).toHaveBeenCalled();
    });

    it("throws NotFoundError when update fails", async () => {
      db.__qb.resolveWith({ data: null, error: { message: "not found" } });

      await expect(
        updateExpenseCategory(
          db as unknown as SupabaseClient,
          "cat-missing",
          "org-1",
          { name: "New" },
          "user-1",
        ),
      ).rejects.toThrow(NotFoundError);
    });
  });

  // ── deleteExpenseCategory ─────────────────────────
  describe("deleteExpenseCategory", () => {
    it("soft-deletes a category", async () => {
      // Factory softDelete fetches existing first via .single()
      db.__qb.resolveWith({ data: { id: "cat-1" }, error: null });

      await deleteExpenseCategory(
        db as unknown as SupabaseClient,
        "cat-1",
        "org-1",
        "user-1",
      );

      expect(db.from("expense_categories").update).toHaveBeenCalled();
      expect(revalidateTag).toHaveBeenCalled();
    });

    it("throws NotFoundError when category does not exist", async () => {
      // Factory softDelete checks existence and throws NotFoundError
      db.__qb.resolveWith({ data: null, error: null });

      await expect(
        deleteExpenseCategory(
          db as unknown as SupabaseClient,
          "cat-missing",
          "org-1",
          "user-1",
        ),
      ).rejects.toThrow(
        expect.objectContaining({ message: "expense_categories not found" }),
      );
    });
  });
});
