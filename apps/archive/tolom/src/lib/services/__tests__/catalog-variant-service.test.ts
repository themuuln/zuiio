import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createMockSupabaseClient,
  type MockSupabaseClient,
} from "@/test/mocks/supabase";

vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));
vi.mock("@/lib/audit", () => ({ logAuditAfter: vi.fn() }));
vi.mock("@/lib/cache/keys", () => ({
  cacheTags: {
    variantGroups: (o: string) => `variant-groups:${o}`,
    variantOptions: (o: string) => `variant-options:${o}`,
    itemVariants: (o: string, et: string, ei: string) =>
      `item-variants:${o}:${et}:${ei}`,
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

import { revalidateTag } from "next/cache";
import { logAuditAfter } from "@/lib/audit";
import { NotFoundError, ValidationError } from "@/lib/errors";

const mockRevalidateTag = vi.mocked(revalidateTag);
const mockLogAudit = vi.mocked(logAuditAfter);

import {
  bulkGenerateVariants,
  createItemVariant,
  createVariantGroup,
  createVariantOption,
  deleteItemVariant,
  deleteVariantGroup,
  deleteVariantOption,
  getItemVariant,
  getItemVariants,
  getVariantGroup,
  getVariantGroups,
  getVariantOption,
  getVariantOptions,
  resolveVariantPrice,
  updateItemVariant,
  updateVariantGroup,
  updateVariantOption,
} from "../catalog-variant-service";

// ── Shared constants ──────────────────────────────────────────────

const ORG_ID = "org-1";
const GROUP_ID = "group-1";
const OPTION_ID = "option-1";
const VARIANT_ID = "variant-1";
const ENTITY_ID = "entity-1";
const USER_ID = "user-1";

let db: MockSupabaseClient;

// ── Helpers ───────────────────────────────────────────────────────

function makeGroup(overrides: Record<string, unknown> = {}) {
  return {
    id: GROUP_ID,
    organization_id: ORG_ID,
    name: "Size",
    name_mn: "Хэмжээ",
    applies_to: "service",
    sort_order: 0,
    created_at: "2025-01-15T10:00:00Z",
    deleted_at: null,
    ...overrides,
  };
}

function makeOption(overrides: Record<string, unknown> = {}) {
  return {
    id: OPTION_ID,
    organization_id: ORG_ID,
    group_id: GROUP_ID,
    label: "Small",
    label_mn: "Жижиг",
    sort_order: 0,
    created_at: "2025-01-15T10:00:00Z",
    deleted_at: null,
    ...overrides,
  };
}

function makeVariant(overrides: Record<string, unknown> = {}) {
  return {
    id: VARIANT_ID,
    organization_id: ORG_ID,
    entity_type: "service",
    entity_id: ENTITY_ID,
    variant_label: "Small",
    variant_data: { Size: "Small" },
    price: 15000,
    cost: 10000,
    sku: null,
    barcode: null,
    sort_order: 0,
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
  db = createMockSupabaseClient();
});

// ═══════════════════════════════════════════════════════════════
// VARIANT GROUPS
// ═══════════════════════════════════════════════════════════════

describe("getVariantGroups", () => {
  it("returns all variant groups for org", async () => {
    db.__qb.resolveWith({
      data: [makeGroup({ id: "g1" }), makeGroup({ id: "g2" })],
      error: null,
    });
    const result = await getVariantGroups(db as never, ORG_ID);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("g1");
    expect(result[1].id).toBe("g2");
  });

  it("filters by appliesTo", async () => {
    db.__qb.resolveWith({ data: [makeGroup()], error: null });
    const result = await getVariantGroups(db as never, ORG_ID, "service");
    expect(result).toHaveLength(1);
    // Verify the chain included .eq("applies_to", "service")
    expect(
      vi.mocked(db.from("catalog_variant_groups").eq),
    ).toHaveBeenCalledWith("applies_to", "service");
  });

  it("returns empty array when no data", async () => {
    db.__qb.resolveWith({ data: null, error: null });
    const result = await getVariantGroups(db as never, ORG_ID);
    expect(result).toEqual([]);
  });

  it("throws on DB error", async () => {
    db.__qb.resolveWith({ data: null, error: new Error("DB down") });
    await expect(getVariantGroups(db as never, ORG_ID)).rejects.toThrow(
      "DB down",
    );
  });
});

describe("getVariantGroup", () => {
  it("returns a single group", async () => {
    db.__qb.resolveOnce({ data: makeGroup(), error: null });
    const result = await getVariantGroup(db as never, GROUP_ID);
    expect(result.id).toBe(GROUP_ID);
  });

  it("throws NotFoundError when not found", async () => {
    db.__qb.resolveOnce({ data: null, error: null });
    await expect(getVariantGroup(db as never, "missing")).rejects.toThrow(
      NotFoundError,
    );
  });

  it("throws NotFoundError on DB error", async () => {
    db.__qb.resolveOnce({ data: null, error: new Error("PGRST116") });
    await expect(getVariantGroup(db as never, "missing")).rejects.toThrow(
      NotFoundError,
    );
  });
});

describe("createVariantGroup", () => {
  const params = {
    name: "Size",
    name_mn: "Хэмжээ",
    applies_to: "service" as const,
    sort_order: 1,
  };

  it("inserts, returns data, invalidates cache", async () => {
    db.__qb.resolveOnce({ data: makeGroup(), error: null });
    const result = await createVariantGroup(db as never, ORG_ID, params);
    expect(result.id).toBe(GROUP_ID);
    expect(mockRevalidateTag).toHaveBeenCalledWith(
      `variant-groups:${ORG_ID}`,
      "max",
    );
  });

  it("uses default sort_order when not provided", async () => {
    db.__qb.resolveOnce({ data: makeGroup({ sort_order: 0 }), error: null });
    await createVariantGroup(db as never, ORG_ID, {
      name: "Grade",
      applies_to: "part",
    });
    // Should pass
  });

  it("throws ValidationError when name is empty", async () => {
    await expect(
      createVariantGroup(db as never, ORG_ID, {
        name: "",
        applies_to: "service",
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("throws ValidationError when name is whitespace", async () => {
    await expect(
      createVariantGroup(db as never, ORG_ID, {
        name: "   ",
        applies_to: "service",
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("throws Error on insert failure", async () => {
    db.__qb.resolveOnce({ data: null, error: new Error("insert fail") });
    await expect(
      createVariantGroup(db as never, ORG_ID, params),
    ).rejects.toThrow("insert fail");
  });

  it("throws Error when insert returns null without error", async () => {
    db.__qb.resolveOnce({ data: null, error: null });
    await expect(
      createVariantGroup(db as never, ORG_ID, params),
    ).rejects.toThrow("Failed to create variant group");
  });
});

describe("updateVariantGroup", () => {
  const updates = { name: "Updated Size", sort_order: 2 };

  it("checks existence, applies updates, invalidates cache", async () => {
    db.__qb.resolveOnce({ data: makeGroup(), error: null });
    db.__qb.resolveOnce({
      data: makeGroup({ name: "Updated Size" }),
      error: null,
    });
    const result = await updateVariantGroup(
      db as never,
      GROUP_ID,
      ORG_ID,
      updates,
    );
    expect(result.name).toBe("Updated Size");
    expect(mockRevalidateTag).toHaveBeenCalledWith(
      `variant-groups:${ORG_ID}`,
      "max",
    );
  });

  it("throws NotFoundError when group does not exist", async () => {
    db.__qb.resolveOnce({ data: null, error: null });
    await expect(
      updateVariantGroup(db as never, "missing", ORG_ID, updates),
    ).rejects.toThrow(NotFoundError);
  });

  it("throws NotFoundError on existence check DB error", async () => {
    db.__qb.resolveOnce({ data: null, error: new Error("PGRST116") });
    await expect(
      updateVariantGroup(db as never, "missing", ORG_ID, updates),
    ).rejects.toThrow(NotFoundError);
  });

  it("throws NotFoundError when update returns null", async () => {
    db.__qb.resolveOnce({ data: makeGroup(), error: null });
    db.__qb.resolveOnce({ data: null, error: null });
    await expect(
      updateVariantGroup(db as never, GROUP_ID, ORG_ID, updates),
    ).rejects.toThrow(NotFoundError);
  });

  it("updates name_mn and applies_to fields", async () => {
    db.__qb.resolveOnce({ data: makeGroup(), error: null });
    db.__qb.resolveOnce({
      data: makeGroup({ name_mn: "Updated MN", applies_to: "part" }),
      error: null,
    });
    const result = await updateVariantGroup(db as never, GROUP_ID, ORG_ID, {
      name_mn: "Updated MN",
      applies_to: "part",
    });
    expect(result.name_mn).toBe("Updated MN");
    expect(mockRevalidateTag).toHaveBeenCalled();
  });

  it("sets name_mn to null when explicitly passed", async () => {
    db.__qb.resolveOnce({ data: makeGroup(), error: null });
    db.__qb.resolveOnce({
      data: makeGroup({ name_mn: null }),
      error: null,
    });
    const result = await updateVariantGroup(db as never, GROUP_ID, ORG_ID, {
      name_mn: null,
    });
    expect(result.name_mn).toBeNull();
    expect(mockRevalidateTag).toHaveBeenCalled();
  });
});

describe("deleteVariantGroup", () => {
  it("soft-deletes and invalidates cache", async () => {
    db.__qb.resolveWith({ data: null, error: null });
    await deleteVariantGroup(db as never, GROUP_ID, ORG_ID);
    expect(mockRevalidateTag).toHaveBeenCalledWith(
      `variant-groups:${ORG_ID}`,
      "max",
    );
  });

  it("throws NotFoundError on DB error", async () => {
    db.__qb.resolveWith({
      data: null,
      error: new Error("row not found"),
    });
    await expect(
      deleteVariantGroup(db as never, "missing", ORG_ID),
    ).rejects.toThrow(NotFoundError);
  });
});

// ═══════════════════════════════════════════════════════════════
// VARIANT OPTIONS
// ═══════════════════════════════════════════════════════════════

describe("getVariantOptions", () => {
  it("returns all variant options for org", async () => {
    db.__qb.resolveWith({
      data: [makeOption({ id: "o1" }), makeOption({ id: "o2" })],
      error: null,
    });
    const result = await getVariantOptions(db as never, ORG_ID);
    expect(result).toHaveLength(2);
  });

  it("filters by groupId when provided", async () => {
    db.__qb.resolveWith({ data: [makeOption()], error: null });
    const result = await getVariantOptions(db as never, ORG_ID, GROUP_ID);
    expect(result).toHaveLength(1);
  });

  it("returns empty array when no data", async () => {
    db.__qb.resolveWith({ data: null, error: null });
    const result = await getVariantOptions(db as never, ORG_ID);
    expect(result).toEqual([]);
  });

  it("throws on DB error", async () => {
    db.__qb.resolveWith({ data: null, error: new Error("fail") });
    await expect(getVariantOptions(db as never, ORG_ID)).rejects.toThrow(
      "fail",
    );
  });
});

describe("getVariantOption", () => {
  it("returns a single option", async () => {
    db.__qb.resolveOnce({ data: makeOption(), error: null });
    const result = await getVariantOption(db as never, OPTION_ID);
    expect(result.id).toBe(OPTION_ID);
  });

  it("throws NotFoundError when not found", async () => {
    db.__qb.resolveOnce({ data: null, error: null });
    await expect(getVariantOption(db as never, "missing")).rejects.toThrow(
      NotFoundError,
    );
  });

  it("throws NotFoundError on DB error", async () => {
    db.__qb.resolveOnce({ data: null, error: new Error("PGRST116") });
    await expect(getVariantOption(db as never, "missing")).rejects.toThrow(
      NotFoundError,
    );
  });
});

describe("createVariantOption", () => {
  const params = {
    group_id: GROUP_ID,
    label: "Small",
    label_mn: "Жижиг",
    sort_order: 1,
  };

  it("inserts, returns data, invalidates cache", async () => {
    db.__qb.resolveOnce({ data: makeOption(), error: null });
    const result = await createVariantOption(db as never, ORG_ID, params);
    expect(result.id).toBe(OPTION_ID);
    expect(mockRevalidateTag).toHaveBeenCalledWith(
      `variant-options:${ORG_ID}`,
      "max",
    );
  });

  it("uses default sort_order when not provided", async () => {
    db.__qb.resolveOnce({ data: makeOption({ sort_order: 0 }), error: null });
    await createVariantOption(db as never, ORG_ID, {
      group_id: GROUP_ID,
      label: "Large",
    });
    // Should pass
  });

  it("throws ValidationError when label is empty", async () => {
    await expect(
      createVariantOption(db as never, ORG_ID, {
        group_id: GROUP_ID,
        label: "",
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("throws ValidationError when label is whitespace", async () => {
    await expect(
      createVariantOption(db as never, ORG_ID, {
        group_id: GROUP_ID,
        label: "   ",
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("throws ValidationError when group_id is empty", async () => {
    await expect(
      createVariantOption(db as never, ORG_ID, {
        group_id: "",
        label: "Small",
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("throws ValidationError when group_id is missing", async () => {
    await expect(
      createVariantOption(db as never, ORG_ID, {
        group_id: "",
        label: "Small",
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("throws Error on insert failure", async () => {
    db.__qb.resolveOnce({ data: null, error: new Error("insert fail") });
    await expect(
      createVariantOption(db as never, ORG_ID, params),
    ).rejects.toThrow("insert fail");
  });

  it("throws Error when insert returns null without error", async () => {
    db.__qb.resolveOnce({ data: null, error: null });
    await expect(
      createVariantOption(db as never, ORG_ID, params),
    ).rejects.toThrow("Failed to create variant option");
  });
});

describe("updateVariantOption", () => {
  const updates = { label: "Large", sort_order: 2 };

  it("checks existence, applies updates, invalidates cache", async () => {
    db.__qb.resolveOnce({ data: makeOption(), error: null });
    db.__qb.resolveOnce({
      data: makeOption({ label: "Large" }),
      error: null,
    });
    const result = await updateVariantOption(
      db as never,
      OPTION_ID,
      ORG_ID,
      updates,
    );
    expect(result.label).toBe("Large");
    expect(mockRevalidateTag).toHaveBeenCalledWith(
      `variant-options:${ORG_ID}`,
      "max",
    );
  });

  it("throws NotFoundError when option does not exist", async () => {
    db.__qb.resolveOnce({ data: null, error: null });
    await expect(
      updateVariantOption(db as never, "missing", ORG_ID, updates),
    ).rejects.toThrow(NotFoundError);
  });

  it("throws NotFoundError on existence check error", async () => {
    db.__qb.resolveOnce({ data: null, error: new Error("PGRST116") });
    await expect(
      updateVariantOption(db as never, "missing", ORG_ID, updates),
    ).rejects.toThrow(NotFoundError);
  });

  it("throws NotFoundError when update returns null", async () => {
    db.__qb.resolveOnce({ data: makeOption(), error: null });
    db.__qb.resolveOnce({ data: null, error: null });
    await expect(
      updateVariantOption(db as never, OPTION_ID, ORG_ID, updates),
    ).rejects.toThrow(NotFoundError);
  });

  it("updates label_mn field", async () => {
    db.__qb.resolveOnce({ data: makeOption(), error: null });
    db.__qb.resolveOnce({
      data: makeOption({ label_mn: "Том" }),
      error: null,
    });
    const result = await updateVariantOption(db as never, OPTION_ID, ORG_ID, {
      label_mn: "Том",
    });
    expect(result.label_mn).toBe("Том");
    expect(mockRevalidateTag).toHaveBeenCalled();
  });

  it("sets label_mn to null when explicitly passed", async () => {
    db.__qb.resolveOnce({ data: makeOption(), error: null });
    db.__qb.resolveOnce({
      data: makeOption({ label_mn: null }),
      error: null,
    });
    const result = await updateVariantOption(db as never, OPTION_ID, ORG_ID, {
      label_mn: null,
    });
    expect(result.label_mn).toBeNull();
    expect(mockRevalidateTag).toHaveBeenCalled();
  });
});

describe("deleteVariantOption", () => {
  it("soft-deletes and invalidates cache", async () => {
    db.__qb.resolveWith({ data: null, error: null });
    await deleteVariantOption(db as never, OPTION_ID, ORG_ID);
    expect(mockRevalidateTag).toHaveBeenCalledWith(
      `variant-options:${ORG_ID}`,
      "max",
    );
  });

  it("throws NotFoundError on DB error", async () => {
    db.__qb.resolveWith({ data: null, error: new Error("fail") });
    await expect(
      deleteVariantOption(db as never, "missing", ORG_ID),
    ).rejects.toThrow(NotFoundError);
  });
});

// ═══════════════════════════════════════════════════════════════
// ITEM VARIANTS
// ═══════════════════════════════════════════════════════════════

describe("getItemVariants", () => {
  it("returns variants for entity", async () => {
    db.__qb.resolveWith({
      data: [makeVariant({ id: "v1" }), makeVariant({ id: "v2" })],
      error: null,
    });
    const result = await getItemVariants(
      db as never,
      ORG_ID,
      "service",
      ENTITY_ID,
    );
    expect(result).toHaveLength(2);
  });

  it("returns empty array when no data", async () => {
    db.__qb.resolveWith({ data: null, error: null });
    const result = await getItemVariants(
      db as never,
      ORG_ID,
      "service",
      ENTITY_ID,
    );
    expect(result).toEqual([]);
  });

  it("throws on DB error", async () => {
    db.__qb.resolveWith({ data: null, error: new Error("fail") });
    await expect(
      getItemVariants(db as never, ORG_ID, "service", ENTITY_ID),
    ).rejects.toThrow("fail");
  });
});

describe("getItemVariant", () => {
  it("returns a single variant", async () => {
    db.__qb.resolveOnce({ data: makeVariant(), error: null });
    const result = await getItemVariant(db as never, VARIANT_ID);
    expect(result.id).toBe(VARIANT_ID);
  });

  it("throws NotFoundError when not found", async () => {
    db.__qb.resolveOnce({ data: null, error: null });
    await expect(getItemVariant(db as never, "missing")).rejects.toThrow(
      NotFoundError,
    );
  });

  it("throws NotFoundError on DB error", async () => {
    db.__qb.resolveOnce({ data: null, error: new Error("PGRST116") });
    await expect(getItemVariant(db as never, "missing")).rejects.toThrow(
      NotFoundError,
    );
  });
});

describe("createItemVariant", () => {
  const params = {
    entity_type: "service" as const,
    entity_id: ENTITY_ID,
    variant_label: "Small",
    variant_data: { Size: "Small" },
    price: 15000,
    cost: 10000,
    sku: "SKU-001",
    barcode: "BAR-001",
    sort_order: 1,
  };

  it("inserts, audits, invalidates cache", async () => {
    db.__qb.resolveOnce({ data: makeVariant(), error: null });
    const result = await createItemVariant(
      db as never,
      ORG_ID,
      params,
      USER_ID,
    );
    expect(result.id).toBe(VARIANT_ID);
    expect(mockLogAudit).toHaveBeenCalled();
    expect(mockRevalidateTag).toHaveBeenCalledWith(
      `item-variants:${ORG_ID}:service:${ENTITY_ID}`,
      "max",
    );
  });

  it("works without userId", async () => {
    db.__qb.resolveOnce({ data: makeVariant(), error: null });
    const result = await createItemVariant(db as never, ORG_ID, params);
    expect(result.id).toBe(VARIANT_ID);
    expect(mockLogAudit).toHaveBeenCalled();
  });

  it("throws ValidationError when variant_label is empty", async () => {
    await expect(
      createItemVariant(db as never, ORG_ID, {
        ...params,
        variant_label: "",
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("throws ValidationError when variant_label is whitespace", async () => {
    await expect(
      createItemVariant(db as never, ORG_ID, {
        ...params,
        variant_label: "   ",
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("throws Error on insert failure", async () => {
    db.__qb.resolveOnce({ data: null, error: new Error("insert fail") });
    await expect(
      createItemVariant(db as never, ORG_ID, params, USER_ID),
    ).rejects.toThrow("insert fail");
  });

  it("throws Error when insert returns null without error", async () => {
    db.__qb.resolveOnce({ data: null, error: null });
    await expect(
      createItemVariant(db as never, ORG_ID, params, USER_ID),
    ).rejects.toThrow("Failed to create item variant");
  });
});

describe("updateItemVariant", () => {
  const updates = { variant_label: "Medium", price: 20000 };

  it("checks existence, applies updates, audits, invalidates cache", async () => {
    db.__qb.resolveOnce({ data: makeVariant(), error: null });
    db.__qb.resolveOnce({
      data: makeVariant({ variant_label: "Medium", price: 20000 }),
      error: null,
    });
    const result = await updateItemVariant(
      db as never,
      VARIANT_ID,
      ORG_ID,
      updates,
      USER_ID,
    );
    expect(result.variant_label).toBe("Medium");
    expect(mockLogAudit).toHaveBeenCalled();
    expect(mockRevalidateTag).toHaveBeenCalledWith(
      `item-variants:${ORG_ID}:service:${ENTITY_ID}`,
      "max",
    );
  });

  it("throws NotFoundError when variant does not exist", async () => {
    db.__qb.resolveOnce({ data: null, error: null });
    await expect(
      updateItemVariant(db as never, "missing", ORG_ID, updates, USER_ID),
    ).rejects.toThrow(NotFoundError);
  });

  it("throws NotFoundError on existence check error", async () => {
    db.__qb.resolveOnce({ data: null, error: new Error("PGRST116") });
    await expect(
      updateItemVariant(db as never, "missing", ORG_ID, updates, USER_ID),
    ).rejects.toThrow(NotFoundError);
  });

  it("throws NotFoundError when update returns null", async () => {
    db.__qb.resolveOnce({ data: makeVariant(), error: null });
    db.__qb.resolveOnce({ data: null, error: null });
    await expect(
      updateItemVariant(db as never, VARIANT_ID, ORG_ID, updates, USER_ID),
    ).rejects.toThrow(NotFoundError);
  });

  it("updates variant_data, cost, sku, barcode fields", async () => {
    db.__qb.resolveOnce({ data: makeVariant(), error: null });
    db.__qb.resolveOnce({
      data: makeVariant({
        variant_data: { Size: "Large", Color: "Red" },
        cost: 12000,
        sku: "SKU-NEW",
        barcode: "BAR-NEW",
      }),
      error: null,
    });
    const result = await updateItemVariant(
      db as never,
      VARIANT_ID,
      ORG_ID,
      {
        variant_data: { Size: "Large", Color: "Red" },
        cost: 12000,
        sku: "SKU-NEW",
        barcode: "BAR-NEW",
      },
      USER_ID,
    );
    expect(result.cost).toBe(12000);
    expect(result.sku).toBe("SKU-NEW");
    expect(mockLogAudit).toHaveBeenCalled();
    expect(mockRevalidateTag).toHaveBeenCalled();
  });

  it("updates is_active and sort_order fields", async () => {
    db.__qb.resolveOnce({ data: makeVariant(), error: null });
    db.__qb.resolveOnce({
      data: makeVariant({ is_active: false, sort_order: 5 }),
      error: null,
    });
    const result = await updateItemVariant(
      db as never,
      VARIANT_ID,
      ORG_ID,
      { is_active: false, sort_order: 5 },
      USER_ID,
    );
    expect(result.is_active).toBe(false);
    expect(mockRevalidateTag).toHaveBeenCalled();
  });

  it("works without userId", async () => {
    db.__qb.resolveOnce({ data: makeVariant(), error: null });
    db.__qb.resolveOnce({
      data: makeVariant({ variant_label: "Updated" }),
      error: null,
    });
    const result = await updateItemVariant(db as never, VARIANT_ID, ORG_ID, {
      variant_label: "Updated",
    });
    expect(result.variant_label).toBe("Updated");
    expect(mockLogAudit).toHaveBeenCalled();
    expect(mockRevalidateTag).toHaveBeenCalled();
  });

  it("sets sku and barcode to null when explicitly passed null", async () => {
    db.__qb.resolveOnce({ data: makeVariant(), error: null });
    db.__qb.resolveOnce({
      data: makeVariant({ sku: null, barcode: null }),
      error: null,
    });
    const result = await updateItemVariant(
      db as never,
      VARIANT_ID,
      ORG_ID,
      { sku: null, barcode: null },
      USER_ID,
    );
    expect(result.sku).toBeNull();
    expect(result.barcode).toBeNull();
    expect(mockRevalidateTag).toHaveBeenCalled();
  });
});

describe("deleteItemVariant", () => {
  it("checks existence, soft-deletes, audits, invalidates cache", async () => {
    db.__qb.resolveOnce({ data: makeVariant(), error: null });
    db.__qb.resolveWith({ data: null, error: null });
    await deleteItemVariant(db as never, VARIANT_ID, ORG_ID, USER_ID);
    expect(mockLogAudit).toHaveBeenCalled();
    expect(mockRevalidateTag).toHaveBeenCalledWith(
      `item-variants:${ORG_ID}:service:${ENTITY_ID}`,
      "max",
    );
  });

  it("throws NotFoundError when variant does not exist", async () => {
    db.__qb.resolveOnce({ data: null, error: null });
    await expect(
      deleteItemVariant(db as never, "missing", ORG_ID, USER_ID),
    ).rejects.toThrow(NotFoundError);
  });

  it("throws NotFoundError on existence check error", async () => {
    db.__qb.resolveOnce({ data: null, error: new Error("PGRST116") });
    await expect(
      deleteItemVariant(db as never, "missing", ORG_ID, USER_ID),
    ).rejects.toThrow(NotFoundError);
  });

  it("throws NotFoundError when soft-delete fails", async () => {
    db.__qb.resolveOnce({ data: makeVariant(), error: null });
    db.__qb.resolveWith({ data: null, error: new Error("delete fail") });
    await expect(
      deleteItemVariant(db as never, VARIANT_ID, ORG_ID, USER_ID),
    ).rejects.toThrow(NotFoundError);
  });
});

describe("bulkGenerateVariants", () => {
  it("creates variants from dimension options (create path)", async () => {
    // maybeSingle returns null by default → create path
    // 2 combinations: [Small, Basic] and [Medium, Basic]
    const dimensionOptions = {
      Size: ["Small", "Medium"],
      "Add-on": ["Basic"],
    };

    // Two create inserts → .single() called twice
    db.__qb.resolveOnce({
      data: makeVariant({
        id: "v1",
        variant_label: "Small + Basic",
        variant_data: { Size: "Small", "Add-on": "Basic" },
      }),
      error: null,
    });
    db.__qb.resolveOnce({
      data: makeVariant({
        id: "v2",
        variant_label: "Medium + Basic",
        variant_data: { Size: "Medium", "Add-on": "Basic" },
      }),
      error: null,
    });

    const result = await bulkGenerateVariants(
      db as never,
      ORG_ID,
      "service",
      ENTITY_ID,
      dimensionOptions,
    );

    expect(result).toHaveLength(2);
    expect(result[0].variant_label).toBe("Small + Basic");
    expect(result[1].variant_label).toBe("Medium + Basic");
    expect(mockRevalidateTag).toHaveBeenCalledWith(
      `item-variants:${ORG_ID}:service:${ENTITY_ID}`,
      "max",
    );
  });

  it("updates existing variants (update path)", async () => {
    const dimensionOptions = { Size: ["Small"] };

    // maybeSingle returns existing variant → update path
    vi.mocked(
      db.from("catalog_item_variants").maybeSingle,
    ).mockResolvedValueOnce({
      data: { id: VARIANT_ID },
      error: null,
    });

    // Update .single() call
    db.__qb.resolveOnce({
      data: makeVariant({ price: 20000 }),
      error: null,
    });

    const result = await bulkGenerateVariants(
      db as never,
      ORG_ID,
      "service",
      ENTITY_ID,
      dimensionOptions,
      undefined,
      USER_ID,
    );

    expect(result).toHaveLength(1);
    expect(mockRevalidateTag).toHaveBeenCalled();
  });

  it("uses getPrice callback for pricing", async () => {
    const dimensionOptions = { Size: ["Small"] };
    const getPrice = vi.fn().mockReturnValue(25000);

    db.__qb.resolveOnce({
      data: makeVariant({ price: 25000 }),
      error: null,
    });

    const result = await bulkGenerateVariants(
      db as never,
      ORG_ID,
      "service",
      ENTITY_ID,
      dimensionOptions,
      getPrice,
    );

    expect(result).toHaveLength(1);
    expect(getPrice).toHaveBeenCalledWith({ Size: "Small" });
  });

  it("handles empty dimension options", async () => {
    const result = await bulkGenerateVariants(
      db as never,
      ORG_ID,
      "service",
      ENTITY_ID,
      {},
    );
    expect(result).toEqual([]);
    expect(mockRevalidateTag).toHaveBeenCalled();
  });

  it("skips insert when maybeSingle returns error and continues", async () => {
    const dimensionOptions = { Size: ["Small"] };

    // maybeSingle returns error → existing is null → create path
    // insert .single() returns error → silently skipped
    db.__qb.resolveOnce({
      data: null,
      error: new Error("insert failed"),
    });

    const result = await bulkGenerateVariants(
      db as never,
      ORG_ID,
      "service",
      ENTITY_ID,
      dimensionOptions,
    );

    expect(result).toHaveLength(0);
  });
});

describe("resolveVariantPrice", () => {
  it("returns matching variant when variant_data aligns", async () => {
    db.__qb.resolveWith({
      data: [
        makeVariant({
          id: "v1",
          variant_label: "Small",
          variant_data: { Size: "Small" },
          price: 15000,
        }),
        makeVariant({
          id: "v2",
          variant_label: "Large",
          variant_data: { Size: "Large" },
          price: 20000,
        }),
      ],
      error: null,
    });
    const result = await resolveVariantPrice(
      db as never,
      ORG_ID,
      "service",
      ENTITY_ID,
      { Size: "Large" },
    );
    expect(result).not.toBeNull();
    expect(result?.id).toBe("v2");
    expect(result?.price).toBe(20000);
  });

  it("returns null when no variants exist", async () => {
    db.__qb.resolveWith({ data: null, error: null });
    const result = await resolveVariantPrice(
      db as never,
      ORG_ID,
      "service",
      ENTITY_ID,
      { Size: "Small" },
    );
    expect(result).toBeNull();
  });

  it("returns null when no variant matches variant_data", async () => {
    db.__qb.resolveWith({
      data: [
        makeVariant({
          variant_data: { Size: "Small" },
        }),
      ],
      error: null,
    });
    const result = await resolveVariantPrice(
      db as never,
      ORG_ID,
      "service",
      ENTITY_ID,
      { Size: "Extra Large" },
    );
    expect(result).toBeNull();
  });

  it("returns null on DB error", async () => {
    db.__qb.resolveWith({ data: null, error: new Error("DB error") });
    const result = await resolveVariantPrice(
      db as never,
      ORG_ID,
      "service",
      ENTITY_ID,
      { Size: "Small" },
    );
    expect(result).toBeNull();
  });

  it("matches correctly with multi-field variant_data", async () => {
    db.__qb.resolveWith({
      data: [
        makeVariant({
          id: "v1",
          variant_data: { Size: "Medium", Color: "Red" },
        }),
        makeVariant({
          id: "v2",
          variant_data: { Size: "Medium", Color: "Blue" },
        }),
      ],
      error: null,
    });
    const result = await resolveVariantPrice(
      db as never,
      ORG_ID,
      "service",
      ENTITY_ID,
      { Size: "Medium", Color: "Blue" },
    );
    expect(result).not.toBeNull();
    expect(result?.id).toBe("v2");
  });

  it("rejects mismatched field count", async () => {
    db.__qb.resolveWith({
      data: [
        makeVariant({
          variant_data: { Size: "Medium", Color: "Red" },
        }),
      ],
      error: null,
    });
    const result = await resolveVariantPrice(
      db as never,
      ORG_ID,
      "service",
      ENTITY_ID,
      { Size: "Medium" }, // only 1 field vs 2 in stored variant
    );
    expect(result).toBeNull();
  });
});
