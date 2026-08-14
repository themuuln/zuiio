import type { SupabaseClient } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabaseClient } from "@/test/mocks/supabase";
import {
  createCustomer,
  deleteCustomer,
  getCustomer,
  getCustomers,
  searchCustomers,
  updateCustomer,
} from "./customer-service";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/cache/with-cache", () => ({
  withCache: vi.fn((_key, fn) => fn()),
}));
vi.mock("@/lib/audit", () => ({
  createAuditLog: vi.fn().mockResolvedValue({ success: true, id: "audit-1" }),
  logAuditAfter: vi.fn(),
}));
vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));

/**
 * Characterization tests for customer-service CRUD functions.
 * These verify function signatures, return types, and basic behavior
 * to detect any behavioral drift after migration.
 */
describe("customer-service characterization", () => {
  let db: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    vi.clearAllMocks();
    db = createMockSupabaseClient();
  });

  describe("getCustomers", () => {
    it("returns PaginatedResponse shape with data, total, page, pageSize, totalPages", async () => {
      db.__qb.resolveWith({
        data: [],
        count: 0,
        error: null,
      });

      const result = await getCustomers(
        db as unknown as SupabaseClient,
        "org-1",
      );

      expect(result).toHaveProperty("data");
      expect(result).toHaveProperty("total");
      expect(result).toHaveProperty("page");
      expect(result).toHaveProperty("pageSize");
      expect(result).toHaveProperty("totalPages");
      expect(Array.isArray(result.data)).toBe(true);
      expect(typeof result.total).toBe("number");
      expect(typeof result.page).toBe("number");
    });

    it("enriches each customer with vehicle_count", async () => {
      db.__qb.resolveWith({
        data: [
          { id: "c1", first_name: "Test", created_at: "2024-01-01T00:00:00Z" },
        ],
        count: 1,
        error: null,
      });

      const result = await getCustomers(
        db as unknown as SupabaseClient,
        "org-1",
      );

      expect(result.data[0]).toHaveProperty("vehicle_count");
      expect(typeof result.data[0].vehicle_count).toBe("number");
    });
  });

  describe("getCustomer", () => {
    it("returns a single customer object with expected fields", async () => {
      db.from("customers").single.mockResolvedValue({
        data: {
          id: "c1",
          organization_id: "org-1",
          first_name: "Test",
          phone: "99112233",
        },
        error: null,
      });

      const result = await getCustomer(
        db as unknown as SupabaseClient,
        "c1",
        "org-1",
      );

      expect(result).toHaveProperty("id");
      expect(result).toHaveProperty("organization_id");
    });
  });

  describe("createCustomer", () => {
    it("creates and returns a customer with minimal identifying info", async () => {
      db.from("customers").maybeSingle.mockResolvedValue({
        data: null,
        error: null,
      });
      db.from("customers").single.mockResolvedValue({
        data: { id: "c1", first_name: "Test", phone: "99112233" },
        error: null,
      });

      const result = await createCustomer(
        db as unknown as SupabaseClient,
        "org-1",
        { firstName: "Test", phone: "99112233" },
        "user-1",
      );

      expect(result).toHaveProperty("id");
    });
  });

  describe("updateCustomer", () => {
    it("updates customer and returns updated data", async () => {
      const existing = {
        id: "c1",
        organization_id: "org-1",
        first_name: "Old",
        type: "individual",
      };

      db.from("customers")
        .single.mockResolvedValueOnce({ data: existing, error: null })
        .mockResolvedValueOnce({
          data: { ...existing, first_name: "New" },
          error: null,
        });

      const result = await updateCustomer(
        db as unknown as SupabaseClient,
        "c1",
        "org-1",
        { firstName: "New" },
        "user-1",
      );

      expect(result.first_name).toBe("New");
    });
  });

  describe("deleteCustomer", () => {
    it("soft deletes customer without throwing", async () => {
      db.from("customers").single.mockResolvedValue({
        data: { id: "c1" },
        error: null,
      });

      await expect(
        deleteCustomer(
          db as unknown as SupabaseClient,
          "c1",
          "org-1",
          "user-1",
        ),
      ).resolves.toBeUndefined();
    });
  });

  describe("searchCustomers", () => {
    it("delegates to getCustomers with search param and returns PaginatedResponse", async () => {
      db.__qb.resolveWith({
        data: [],
        count: 0,
        error: null,
      });

      const result = await searchCustomers(
        db as unknown as SupabaseClient,
        "org-1",
        "test",
      );

      expect(result).toHaveProperty("data");
      expect(result).toHaveProperty("total");
      expect(Array.isArray(result.data)).toBe(true);
    });
  });
});
