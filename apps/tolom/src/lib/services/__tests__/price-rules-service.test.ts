import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createMockSupabaseClient,
  type MockSupabaseClient,
} from "@/test/mocks/supabase";

vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));
vi.mock("@/lib/audit", () => ({ logAuditAfter: vi.fn() }));
vi.mock("@/lib/cache/keys", () => ({
  cacheTags: {
    priceRules: (o: string) => `price-rules:${o}`,
  },
}));
vi.mock("@/lib/errors", () => ({
  NotFoundError: class extends Error {
    constructor(m: string) {
      super(m);
      this.name = "NotFoundError";
    }
  },
  ValidationError: class extends Error {
    constructor(m: string) {
      super(m);
      this.name = "ValidationError";
    }
  },
}));
vi.mock("@/lib/capture", () => ({ capture: vi.fn() }));
vi.mock("@/lib/supabase/with-branch", () => ({
  resolveBranchId: vi.fn().mockResolvedValue("branch-1"),
}));

import { revalidateTag } from "next/cache";
import { logAuditAfter } from "@/lib/audit";
import { resolveBranchId } from "@/lib/supabase/with-branch";

const mockRevalidateTag = vi.mocked(revalidateTag);
const mockLogAudit = vi.mocked(logAuditAfter);
const mockResolveBranchId = vi.mocked(resolveBranchId);

import {
  createPriceRule,
  deletePriceRule,
  getActivePriceRules,
  getPriceRule,
  getPriceRules,
  type RuleOperator,
  resolvePrice,
  updatePriceRule,
} from "../price-rules-service";

const ORG_ID = "org-1";
const RULE_ID = "rule-1";
const USER_ID = "user-1";

let db: MockSupabaseClient;

/** Access the shared query builder to control maybeSingle returns. */
function qb() {
  return db.from("") as unknown as {
    maybeSingle: ReturnType<typeof vi.fn>;
  };
}

function makePriceRule(overrides: Record<string, unknown> = {}) {
  return {
    id: RULE_ID,
    organization_id: ORG_ID,
    name: "Test Rule",
    description: null,
    apply_to: "both",
    conditions: {},
    conditions_description: null,
    operator: "multiply",
    value: 1.5,
    priority: 100,
    part_category: null,
    service_category: null,
    part_name_pattern: null,
    service_name_pattern: null,
    is_active: true,
    created_at: "2025-01-15T10:00:00Z",
    updated_at: "2025-01-15T10:00:00Z",
    deleted_at: null,
    created_by: null,
    updated_by: null,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockResolveBranchId.mockResolvedValue("branch-1");
  db = createMockSupabaseClient();
});

// ── getPriceRules ───────────────────────────────────────────────

describe("getPriceRules", () => {
  it("fetches all non-deleted price rules for org, ordered by priority then name", async () => {
    const rules = [
      makePriceRule({ id: "r1", name: "A Rule" }),
      makePriceRule({ id: "r2", name: "B Rule" }),
    ];
    db.__qb.resolveWith({ data: rules, error: null });

    const result = await getPriceRules(db, ORG_ID);

    expect(result).toEqual(rules);
    expect(db.from).toHaveBeenCalledWith("price_rules");
  });

  it("returns empty array when no rules exist", async () => {
    db.__qb.resolveWith({ data: null, error: null });

    const result = await getPriceRules(db, ORG_ID);

    expect(result).toEqual([]);
  });

  it("throws on database error", async () => {
    db.__qb.resolveWith({
      data: null,
      error: { message: "Connection failed" },
    });

    await expect(getPriceRules(db, ORG_ID)).rejects.toThrow(
      "Connection failed",
    );
  });
});

// ── getActivePriceRules ─────────────────────────────────────────

describe("getActivePriceRules", () => {
  it("fetches only active non-deleted rules for org", async () => {
    const rules = [
      makePriceRule({ id: "r1", priority: 10 }),
      makePriceRule({ id: "r2", priority: 50 }),
    ];
    db.__qb.resolveWith({ data: rules, error: null });

    const result = await getActivePriceRules(db, ORG_ID);

    expect(result).toEqual(rules);
    expect(db.from).toHaveBeenCalledWith("price_rules");
  });

  it("returns empty array when no active rules", async () => {
    db.__qb.resolveWith({ data: null, error: null });

    expect(await getActivePriceRules(db, ORG_ID)).toEqual([]);
  });

  it("throws on database error", async () => {
    db.__qb.resolveWith({ data: null, error: { message: "DB error" } });

    // The function throws new Error(error.message), not the fallback string
    await expect(getActivePriceRules(db, ORG_ID)).rejects.toThrow("DB error");
  });
});

// ── getPriceRule ────────────────────────────────────────────────

describe("getPriceRule", () => {
  it("returns a price rule by id", async () => {
    const rule = makePriceRule();
    db.__qb.resolveWith({ data: rule, error: null });

    const result = await getPriceRule(db, RULE_ID);

    expect(result).toEqual(rule);
    expect(db.from).toHaveBeenCalledWith("price_rules");
  });

  it("throws NotFoundError when rule not found", async () => {
    db.__qb.resolveWith({ data: null, error: null });

    await expect(getPriceRule(db, RULE_ID)).rejects.toThrow(
      "Price rule not found",
    );
  });

  it("throws NotFoundError on query error", async () => {
    db.__qb.resolveWith({ data: null, error: { message: "Not found" } });

    await expect(getPriceRule(db, RULE_ID)).rejects.toThrow(
      "Price rule not found",
    );
  });
});

// ── createPriceRule ─────────────────────────────────────────────

describe("createPriceRule", () => {
  const validParams: Parameters<typeof createPriceRule>[2] = {
    name: " Winter Discount ",
    operator: "percentage_sub",
    value: 10,
    apply_to: "both",
    conditions: { years: { start: 2010, end: 2025 } },
  };

  it("creates a price rule with valid params", async () => {
    const created = makePriceRule({
      name: "Winter Discount",
      operator: "percentage_sub",
      value: 10,
    });
    db.__qb.resolveWith({ data: created, error: null });

    const result = await createPriceRule(db, ORG_ID, validParams, USER_ID);

    expect(result).toEqual(created);
    expect(db.from).toHaveBeenCalledWith("price_rules");
  });

  it("trims name and description", async () => {
    const params = {
      ...validParams,
      name: "  My Rule  ",
      description: "  desc text  ",
    };
    db.__qb.resolveWith({ data: makePriceRule(), error: null });

    await createPriceRule(db, ORG_ID, params, USER_ID);

    const insertCall = (db.from as ReturnType<typeof vi.fn>).mock.results[0]
      .value.insert as ReturnType<typeof vi.fn>;
    expect(insertCall).toHaveBeenCalledWith(
      expect.objectContaining({ name: "My Rule", description: "desc text" }),
    );
  });

  it("sets created_by and updated_by when userId provided", async () => {
    db.__qb.resolveWith({ data: makePriceRule(), error: null });

    await createPriceRule(db, ORG_ID, validParams, USER_ID);

    const insertCall = (db.from as ReturnType<typeof vi.fn>).mock.results[0]
      .value.insert as ReturnType<typeof vi.fn>;
    expect(insertCall).toHaveBeenCalledWith(
      expect.objectContaining({ created_by: USER_ID, updated_by: USER_ID }),
    );
  });

  it("defaults priority to 100", async () => {
    db.__qb.resolveWith({ data: makePriceRule(), error: null });

    await createPriceRule(db, ORG_ID, validParams, USER_ID);

    const insertCall = (db.from as ReturnType<typeof vi.fn>).mock.results[0]
      .value.insert as ReturnType<typeof vi.fn>;
    expect(insertCall).toHaveBeenCalledWith(
      expect.objectContaining({ priority: 100 }),
    );
  });

  it("throws ValidationError when name is blank", async () => {
    await expect(
      createPriceRule(db, ORG_ID, { ...validParams, name: "  " }, USER_ID),
    ).rejects.toThrow("Name is required");
  });

  it("throws ValidationError when operator is missing", async () => {
    await expect(
      createPriceRule(
        db,
        ORG_ID,
        { ...validParams, operator: "" as RuleOperator },
        USER_ID,
      ),
    ).rejects.toThrow("Operator is required");
  });

  it("throws ValidationError when value is null", async () => {
    await expect(
      createPriceRule(
        db,
        ORG_ID,
        { ...validParams, value: null as unknown as number },
        USER_ID,
      ),
    ).rejects.toThrow("Value is required");
  });

  it("calls logAuditAfter and revalidateTag on success", async () => {
    const created = makePriceRule();
    db.__qb.resolveWith({ data: created, error: null });

    await createPriceRule(db, ORG_ID, validParams, USER_ID);

    expect(mockLogAudit).toHaveBeenCalledWith({
      supabase: db,
      action: "create",
      table_name: "price_rules",
      record_id: RULE_ID,
      user_id: USER_ID,
      organization_id: ORG_ID,
      new_data: created,
    });
    expect(mockRevalidateTag).toHaveBeenCalledWith(
      `price-rules:${ORG_ID}`,
      "max",
    );
  });

  it("deep-clones conditions via JSON round-trip", async () => {
    const conditions = { makes: ["Toyota", "Lexus"] };
    db.__qb.resolveWith({ data: makePriceRule(), error: null });

    await createPriceRule(db, ORG_ID, { ...validParams, conditions }, USER_ID);

    const insertCall = (db.from as ReturnType<typeof vi.fn>).mock.results[0]
      .value.insert as ReturnType<typeof vi.fn>;
    const callArg = insertCall.mock.calls[0][0] as Record<string, unknown>;
    expect(callArg.conditions).toEqual(conditions);
    expect(callArg.conditions).not.toBe(conditions);
  });

  it("throws on DB error", async () => {
    db.__qb.resolveWith({ data: null, error: { message: "Insert failed" } });

    await expect(
      createPriceRule(db, ORG_ID, validParams, USER_ID),
    ).rejects.toThrow("Insert failed");
  });
});

// ── updatePriceRule ─────────────────────────────────────────────

describe("updatePriceRule", () => {
  it("updates specified fields with partial params", async () => {
    const updated = makePriceRule({ name: "Updated Name", value: 20 });
    db.__qb.resolveWith({ data: updated, error: null });

    const result = await updatePriceRule(
      db,
      RULE_ID,
      ORG_ID,
      { name: "Updated Name", value: 20 },
      USER_ID,
    );

    expect(result).toEqual(updated);
    const updateCall = (db.from as ReturnType<typeof vi.fn>).mock.results[0]
      .value.update as ReturnType<typeof vi.fn>;
    expect(updateCall).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Updated Name",
        value: 20,
        updated_by: USER_ID,
      }),
    );
  });

  it("toggles is_active flag", async () => {
    const updated = makePriceRule({ is_active: false });
    db.__qb.resolveWith({ data: updated, error: null });

    await updatePriceRule(db, RULE_ID, ORG_ID, { is_active: false }, USER_ID);

    const updateCall = (db.from as ReturnType<typeof vi.fn>).mock.results[0]
      .value.update as ReturnType<typeof vi.fn>;
    expect(updateCall).toHaveBeenCalledWith(
      expect.objectContaining({ is_active: false, updated_by: USER_ID }),
    );
  });

  it("throws NotFoundError when rule not found", async () => {
    db.__qb.resolveWith({ data: null, error: null });

    await expect(
      updatePriceRule(db, RULE_ID, ORG_ID, { name: "X" }, USER_ID),
    ).rejects.toThrow("Price rule not found");
  });

  it("throws NotFoundError on query error", async () => {
    db.__qb.resolveWith({ data: null, error: { message: "Error" } });

    await expect(
      updatePriceRule(db, RULE_ID, ORG_ID, { name: "X" }, USER_ID),
    ).rejects.toThrow("Price rule not found");
  });

  it("calls logAuditAfter and revalidateTag", async () => {
    const updated = makePriceRule({ name: "Renamed" });
    db.__qb.resolveWith({ data: updated, error: null });

    await updatePriceRule(db, RULE_ID, ORG_ID, { name: "Renamed" }, USER_ID);

    expect(mockLogAudit).toHaveBeenCalledWith({
      supabase: db,
      action: "update",
      table_name: "price_rules",
      record_id: RULE_ID,
      user_id: USER_ID,
      organization_id: ORG_ID,
      new_data: updated,
    });
    expect(mockRevalidateTag).toHaveBeenCalledWith(
      `price-rules:${ORG_ID}`,
      "max",
    );
  });

  it("trims string fields before update", async () => {
    db.__qb.resolveWith({ data: makePriceRule(), error: null });

    await updatePriceRule(
      db,
      RULE_ID,
      ORG_ID,
      { name: "  Trimmed  ", description: "  desc  " },
      USER_ID,
    );

    const updateCall = (db.from as ReturnType<typeof vi.fn>).mock.results[0]
      .value.update as ReturnType<typeof vi.fn>;
    expect(updateCall).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Trimmed",
        description: "desc",
        updated_by: USER_ID,
      }),
    );
  });
});

// ── deletePriceRule ─────────────────────────────────────────────

describe("deletePriceRule", () => {
  it("soft-deletes by setting deleted_at and updated_by", async () => {
    db.__qb.resolveWith({ data: null, error: null });

    await deletePriceRule(db, RULE_ID, ORG_ID);

    const updateCall = (db.from as ReturnType<typeof vi.fn>).mock.results[0]
      .value.update as ReturnType<typeof vi.fn>;
    expect(updateCall).toHaveBeenCalledWith(
      expect.objectContaining({
        deleted_at: expect.any(String),
        updated_by: "test-user-id",
      }),
    );

    // Verify targeting filters
    const eqMock = (db.from as ReturnType<typeof vi.fn>).mock.results[0].value
      .eq as ReturnType<typeof vi.fn>;
    expect(eqMock).toHaveBeenCalledWith("id", RULE_ID);
    expect(eqMock).toHaveBeenCalledWith("organization_id", ORG_ID);
  });

  it("calls logAuditAfter and revalidateTag", async () => {
    db.__qb.resolveWith({ data: null, error: null });

    await deletePriceRule(db, RULE_ID, ORG_ID);

    expect(mockLogAudit).toHaveBeenCalledWith({
      supabase: db,
      action: "soft_delete",
      table_name: "price_rules",
      record_id: RULE_ID,
      user_id: "test-user-id",
      organization_id: ORG_ID,
    });
    expect(mockRevalidateTag).toHaveBeenCalledWith(
      `price-rules:${ORG_ID}`,
      "max",
    );
  });

  it("throws on database error", async () => {
    db.__qb.resolveWith({ data: null, error: { message: "Delete failed" } });

    await expect(deletePriceRule(db, RULE_ID, ORG_ID)).rejects.toThrow(
      "Delete failed",
    );
  });
});

// ── resolvePrice ────────────────────────────────────────────────

describe("resolvePrice", () => {
  beforeEach(() => {
    db.__qb.resolveWith({ data: null, error: null });
  });

  // ── Step 1: Specific Price ────────────────────────────────────

  describe("step 1: specific_price", () => {
    const partInput = {
      basePrice: 10000,
      type: "part" as const,
      part: { name: "Oil Filter" },
      vehicle: { make: "Toyota", model: "Camry", year: 2020 },
      vehicleClass: "standard",
    };

    it("returns specific_price when found for a part with vehicle context", async () => {
      // maybeSingle is on the shared qb, not __qb
      qb().maybeSingle.mockResolvedValueOnce({
        data: { id: "cat-1", default_price: 10000 },
        error: null,
      });
      db.__qb.resolveOnce({ data: [{ id: "vm-1" }], error: null });
      qb().maybeSingle.mockResolvedValueOnce({
        data: { specific_price: 12000 },
        error: null,
      });

      const result = await resolvePrice(db, ORG_ID, partInput);

      expect(result).toEqual({
        price: 12000,
        source: "specific_price",
        explanation: "Toyota Camry specific price",
      });
    });

    it("falls through to default when catalog part is not found", async () => {
      qb().maybeSingle.mockResolvedValueOnce({ data: null, error: null });
      db.__qb.resolveOnce({ data: [], error: null });

      const result = await resolvePrice(db, ORG_ID, partInput);

      expect(result.source).toBe("default_price");
      expect(result.price).toBe(10000);
    });
  });

  // ── Step 2: Rule Operators ────────────────────────────────────

  describe("step 2: rule operators", () => {
    const partInput = {
      basePrice: 10000,
      type: "part" as const,
      part: { name: "Oil Filter", category: "Filters" },
      vehicle: { make: "Toyota", model: "Camry", year: 2020 },
    };

    beforeEach(() => {
      qb().maybeSingle.mockResolvedValueOnce({
        data: { id: "cat-1", default_price: 10000 },
        error: null,
      });
      db.__qb.resolveOnce({ data: [], error: null });
    });

    it("multiply: basePrice * value", async () => {
      db.__qb.resolveOnce({
        data: [makePriceRule({ operator: "multiply", value: 2 })],
        error: null,
      });

      const result = await resolvePrice(db, ORG_ID, partInput);

      expect(result.source).toBe("price_rule");
      expect(result.price).toBe(20000);
    });

    it("add_fixed: basePrice + value", async () => {
      db.__qb.resolveOnce({
        data: [makePriceRule({ operator: "add_fixed", value: 5000 })],
        error: null,
      });

      const result = await resolvePrice(db, ORG_ID, partInput);

      expect(result.price).toBe(15000);
    });

    it("set_fixed: returns exact value without rounding", async () => {
      db.__qb.resolveOnce({
        data: [makePriceRule({ operator: "set_fixed", value: 9999.9 })],
        error: null,
      });

      const result = await resolvePrice(db, ORG_ID, partInput);

      expect(result.price).toBe(9999.9);
      expect(typeof result.price).toBe("number");
      expect(result.explanation).toBe("Fixed price: Test Rule");
    });

    it("percentage_add: basePrice * (1 + value/100)", async () => {
      db.__qb.resolveOnce({
        data: [makePriceRule({ operator: "percentage_add", value: 25 })],
        error: null,
      });

      const result = await resolvePrice(db, ORG_ID, partInput);

      expect(result.price).toBe(12500);
    });

    it("percentage_sub: basePrice * (1 - value/100)", async () => {
      db.__qb.resolveOnce({
        data: [makePriceRule({ operator: "percentage_sub", value: 15 })],
        error: null,
      });

      const result = await resolvePrice(db, ORG_ID, partInput);

      expect(result.price).toBe(8500);
    });

    it("rounds non-set_fixed results to 2 decimal places", async () => {
      db.__qb.resolveOnce({
        data: [makePriceRule({ operator: "multiply", value: 1 / 3 })],
        error: null,
      });

      const result = await resolvePrice(db, ORG_ID, partInput);

      expect(result.price).toBe(3333.33);
    });
  });

  // ── Step 2: Rule Filtering ────────────────────────────────────

  describe("step 2: rule filtering", () => {
    const partInput = {
      basePrice: 10000,
      type: "part" as const,
      part: { name: "Oil Filter", category: "Filters" },
      vehicle: { make: "Toyota", model: "Camry", year: 2020 },
    };

    beforeEach(() => {
      qb().maybeSingle.mockResolvedValueOnce({
        data: { id: "cat-1", default_price: 10000 },
        error: null,
      });
      db.__qb.resolveOnce({ data: [], error: null });
    });

    it("filters by apply_to (part applies, service does not)", async () => {
      db.__qb.resolveOnce({
        data: [
          makePriceRule({
            apply_to: "part",
            operator: "add_fixed",
            value: 1000,
            id: "r-part",
          }),
          makePriceRule({
            apply_to: "service",
            operator: "add_fixed",
            value: 9999,
            id: "r-svc",
          }),
        ],
        error: null,
      });

      const result = await resolvePrice(db, ORG_ID, partInput);

      expect(result.price).toBe(11000);
    });

    it("filters by part category", async () => {
      db.__qb.resolveOnce({
        data: [
          makePriceRule({
            part_category: "Filters",
            operator: "add_fixed",
            value: 2000,
          }),
          makePriceRule({
            part_category: "Brakes",
            operator: "add_fixed",
            value: 9999,
            id: "r-brake",
          }),
        ],
        error: null,
      });

      const result = await resolvePrice(db, ORG_ID, partInput);

      expect(result.price).toBe(12000);
    });

    it("filters by part name pattern (wildcard)", async () => {
      db.__qb.resolveOnce({
        data: [
          makePriceRule({
            part_name_pattern: "Oil*",
            operator: "add_fixed",
            value: 3000,
          }),
          makePriceRule({
            part_name_pattern: "Brake*",
            operator: "add_fixed",
            value: 9999,
            id: "r-brake",
          }),
        ],
        error: null,
      });

      const result = await resolvePrice(db, ORG_ID, partInput);

      expect(result.price).toBe(13000);
    });
  });

  // ── Step 2: Condition Matching ────────────────────────────────

  describe("step 2: condition matching", () => {
    const partInput = {
      basePrice: 10000,
      type: "part" as const,
      part: { name: "Oil Filter", category: "Filters" },
      vehicle: {
        make: "Toyota",
        model: "Camry",
        year: 2020,
        body_type: "sedan",
        fuel_type: "gasoline",
      },
      vehicleClass: "standard",
    };

    beforeEach(() => {
      qb().maybeSingle.mockResolvedValueOnce({
        data: { id: "cat-1", default_price: 10000 },
        error: null,
      });
      db.__qb.resolveOnce({ data: [], error: null });
    });

    it("matches vehicle makes (case-insensitive)", async () => {
      db.__qb.resolveOnce({
        data: [
          makePriceRule({
            conditions: { makes: ["toyota"] },
            operator: "add_fixed",
            value: 5000,
          }),
        ],
        error: null,
      });

      const result = await resolvePrice(db, ORG_ID, partInput);

      expect(result.price).toBe(15000);
    });

    it("matches vehicle models", async () => {
      db.__qb.resolveOnce({
        data: [
          makePriceRule({
            conditions: { models: ["Camry"] },
            operator: "add_fixed",
            value: 5000,
          }),
        ],
        error: null,
      });

      const result = await resolvePrice(db, ORG_ID, partInput);

      expect(result.price).toBe(15000);
    });

    it("matches vehicle year within range", async () => {
      db.__qb.resolveOnce({
        data: [
          makePriceRule({
            conditions: { years: { start: 2015, end: 2025 } },
            operator: "add_fixed",
            value: 3000,
          }),
        ],
        error: null,
      });

      const result = await resolvePrice(db, ORG_ID, partInput);

      expect(result.price).toBe(13000);
    });

    it("matches vehicle class", async () => {
      db.__qb.resolveOnce({
        data: [
          makePriceRule({
            conditions: { classes: ["standard"] },
            operator: "add_fixed",
            value: 2000,
          }),
        ],
        error: null,
      });

      const result = await resolvePrice(db, ORG_ID, partInput);

      expect(result.price).toBe(12000);
    });

    it("matches body type", async () => {
      db.__qb.resolveOnce({
        data: [
          makePriceRule({
            conditions: { body_types: ["sedan"] },
            operator: "add_fixed",
            value: 2000,
          }),
        ],
        error: null,
      });

      const result = await resolvePrice(db, ORG_ID, partInput);

      expect(result.price).toBe(12000);
    });

    it("matches fuel type", async () => {
      db.__qb.resolveOnce({
        data: [
          makePriceRule({
            conditions: { fuel_types: ["gasoline"] },
            operator: "add_fixed",
            value: 2000,
          }),
        ],
        error: null,
      });

      const result = await resolvePrice(db, ORG_ID, partInput);

      expect(result.price).toBe(12000);
    });

    it("excludes rules with non-matching conditions", async () => {
      db.__qb.resolveOnce({
        data: [
          makePriceRule({
            conditions: { makes: ["Honda"] },
            operator: "add_fixed",
            value: 5000,
          }),
        ],
        error: null,
      });

      const result = await resolvePrice(db, ORG_ID, partInput);

      expect(result.source).toBe("default_price");
    });

    it("picks first matching rule by priority when multiple match", async () => {
      db.__qb.resolveOnce({
        data: [
          makePriceRule({
            priority: 100,
            operator: "add_fixed",
            value: 1000,
            id: "r-high",
          }),
          makePriceRule({
            priority: 200,
            operator: "add_fixed",
            value: 5000,
            id: "r-low",
          }),
        ],
        error: null,
      });

      const result = await resolvePrice(db, ORG_ID, partInput);

      expect(result.price).toBe(11000);
    });
  });

  // ── Step 3: Price History ─────────────────────────────────────

  describe("step 3: price history fallback", () => {
    it("uses part_price_history when no rules match and vehicle is provided", async () => {
      const input = {
        basePrice: 10000,
        type: "part" as const,
        part: { name: "Oil Filter" },
        vehicle: { make: "Toyota", model: "Camry" },
      };

      qb().maybeSingle.mockResolvedValueOnce({
        data: { id: "cat-1", default_price: 10000 },
        error: null,
      });
      db.__qb.resolveOnce({ data: [], error: null }); // no vehicle_models
      db.__qb.resolveOnce({ data: [], error: null }); // getActivePriceRules returns empty
      db.__qb.resolveOnce({ data: [{ unit_price: 9000 }], error: null }); // part_price_history

      const result = await resolvePrice(db, ORG_ID, input);

      expect(result).toEqual({
        price: 9000,
        source: "price_history",
        explanation: "Last price for Toyota Camry",
      });
    });

    it("uses service_price_history for service type", async () => {
      const input = {
        basePrice: 20000,
        type: "service" as const,
        service: { name: "Oil Change" },
        vehicle: { make: "Toyota", model: "Camry" },
      };

      db.__qb.resolveOnce({ data: [], error: null }); // getActivePriceRules
      db.__qb.resolveOnce({ data: [{ unit_price: 18000 }], error: null }); // service_price_history

      const result = await resolvePrice(db, ORG_ID, input);

      expect(result).toEqual({
        price: 18000,
        source: "price_history",
        explanation: "Last price for Toyota Camry",
      });
    });

    it("skips history when no vehicle context", async () => {
      const input = {
        basePrice: 10000,
        type: "part" as const,
        part: { name: "Oil Filter" },
      };

      qb().maybeSingle.mockResolvedValueOnce({
        data: { id: "cat-1", default_price: 10000 },
        error: null,
      });
      db.__qb.resolveOnce({ data: [], error: null }); // getActivePriceRules

      const result = await resolvePrice(db, ORG_ID, input);

      expect(result.source).toBe("default_price");
      expect(result.price).toBe(10000);
    });
  });

  // ── Step 4: Default Price ─────────────────────────────────────

  describe("step 4: default price fallback", () => {
    it("returns basePrice when no context matches", async () => {
      const result = await resolvePrice(db, ORG_ID, {
        basePrice: 5000,
        type: "service",
        service: { name: "Oil Change" },
      });

      expect(result).toEqual({
        price: 5000,
        source: "default_price",
        explanation: "Catalog default price",
      });
    });

    it("returns basePrice for part with no vehicle and no rules", async () => {
      qb().maybeSingle.mockResolvedValueOnce({ data: null, error: null });
      db.__qb.resolveOnce({ data: [], error: null });

      const result = await resolvePrice(db, ORG_ID, {
        basePrice: 7500,
        type: "part",
        part: { name: "Air Filter" },
      });

      expect(result.source).toBe("default_price");
      expect(result.price).toBe(7500);
    });
  });
});
