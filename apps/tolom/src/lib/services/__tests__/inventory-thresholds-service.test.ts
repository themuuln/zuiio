import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabaseClient, type MockSupabaseClient } from "@/test/mocks/supabase";

vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));
vi.mock("@/lib/audit", () => ({ logAuditAfter: vi.fn() }));
vi.mock("@/lib/cache/keys", () => ({
  cacheTags: {
    stockThresholds: (orgId: string) => `stock-thresholds:${orgId}`,
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

import { revalidateTag } from "next/cache";
import { resolveBranchId, withBranchFilter } from "@/lib/supabase/with-branch";
import {
  getStockThresholds,
  setStockThreshold,
} from "../inventory-service";

const ORG_ID = "org-1";
const PART_ID = "part-1";
const USER_ID = "user-1";

const mockRevalidateTag = vi.mocked(revalidateTag);
const mockResolveBranchId = vi.mocked(resolveBranchId);

let db: MockSupabaseClient;

function makeThreshold(overrides: Record<string, unknown> = {}) {
  return {
    id: "th-1",
    organization_id: ORG_ID,
    branch_id: null,
    part_id: PART_ID,
    minimum_quantity: 10,
    maximum_quantity: 100,
    notes: null,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
    ...overrides,
  };
}

beforeEach(() => {
  vi.resetAllMocks();
  mockResolveBranchId.mockResolvedValue("branch-1");
  db = createMockSupabaseClient();
});

// ── Get Stock Thresholds ────────────────────────────────────────

describe("getStockThresholds", () => {
  it("returns thresholds for org", async () => {
    const thresholds = [makeThreshold()];
    db.__qb.resolveWith({ data: thresholds, error: null });

    const result = await getStockThresholds(db as never, ORG_ID);

    expect(result).toEqual(thresholds);
    expect(result).toHaveLength(1);
    expect(db.from).toHaveBeenCalledWith("stock_thresholds");
  });

  it("returns empty array when no data", async () => {
    db.__qb.resolveWith({ data: null, error: null });
    expect(await getStockThresholds(db as never, ORG_ID)).toEqual([]);
  });

  it("throws on db error", async () => {
    db.__qb.resolveWith({ data: null, error: new Error("DB fail") });
    await expect(getStockThresholds(db as never, ORG_ID)).rejects.toThrow(
      "DB fail",
    );
  });

  it("queries with correct org filter", async () => {
    db.__qb.resolveWith({ data: [], error: null });
    await getStockThresholds(db as never, ORG_ID);

    expect(db.from("stock_thresholds").eq).toHaveBeenCalledWith(
      "organization_id",
      ORG_ID,
    );
  });

  it("passes branch filter when provided", async () => {
    db.__qb.resolveWith({ data: [makeThreshold({ branch_id: "branch-1" })], error: null });

    const result = await getStockThresholds(db as never, ORG_ID, "branch-1");

    expect(result).toHaveLength(1);
    expect(withBranchFilter).toHaveBeenCalled();
  });

  it("returns multiple thresholds with mixed branches", async () => {
    const thresholds = [
      makeThreshold({ id: "th-1", branch_id: null }),
      makeThreshold({ id: "th-2", branch_id: "branch-1", minimum_quantity: 5 }),
      makeThreshold({ id: "th-3", branch_id: "branch-2", minimum_quantity: 20 }),
    ];
    db.__qb.resolveWith({ data: thresholds, error: null });

    const result = await getStockThresholds(db as never, ORG_ID);

    expect(result).toHaveLength(3);
    expect(result[1].minimum_quantity).toBe(5);
    expect(result[2].minimum_quantity).toBe(20);
  });
});

// ── Set Stock Threshold ─────────────────────────────────────────

describe("setStockThreshold", () => {
  const created = {
    id: "th-1",
    organization_id: ORG_ID,
    branch_id: "branch-1",
    part_id: PART_ID,
    minimum_quantity: 10,
    maximum_quantity: null,
    notes: null,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
    created_by: USER_ID,
    updated_by: USER_ID,
  };

  it("creates threshold with upsert and invalidates cache", async () => {
    db.__qb.resolveOnce({ data: created, error: null });

    const result = await setStockThreshold(
      db as never,
      ORG_ID,
      { part_id: PART_ID, minimum_quantity: 10 },
      USER_ID,
    );

    expect(result).toEqual(created);
    expect(db.from).toHaveBeenCalledWith("stock_thresholds");
    expect(mockRevalidateTag).toHaveBeenCalledWith(
      `stock-thresholds:${ORG_ID}`,
      "max",
    );
  });

  it("rejects empty part_id", async () => {
    await expect(
      setStockThreshold(
        db as never,
        ORG_ID,
        { part_id: "", minimum_quantity: 10 },
        USER_ID,
      ),
    ).rejects.toThrow("Part is required");
  });

  it("falls back to auth.getUser when userId omitted", async () => {
    db.__qb.resolveOnce({ data: created, error: null });

    await setStockThreshold(
      db as never,
      ORG_ID,
      { part_id: PART_ID, minimum_quantity: 10 },
    );

    expect(db.auth.getUser).toHaveBeenCalled();
  });

  it("throws on db error", async () => {
    db.__qb.resolveOnce({
      data: null,
      error: new Error("upsert failed"),
    });

    await expect(
      setStockThreshold(
        db as never,
        ORG_ID,
        { part_id: PART_ID, minimum_quantity: 10 },
        USER_ID,
      ),
    ).rejects.toThrow("upsert failed");
  });

  it("throws on null result from upsert", async () => {
    db.__qb.resolveOnce({ data: null, error: null });

    await expect(
      setStockThreshold(
        db as never,
        ORG_ID,
        { part_id: PART_ID, minimum_quantity: 10 },
        USER_ID,
      ),
    ).rejects.toThrow("Failed to set threshold");
  });

  it("resolves branch id and uses it", async () => {
    db.__qb.resolveOnce({ data: created, error: null });

    await setStockThreshold(
      db as never,
      ORG_ID,
      { part_id: PART_ID, minimum_quantity: 10 },
      USER_ID,
    );

    expect(mockResolveBranchId).toHaveBeenCalled();
  });

  it("accepts minimum_quantity of 0 as valid threshold", async () => {
    db.__qb.resolveOnce({
      data: { ...created, minimum_quantity: 0 },
      error: null,
    });

    const result = await setStockThreshold(
      db as never,
      ORG_ID,
      { part_id: PART_ID, minimum_quantity: 0 },
      USER_ID,
    );

    expect(result.minimum_quantity).toBe(0);
  });
});
