import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidateTag } from "next/cache";
import { describe, expect, it, vi } from "vitest";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { createMockSupabaseClient } from "@/test/mocks/supabase";
import {
  createVehicleModel,
  deleteVehicleModel,
  updateVehicleModel,
} from "./vehicle-models-service";

vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));
vi.mock("@/lib/audit", () => ({
  createAuditLog: vi.fn().mockResolvedValue({ success: true, id: "audit-1" }),
  logAuditAfter: vi.fn(),
}));

function makeBuilder<T = unknown>(data?: T, error: unknown = null) {
  const resolved = { data: data ?? null, error };
  return {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(resolved),
    then: vi.fn((resolve: (v: typeof resolved) => void) => resolve(resolved)),
  };
}

const rawClient = createMockSupabaseClient();
const db = rawClient as unknown as SupabaseClient;

describe("createVehicleModel", () => {
  it("rejects an invalid year range", async () => {
    await expect(
      createVehicleModel(db, "org-1", {
        make: "Toyota",
        model: "Camry",
        year_start: 2024,
        year_end: 2020,
      }),
    ).rejects.toThrow(ValidationError);
  });
});

describe("updateVehicleModel", () => {
  it("scopes updates to organization_id and active rows", async () => {
    const builder = makeBuilder({ id: "vm-1", make: "Toyota", model: "Prius" });
    rawClient.from = vi.fn().mockReturnValue(builder);

    await updateVehicleModel(db, "vm-1", "org-1", {
      make: "Toyota",
      model: "Prius",
    });

    expect(builder.eq).toHaveBeenNthCalledWith(1, "id", "vm-1");
    expect(builder.eq).toHaveBeenNthCalledWith(2, "organization_id", "org-1");
    expect(builder.is).toHaveBeenCalledWith("deleted_at", null);
    expect(revalidateTag).toHaveBeenCalled();
  });

  it("rejects an invalid year range", async () => {
    await expect(
      updateVehicleModel(db, "vm-1", "org-1", {
        year_start: 2025,
        year_end: 2021,
      }),
    ).rejects.toThrow(ValidationError);
  });
});

describe("deleteVehicleModel", () => {
  it("revalidates after a successful soft delete", async () => {
    const builder = makeBuilder({ id: "vm-1" });
    builder.then = vi.fn((resolve: (v: unknown) => void) =>
      resolve({ data: { id: "vm-1" }, error: null }),
    );
    rawClient.from = vi.fn().mockReturnValue(builder);

    await expect(
      deleteVehicleModel(db, "vm-1", "org-1"),
    ).resolves.toBeUndefined();
    expect(revalidateTag).toHaveBeenCalled();
  });

  it("throws NotFoundError when the delete fails", async () => {
    const builder = makeBuilder(null, { message: "Not found" });
    builder.then = vi.fn((resolve: (v: unknown) => void) =>
      resolve({ data: null, error: { message: "Not found" } }),
    );
    rawClient.from = vi.fn().mockReturnValue(builder);

    await expect(deleteVehicleModel(db, "vm-1", "org-1")).rejects.toThrow(
      NotFoundError,
    );
  });
});
