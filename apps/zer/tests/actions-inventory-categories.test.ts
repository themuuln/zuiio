/**
 * Tests for `inventory/categories/actions.ts` — CRUD + seedPresetCategories.
 *
 * Run: npx tsx --test --experimental-test-module-mocks tests/actions-inventory-categories.test.ts
 */

import assert from "node:assert/strict";
import test, { mock } from "node:test";

import {
  createMockSupabase,
  formData,
  mockActionCtx,
  mockMod,
  resolved,
} from "./actions-helpers";

// ─── Global mocks ────────────────────────────────────────────────────

const revalidateEntityMock = mock.fn(() => {});
let mockCtx: Record<string, unknown> = mockActionCtx();

mockMod("@zuiio/capture", {
  capture: mock.fn(() => {}),
});

mockMod("@/lib/action-utils", {
  requireActionContext: mock.fn(async () => mockCtx),
  requireWriteAction: mock.fn(async () => mockCtx),
});

mockMod("@/lib/constants", {
  PRESET_CATEGORIES: {
    retail: ["Хүнс", "Ундаа", "Хувцас"],
    other: ["Бусад"],
  },
});

mockMod("@/lib/revalidate", {
  revalidateEntities: mock.fn(() => {}),
  revalidateEntity: revalidateEntityMock,
  revalidateEntityTag: mock.fn(() => {}),
});

mockMod("@/lib/audit", {
  logAuditEventWithClient: mock.fn(async () => {}),
});

mockMod("next/server", {
  after: (fn: () => void) => fn(),
});

mockMod("next/cache", {
  revalidatePath: mock.fn(() => {}),
  revalidateTag: mock.fn(() => {}),
});

mockMod("server-only", {});

// ─── Lazy-loaded module ──────────────────────────────────────────────

let createCategory: (
  prev: undefined,
  fd: FormData,
) => Promise<Record<string, unknown>>;
let updateCategory: (
  prev: undefined,
  fd: FormData,
) => Promise<Record<string, unknown>>;
let deleteCategory: (
  prev: undefined,
  fd: FormData,
) => Promise<Record<string, unknown>>;
let seedPresetCategories: () => Promise<{
  seeded?: number;
  error?: string;
}>;

test.before(async () => {
  const mod = await import("@/app/(dashboard)/inventory/categories/actions");
  createCategory = mod.createCategory;
  updateCategory = mod.updateCategory;
  deleteCategory = mod.deleteCategory;
  seedPresetCategories = mod.seedPresetCategories;
});

function resetRevalidateMock() {
  revalidateEntityMock.mock.resetCalls();
}

// ─── Helpers ─────────────────────────────────────────────────────────

/**
 * Build a mock chainable query that resolves to `result`.
 * Produces: .select → .eq → .eq → .maybeSingle (for create/update duplicate checks)
 */
function mockDuplicateCheckChain(result: unknown) {
  return {
    select: mock.fn(() => ({
      eq: mock.fn(() => ({
        eq: mock.fn(() => ({
          maybeSingle: mock.fn(() => resolved(result, null)),
        })),
      })),
    })),
  };
}

/**
 * Build a mock chainable query for updateCategory's duplicate check:
 * .select → .eq → .eq → .neq → .maybeSingle
 */
function mockUpdateDuplicateCheckChain(result: unknown) {
  return {
    select: mock.fn(() => ({
      eq: mock.fn(() => ({
        eq: mock.fn(() => ({
          neq: mock.fn(() => ({
            maybeSingle: mock.fn(() => resolved(result, null)),
          })),
        })),
      })),
    })),
  };
}

/**
 * Build a mock chainable query for deleteCategory's product check:
 * .select → .eq → .eq (resolves to product list)
 */
function mockProductCheckChain(products: unknown[]) {
  return {
    select: mock.fn(() => ({
      eq: mock.fn(() => ({
        eq: mock.fn(() => resolved(products, null)),
      })),
    })),
  };
}

/**
 * Build a mock chainable query for a two-.eq delete:
 * .delete → .eq → .eq (resolves to result)
 */
function mockDeleteChain(result: unknown, error: unknown = null) {
  return {
    delete: mock.fn(() => ({
      eq: mock.fn(() => ({
        eq: mock.fn(() => resolved(result, error)),
      })),
    })),
  };
}

/**
 * Build a mock chainable query for a two-.eq update:
 * .update → .eq → .eq (resolves to result)
 */
function mockUpdateChain(result: unknown, error: unknown = null) {
  return {
    update: mock.fn(() => ({
      eq: mock.fn(() => ({
        eq: mock.fn(() => resolved(result, error)),
      })),
    })),
  };
}

// ─── Tests: createCategory ───────────────────────────────────────────

test("createCategory rejects missing name", async () => {
  mockCtx = mockActionCtx();
  const fd = formData({});
  const result = await createCategory(undefined, fd);
  assert.ok(result && "error" in result, "should return error");
  assert.ok(String(result.error).includes("нэр"), "error should mention name");
});

test("createCategory rejects validation failure", async () => {
  mockCtx = mockActionCtx();
  const fd = formData({ name: "   " });
  const result = await createCategory(undefined, fd);
  assert.ok(result && "error" in result, "should return error");
  assert.equal(
    result.error,
    "Ангиллын нэр шаардлагатай.",
    "should match validation message",
  );
});

test("createCategory rejects duplicate name", async () => {
  const supabase = createMockSupabase({
    categories: mockDuplicateCheckChain({ id: "existing-cat" }),
  });
  mockCtx = mockActionCtx({ supabase });

  const fd = formData({ name: "Хоол" });
  const result = await createCategory(undefined, fd);
  assert.ok(result && "error" in result, "should return error");
  assert.ok(
    String(result.error).includes("бүртгэгдсэн"),
    "error should mention duplicate",
  );
});

test("createCategory inserts with organization_id and name when no duplicate", async () => {
  const insertFn = mock.fn(() => resolved(null, null));
  const supabase = createMockSupabase({
    categories: {
      ...mockDuplicateCheckChain(null),
      insert: insertFn,
    },
  });
  mockCtx = mockActionCtx({ supabase, organizationId: "org-42" });

  const fd = formData({ name: "Хоол" });
  const result = await createCategory(undefined, fd);

  assert.equal(insertFn.mock.calls.length, 1, "should call insert once");
  const insertArg = insertFn.mock.calls[0].arguments[0];
  assert.equal(insertArg.organization_id, "org-42");
  assert.equal(insertArg.name, "Хоол");
  assert.equal(result && "success" in result, true, "should return success");
});

test("createCategory handles insert error", async () => {
  const supabase = createMockSupabase({
    categories: {
      ...mockDuplicateCheckChain(null),
      insert: mock.fn(() => resolved(null, { message: "insert failed" })),
    },
  });
  mockCtx = mockActionCtx({ supabase });

  const fd = formData({ name: "Шинэ ангилал" });
  const result = await createCategory(undefined, fd);
  assert.ok(result && "error" in result, "should return error");
  assert.equal(result.error, "insert failed");
});

test("createCategory calls revalidateEntity on success", async () => {
  resetRevalidateMock();
  const supabase = createMockSupabase({
    categories: {
      ...mockDuplicateCheckChain(null),
      insert: mock.fn(() => resolved(null, null)),
    },
  });
  mockCtx = mockActionCtx({ supabase });

  const fd = formData({ name: "Шинэ ангилал" });
  await createCategory(undefined, fd);

  assert.equal(
    revalidateEntityMock.mock.calls.length,
    1,
    "should call revalidateEntity once",
  );
  assert.equal(revalidateEntityMock.mock.calls[0].arguments[0], "categories");
});

test("createCategory returns { success: true as const }", async () => {
  const supabase = createMockSupabase({
    categories: {
      ...mockDuplicateCheckChain(null),
      insert: mock.fn(() => resolved(null, null)),
    },
  });
  mockCtx = mockActionCtx({ supabase });

  const fd = formData({ name: "Шинэ ангилал" });
  const result = await createCategory(undefined, fd);
  assert.deepEqual(result, { success: true });
});

// ─── Tests: updateCategory ───────────────────────────────────────────

test("updateCategory rejects missing id", async () => {
  mockCtx = mockActionCtx();
  const fd = formData({ name: "Шинэ нэр" });
  const result = await updateCategory(undefined, fd);
  assert.ok(result && "error" in result, "should return error");
  assert.ok(String(result.error).includes("ID"), "error should mention ID");
});
test("updateCategory calls supabase.update with correct fields", async () => {
  // Track eq calls directly since Node mock API lacks .results
  const eqCalls: string[][] = [];
  const makeEqChain = (finalResult: unknown, finalError: unknown = null) => {
    const eq2 = mock.fn((...args: unknown[]) => {
      eqCalls.push(args as string[]);
      return resolved(finalResult, finalError);
    });
    const eq1 = mock.fn((...args: unknown[]) => {
      eqCalls.push(args as string[]);
      return { eq: eq2 };
    });
    return { eq: eq1 };
  };

  const selectChain = mockUpdateDuplicateCheckChain(null);
  const eqChainForUpdate = makeEqChain(null);
  const updateFn = mock.fn(() => eqChainForUpdate);

  const supabase = {
    from: mock.fn((table: string) => {
      if (table === "categories") {
        // Action calls from() twice: select for dup check, then update
        // We return selectChain first time, categoriesUpdateChain second
        if (supabase.from.mock.calls.length === 0) return selectChain;
        return { update: updateFn };
      }
      return {};
    }),
    rpc: mock.fn(() => resolved({}, null)),
  };
  mockCtx = mockActionCtx({ supabase, organizationId: "org-42" });

  const fd = formData({ id: "cat-1", name: "Шинэ нэр" });
  const result = await updateCategory(undefined, fd);

  assert.equal(updateFn.mock.calls.length, 1, "should call update once");
  const updateArg = updateFn.mock.calls[0].arguments[0];
  assert.equal(updateArg.name, "Шинэ нэр");

  // Verify eq chains: first .eq("id", id), then .eq("organization_id", orgId)
  assert.equal(eqCalls.length, 2, "should call eq twice");
  assert.deepEqual(eqCalls[0], ["id", "cat-1"]);
  assert.deepEqual(eqCalls[1], ["organization_id", "org-42"]);

  assert.equal(result && "success" in result, true, "should return success");
});

test("updateCategory handles DB error", async () => {
  const supabase = createMockSupabase({
    categories: {
      ...mockUpdateDuplicateCheckChain(null),
      ...mockUpdateChain(null, { message: "update failed" }),
    },
  });
  mockCtx = mockActionCtx({ supabase });

  const fd = formData({ id: "cat-1", name: "Шинэ нэр" });
  const result = await updateCategory(undefined, fd);
  assert.ok(result && "error" in result, "should return error");
  assert.equal(result.error, "update failed");
});

test("updateCategory calls revalidateEntity on success", async () => {
  resetRevalidateMock();
  const supabase = createMockSupabase({
    categories: {
      ...mockUpdateDuplicateCheckChain(null),
      ...mockUpdateChain(null),
    },
  });
  mockCtx = mockActionCtx({ supabase });

  const fd = formData({ id: "cat-1", name: "Шинэ нэр" });
  await updateCategory(undefined, fd);

  assert.equal(
    revalidateEntityMock.mock.calls.length,
    1,
    "should call revalidateEntity once",
  );
  assert.equal(revalidateEntityMock.mock.calls[0].arguments[0], "categories");
});

// ─── Tests: deleteCategory ───────────────────────────────────────────

test("deleteCategory rejects missing id", async () => {
  mockCtx = mockActionCtx();
  const fd = formData({});
  const result = await deleteCategory(undefined, fd);
  assert.ok(result && "error" in result, "should return error");
  assert.ok(String(result.error).includes("ID"), "error should mention ID");
});

test("deleteCategory rejects when products reference the category", async () => {
  const supabase = createMockSupabase({
    products: mockProductCheckChain([{ id: "p1" }, { id: "p2" }]),
  });
  mockCtx = mockActionCtx({ supabase });

  const fd = formData({ id: "cat-1" });
  const result = await deleteCategory(undefined, fd);
  assert.ok(result && "error" in result, "should return error");
  assert.ok(
    String(result.error).includes("2"),
    "error should mention product count",
  );
  assert.ok(
    String(result.error).includes("устгах"),
    "error should mention cannot delete",
  );
});

test("deleteCategory calls supabase.delete with correct eq filters", async () => {
  // Track eq calls directly since Node mock API lacks .results
  const eqCalls: string[][] = [];
  const eq2 = mock.fn((...args: unknown[]) => {
    eqCalls.push(args as string[]);
    return resolved(null, null);
  });
  const eq1 = mock.fn((...args: unknown[]) => {
    eqCalls.push(args as string[]);
    return { eq: eq2 };
  });
  const deleteFn = mock.fn(() => ({ eq: eq1 }));

  const supabase = {
    from: mock.fn((table: string) => {
      if (table === "categories") return { delete: deleteFn };
      return mockProductCheckChain([]);
    }),
    rpc: mock.fn(() => resolved({}, null)),
  };
  mockCtx = mockActionCtx({ supabase, organizationId: "org-42" });

  const fd = formData({ id: "cat-1" });
  await deleteCategory(undefined, fd);

  assert.equal(deleteFn.mock.calls.length, 1, "should call delete once");

  // Verify eq chains: first .eq("id", id), then .eq("organization_id", orgId)
  assert.equal(eqCalls.length, 2, "should call eq twice");
  assert.deepEqual(eqCalls[0], ["id", "cat-1"]);
  assert.deepEqual(eqCalls[1], ["organization_id", "org-42"]);
});

test("deleteCategory handles DB error", async () => {
  const supabase = createMockSupabase({
    products: mockProductCheckChain([]),
    categories: mockDeleteChain(null, { message: "delete failed" }),
  });
  mockCtx = mockActionCtx({ supabase });

  const fd = formData({ id: "cat-1" });
  const result = await deleteCategory(undefined, fd);
  assert.ok(result && "error" in result, "should return error");
  assert.equal(result.error, "delete failed");
});

test("deleteCategory calls revalidateEntity on success", async () => {
  resetRevalidateMock();
  const supabase = createMockSupabase({
    products: mockProductCheckChain([]),
    categories: mockDeleteChain(null),
  });
  mockCtx = mockActionCtx({ supabase });

  const fd = formData({ id: "cat-1" });
  await deleteCategory(undefined, fd);

  assert.equal(
    revalidateEntityMock.mock.calls.length,
    1,
    "should call revalidateEntity once",
  );
  assert.equal(revalidateEntityMock.mock.calls[0].arguments[0], "categories");
});

// ─── Tests: seedPresetCategories ─────────────────────────────────────

test("seedPresetCategories reads PRESET_CATEGORIES and inserts all for retail", async () => {
  resetRevalidateMock();
  const supabase = createMockSupabase({
    organizations: {
      select: mock.fn(() => ({
        eq: mock.fn(() => ({
          single: mock.fn(() => resolved({ company_type: "retail" })),
        })),
      })),
    },
    categories: {
      select: mock.fn(() => ({
        eq: mock.fn(() => resolved([], null)),
      })),
    },
  });
  mockCtx = mockActionCtx({ supabase });

  const result = await seedPresetCategories();
  assert.equal(result.seeded, 3);
});

test("seedPresetCategories skips existing categories", async () => {
  const supabase = createMockSupabase({
    organizations: {
      select: mock.fn(() => ({
        eq: mock.fn(() => ({
          single: mock.fn(() => resolved({ company_type: "retail" })),
        })),
      })),
    },
    categories: {
      select: mock.fn(() => ({
        eq: mock.fn(() =>
          resolved([{ name: "Хүнс" }, { name: "Ундаа" }], null),
        ),
      })),
    },
  });
  mockCtx = mockActionCtx({ supabase });

  const result = await seedPresetCategories();
  assert.equal(result.seeded, 1);
});

test("seedPresetCategories returns seeded: 0 when all exist", async () => {
  const supabase = createMockSupabase({
    organizations: {
      select: mock.fn(() => ({
        eq: mock.fn(() => ({
          single: mock.fn(() => resolved({ company_type: "retail" })),
        })),
      })),
    },
    categories: {
      select: mock.fn(() => ({
        eq: mock.fn(() =>
          resolved(
            [{ name: "Хүнс" }, { name: "Ундаа" }, { name: "Хувцас" }],
            null,
          ),
        ),
      })),
    },
  });
  mockCtx = mockActionCtx({ supabase });

  const result = await seedPresetCategories();
  assert.equal(result.seeded, 0);
});

test("seedPresetCategories only inserts non-existing categories", async () => {
  const insertFn = mock.fn(() => resolved(null, null));
  const supabase = createMockSupabase({
    organizations: {
      select: mock.fn(() => ({
        eq: mock.fn(() => ({
          single: mock.fn(() => resolved({ company_type: "retail" })),
        })),
      })),
    },
    categories: {
      select: mock.fn(() => ({
        eq: mock.fn(() => resolved([{ name: "Хүнс" }], null)),
      })),
      insert: insertFn,
    },
  });
  mockCtx = mockActionCtx({ supabase, organizationId: "org-42" });

  await seedPresetCategories();

  assert.equal(insertFn.mock.calls.length, 1, "should call insert once");
  const insertArg = insertFn.mock.calls[0].arguments[0];
  assert.equal(insertArg.length, 2, "should insert 2 new categories");

  const names = insertArg.map((c: { name: string }) => c.name);
  assert.ok(!names.includes("Хүнс"), "should not insert existing name");
  assert.ok(names.includes("Хувцас"), "should insert new name");

  for (const cat of insertArg) {
    assert.equal(cat.organization_id, "org-42");
    assert.equal(cat.slug, "");
  }
});

test("seedPresetCategories returns error on insert failure", async () => {
  const supabase = createMockSupabase({
    organizations: {
      select: mock.fn(() => ({
        eq: mock.fn(() => ({
          single: mock.fn(() => resolved({ company_type: "retail" })),
        })),
      })),
    },
    categories: {
      select: mock.fn(() => ({
        eq: mock.fn(() => resolved([], null)),
      })),
      insert: mock.fn(() => resolved(null, { message: "insert failed" })),
    },
  });
  mockCtx = mockActionCtx({ supabase });

  const result = await seedPresetCategories();
  assert.ok(result.error, "should return error");
  assert.equal(result.error, "insert failed");
});

test("seedPresetCategories falls back to 'other' for unknown company type", async () => {
  const supabase = createMockSupabase({
    organizations: {
      select: mock.fn(() => ({
        eq: mock.fn(() => ({
          single: mock.fn(() => resolved({ company_type: "unknown_type" })),
        })),
      })),
    },
    categories: {
      select: mock.fn(() => ({
        eq: mock.fn(() => resolved([], null)),
      })),
    },
  });
  mockCtx = mockActionCtx({ supabase });

  const result = await seedPresetCategories();
  assert.equal(result.seeded, 1);
});
