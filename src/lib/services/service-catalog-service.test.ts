import { beforeEach, describe, expect, it, vi } from "vitest";
import { createClient } from "@/lib/supabase/server";
import { withCache } from "@/lib/cache/with-cache";
import { revalidateTag } from "next/cache";
import { createMockSupabaseClient } from "@/test/mocks/supabase";
import { NotFoundError, ValidationError } from "@/lib/errors";
import {
  getServices,
  getService,
  createService,
  updateService,
  deleteService,
  getLastSoldPrice,
  getServicePriceHistory,
} from "./service-catalog-service";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/cache/with-cache", () => ({
  withCache: vi.fn((_key: unknown, fn: () => unknown) => fn()),
}));
vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));

describe("Service Catalog Service", () => {
  const mockClient = createMockSupabaseClient();

  const mockService = {
    id: "svc-1",
    organization_id: "org-1",
    name: "Oil Change",
    category: "Maintenance",
    description: "Full oil change service",
    default_price: 49.99,
    is_active: true,
    created_at: "2024-01-01T00:00:00.000Z",
    updated_at: "2024-01-01T00:00:00.000Z",
    deleted_at: null,
    created_by: "user-1",
    updated_by: "user-1",
    branch_id: null,
    estimated_duration_minutes: null,
    interval_km: null,
    interval_months: null,
  };

  const mockPriceHistory = {
    id: "ph-1",
    organization_id: "org-1",
    service_catalog_id: "svc-1",
    service_name: "Oil Change",
    unit_price: 49.99,
    final_price: 49.99,
    discount_amount: null,
    discount_percentage: null,
    quantity: 1,
    created_at: "2024-01-01T00:00:00.000Z",
    created_by: "user-1",
    mechanic_id: null,
    vehicle_id: "v-1",
    vehicle_make: null,
    vehicle_model: null,
    work_order_id: "wo-1",
    work_order_service_id: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createClient).mockResolvedValue(
      mockClient as unknown as Awaited<ReturnType<typeof createClient>>,
    );
  });

  // ── getServices ──────────────────────────────────────────────

  describe("getServices", () => {
    it("returns all services for org, ordered by name, filtered by deleted_at is null", async () => {
      const services = [
        { ...mockService, id: "svc-1", name: "Oil Change" },
        { ...mockService, id: "svc-2", name: "Tire Rotation" },
      ];
      mockClient
        .from("service_catalog")
        .limit.mockResolvedValueOnce({ data: services, error: null });

      const result = await getServices("org-1");

      expect(result).toEqual(services);
      expect(mockClient.from).toHaveBeenCalledWith("service_catalog");
    });

    it("supports category filter", async () => {
      const services = [{ ...mockService, category: "Maintenance" }];
      mockClient
        .from("service_catalog")
        .limit.mockResolvedValueOnce({ data: services, error: null });

      const result = await getServices("org-1", "Maintenance");

      expect(result).toEqual(services);
      const qb = mockClient.from("unused");
      expect(qb.eq).toHaveBeenCalledWith("category", "Maintenance");
    });

    it("returns empty array when no data", async () => {
      mockClient
        .from("service_catalog")
        .limit.mockResolvedValueOnce({ data: [], error: null });

      const result = await getServices("org-1");

      expect(result).toEqual([]);
    });
  });

  // ── getService ──────────────────────────────────────────────

  describe("getService", () => {
    it("returns single service by id", async () => {
      mockClient
        .from("service_catalog")
        .single.mockResolvedValueOnce({ data: mockService, error: null });

      const result = await getService("svc-1");

      expect(result).toEqual(mockService);
      expect(mockClient.from).toHaveBeenCalledWith("service_catalog");
    });

    it("throws NotFoundError when not found", async () => {
      mockClient.from("service_catalog").single = vi.fn().mockResolvedValue({
        data: null,
        error: { code: "PGRST116", message: "No rows found" },
      });

      await expect(getService("nonexistent")).rejects.toThrow(NotFoundError);
      await expect(getService("nonexistent")).rejects.toThrow(
        "Service not found",
      );
    });
  });

  // ── createService ───────────────────────────────────────────

  describe("createService", () => {
    it("creates service with name, category, description, default_price", async () => {
      mockClient
        .from("service_catalog")
        .single.mockResolvedValueOnce({ data: mockService, error: null });

      const result = await createService("org-1", {
        name: "Oil Change",
        category: "Maintenance",
        description: "Full oil change service",
        default_price: 49.99,
      });

      expect(result).toEqual(mockService);
      expect(mockClient.from).toHaveBeenCalledWith("service_catalog");
    });

    it("sets is_active: true", async () => {
      mockClient
        .from("service_catalog")
        .single.mockResolvedValueOnce({ data: mockService, error: null });

      await createService("org-1", {
        name: "Oil Change",
        default_price: 49.99,
      });

      expect(mockClient.from("service_catalog").insert).toHaveBeenCalledWith(
        expect.objectContaining({ is_active: true }),
      );
    });

    it("rejects when name is empty (ValidationError)", async () => {
      await expect(
        createService("org-1", { name: "", default_price: 49.99 }),
      ).rejects.toThrow(ValidationError);

      await expect(
        createService("org-1", { name: "", default_price: 49.99 }),
      ).rejects.toThrow("Service name is required");

      await expect(
        createService("org-1", { name: "   ", default_price: 49.99 }),
      ).rejects.toThrow("Service name is required");
    });

    it("revalidates serviceCatalog cache", async () => {
      mockClient
        .from("service_catalog")
        .single.mockResolvedValueOnce({ data: mockService, error: null });

      await createService("org-1", {
        name: "Oil Change",
        default_price: 49.99,
      });

      expect(revalidateTag).toHaveBeenCalledWith(
        expect.stringContaining("service-catalog:org-1"),
        "max",
      );
    });
  });

  // ── updateService ───────────────────────────────────────────

  describe("updateService", () => {
    it("updates service fields (name, category, description, default_price, is_active)", async () => {
      const updated = {
        ...mockService,
        name: "Premium Oil Change",
        description: "Premium full oil change",
        default_price: 79.99,
        is_active: false,
      };
      mockClient
        .from("service_catalog")
        .single.mockResolvedValueOnce({ data: updated, error: null });

      const result = await updateService("svc-1", "org-1", {
        name: "Premium Oil Change",
        description: "Premium full oil change",
        default_price: 79.99,
        is_active: false,
      });

      expect(result).toEqual(updated);
    });

    it("throws NotFoundError when service not found", async () => {
      mockClient.from("service_catalog").single = vi.fn().mockResolvedValue({
        data: null,
        error: { code: "PGRST116", message: "No rows found" },
      });

      await expect(
        updateService("nonexistent", "org-1", { name: "Updated" }),
      ).rejects.toThrow(NotFoundError);
      await expect(
        updateService("nonexistent", "org-1", { name: "Updated" }),
      ).rejects.toThrow("Service not found");
    });

    it("revalidates cache", async () => {
      mockClient
        .from("service_catalog")
        .single.mockResolvedValueOnce({ data: mockService, error: null });

      await updateService("svc-1", "org-1", { name: "Updated Name" });

      expect(revalidateTag).toHaveBeenCalledWith(
        expect.stringContaining("service-catalog:org-1"),
        "max",
      );
    });
  });

  // ── deleteService ───────────────────────────────────────────

  describe("deleteService", () => {
    it("soft deletes (sets deleted_at)", async () => {
      mockClient
        .from("service_catalog")
        .is.mockResolvedValueOnce({ error: null });

      await deleteService("svc-1", "org-1");

      expect(mockClient.from("service_catalog").update).toHaveBeenCalledWith(
        expect.objectContaining({ deleted_at: expect.any(String) }),
      );
    });

    it("throws NotFoundError when not found", async () => {
      mockClient.from("service_catalog").is = vi.fn().mockResolvedValue({
        error: { message: "Not found" },
      });

      await expect(deleteService("nonexistent", "org-1")).rejects.toThrow(
        NotFoundError,
      );
      await expect(deleteService("nonexistent", "org-1")).rejects.toThrow(
        "Service not found or already deleted",
      );
    });

    it("revalidates cache", async () => {
      mockClient
        .from("service_catalog")
        .is.mockResolvedValueOnce({ error: null });

      await deleteService("svc-1", "org-1");

      expect(revalidateTag).toHaveBeenCalledWith(
        expect.stringContaining("service-catalog:org-1"),
        "max",
      );
    });
  });

  // ── getLastSoldPrice ────────────────────────────────────────

  describe("getLastSoldPrice", () => {
    it("returns most recent price for service_catalog_id", async () => {
      mockClient
        .from("service_price_history")
        .maybeSingle.mockResolvedValueOnce({
          data: mockPriceHistory,
          error: null,
        });

      const result = await getLastSoldPrice("org-1", "svc-1");

      expect(result).toEqual(mockPriceHistory);
    });

    it("supports vehicle_make and vehicle_model filters", async () => {
      const filtered = {
        ...mockPriceHistory,
        vehicle_make: "Toyota",
        vehicle_model: "Camry",
      };
      mockClient
        .from("service_price_history")
        .maybeSingle.mockResolvedValueOnce({ data: filtered, error: null });

      const result = await getLastSoldPrice(
        "org-1",
        "svc-1",
        "Toyota",
        "Camry",
      );

      expect(result).toEqual(filtered);
      const qb = mockClient.from("unused");
      expect(qb.eq).toHaveBeenCalledWith("vehicle_make", "Toyota");
      expect(qb.eq).toHaveBeenCalledWith("vehicle_model", "Camry");
    });

    it("returns null when no price history", async () => {
      mockClient
        .from("service_price_history")
        .maybeSingle.mockResolvedValueOnce({ data: null, error: null });

      const result = await getLastSoldPrice("org-1", "svc-1");

      expect(result).toBeNull();
    });

    it("orders by created_at desc, limit 1", async () => {
      mockClient
        .from("service_price_history")
        .maybeSingle.mockResolvedValueOnce({
          data: mockPriceHistory,
          error: null,
        });

      await getLastSoldPrice("org-1", "svc-1");

      const qb = mockClient.from("unused");
      expect(qb.order).toHaveBeenCalledWith("created_at", {
        ascending: false,
      });
      expect(qb.limit).toHaveBeenCalledWith(1);
    });
  });

  // ── getServicePriceHistory ──────────────────────────────────

  describe("getServicePriceHistory", () => {
    it("returns ordered price changes by service_catalog_id", async () => {
      const history = [
        { ...mockPriceHistory, id: "ph-2" },
        { ...mockPriceHistory, id: "ph-1" },
      ];
      mockClient
        .from("service_price_history")
        .limit.mockResolvedValueOnce({ data: history, error: null });

      const result = await getServicePriceHistory("org-1", "svc-1");

      expect(result).toEqual(history);
    });

    it("limits to 50 results", async () => {
      mockClient
        .from("service_price_history")
        .limit.mockResolvedValueOnce({ data: [mockPriceHistory], error: null });

      await getServicePriceHistory("org-1", "svc-1");

      const qb = mockClient.from("unused");
      expect(qb.limit).toHaveBeenCalledWith(50);
    });

    it("returns empty array when no history", async () => {
      mockClient
        .from("service_price_history")
        .limit.mockResolvedValueOnce({ data: [], error: null });

      const result = await getServicePriceHistory("org-1", "svc-1");

      expect(result).toEqual([]);
    });
  });
});
