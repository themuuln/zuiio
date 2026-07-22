import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabaseClient } from "@/test/mocks/supabase";

vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));
vi.mock("@/lib/audit", () => ({ logAuditAfter: vi.fn() }));
vi.mock("@/lib/cache/keys", () => ({
  cacheTags: {
    partsCatalog: (o: string) => `parts_catalog:${o}`,
    inventoryMovements: (o: string) => `inventory_movements:${o}`,
    inventoryBalances: (o: string) => `inventory_balances:${o}`,
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
vi.mock("@/lib/supabase/with-branch", () => ({
  resolveBranchId: vi.fn().mockResolvedValue("branch-1"),
  withBranchFilter: vi.fn((q: unknown) => q),
}));
vi.mock("@/lib/supabase/query", () => ({
  withDbCapture: vi.fn((_l: string, p: Promise<unknown>) => p),
}));

import { revalidateTag } from "next/cache";
import { logAuditAfter } from "@/lib/audit";
import { resolveBranchId } from "@/lib/supabase/with-branch";

const mockRevalidateTag = vi.mocked(revalidateTag);
const mockLogAudit = vi.mocked(logAuditAfter);
const mockResolveBranchId = vi.mocked(resolveBranchId);

import {
  createMovement,
  createPart,
  deletePart,
  getInventoryBalances,
  getInventoryFast,
  getInventoryMovements,
  getPart,
  getPartsCatalog,
  getWeightedAverageCosts,
  updatePart,
} from "../inventory-service";

const ORG_ID = "org-1";
const PART_ID = "part-1";
const USER_ID = "user-1";

let db: ReturnType<typeof createMockSupabaseClient>;

function makePart(o: Record<string, unknown> = {}) {
  return {
    id: PART_ID,
    organization_id: ORG_ID,
    name: "Oil Filter",
    name_mn: "Тосны шүүлтүүр",
    part_number: "OF-101",
    category: "Filters",
    unit: "piece",
    default_price: 15000,
    is_active: true,
    purchase_price: 10000,
    image_url: null,
    location: "A-12",
    created_at: "2025-01-15T10:00:00Z",
    deleted_at: null,
    global_part_id: null,
    ...o,
  };
}

beforeEach(() => {
  vi.resetAllMocks();
  mockResolveBranchId.mockResolvedValue("branch-1");
  db = createMockSupabaseClient();
});

describe("getPartsCatalog", () => {
  it("returns paginated result with popularity sorting", async () => {
    db.__qb.resolveOnce({
      data: [makePart({ id: "p1" }), makePart({ id: "p2" })],
      error: null,
      count: 2,
    });
    db.__qb.resolveOnce({
      data: [{ part_id: "p2" }, { part_id: "p2" }],
      error: null,
    });
    const r = (await getPartsCatalog(db as never, ORG_ID, 1, 10)) as any;
    expect(r.data).toHaveLength(2);
    expect(r.total).toBe(2);
  });

  it("returns flat array without pagination", async () => {
    db.__qb.resolveOnce({ data: [makePart()], error: null });
    db.__qb.resolveOnce({ data: [], error: null });
    const r = await getPartsCatalog(db as never, ORG_ID);
    expect(Array.isArray(r)).toBe(true);
  });

  it("throws on DB error", async () => {
    db.__qb.resolveOnce({ data: null, error: new Error("fail") });
    await expect(getPartsCatalog(db as never, ORG_ID)).rejects.toThrow("fail");
  });

  it("handles null popularity assignments", async () => {
    db.__qb.resolveOnce({ data: [makePart()], error: null, count: 1 });
    db.__qb.resolveOnce({ data: null, error: null });
    const r = (await getPartsCatalog(db as never, ORG_ID, 1, 10)) as any;
    expect(r.data[0].popularity_score).toBe(0);
  });
});

describe("getPart", () => {
  it("returns a single part", async () => {
    db.__qb.resolveOnce({ data: makePart(), error: null });
    expect((await getPart(db as never, PART_ID, ORG_ID)).id).toBe(PART_ID);
  });

  it("throws NotFoundError", async () => {
    db.__qb.resolveOnce({ data: null, error: null });
    await expect(getPart(db as never, "x", ORG_ID)).rejects.toThrow(
      "not found",
    );
  });
});

describe("createPart", () => {
  const p = {
    name: "OF",
    name_mn: "Тосны шүүлтүүр",
    part_number: "OF-101",
    category: "Filters",
    unit: "piece",
    default_price: 15000,
  };

  it("inserts, audits, invalidates cache", async () => {
    db.__qb.resolveOnce({ data: makePart(), error: null });
    const r = await createPart(db as never, ORG_ID, p, USER_ID);
    expect(r.id).toBe(PART_ID);
    expect(mockLogAudit).toHaveBeenCalled();
    expect(mockRevalidateTag).toHaveBeenCalledWith(
      `parts_catalog:${ORG_ID}`,
      "max",
    );
  });

  it("rejects empty name_mn", async () => {
    await expect(
      createPart(db as never, ORG_ID, { ...p, name_mn: "" }, USER_ID),
    ).rejects.toThrow("Монгол нэр");
  });

  it("falls back name to name_mn", async () => {
    db.__qb.resolveOnce({
      data: makePart({ name: "Тосны шүүлтүүр" }),
      error: null,
    });
    await createPart(db as never, ORG_ID, { ...p, name: "" }, USER_ID);
  });
});

describe("updatePart", () => {
  beforeEach(() => {
    db.auth.getUser.mockResolvedValue({
      data: { user: { id: USER_ID } },
      error: null,
    });
  });

  it("fetches, applies fieldMap, updates, audits", async () => {
    db.__qb.resolveOnce({ data: makePart(), error: null });
    db.__qb.resolveOnce({ data: makePart({ name: "Updated" }), error: null });
    const r = await updatePart(db as never, PART_ID, ORG_ID, {
      name: "Updated",
    });
    expect(r.name).toBe("Updated");
    expect(mockLogAudit).toHaveBeenCalled();
  });

  it("throws when not found", async () => {
    db.__qb.resolveOnce({ data: null, error: new Error("not found") });
    await expect(
      updatePart(db as never, "x", ORG_ID, { name: "N" }),
    ).rejects.toThrow("not found");
  });
});

describe("deletePart", () => {
  beforeEach(() => {
    db.auth.getUser.mockResolvedValue({
      data: { user: { id: USER_ID } },
      error: null,
    });
  });

  it("soft-deletes and invalidates cache", async () => {
    await deletePart(db as never, PART_ID, ORG_ID);
    expect(mockRevalidateTag).toHaveBeenCalledWith(
      `parts_catalog:${ORG_ID}`,
      "max",
    );
  });
});

describe("getInventoryBalances", () => {
  it("returns balances", async () => {
    db.__qb.resolveWith({
      data: [{ part_id: PART_ID, part_name: "Filter", quantity_on_hand: 10 }],
      error: null,
    });
    const r = await getInventoryBalances(db as never, ORG_ID);
    expect(r).toHaveLength(1);
  });

  it("returns [] on null", async () => {
    db.__qb.resolveWith({ data: null, error: null });
    expect(await getInventoryBalances(db as never, ORG_ID)).toEqual([]);
  });
});

describe("getInventoryFast", () => {
  const row = {
    part_id: PART_ID,
    part_name: "OF",
    part_number: "OF-101",
    category: "Filters",
    unit: "piece",
    default_price: 15000,
    quantity_on_hand: 25,
    last_movement_at: "2025-01-15T10:00:00Z",
    min_threshold: 5,
    max_threshold: 50,
    stock_status: "in_stock",
  };

  it("returns mapped RPC rows", async () => {
    db.rpc.mockResolvedValue({ data: [row], error: null });
    const r = await getInventoryFast(db as never, ORG_ID);
    expect(r).toHaveLength(1);
    expect(r[0].stock_status).toBe("in_stock");
  });

  it("passes all params to RPC", async () => {
    db.rpc.mockResolvedValue({ data: [row], error: null });
    await getInventoryFast(db as never, ORG_ID, {
      search: "OF",
      lowStockOnly: true,
      limit: 10,
    });
    expect(db.rpc).toHaveBeenCalledWith("get_inventory_with_stock", {
      p_org_id: ORG_ID,
      p_search: "OF",
      p_low_stock_only: true,
      p_limit: 10,
      p_offset: 0,
    });
  });

  it("throws on RPC error", async () => {
    db.rpc.mockResolvedValue({ data: null, error: new Error("fail") });
    await expect(getInventoryFast(db as never, ORG_ID)).rejects.toThrow("fail");
  });
});

describe("getWeightedAverageCosts", () => {
  it("computes weighted avg from purchase movements", async () => {
    db.__qb.resolveWith({
      data: [
        { part_id: "p1", quantity: 10, unit_cost: 100 },
        { part_id: "p1", quantity: 5, unit_cost: 200 },
      ],
      error: null,
    });
    const r = await getWeightedAverageCosts(db as never, ORG_ID);
    expect(r.p1).toBeCloseTo(133.33, 1);
  });

  it("returns {} for no data", async () => {
    db.__qb.resolveWith({ data: [], error: null });
    expect(await getWeightedAverageCosts(db as never, ORG_ID)).toEqual({});
  });
});

describe("getInventoryMovements", () => {
  const row = {
    id: "mov-1",
    part_id: PART_ID,
    movement_type: "purchase",
    quantity: 10,
    unit_cost: 100,
    unit_price: 150,
    reference_type: "purchase_order",
    reference_id: "po-1",
    notes: "Initial stock",
    created_at: "2025-01-15T10:00:00Z",
    created_by: USER_ID,
    branch_id: "branch-1",
    organization_id: ORG_ID,
  };

  it("returns paginated result", async () => {
    db.__qb.resolveOnce({ data: [row], error: null, count: 1 });
    const r = (await getInventoryMovements(
      db as never,
      ORG_ID,
      "purchase",
      50,
      1,
      20,
    )) as any;
    expect(r).toHaveProperty("data");
    expect(r.total).toBe(1);
  });

  it("returns flat array without pagination", async () => {
    db.__qb.resolveOnce({ data: [row], error: null });
    expect(
      Array.isArray(await getInventoryMovements(db as never, ORG_ID)),
    ).toBe(true);
  });

  it("throws on error", async () => {
    db.__qb.resolveOnce({ data: null, error: new Error("fail") });
    await expect(getInventoryMovements(db as never, ORG_ID)).rejects.toThrow(
      "fail",
    );
  });
});

describe("createMovement", () => {
  const p = {
    part_id: PART_ID,
    movement_type: "purchase",
    quantity: 10,
    unit_cost: 100,
    unit_price: 150,
    reference_type: "purchase_order",
    reference_id: "po-1",
    notes: "Initial stock",
    branchId: "branch-1",
  };

  beforeEach(() => {
    db.auth.getUser.mockResolvedValue({
      data: { user: { id: USER_ID } },
      error: null,
    });
  });

  it("validates, checks part, inserts, audits, caches", async () => {
    // Part existence check uses .single() → resolveOnce #1
    db.__qb.resolveOnce({ data: { id: PART_ID }, error: null });
    // Insert with .single() → resolveOnce #2
    db.__qb.resolveOnce({
      data: {
        id: "mov-1",
        part_id: PART_ID,
        organization_id: ORG_ID,
        movement_type: "purchase",
        quantity: 10,
        branch_id: "branch-1",
        created_at: "2025-01-15T10:00:00Z",
        created_by: USER_ID,
      },
      error: null,
    });

    const r = await createMovement(db as never, ORG_ID, p, USER_ID);
    expect(r.id).toBe("mov-1");
    expect(mockLogAudit).toHaveBeenCalled();
    expect(mockRevalidateTag).toHaveBeenCalledWith(
      `inventory_movements:${ORG_ID}`,
      "max",
    );
    expect(mockRevalidateTag).toHaveBeenCalledWith(
      `inventory_balances:${ORG_ID}`,
      "max",
    );
  });

  it("rejects missing part_id", async () => {
    await expect(
      createMovement(db as never, ORG_ID, { ...p, part_id: "" }, USER_ID),
    ).rejects.toThrow("Part is required");
  });

  it("rejects missing movement_type", async () => {
    await expect(
      createMovement(db as never, ORG_ID, { ...p, movement_type: "" }, USER_ID),
    ).rejects.toThrow("Movement type is required");
  });

  it("rejects zero quantity", async () => {
    await expect(
      createMovement(db as never, ORG_ID, { ...p, quantity: 0 }, USER_ID),
    ).rejects.toThrow("non-zero");
  });

  it("throws NotFoundError when part missing", async () => {
    const qb = db.from("parts_catalog").select("id") as any;
    qb.eq = vi.fn().mockReturnThis();
    qb.is = vi.fn().mockReturnThis();
    qb.single = vi.fn().mockResolvedValue({ data: null, error: null });

    await expect(
      createMovement(db as never, ORG_ID, p, USER_ID),
    ).rejects.toThrow("not found");
  });
});
