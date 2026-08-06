import assert from "node:assert/strict";
import test, { mock } from "node:test";
import { mockMod } from "./actions-helpers";

// ─── Standard boilerplate mocks ──────────────────────────────────────
const captureMock = mock.fn(() => {});
mockMod("@zuiio/capture", { capture: captureMock });

const revalidateEntitiesMock = mock.fn(() => {});
mockMod("@/lib/revalidate", { revalidateEntities: revalidateEntitiesMock });

mockMod("@/lib/constants", {
  PRESET_CATEGORIES: { other: ["Cat1", "Cat2"] },
});

const redirectMock = mock.fn(() => {
  throw new Error("REDIRECT");
});
mockMod("next/navigation", { redirect: redirectMock });

mockMod("next/server", { after: (fn: () => unknown) => fn() });
mockMod("next/cache", {
  revalidatePath: mock.fn(() => {}),
  revalidateTag: mock.fn(() => {}),
});
mockMod("server-only", {});

// ─── Chain mock builder ──────────────────────────────────────────────
//
// Supabase query chains are thenable: every intermediate link can be
// awaited directly (e.g. `await .update().eq(...)`) OR terminal methods
// like `.single()` / `.maybeSingle()` resolve the same way.
//
// `makeChain` builds a link where every chain method returns a fresh
// link, `.single()` / `.maybeSingle()` resolve to the configured result,
// and the link itself is thenable via `.then()`.
//
// `makeFromRouter` creates a `from()` mock that routes each table+call
// to a pre-configured result, tracking call order per table.

const insertLog: Record<string, unknown[]> = {};

function makeChain(
  result: { data: unknown; error: unknown },
  tableName?: string,
) {
  const makeLink = (): Record<string, unknown> => {
    const link: Record<string, unknown> = {};
    // Thenable — `await link` resolves to result
    // biome-ignore lint/suspicious/noThenProperty: Supabase query builders are intentionally thenable in this test mock.
    link.then = (
      resolve: (value: unknown) => void,
      reject: (reason?: unknown) => void,
    ) => Promise.resolve(result).then(resolve, reject);
    // Chain methods → fresh link (preserving result)
    for (const m of [
      "select",
      "update",
      "eq",
      "neq",
      "in",
      "is",
      "not",
      "order",
      "limit",
      "range",
    ]) {
      link[m] = mock.fn(() => makeLink());
    }
    // Insert tracks calls for assertions (flatten arrays for bulk inserts)
    link.insert = mock.fn((data: unknown) => {
      if (tableName) {
        if (!insertLog[tableName]) insertLog[tableName] = [];
        if (Array.isArray(data)) {
          insertLog[tableName].push(...data);
        } else {
          insertLog[tableName].push(data);
        }
      }
      return makeLink();
    });
    // Terminal methods
    link.single = mock.fn(async () => result);
    link.maybeSingle = mock.fn(async () => result);
    return link;
  };
  return makeLink();
}

function makeFromRouter(
  routes: Record<string, Array<{ data: unknown; error: unknown }>>,
) {
  const callCounts: Record<string, number> = {};
  return mock.fn((table: string) => {
    if (!(table in callCounts)) callCounts[table] = 0;
    const idx = callCounts[table]++;
    const r = routes[table];
    if (r && idx < r.length) return makeChain(r[idx], table);
    return makeChain({ data: null, error: null }, table);
  });
}

// ─── Configurable mock state ─────────────────────────────────────────

const USER_ID = "user-1";
const ORG_ID = "org-1";

interface GetUserResult {
  data: { user: { id: string } | null };
  error: unknown;
}
let currentGetUserResult: GetUserResult = {
  data: { user: { id: USER_ID } },
  error: null,
};
let currentClientRoutes: Record<
  string,
  Array<{ data: unknown; error: unknown }>
> = {};
let serviceClientQueue: Array<() => Record<string, unknown>> = [];

// ─── Client mocks ────────────────────────────────────────────────────

const createClientMock = mock.fn(async () => ({
  auth: {
    getUser: mock.fn(async () => currentGetUserResult),
  },
  from: makeFromRouter(currentClientRoutes),
}));

const createServiceClientMock = mock.fn(() => {
  const factory = serviceClientQueue.shift();
  if (!factory) throw new Error("createServiceClient called with empty queue");
  return factory();
});

mockMod("@/lib/supabase/server", { createClient: createClientMock });
mockMod("@/lib/supabase/server-service", {
  createServiceClient: createServiceClientMock,
});

// ─── Action under test ───────────────────────────────────────────────

let completeOnboarding: (
  enabledFeatures: string[],
  brandNamesToImport?: string[],
  hasSuppliers?: boolean,
  hasInventory?: boolean,
  hasCustomerCredit?: boolean,
  hasMultiBranch?: boolean,
  hasVariants?: boolean,
  hasBrands?: boolean,
  hasCategories?: boolean,
  hasEmailReports?: boolean,
  hasAuditLog?: boolean,
  hasCheckoutCustomer?: boolean,
) => Promise<{ error?: string }>;

// Dynamic import required: mock.module() must register before the action module loads
test.before(async () => {
  const mod = await import("@/app/(onboarding)/onboarding/actions");
  completeOnboarding = mod.completeOnboarding;
});

// ─── Helpers ─────────────────────────────────────────────────────────

function resetAll() {
  captureMock.mock.resetCalls();
  revalidateEntitiesMock.mock.resetCalls();
  redirectMock.mock.resetCalls();
  createClientMock.mock.resetCalls();
  createServiceClientMock.mock.resetCalls();
  for (const key of Object.keys(insertLog)) delete insertLog[key];
  serviceClientQueue = [];
  currentGetUserResult = { data: { user: { id: USER_ID } }, error: null };
  currentClientRoutes = {};
}

async function expectRedirect(fn: () => Promise<unknown>): Promise<void> {
  try {
    await fn();
    assert.fail("expected REDIRECT");
  } catch (e: unknown) {
    if ((e as Error).message !== "REDIRECT") throw e;
  }
}

// ─── Tests ───────────────────────────────────────────────────────────

test("rejects when no user", async () => {
  resetAll();
  currentGetUserResult = { data: { user: null }, error: null };

  const result = await completeOnboarding(["feat1"]);
  assert.deepStrictEqual(result, { error: "Нэвтрэх шаардлагатай." });
});

test("rejects when profile fetch fails", async () => {
  resetAll();
  currentClientRoutes = {
    profiles: [{ data: null, error: { message: "DB connection lost" } }],
  };

  const result = await completeOnboarding(["feat1"]);
  assert.deepStrictEqual(result, {
    error: "Профайл авахад алдаа гарлаа.",
  });
  assert.strictEqual(captureMock.mock.callCount(), 1);
});

test("rejects when no organization_id", async () => {
  resetAll();
  currentClientRoutes = {
    profiles: [{ data: { organization_id: null }, error: null }],
  };

  const result = await completeOnboarding(["feat1"]);
  assert.deepStrictEqual(result, { error: "Байгууллага олдсонгүй." });
});

test("rejects when org update fails", async () => {
  resetAll();
  currentClientRoutes = {
    profiles: [{ data: { organization_id: ORG_ID }, error: null }],
    organizations: [{ data: null, error: { message: "Permission denied" } }],
  };

  const result = await completeOnboarding(["feat1"]);
  assert.ok(result.error);
  assert.ok(result.error.includes("Permission denied"));
  assert.strictEqual(captureMock.mock.callCount(), 1);
});

test("completes minimal path without brands or categories", async () => {
  resetAll();
  currentClientRoutes = {
    profiles: [{ data: { organization_id: ORG_ID }, error: null }],
    organizations: [
      { data: null, error: null }, // main update
      { data: null, error: null }, // POS update
    ],
  };

  await expectRedirect(() =>
    completeOnboarding(
      ["feat1"],
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      false, // hasCategories = false
    ),
  );
  assert.strictEqual(revalidateEntitiesMock.mock.callCount(), 1);
  assert.deepStrictEqual(revalidateEntitiesMock.mock.calls[0].arguments[0], [
    "settings",
    "products",
    "categories",
  ]);
  assert.strictEqual(createServiceClientMock.mock.callCount(), 0);
});

test("completes with brand import", async () => {
  resetAll();
  currentClientRoutes = {
    profiles: [{ data: { organization_id: ORG_ID }, error: null }],
    organizations: [
      { data: null, error: null },
      { data: null, error: null },
    ],
  };

  const preset = {
    id: "preset-1",
    brand_name: "Nike",
    brand_logo_url: "https://logo.png",
    product_name: "Air Max",
    product_sku: "NIKE-001",
    category_name: "Shoes",
    unit: "ш",
    cost_price: 100,
    sale_price: 200,
    min_stock: 5,
  };

  serviceClientQueue = [
    () => ({
      from: makeFromRouter({
        product_presets: [{ data: [preset], error: null }],
        brands: [
          { data: null, error: null }, // maybeSingle: not found
          { data: { id: "brand-1" }, error: null }, // insert.select.single
        ],
        categories: [
          { data: null, error: null }, // maybeSingle: not found
          { data: { id: "cat-1" }, error: null }, // insert.select.single
        ],
        products: [
          { data: null, error: null }, // maybeSingle: no SKU duplicate
          { data: null, error: null }, // insert
        ],
      }),
    }),
  ];

  await expectRedirect(() =>
    completeOnboarding(
      ["feat1"],
      ["Nike"],
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      false, // hasCategories = false to isolate brand import
    ),
  );
  assert.strictEqual(createServiceClientMock.mock.callCount(), 1);
  assert.strictEqual(revalidateEntitiesMock.mock.callCount(), 1);
});

test("captures POS update error but continues", async () => {
  resetAll();
  currentClientRoutes = {
    profiles: [{ data: { organization_id: ORG_ID }, error: null }],
    organizations: [
      { data: null, error: null }, // main update: OK
      {
        data: null,
        error: { message: "column has_checkout_customer does not exist" },
      }, // POS update: error
    ],
  };

  await expectRedirect(() =>
    completeOnboarding(
      ["feat1"],
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      false, // skip categories so we don't need service client
    ),
  );
  // POS error captured exactly once
  assert.strictEqual(captureMock.mock.callCount(), 1);
  assert.deepStrictEqual(captureMock.mock.calls[0].arguments[1], {
    context: "onboarding: pos checkout setting",
  });
  // Still completes (revalidate + redirect)
  assert.strictEqual(revalidateEntitiesMock.mock.callCount(), 1);
});

test("seeds preset categories when hasCategories is true", async () => {
  resetAll();
  currentClientRoutes = {
    profiles: [{ data: { organization_id: ORG_ID }, error: null }],
    organizations: [
      { data: null, error: null },
      { data: null, error: null },
    ],
  };

  serviceClientQueue = [
    () => ({
      from: makeFromRouter({
        organizations: [{ data: { company_type: "other" }, error: null }],
        categories: [
          { data: [], error: null }, // no existing → seed all
          { data: null, error: null }, // insert result
        ],
      }),
    }),
  ];

  await expectRedirect(() =>
    completeOnboarding(
      ["feat1"],
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      true, // hasCategories = true
    ),
  );
  assert.strictEqual(createServiceClientMock.mock.callCount(), 1);
  assert.deepStrictEqual(insertLog.categories, [
    { name: "Cat1", organization_id: ORG_ID, slug: "" },
    { name: "Cat2", organization_id: ORG_ID, slug: "" },
  ]);
});

test("skips category seeding when hasCategories is false", async () => {
  resetAll();
  currentClientRoutes = {
    profiles: [{ data: { organization_id: ORG_ID }, error: null }],
    organizations: [
      { data: null, error: null },
      { data: null, error: null },
    ],
  };

  await expectRedirect(() =>
    completeOnboarding(
      ["feat1"],
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      false, // hasCategories = false
    ),
  );
  assert.strictEqual(createServiceClientMock.mock.callCount(), 0);
  assert.strictEqual(insertLog.categories, undefined);
});

test("preserves existing categories during seeding", async () => {
  resetAll();
  currentClientRoutes = {
    profiles: [{ data: { organization_id: ORG_ID }, error: null }],
    organizations: [
      { data: null, error: null },
      { data: null, error: null },
    ],
  };

  serviceClientQueue = [
    () => ({
      from: makeFromRouter({
        organizations: [{ data: { company_type: "other" }, error: null }],
        categories: [
          { data: [{ name: "Cat1" }], error: null }, // Cat1 exists
          { data: null, error: null }, // insert result
        ],
      }),
    }),
  ];

  await expectRedirect(() =>
    completeOnboarding(
      ["feat1"],
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      true,
    ),
  );
  // Only Cat2 inserted — Cat1 already existed
  assert.deepStrictEqual(insertLog.categories, [
    { name: "Cat2", organization_id: ORG_ID, slug: "" },
  ]);
});
