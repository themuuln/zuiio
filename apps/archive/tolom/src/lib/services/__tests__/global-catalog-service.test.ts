import { beforeEach, describe, expect, it } from "vitest";
// ValidationError is used for input validation checks — import the real class
// via the mock so we can assert with .rejects.toThrow(ValidationError).
import { ValidationError } from "@/lib/errors";
import {
  createMockSupabaseClient,
  type MockSupabaseClient,
} from "@/test/mocks/supabase";

import {
  getGlobalPartById,
  importGlobalPartsToOrg,
  searchGlobalParts,
  searchGlobalServices,
} from "../global-catalog-service";

const ORG_ID = "org-1";
const USER_ID = "user-1";

let db: MockSupabaseClient;

function makeGlobalPart(overrides: Record<string, unknown> = {}) {
  return {
    id: "gp-1",
    name: "Brake Pad Set",
    name_mn: "Тормозны дэвсгэр",
    category: "Brake System",
    description: "Front brake pads",
    part_number: "BP-1001",
    unit: "set",
    is_active: true,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}

function makeGlobalService(overrides: Record<string, unknown> = {}) {
  return {
    id: "gs-1",
    name: "Oil Change",
    name_mn: "Тос солих",
    category: "Maintenance",
    description: "Engine oil replacement",
    estimated_duration_minutes: 30,
    interval_months: 6,
    interval_km: 10000,
    is_active: true,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}

beforeEach(() => {
  db = createMockSupabaseClient();
});

// ── searchGlobalParts ─────────────────────────────────────────

describe("searchGlobalParts", () => {
  it("returns all active parts when no query", async () => {
    const parts = [
      makeGlobalPart(),
      makeGlobalPart({ id: "gp-2", name: "Oil Filter" }),
    ];
    db.__qb.resolveWith({ data: parts, error: null });

    const result = await searchGlobalParts(db);

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("Brake Pad Set");
  });

  it("returns empty array when no results", async () => {
    db.__qb.resolveWith({ data: [], error: null });

    const result = await searchGlobalParts(db, "nonexistent");

    expect(result).toEqual([]);
  });

  it("filters by query", async () => {
    const parts = [makeGlobalPart()];
    db.__qb.resolveWith({ data: parts, error: null });

    const result = await searchGlobalParts(db, "brake");

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Brake Pad Set");
  });

  it("applies category filter", async () => {
    const parts = [makeGlobalPart()];
    db.__qb.resolveWith({ data: parts, error: null });

    const result = await searchGlobalParts(db, undefined, {
      category: "Brake System",
    });

    expect(result).toHaveLength(1);
  });

  it("respects custom limit and offset", async () => {
    db.__qb.resolveWith({ data: [], error: null });

    const result = await searchGlobalParts(db, undefined, {
      limit: 15,
      offset: 10,
    });

    expect(result).toEqual([]);
  });

  it("throws on query error", async () => {
    db.__qb.resolveWith({
      data: null,
      error: { message: "DB error" },
    });

    await expect(searchGlobalParts(db)).rejects.toThrow("DB error");
  });
});

// ── getGlobalPartById ─────────────────────────────────────────

describe("getGlobalPartById", () => {
  it("returns a single part by id", async () => {
    const part = makeGlobalPart();
    db.__qb.resolveWith({ data: part, error: null });

    const result = await getGlobalPartById(db, "gp-1");

    expect(result.id).toBe("gp-1");
    expect(result.name).toBe("Brake Pad Set");
  });

  it("throws NotFoundError when part not found", async () => {
    db.__qb.resolveWith({
      data: null,
      error: { message: "No rows found", code: "PGRST116" },
    });

    await expect(getGlobalPartById(db, "nonexistent")).rejects.toThrow(
      "Global part not found",
    );
  });
});

// ── searchGlobalServices ──────────────────────────────────────

describe("searchGlobalServices", () => {
  it("returns all active services", async () => {
    const services = [makeGlobalService()];
    db.__qb.resolveWith({ data: services, error: null });

    const result = await searchGlobalServices(db);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Oil Change");
  });

  it("searches by query", async () => {
    const services = [makeGlobalService()];
    db.__qb.resolveWith({ data: services, error: null });

    const result = await searchGlobalServices(db, "oil");

    expect(result).toHaveLength(1);
  });

  it("filters by category", async () => {
    const services = [makeGlobalService()];
    db.__qb.resolveWith({ data: services, error: null });

    const result = await searchGlobalServices(db, undefined, {
      category: "Maintenance",
    });

    expect(result).toHaveLength(1);
  });
});

// ── importGlobalPartsToOrg ────────────────────────────────────

describe("importGlobalPartsToOrg", () => {
  it("imports global parts to org catalog", async () => {
    const globalParts = [
      makeGlobalPart({ id: "gp-1" }),
      makeGlobalPart({
        id: "gp-2",
        name: "Oil Filter",
        part_number: "OF-2001",
      }),
    ];

    // 1. Fetch global parts
    db.__qb.resolveOnce({ data: globalParts, error: null });
    // 2. Check existing
    db.__qb.resolveOnce({ data: [], error: null });
    // 3. Insert
    db.__qb.resolveOnce({ data: null, error: null });

    const result = await importGlobalPartsToOrg(db, ORG_ID, USER_ID, [
      "gp-1",
      "gp-2",
    ]);

    expect(result.imported).toBe(2);
    expect(result.skipped).toBe(0);
  });

  it("skips already-imported parts", async () => {
    const globalParts = [makeGlobalPart({ id: "gp-1" })];

    // 1. Fetch global parts
    db.__qb.resolveOnce({ data: globalParts, error: null });
    // 2. Check existing — part already imported
    db.__qb.resolveOnce({
      data: [{ global_part_id: "gp-1" }],
      error: null,
    });

    const result = await importGlobalPartsToOrg(db, ORG_ID, USER_ID, ["gp-1"]);

    expect(result.imported).toBe(0);
    expect(result.skipped).toBe(1);
  });

  it("throws ValidationError for empty orgId", async () => {
    await expect(
      importGlobalPartsToOrg(db, "", USER_ID, ["gp-1"]),
    ).rejects.toThrow(ValidationError);
  });

  it("throws ValidationError for empty partIds", async () => {
    await expect(
      importGlobalPartsToOrg(db, ORG_ID, USER_ID, []),
    ).rejects.toThrow(ValidationError);
  });

  it("throws when no active global parts found", async () => {
    db.__qb.resolveOnce({ data: [], error: null });

    await expect(
      importGlobalPartsToOrg(db, ORG_ID, USER_ID, ["gp-nonexistent"]),
    ).rejects.toThrow("No active global parts found");
  });

  it("reports insert error", async () => {
    const globalParts = [makeGlobalPart({ id: "gp-1" })];

    // 1. Fetch global parts
    db.__qb.resolveOnce({ data: globalParts, error: null });
    // 2. Check existing
    db.__qb.resolveOnce({ data: [], error: null });
    // 3. Insert — fails
    db.__qb.resolveOnce({
      data: null,
      error: { message: "Insert failed" },
    });

    await expect(
      importGlobalPartsToOrg(db, ORG_ID, USER_ID, ["gp-1"]),
    ).rejects.toThrow("Insert failed");
  });
});
