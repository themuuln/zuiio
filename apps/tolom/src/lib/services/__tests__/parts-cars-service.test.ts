import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createMockSupabaseClient,
  type MockSupabaseClient,
} from "@/test/mocks/supabase";

vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));
vi.mock("@/lib/audit", () => ({ logAuditAfter: vi.fn() }));
vi.mock("@/lib/cache/keys", () => ({
  cacheTags: {
    partsCars: (orgId: string) => `parts-cars:${orgId}`,
    partsCarParts: (carId: string) => `parts-car-parts:${carId}`,
  },
}));
vi.mock("@/lib/capture", () => ({ capture: vi.fn() }));
vi.mock("@/lib/errors", () => ({
  NotFoundError: class extends Error {
    constructor(msg: string) {
      super(msg);
      this.name = "NotFoundError";
    }
  },
  ValidationError: class extends Error {
    constructor(msg: string) {
      super(msg);
      this.name = "ValidationError";
    }
  },
}));

import { revalidateTag } from "next/cache";
import type { PartsCars } from "@/lib/types";
import {
  addPartsCarPart,
  completeDisassembly,
  createPartsCar,
  deletePartsCar,
  getPartsCar,
  getPartsCarParts,
  getPartsCars,
  removePartsCarPart,
  updatePartsCar,
} from "../parts-cars-service";

const ORG_ID = "org-1";
const CAR_ID = "car-1";
const PART_ID = "part-1";
const USER_ID = "user-1";

const mockRevalidateTag = vi.mocked(revalidateTag);

let db: MockSupabaseClient;

function makeCar(overrides: Partial<PartsCars> = {}): PartsCars {
  return {
    id: CAR_ID,
    organization_id: ORG_ID,
    branch_id: "branch-1",
    make: "Toyota",
    model: "Land Cruiser",
    year: 2020,
    vin: "JTEBU3FJ0LK123456",
    license_plate: "01-123-УБ",
    purchase_cost: 50000000,
    currency: "MNT",
    arrival_date: "2025-01-15",
    status: "arrived",
    total_parts_actual: 0,
    total_estimated_value: 0,
    notes: null,
    created_at: "2025-01-15T10:00:00Z",
    updated_at: "2025-01-15T10:00:00Z",
    deleted_at: null,
    ...overrides,
  };
}

function makeCarPart(overrides: Record<string, unknown> = {}) {
  return {
    id: "cp-1",
    organization_id: ORG_ID,
    parts_car_id: CAR_ID,
    part_id: PART_ID,
    name: "Door Panel",
    location_group: "body",
    quantity: 4,
    condition: "good",
    estimated_price: 150000,
    notes: null,
    created_by: USER_ID,
    updated_by: USER_ID,
    created_at: "2025-01-15T10:00:00Z",
    updated_at: "2025-01-15T10:00:00Z",
    ...overrides,
  };
}

beforeEach(() => {
  vi.resetAllMocks();
  db = createMockSupabaseClient();
});

// ── Get Parts Cars ──────────────────────────────────────────────

describe("getPartsCars", () => {
  it("returns list of parts cars for org", async () => {
    const cars = [
      makeCar(),
      makeCar({ id: "car-2", make: "Honda", model: "Civic" }),
    ];
    db.__qb.resolveWith({ data: cars, error: null });

    const result = await getPartsCars(db as never, ORG_ID);

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe(CAR_ID);
    expect(db.from).toHaveBeenCalledWith("parts_cars");
  });

  it("returns empty array when no cars exist", async () => {
    db.__qb.resolveWith({ data: null, error: null });
    expect(await getPartsCars(db as never, ORG_ID)).toEqual([]);
  });

  it("queries with correct org filter and excludes deleted", async () => {
    db.__qb.resolveWith({ data: [], error: null });
    await getPartsCars(db as never, ORG_ID);

    const chain = db.from("parts_cars");
    expect(chain.eq).toHaveBeenCalledWith("organization_id", ORG_ID);
    expect(chain.is).toHaveBeenCalledWith("deleted_at", null);
    expect(chain.order).toHaveBeenCalledWith("created_at", {
      ascending: false,
    });
  });

  it("throws on db error", async () => {
    db.__qb.resolveWith({ data: null, error: new Error("DB error") });
    await expect(getPartsCars(db as never, ORG_ID)).rejects.toThrow("DB error");
  });
});

// ── Get Parts Car (single) ──────────────────────────────────────

describe("getPartsCar", () => {
  it("returns a single parts car by id", async () => {
    const car = makeCar();
    db.__qb.resolveOnce({ data: car, error: null });

    const result = await getPartsCar(db as never, ORG_ID, CAR_ID);

    expect(result.id).toBe(CAR_ID);
    expect(result.make).toBe("Toyota");
  });

  it("throws NotFoundError when car does not exist", async () => {
    db.__qb.resolveOnce({ data: null, error: null });

    await expect(
      getPartsCar(db as never, ORG_ID, "nonexistent"),
    ).rejects.toThrow("not found");
  });

  it("throws on db error", async () => {
    db.__qb.resolveOnce({ data: null, error: new Error("query failed") });

    await expect(getPartsCar(db as never, ORG_ID, "x")).rejects.toThrow(
      "Parts car not found",
    );
  });
});

// ── Create Parts Car ────────────────────────────────────────────

describe("createPartsCar", () => {
  const params = { make: "Toyota", model: "Land Cruiser", year: 2020 };

  it("creates and returns the new car with cache invalidation", async () => {
    db.__qb.resolveOnce({ data: makeCar(), error: null });

    const result = await createPartsCar(db as never, ORG_ID, USER_ID, params);

    expect(result.id).toBe(CAR_ID);
    expect(result.make).toBe("Toyota");
    expect(mockRevalidateTag).toHaveBeenCalledWith(
      `parts-cars:${ORG_ID}`,
      "max",
    );
  });

  it("rejects missing make", async () => {
    await expect(
      createPartsCar(db as never, ORG_ID, USER_ID, { ...params, make: "" }),
    ).rejects.toThrow("Make and model are required");
  });

  it("rejects missing model", async () => {
    await expect(
      createPartsCar(db as never, ORG_ID, USER_ID, { ...params, model: "" }),
    ).rejects.toThrow("Make and model are required");
  });

  it("throws on db error", async () => {
    db.__qb.resolveOnce({ data: null, error: new Error("insert failed") });

    await expect(
      createPartsCar(db as never, ORG_ID, USER_ID, params),
    ).rejects.toThrow("insert failed");
  });

  it("defaults currency to MNT and status to arrived", async () => {
    db.__qb.resolveOnce({ data: makeCar(), error: null });
    await createPartsCar(db as never, ORG_ID, USER_ID, params);

    const insertArg = db.from("parts_cars").insert?.mock.calls[0]?.[0];
    expect(insertArg?.currency).toBe("MNT");
    expect(insertArg?.status).toBe("arrived");
  });
});

// ── Update Parts Car ────────────────────────────────────────────

describe("updatePartsCar", () => {
  it("updates and returns the car with cache invalidation", async () => {
    db.__qb.resolveOnce({ data: makeCar({ make: "Updated" }), error: null });

    const result = await updatePartsCar(db as never, ORG_ID, CAR_ID, {
      make: "Updated",
    });

    expect(result.make).toBe("Updated");
    expect(mockRevalidateTag).toHaveBeenCalledWith(
      `parts-cars:${ORG_ID}`,
      "max",
    );
  });

  it("throws on db error", async () => {
    db.__qb.resolveOnce({ data: null, error: new Error("not found") });

    await expect(
      updatePartsCar(db as never, ORG_ID, "x", { make: "N" }),
    ).rejects.toThrow("not found");
  });

  it("throws on empty result", async () => {
    db.__qb.resolveOnce({ data: null, error: null });

    await expect(
      updatePartsCar(db as never, ORG_ID, "x", { make: "N" }),
    ).rejects.toThrow("Failed to update");
  });
});

// ── Delete Parts Car ────────────────────────────────────────────

describe("deletePartsCar", () => {
  it("soft-deletes and invalidates cache", async () => {
    await deletePartsCar(db as never, ORG_ID, CAR_ID);

    const updateArg = db.from("parts_cars").update?.mock.calls[0]?.[0];
    expect(updateArg?.deleted_at).toEqual(expect.any(String));
    expect(updateArg?.updated_by).toBe("test-user-id");
    expect(mockRevalidateTag).toHaveBeenCalledWith(
      `parts-cars:${ORG_ID}`,
      "max",
    );
  });

  it("throws on db error", async () => {
    db.__qb.resolveWith({ data: null, error: new Error("delete failed") });

    await expect(deletePartsCar(db as never, ORG_ID, CAR_ID)).rejects.toThrow(
      "delete failed",
    );
  });
});

// ── Get Parts Car Parts ─────────────────────────────────────────

describe("getPartsCarParts", () => {
  it("returns parts for a car", async () => {
    const parts = [makeCarPart()];
    db.__qb.resolveWith({ data: parts, error: null });

    const result = await getPartsCarParts(db as never, ORG_ID, CAR_ID);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Door Panel");
    expect(db.from).toHaveBeenCalledWith("parts_car_parts");
  });

  it("returns empty array when no parts", async () => {
    db.__qb.resolveWith({ data: null, error: null });
    expect(await getPartsCarParts(db as never, ORG_ID, CAR_ID)).toEqual([]);
  });

  it("filters by car id and org", async () => {
    db.__qb.resolveWith({ data: [], error: null });
    await getPartsCarParts(db as never, ORG_ID, CAR_ID);

    const chain = db.from("parts_car_parts");
    expect(chain.eq).toHaveBeenCalledWith("parts_car_id", CAR_ID);
    expect(chain.eq).toHaveBeenCalledWith("organization_id", ORG_ID);
  });

  it("throws on db error", async () => {
    db.__qb.resolveWith({ data: null, error: new Error("DB error") });
    await expect(getPartsCarParts(db as never, ORG_ID, CAR_ID)).rejects.toThrow(
      "DB error",
    );
  });
});

// ── Add Parts Car Part ──────────────────────────────────────────

describe("addPartsCarPart", () => {
  const params = {
    name: "Door Panel",
    quantity: 4,
    condition: "good" as const,
  };

  it("adds a part to the car with cache invalidation", async () => {
    db.__qb.resolveOnce({ data: makeCarPart(), error: null });

    const result = await addPartsCarPart(
      db as never,
      ORG_ID,
      USER_ID,
      CAR_ID,
      params,
    );

    expect(result.name).toBe("Door Panel");
    expect(mockRevalidateTag).toHaveBeenCalledWith(
      `parts-car-parts:${CAR_ID}`,
      "max",
    );
  });

  it("rejects missing part name", async () => {
    await expect(
      addPartsCarPart(db as never, ORG_ID, USER_ID, CAR_ID, {
        ...params,
        name: "",
      }),
    ).rejects.toThrow("Part name is required");
  });

  it("defaults location_group to other and estimated_price to 0", async () => {
    db.__qb.resolveOnce({ data: makeCarPart(), error: null });
    await addPartsCarPart(db as never, ORG_ID, USER_ID, CAR_ID, {
      name: "Bumper",
    });

    const insertArg = db.from("parts_car_parts").insert?.mock.calls[0]?.[0];
    expect(insertArg?.location_group).toBe("other");
    expect(insertArg?.estimated_price).toBe(0);
    expect(insertArg?.quantity).toBe(1);
  });
});

// ── Remove Parts Car Part ───────────────────────────────────────

describe("removePartsCarPart", () => {
  it("removes part and invalidates cache", async () => {
    await removePartsCarPart(db as never, ORG_ID, CAR_ID, "cp-1");

    expect(db.from).toHaveBeenCalledWith("parts_car_parts");
    const chain = db.from("parts_car_parts");
    expect(chain.eq).toHaveBeenCalledWith("id", "cp-1");
    expect(mockRevalidateTag).toHaveBeenCalledWith(
      `parts-car-parts:${CAR_ID}`,
      "max",
    );
  });

  it("throws on db error", async () => {
    db.__qb.resolveWith({ data: null, error: new Error("delete failed") });
    await expect(
      removePartsCarPart(db as never, ORG_ID, CAR_ID, "cp-1"),
    ).rejects.toThrow("delete failed");
  });
});

// ── Complete Disassembly ────────────────────────────────────────

describe("completeDisassembly", () => {
  it("completes disassembly with parts count and value", async () => {
    const car = makeCar();
    const parts = [
      makeCarPart({ estimated_price: 150000, quantity: 4 }),
      makeCarPart({
        id: "cp-2",
        name: "Engine",
        estimated_price: 2000000,
        quantity: 1,
      }),
    ];

    db.__qb.resolveOnce({ data: car, error: null });
    db.__qb.resolveOnce({ data: parts, error: null });
    db.__qb.resolveOnce({
      data: makeCar({
        status: "completed",
        total_parts_actual: 2,
        total_estimated_value: 2600000,
      }),
      error: null,
    });

    const result = await completeDisassembly(
      db as never,
      ORG_ID,
      USER_ID,
      CAR_ID,
    );

    expect(result.status).toBe("completed");
    expect(mockRevalidateTag).toHaveBeenCalledWith(
      `parts-cars:${ORG_ID}`,
      "max",
    );
    expect(mockRevalidateTag).toHaveBeenCalledWith(
      `parts-car-parts:${CAR_ID}`,
      "max",
    );
  });

  it("throws if already completed", async () => {
    db.__qb.resolveOnce({
      data: makeCar({ status: "completed" }),
      error: null,
    });
    db.__qb.resolveOnce({ data: [], error: null });

    await expect(
      completeDisassembly(db as never, ORG_ID, USER_ID, CAR_ID),
    ).rejects.toThrow("already completed");
  });
});
