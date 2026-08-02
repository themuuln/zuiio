/**
 * Tests for `promotions/actions.ts` — createPromotion, togglePromotionActive, deletePromotion, evaluateCartPromotions.
 */

import assert from "node:assert/strict";
import test, { mock } from "node:test";
import { formData, mockActionCtx, mockMod } from "./actions-helpers";

// ─── resolve helper (inline to avoid esbuild depth issues) ──────────
function resolved<T>(data: T, error: unknown = null) {
  return Promise.resolve({ data, error });
}

// ─── Supabase chain builders ────────────────────────────────────────

/** Build a supabase mock for createPromotion with controllable inserts */
function makeCreatePromotionSupabase(
  opts: {
    promotionId?: string;
    promoInsertError?: { message: string } | null;
    conditionInsertError?: { message: string } | null;
    rewardInsertError?: { message: string } | null;
  } = {},
) {
  const {
    promotionId = "new-promo-id",
    promoInsertError = null,
    conditionInsertError = null,
    rewardInsertError = null,
  } = opts;

  const promotionsTable = {
    insert: mock.fn(() => ({
      select: mock.fn(() => ({
        single: mock.fn(() => resolved({ id: promotionId }, promoInsertError)),
      })),
    })),
  };

  const promotionConditionsTable = {
    insert: mock.fn(() => resolved(null, conditionInsertError)),
  };

  const promotionRewardsTable = {
    insert: mock.fn(() => resolved(null, rewardInsertError)),
  };

  return {
    from: mock.fn((table: string) => {
      if (table === "promotions") return promotionsTable;
      if (table === "promotion_conditions") return promotionConditionsTable;
      if (table === "promotion_rewards") return promotionRewardsTable;
      return {};
    }),
  };
}

/** Build a supabase mock for togglePromotionActive */
function makeTogglePromotionSupabase(
  opts: {
    promotion?: { name: string } | null;
    fetchError?: { message: string } | null;
    updateError?: { message: string } | null;
  } = {},
) {
  const {
    promotion = { name: "Summer Promo" },
    fetchError = null,
    updateError = null,
  } = opts;

  const promotionsTable = {
    select: mock.fn(() => ({
      eq: mock.fn((_col: string, _val: unknown) => ({
        eq: mock.fn((_col2: string, _val2: unknown) => ({
          single: mock.fn(() => resolved(promotion, fetchError)),
        })),
      })),
    })),
    update: mock.fn(() => ({
      eq: mock.fn((_col: string, _val: unknown) => ({
        eq: mock.fn((_col2: string, _val2: unknown) =>
          resolved(null, updateError),
        ),
      })),
    })),
  };

  return {
    from: mock.fn((table: string) => {
      if (table === "promotions") return promotionsTable;
      return {};
    }),
  };
}

/** Build a supabase mock for deletePromotion */
function makeDeletePromotionSupabase(
  opts: {
    promotion?: { name: string } | null;
    fetchError?: { message: string } | null;
    deleteError?: { message: string } | null;
  } = {},
) {
  const {
    promotion = { name: "Summer Promo" },
    fetchError = null,
    deleteError = null,
  } = opts;

  const promotionsTable = {
    select: mock.fn(() => ({
      eq: mock.fn((_col: string, _val: unknown) => ({
        eq: mock.fn((_col2: string, _val2: unknown) => ({
          single: mock.fn(() => resolved(promotion, fetchError)),
        })),
      })),
    })),
    delete: mock.fn(() => ({
      eq: mock.fn((_col: string, _val: unknown) => ({
        eq: mock.fn((_col2: string, _val2: unknown) =>
          resolved(null, deleteError),
        ),
      })),
    })),
  };

  return {
    from: mock.fn((table: string) => {
      if (table === "promotions") return promotionsTable;
      return {};
    }),
  };
}

/** Build a supabase mock for evaluateCartPromotions with controllable RPC result */
function makeEvaluatePromotionsSupabase(
  opts: { rpcResult?: unknown; rpcError?: { message: string } | null } = {},
) {
  const { rpcResult = null, rpcError = null } = opts;

  return {
    from: mock.fn(() => ({})),
    rpc: mock.fn((_fn: string, _args: unknown) =>
      resolved(rpcResult, rpcError),
    ),
  };
}

// ─── Global mocks ───────────────────────────────────────────────────
const captureMock = mock.fn(() => {});
const withDbCaptureMock = mock.fn(
  async (_name: string, query: Promise<unknown>) => {
    return await query;
  },
);
mockMod("@zuiio/capture", {
  capture: captureMock,
  withDbCapture: withDbCaptureMock,
});

const revalidateEntitiesMock = mock.fn(() => {});
mockMod("@/lib/revalidate", {
  revalidateEntities: revalidateEntitiesMock,
  revalidateEntity: mock.fn(() => {}),
  revalidateEntityTag: mock.fn(() => {}),
});

mockMod("@/lib/audit", {
  logAuditEventWithClient: mock.fn(async () => {}),
});
mockMod("next/server", { after: (fn: () => void) => fn() });
mockMod("next/cache", {
  revalidatePath: mock.fn(() => {}),
  revalidateTag: mock.fn(() => {}),
});
mockMod("server-only", {});
mockMod("@/lib/validation", {
  getString: mock.fn(
    (fd: FormData, key: string) => (fd.get(key) as string) ?? "",
  ),
});

let mockCtx: Record<string, unknown> = mockActionCtx();
mockMod("@/lib/action-utils", {
  requireActionContext: mock.fn(async () => mockCtx),
  requireWriteAction: mock.fn(async () => mockCtx),
  requireAppContext: mock.fn(async () => mockCtx),
});

// ─── Lazy-loaded module ─────────────────────────────────────────────
let createPromotion: (
  prev: { error?: string } | undefined,
  form: FormData,
) => Promise<unknown>;
let togglePromotionActive: (
  promotionId: string,
  isActive: boolean,
) => Promise<unknown>;
let deletePromotion: (promotionId: string) => Promise<unknown>;
let evaluateCartPromotions: (
  items: Array<{
    product_id: string;
    quantity: number;
    unit_price: number;
    category_id?: string;
  }>,
  subtotal: number,
) => Promise<unknown>;

test.before(async () => {
  const mod = await import("@/app/(dashboard)/promotions/actions");
  createPromotion = mod.createPromotion;
  togglePromotionActive = mod.togglePromotionActive;
  deletePromotion = mod.deletePromotion;
  evaluateCartPromotions = mod.evaluateCartPromotions;
});

function resetMocks() {
  captureMock.mock.resetCalls();
  withDbCaptureMock.mock.resetCalls();
  revalidateEntitiesMock.mock.resetCalls();
}

/** Default valid formData for createPromotion */
function validCreateData(
  overrides: Record<string, string | string[] | null> = {},
) {
  return formData({
    name: "Зуны урамшуулал",
    description: "Зуны улирлын урамшуулал",
    type: "threshold_discount",
    is_active: "true",
    priority: "0",
    stackable: "false",
    valid_from: "2025-06-01",
    valid_until: "2025-08-31",
    usage_limit: "",
    conditions: JSON.stringify([
      JSON.stringify({
        condition_type: "min_amount",
        condition_value: "50000",
        operator: "gte",
      }),
    ]),
    rewards: JSON.stringify([
      JSON.stringify({
        reward_type: "percentage_discount",
        reward_value: "10",
        reward_product_id: null,
        reward_max_count: null,
      }),
    ]),
    ...overrides,
  });
}

// ═══════════════════════════════════════════════════════════════════
// createPromotion tests
// ═══════════════════════════════════════════════════════════════════

test("createPromotion rejects missing name", async () => {
  const result = await createPromotion(
    undefined,
    validCreateData({ name: "" }),
  );
  assert.deepStrictEqual(result, { error: "Нэр шаардлагатай." });
});

test("createPromotion rejects invalid type", async () => {
  const result = await createPromotion(
    undefined,
    validCreateData({ type: "invalid_type" }),
  );
  assert.deepStrictEqual(result, { error: "Буруу сурталчилгааны төрөл." });
});

test("createPromotion rejects missing valid_from", async () => {
  const result = await createPromotion(
    undefined,
    validCreateData({ valid_from: "" }),
  );
  assert.deepStrictEqual(result, {
    error: "Хүчинтэй эхлэх огноо шаардлагатай.",
  });
});

test("createPromotion rejects empty conditions", async () => {
  const result = await createPromotion(
    undefined,
    validCreateData({
      conditions: JSON.stringify([]),
    }),
  );
  assert.deepStrictEqual(result, {
    error: "Дор хаяж нэг нөхцөл шаардлагатай.",
  });
});

test("createPromotion rejects empty rewards", async () => {
  const result = await createPromotion(
    undefined,
    validCreateData({
      conditions: JSON.stringify([
        JSON.stringify({
          condition_type: "min_amount",
          condition_value: "50000",
          operator: "gte",
        }),
      ]),
      rewards: JSON.stringify([]),
    }),
  );
  assert.deepStrictEqual(result, {
    error: "Дор хаяж нэг урамшуулал шаардлагатай.",
  });
});

test("createPromotion inserts successfully", async () => {
  resetMocks();
  const supabase = makeCreatePromotionSupabase({
    promotionId: "created-123",
  });
  mockCtx = mockActionCtx({ supabase });

  const result = await createPromotion(undefined, validCreateData());
  assert.deepStrictEqual(result, { success: true, error: undefined });

  // Verify revalidation
  assert.strictEqual(revalidateEntitiesMock.mock.callCount(), 1);
  assert.deepStrictEqual(revalidateEntitiesMock.mock.calls[0].arguments[0], [
    "promotions",
  ]);
});

test("createPromotion with conditions and rewards", async () => {
  resetMocks();
  const supabase = makeCreatePromotionSupabase({
    promotionId: "created-cond-reward",
  });
  mockCtx = mockActionCtx({ supabase });

  const result = await createPromotion(
    undefined,
    validCreateData({
      type: "buy_x_get_y",
      conditions: JSON.stringify([
        JSON.stringify({
          condition_type: "min_quantity",
          condition_value: "2",
          operator: "gte",
        }),
        JSON.stringify({
          condition_type: "specific_products",
          condition_value: "product-123",
          operator: "eq",
        }),
      ]),
      rewards: JSON.stringify([
        JSON.stringify({
          reward_type: "free_product",
          reward_value: "0",
          reward_product_id: "product-456",
          reward_max_count: "1",
        }),
      ]),
    }),
  );
  assert.deepStrictEqual(result, { success: true, error: undefined });
  assert.strictEqual(revalidateEntitiesMock.mock.callCount(), 1);

  // Verify insert was called for conditions and rewards
  const fromCalls = supabase.from.mock.calls;
  const calledTables = fromCalls.map(
    (c: { arguments: [string] }) => c.arguments[0],
  );
  assert.ok(calledTables.includes("promotion_conditions"));
  assert.ok(calledTables.includes("promotion_rewards"));
});

test("createPromotion handles promo insert error", async () => {
  resetMocks();
  const supabase = makeCreatePromotionSupabase({
    promoInsertError: { message: "Database constraint violation" },
  });
  mockCtx = mockActionCtx({ supabase });

  const result = await createPromotion(undefined, validCreateData());
  assert.deepStrictEqual(result, {
    error: "Сурталчилгаа үүсгэхэд алдаа гарлаа: Database constraint violation",
  });

  // Verify capture was called
  assert.strictEqual(captureMock.mock.callCount(), 1);
  assert.strictEqual(
    captureMock.mock.calls[0].arguments[1]?.context,
    "createPromotion: insert",
  );

  assert.strictEqual(revalidateEntitiesMock.mock.callCount(), 0);
});

test("createPromotion handles condition insert error", async () => {
  resetMocks();
  const supabase = makeCreatePromotionSupabase({
    conditionInsertError: { message: "Condition insert failed" },
  });
  mockCtx = mockActionCtx({ supabase });

  const result = await createPromotion(undefined, validCreateData());
  assert.deepStrictEqual(result, {
    error: "Нөхцөлүүдийг хадгалахад алдаа гарлаа.",
  });

  assert.strictEqual(captureMock.mock.callCount(), 1);
  assert.strictEqual(
    captureMock.mock.calls[0].arguments[1]?.context,
    "createPromotion: insert conditions",
  );

  assert.strictEqual(revalidateEntitiesMock.mock.callCount(), 0);
});

test("createPromotion handles reward insert error", async () => {
  resetMocks();
  const supabase = makeCreatePromotionSupabase({
    rewardInsertError: { message: "Reward insert failed" },
  });
  mockCtx = mockActionCtx({ supabase });

  const result = await createPromotion(undefined, validCreateData());
  assert.deepStrictEqual(result, {
    error: "Урамшууллуудыг хадгалахад алдаа гарлаа.",
  });

  assert.strictEqual(captureMock.mock.callCount(), 1);
  assert.strictEqual(
    captureMock.mock.calls[0].arguments[1]?.context,
    "createPromotion: insert rewards",
  );

  assert.strictEqual(revalidateEntitiesMock.mock.callCount(), 0);
});

// ═══════════════════════════════════════════════════════════════════
// togglePromotionActive tests
// ═══════════════════════════════════════════════════════════════════

test("togglePromotionActive toggles on", async () => {
  resetMocks();
  const supabase = makeTogglePromotionSupabase({
    promotion: { name: "Summer Promo" },
  });
  mockCtx = mockActionCtx({ supabase });

  const result = await togglePromotionActive("promo-1", true);
  assert.deepStrictEqual(result, { success: true, error: undefined });

  // Verify revalidation
  assert.strictEqual(revalidateEntitiesMock.mock.callCount(), 1);
  assert.deepStrictEqual(revalidateEntitiesMock.mock.calls[0].arguments[0], [
    "promotions",
  ]);
});

test("togglePromotionActive toggles off", async () => {
  resetMocks();
  const supabase = makeTogglePromotionSupabase({
    promotion: { name: "Winter Promo" },
  });
  mockCtx = mockActionCtx({ supabase });

  const result = await togglePromotionActive("promo-2", false);
  assert.deepStrictEqual(result, { success: true, error: undefined });

  assert.strictEqual(revalidateEntitiesMock.mock.callCount(), 1);
});

test("togglePromotionActive returns error when promotion not found", async () => {
  resetMocks();
  const supabase = makeTogglePromotionSupabase({
    promotion: null,
    fetchError: { message: "Row not found" },
  });
  mockCtx = mockActionCtx({ supabase });

  const result = await togglePromotionActive("nonexistent", true);
  assert.deepStrictEqual(result, {
    error: "Сурталчилгаа олдсонгүй.",
  });

  assert.strictEqual(revalidateEntitiesMock.mock.callCount(), 0);
});

test("togglePromotionActive returns error on update failure", async () => {
  resetMocks();
  const supabase = makeTogglePromotionSupabase({
    promotion: { name: "Error Promo" },
    updateError: { message: "Constraint violation" },
  });
  mockCtx = mockActionCtx({ supabase });

  const result = await togglePromotionActive("promo-3", true);
  assert.deepStrictEqual(result, {
    error: "Төлөв шинэчлэхэд алдаа гарлаа: Constraint violation",
  });

  // Verify capture was called
  assert.strictEqual(captureMock.mock.callCount(), 1);
  assert.strictEqual(
    captureMock.mock.calls[0].arguments[1]?.context,
    "togglePromotionActive",
  );

  assert.strictEqual(revalidateEntitiesMock.mock.callCount(), 0);
});

// ═══════════════════════════════════════════════════════════════════
// deletePromotion tests
// ═══════════════════════════════════════════════════════════════════

test("deletePromotion deletes successfully", async () => {
  resetMocks();
  const supabase = makeDeletePromotionSupabase({
    promotion: { name: "Summer Promo" },
  });
  mockCtx = mockActionCtx({ supabase });

  const result = await deletePromotion("promo-1");
  assert.deepStrictEqual(result, { success: true, error: undefined });

  // Verify revalidation
  assert.strictEqual(revalidateEntitiesMock.mock.callCount(), 1);
  assert.deepStrictEqual(revalidateEntitiesMock.mock.calls[0].arguments[0], [
    "promotions",
  ]);
});

test("deletePromotion returns error when promotion not found", async () => {
  resetMocks();
  const supabase = makeDeletePromotionSupabase({
    promotion: null,
    fetchError: { message: "Row not found" },
  });
  mockCtx = mockActionCtx({ supabase });

  const result = await deletePromotion("nonexistent");
  assert.deepStrictEqual(result, {
    error: "Сурталчилгаа олдсонгүй.",
  });

  assert.strictEqual(revalidateEntitiesMock.mock.callCount(), 0);
});

test("deletePromotion returns error on delete failure and calls capture", async () => {
  resetMocks();
  const supabase = makeDeletePromotionSupabase({
    promotion: { name: "Delete Error Promo" },
    deleteError: { message: "FK constraint" },
  });
  mockCtx = mockActionCtx({ supabase });

  const result = await deletePromotion("promo-4");
  assert.deepStrictEqual(result, {
    error: "Сурталчилгаа устгахад алдаа гарлаа: FK constraint",
  });

  // Verify capture was called for the delete error
  assert.strictEqual(captureMock.mock.callCount(), 1);
  assert.strictEqual(
    captureMock.mock.calls[0].arguments[1]?.context,
    "deletePromotion: delete",
  );

  assert.strictEqual(revalidateEntitiesMock.mock.callCount(), 0);
});

// ═══════════════════════════════════════════════════════════════════
// evaluateCartPromotions tests
// ═══════════════════════════════════════════════════════════════════

test("evaluateCartPromotions returns promotion data", async () => {
  resetMocks();
  const rpcResult = {
    promotions: [
      {
        promotion_id: "promo-1",
        promotion_name: "10% хямдрал",
        promotion_type: "threshold_discount",
        reward_type: "percentage_discount",
        reward_amount: 5000,
        reward_product_id: null,
        stackable: false,
      },
    ],
    count: 1,
  };
  const supabase = makeEvaluatePromotionsSupabase({
    rpcResult: JSON.stringify(rpcResult),
  });
  mockCtx = mockActionCtx({ supabase });

  const items = [
    {
      product_id: "product-1",
      quantity: 2,
      unit_price: 25000,
    },
  ];

  const result = await evaluateCartPromotions(items, 50000);
  assert.deepStrictEqual(result, {
    promotions: [
      {
        promotion_id: "promo-1",
        promotion_name: "10% хямдрал",
        promotion_type: "threshold_discount",
        reward_type: "percentage_discount",
        reward_amount: 5000,
        reward_product_id: null,
        stackable: false,
      },
    ],
    total_discount: 5000,
  });
});

test("evaluateCartPromotions with empty cart", async () => {
  resetMocks();
  const rpcResult = {
    promotions: [],
    count: 0,
  };
  const supabase = makeEvaluatePromotionsSupabase({
    rpcResult: JSON.stringify(rpcResult),
  });
  mockCtx = mockActionCtx({ supabase });

  const result = await evaluateCartPromotions([], 0);
  assert.deepStrictEqual(result, {
    promotions: [],
    total_discount: 0,
  });
});

test("evaluateCartPromotions handles RPC error", async () => {
  resetMocks();
  const supabase = makeEvaluatePromotionsSupabase({
    rpcError: { message: "RPC failed" },
  });
  mockCtx = mockActionCtx({ supabase });

  const result = await evaluateCartPromotions(
    [{ product_id: "p1", quantity: 1, unit_price: 1000 }],
    1000,
  );
  assert.deepStrictEqual(result, {
    promotions: [],
    total_discount: 0,
    error: "Сурталчилгаа үнэлэхэд алдаа гарлаа: RPC failed",
  });

  // Verify capture was called
  assert.strictEqual(captureMock.mock.callCount(), 1);
  assert.strictEqual(
    captureMock.mock.calls[0].arguments[1]?.context,
    "evaluateCartPromotions: rpc",
  );
});

test("evaluateCartPromotions handles malformed RPC result", async () => {
  resetMocks();
  const supabase = makeEvaluatePromotionsSupabase({
    rpcResult: "invalid-json",
  });
  mockCtx = mockActionCtx({ supabase });

  const result = await evaluateCartPromotions(
    [{ product_id: "p1", quantity: 1, unit_price: 1000 }],
    1000,
  );
  assert.deepStrictEqual(result, {
    promotions: [],
    total_discount: 0,
    error: "Сурталчилгааны үр дүнг боловсруулахад алдаа гарлаа.",
  });
});

test("evaluateCartPromotions handles non-promotion result shape", async () => {
  resetMocks();
  const supabase = makeEvaluatePromotionsSupabase({
    rpcResult: JSON.stringify({}),
  });
  mockCtx = mockActionCtx({ supabase });

  const result = await evaluateCartPromotions(
    [{ product_id: "p1", quantity: 1, unit_price: 1000 }],
    1000,
  );
  // Empty promotions array when no `promotions` field in result
  assert.deepStrictEqual(result, {
    promotions: [],
    total_discount: 0,
  });
});

test("evaluateCartPromotions with multiple items calculates total discount", async () => {
  resetMocks();
  const rpcResult = {
    promotions: [
      {
        promotion_id: "promo-1",
        promotion_name: "10% хямдрал",
        promotion_type: "threshold_discount",
        reward_type: "percentage_discount",
        reward_amount: 3000,
        reward_product_id: null,
        stackable: false,
      },
      {
        promotion_id: "promo-2",
        promotion_name: "Үнэгүй хүргэлт",
        promotion_type: "free_shipping",
        reward_type: "free_shipping",
        reward_amount: 5000,
        reward_product_id: null,
        stackable: true,
      },
    ],
    count: 2,
  };
  const supabase = makeEvaluatePromotionsSupabase({
    rpcResult: JSON.stringify(rpcResult),
  });
  mockCtx = mockActionCtx({ supabase });

  const items = [
    { product_id: "p1", quantity: 1, unit_price: 30000 },
    { product_id: "p2", quantity: 2, unit_price: 10000 },
  ];

  const result = await evaluateCartPromotions(items, 50000);
  assert.strictEqual(result.total_discount, 8000);
  assert.strictEqual(result.promotions.length, 2);
});
