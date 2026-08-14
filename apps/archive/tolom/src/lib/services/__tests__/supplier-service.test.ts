import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabaseClient } from "@/test/mocks/supabase";

vi.mock("@/lib/errors", () => ({
  NotFoundError: class NotFoundError extends Error {
    constructor(msg: string) {
      super(msg);
      this.name = "NotFoundError";
    }
  },
  ValidationError: class ValidationError extends Error {
    constructor(msg: string) {
      super(msg);
      this.name = "ValidationError";
    }
  },
}));

import { NotFoundError, ValidationError } from "@/lib/errors";
import {
  addSupplierPart,
  getPartSuppliers,
  getSupplierParts,
  getSupplierPerformance,
  removeSupplierPart,
  setPreferredSupplier,
} from "../supplier-service";

const ORG_ID = "org-1";
const SUPPLIER_ID = "supplier-1";
const PART_ID = "part-1";
const USER_ID = "user-1";

let db: ReturnType<typeof createMockSupabaseClient>;

const MOCK_SUPPLIER_PART = {
  id: "sp-1",
  supplier_id: SUPPLIER_ID,
  part_id: PART_ID,
  supplier_part_number: "SP-001",
  unit_cost: 15000,
  is_preferred: true,
  notes: null,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  part: {
    id: PART_ID,
    name: "Oil Filter",
    part_number: "OF-101",
    default_price: 25000,
    unit_cost: 12000,
    category: "Filters",
  },
};

const MOCK_PART_SUPPLIER = {
  id: "sp-1",
  supplier_id: SUPPLIER_ID,
  part_id: PART_ID,
  supplier_part_number: "SP-001",
  unit_cost: 15000,
  is_preferred: true,
  notes: null,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  supplier: {
    id: SUPPLIER_ID,
    name: "Auto Parts Co",
    phone: "99110001",
    email: "contact@autoparts.mn",
  },
};

beforeEach(() => {
  vi.clearAllMocks();
  db = createMockSupabaseClient();
});

describe("getSupplierPerformance", () => {
  it("returns organization-scoped supplier metrics", async () => {
    const metrics = [
      {
        supplier_id: SUPPLIER_ID,
        organization_id: ORG_ID,
        supplier_name: "Auto Parts Co",
        total_pos: 4,
        completed_pos: 3,
        total_items_ordered: 8,
        total_quantity_ordered: 24,
        avg_unit_cost: 12500,
        last_order_date: "2026-07-31T00:00:00Z",
      },
    ];
    db.__qb.resolveOnce({ data: metrics, error: null });

    const result = await getSupplierPerformance(db as never, ORG_ID);

    expect(result).toEqual(metrics);
    expect(db.from).toHaveBeenCalledWith("supplier_performance");
  });

  it("throws when metrics query fails", async () => {
    db.__qb.resolveOnce({ data: null, error: new Error("DB error") });

    await expect(getSupplierPerformance(db as never, ORG_ID)).rejects.toThrow(
      "DB error",
    );
  });
});

// ── getSupplierParts ───────────────────────────────────────────

describe("getSupplierParts", () => {
  it("returns parts for a supplier", async () => {
    db.__qb.resolveOnce({
      data: [MOCK_SUPPLIER_PART],
      error: null,
    });

    const result = await getSupplierParts(db as never, ORG_ID, SUPPLIER_ID);

    expect(result).toHaveLength(1);
    expect(result[0].part?.name).toBe("Oil Filter");
    expect(db.from).toHaveBeenCalledWith("supplier_parts");
  });

  it("returns empty array when no parts mapped", async () => {
    db.__qb.resolveOnce({ data: [], error: null });

    const result = await getSupplierParts(db as never, ORG_ID, SUPPLIER_ID);
    expect(result).toEqual([]);
  });

  it("throws on database error", async () => {
    db.__qb.resolveOnce({ data: null, error: new Error("DB error") });

    await expect(
      getSupplierParts(db as never, ORG_ID, SUPPLIER_ID),
    ).rejects.toThrow("DB error");
  });
});

// ── getPartSuppliers ───────────────────────────────────────────

describe("getPartSuppliers", () => {
  it("returns suppliers for a part", async () => {
    db.__qb.resolveOnce({
      data: [MOCK_PART_SUPPLIER],
      error: null,
    });

    const result = await getPartSuppliers(db as never, ORG_ID, PART_ID);

    expect(result).toHaveLength(1);
    expect(result[0].supplier?.name).toBe("Auto Parts Co");
    expect(db.from).toHaveBeenCalledWith("supplier_parts");
  });

  it("returns empty array when no suppliers mapped", async () => {
    db.__qb.resolveOnce({ data: [], error: null });

    const result = await getPartSuppliers(db as never, ORG_ID, PART_ID);
    expect(result).toEqual([]);
  });
});

// ── addSupplierPart ────────────────────────────────────────────

describe("addSupplierPart", () => {
  it("adds a part to a supplier", async () => {
    // maybeSingle for duplicate check — return null (no duplicate)
    vi.mocked(db.from("supplier_parts").maybeSingle).mockResolvedValueOnce({
      data: null,
      error: null,
    } as never);

    // single for insert — return the new record
    db.__qb.resolveOnce({ data: MOCK_SUPPLIER_PART, error: null });

    const result = await addSupplierPart(
      db as never,
      ORG_ID,
      {
        supplier_id: SUPPLIER_ID,
        part_id: PART_ID,
        supplier_part_number: "SP-001",
        unit_cost: 15000,
      },
      USER_ID,
    );

    expect(result.part?.name).toBe("Oil Filter");
    expect(result.supplier_id).toBe(SUPPLIER_ID);
  });

  it("adds a part as preferred and unsets other preferred", async () => {
    vi.mocked(db.from("supplier_parts").maybeSingle).mockResolvedValueOnce({
      data: null,
      error: null,
    } as never);

    const preferredPart = { ...MOCK_SUPPLIER_PART, is_preferred: true };
    db.__qb.resolveOnce({ data: preferredPart, error: null });

    // The unset-preferred update is a separate chain (await db.from(...).update(...).eq(...).neq(...).eq(...))
    // Since this is called after insert with .single(), it goes through a new chain
    // But actually the unset-preferred code uses db.from() which produces a new qb chain
    // Let's set a default resolve for any additional awaits
    db.__qb.resolveOnce({ data: null, error: null });

    const result = await addSupplierPart(
      db as never,
      ORG_ID,
      {
        supplier_id: SUPPLIER_ID,
        part_id: PART_ID,
        is_preferred: true,
      },
      USER_ID,
    );

    expect(result.is_preferred).toBe(true);
  });

  it("throws ValidationError when part already mapped", async () => {
    vi.mocked(db.from("supplier_parts").maybeSingle).mockResolvedValueOnce({
      data: { id: "existing" },
      error: null,
    } as never);

    await expect(
      addSupplierPart(
        db as never,
        ORG_ID,
        {
          supplier_id: SUPPLIER_ID,
          part_id: PART_ID,
        },
        USER_ID,
      ),
    ).rejects.toThrow(ValidationError);
  });

  it("throws when insert returns no data", async () => {
    vi.mocked(db.from("supplier_parts").maybeSingle).mockResolvedValueOnce({
      data: null,
      error: null,
    } as never);

    db.__qb.resolveOnce({ data: null, error: null });

    await expect(
      addSupplierPart(
        db as never,
        ORG_ID,
        {
          supplier_id: SUPPLIER_ID,
          part_id: PART_ID,
        },
        USER_ID,
      ),
    ).rejects.toThrow(NotFoundError);
  });
});

// ── removeSupplierPart ─────────────────────────────────────────

describe("removeSupplierPart", () => {
  it("removes mapping successfully", async () => {
    db.__qb.resolveOnce({
      data: { id: "sp-1" },
      error: null,
    });

    await expect(
      removeSupplierPart(db as never, ORG_ID, "sp-1"),
    ).resolves.toBeUndefined();
  });

  it("throws NotFoundError when mapping not found", async () => {
    db.__qb.resolveOnce({ data: null, error: null });

    await expect(
      removeSupplierPart(db as never, ORG_ID, "nonexistent"),
    ).rejects.toThrow(NotFoundError);
  });
});

// ── setPreferredSupplier ──────────────────────────────────────

describe("setPreferredSupplier", () => {
  it("unsets existing preferred and sets new one", async () => {
    // Each await in setPreferredSupplier goes through a new from() chain
    // First: unset all preferred → .update().eq().eq().eq()
    db.__qb.resolveOnce({ data: null, error: null });

    // Second: set new preferred → .update().eq().eq().eq()
    db.__qb.resolveOnce({ data: null, error: null });

    await expect(
      setPreferredSupplier(db as never, ORG_ID, PART_ID, SUPPLIER_ID),
    ).resolves.toBeUndefined();
  });

  it("throws on unset error", async () => {
    db.__qb.resolveOnce({ data: null, error: new Error("Update failed") });

    await expect(
      setPreferredSupplier(db as never, ORG_ID, PART_ID, SUPPLIER_ID),
    ).rejects.toThrow("Update failed");
  });
});
