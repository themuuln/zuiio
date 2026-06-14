import type { SupabaseClient } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabaseClient } from "@/test/mocks/supabase";
import {
  createVehicle,
  deleteVehicle,
  getVehicle,
  getVehicles,
  searchByPlate,
  updateVehicle,
} from "./vehicle-service";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/cache/with-cache", () => ({
  withCache: vi.fn((_key, fn) => fn()),
}));
vi.mock("@/lib/audit", () => ({
  createAuditLog: vi.fn().mockResolvedValue({ success: true, id: "audit-1" }),
}));
vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));

/**
 * Characterization tests for vehicle-service CRUD functions.
 * These verify function signatures, return types, and basic behavior
 * to detect any behavioral drift after migration.
 */
describe("vehicle-service characterization", () => {
  let db: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    vi.clearAllMocks();
    db = createMockSupabaseClient();
  });

  describe("getVehicles", () => {
    it("returns an array with owner info", async () => {
      db.from("vehicles").limit.mockResolvedValue({
        data: [
          {
            id: "v1",
            plate_number: "4444УНА",
            make: "Toyota",
            model: "Camry",
            vehicle_owners: [
              {
                customer_id: "c1",
                customers: { first_name: "John", last_name: "Doe", phone: "555-0100" },
              },
            ],
          },
        ],
        error: null,
      });

      const result = await getVehicles(
        db as unknown as SupabaseClient,
        "org-1",
      );

      expect(Array.isArray(result)).toBe(true);
      if (result.length > 0) {
        expect(result[0]).toHaveProperty("owner_name");
        expect(result[0]).toHaveProperty("owner_phone");
      }
    });
  });

  describe("getVehicle", () => {
    it("returns VehicleDetail with owners and recent_work_orders arrays", async () => {
      db.from("vehicles").single.mockResolvedValue({
        data: {
          id: "v1",
          plate_number: "4444УНА",
          make: "Toyota",
          model: "Camry",
        },
        error: null,
      });

      const result = await getVehicle(
        db as unknown as SupabaseClient,
        "v1",
        "org-1",
      );

      expect(result).toHaveProperty("id");
      expect(result).toHaveProperty("plate_number");
      expect(Array.isArray(result.owners)).toBe(true);
      expect(Array.isArray(result.recent_work_orders)).toBe(true);
    });
  });

  describe("createVehicle", () => {
    it("creates vehicle with valid data and returns it", async () => {
      db.from("vehicles").maybeSingle.mockResolvedValue({
        data: null,
        error: null,
      });
      db.from("vehicles").single.mockResolvedValue({
        data: {
          id: "v1",
          plate_number: "4444УНА",
          make: "Toyota",
          model: "Camry",
        },
        error: null,
      });

      const result = await createVehicle(
        db as unknown as SupabaseClient,
        "org-1",
        { plateNumber: "4444УНА", make: "Toyota", model: "Camry" },
        "user-1",
      );

      expect(result).toHaveProperty("id");
      expect(result).toHaveProperty("plate_number");
    });
  });

  describe("updateVehicle", () => {
    it("updates vehicle and returns updated data", async () => {
      db.from("vehicles").single
        .mockResolvedValueOnce({
          data: {
            id: "v1",
            plate_number: "4444УНА",
            make: "Toyota",
            model: "Camry",
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: {
            id: "v1",
            plate_number: "5555УНА",
            make: "Toyota",
            model: "Camry",
          },
          error: null,
        });

      const result = await updateVehicle(
        db as unknown as SupabaseClient,
        "v1",
        "org-1",
        { plateNumber: "5555УНА" },
        "user-1",
      );

      expect(result.plate_number).toBe("5555УНА");
    });
  });

  describe("deleteVehicle", () => {
    it("soft deletes vehicle without throwing", async () => {
      db.from("vehicles").single.mockResolvedValue({
        data: { id: "v1" },
        error: null,
      });

      await expect(
        deleteVehicle(db as unknown as SupabaseClient, "v1", "org-1", "user-1"),
      ).resolves.toBeUndefined();
    });
  });

  describe("searchByPlate", () => {
    it("returns vehicles matching plate search", async () => {
      db.from("vehicles").limit.mockResolvedValue({
        data: [
          {
            id: "v1",
            plate_number: "ABC123",
            make: "Toyota",
            model: "Camry",
            vehicle_owners: [
              {
                customer_id: "c1",
                customers: { first_name: "John", last_name: "Doe", phone: null },
              },
            ],
          },
        ],
        error: null,
      });

      const result = await searchByPlate(
        db as unknown as SupabaseClient,
        "org-1",
        "ABC",
      );

      expect(Array.isArray(result)).toBe(true);
    });
  });
});
