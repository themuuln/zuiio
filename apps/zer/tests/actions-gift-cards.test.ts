/**
 * Tests for `gift-cards/actions.ts` — createGiftCard, updateGiftCard,
 * toggleGiftCardActive, deleteGiftCard, topUpGiftCard, redeemGiftCardCheck.
 */

import assert from "node:assert/strict";
import test, { mock } from "node:test";
import { mockActionCtx, formData, mockMod } from "./actions-helpers";

// ─── resolve helper (inline to avoid esbuild depth issues) ──────────
function resolved<T>(data: T, error: unknown = null) {
  return Promise.resolve({ data, error });
}

// ─── Types ───────────────────────────────────────────────────────────

type GiftCardRow = {
  id: string;
  code: string;
  initial_balance: number;
  current_balance: number;
  currency_code: string;
  expires_at: string | null;
  is_active: boolean;
  recipient_name: string | null;
  recipient_email: string | null;
  sender_name: string | null;
  message: string | null;
  created_by: string | null;
  organization_id: string;
};

type TransactionRow = {
  id: string;
  gift_card_id: string;
  organization_id: string;
  transaction_type: string;
  amount: number;
  balance_before: number;
  balance_after: number;
  created_by: string | null;
};

function defaultGiftCardRow(overrides: Partial<GiftCardRow> = {}): GiftCardRow {
  return {
    id: "gc-1",
    code: "GIFT50",
    initial_balance: 50000,
    current_balance: 50000,
    currency_code: "MNT",
    expires_at: "2030-12-31",
    is_active: true,
    recipient_name: "Bat",
    recipient_email: null,
    sender_name: null,
    message: "Happy birthday!",
    created_by: "test-user-id",
    organization_id: "test-org-id",
    ...overrides,
  };
}

function defaultTransactionRow(overrides: Partial<TransactionRow> = {}): TransactionRow {
  return {
    id: "tx-1",
    gift_card_id: "gc-1",
    organization_id: "test-org-id",
    transaction_type: "issuance",
    amount: 50000,
    balance_before: 0,
    balance_after: 50000,
    created_by: "test-user-id",
    ...overrides,
  };
}

// ─── Supabase chain builders ────────────────────────────────────────

/** Build a supabase mock for createGiftCard with controllable duplicate + insert behavior */
function makeCreateGiftCardSupabase(opts: {
  giftCardId?: string;
  insertError?: { message: string } | null;
  duplicateCode?: boolean;
  transactionError?: { message: string } | null;
} = {}) {
  const {
    giftCardId = "created-gc-1",
    insertError = null,
    duplicateCode = false,
    transactionError = null,
  } = opts;

  const giftCardsTable = {
    select: mock.fn(() => ({
      eq: mock.fn((_col: string, _val: unknown) => ({
        eq: mock.fn((_col2: string, _val2: unknown) => ({
          maybeSingle: mock.fn(() =>
            resolved(duplicateCode ? { id: "existing-gc" } : null, null),
          ),
        })),
      })),
    })),
    insert: mock.fn(() => ({
      select: mock.fn(() => ({
        single: mock.fn(() => resolved({ id: giftCardId, code: "GIFT50" }, insertError)),
      })),
    })),
  };

  const transactionsTable = {
    insert: mock.fn(() => resolved(null, transactionError)),
  };

  return {
    from: mock.fn((table: string) => {
      if (table === "gift_cards") return giftCardsTable;
      if (table === "gift_card_transactions") return transactionsTable;
      return {};
    }),
  };
}

/** Build a supabase mock for updateGiftCard */
function makeUpdateGiftCardSupabase(opts: {
  existingId?: string | null;
  duplicateCode?: boolean;
  updateError?: { message: string } | null;
} = {}) {
  const {
    existingId = "gc-1",
    duplicateCode = false,
    updateError = null,
  } = opts;

  const giftCardsTable = {
    select: mock.fn(() => ({
      eq: mock.fn((_col: string, _val: unknown) => ({
        eq: mock.fn((_col2: string, _val2: unknown) => ({
          neq: mock.fn((_col3: string, _val3: unknown) => ({
            maybeSingle: mock.fn(() =>
              resolved(duplicateCode ? { id: "other-gc" } : null, null),
            ),
          })),
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
      if (table === "gift_cards") return giftCardsTable;
      return {};
    }),
  };
}

/** Build a supabase mock for toggleGiftCardActive */
function makeToggleGiftCardSupabase(opts: {
  giftCard?: { code: string } | null;
  fetchError?: { message: string } | null;
  updateError?: { message: string } | null;
} = {}) {
  const {
    giftCard = { code: "GIFT50" },
    fetchError = null,
    updateError = null,
  } = opts;

  const giftCardsTable = {
    select: mock.fn(() => ({
      eq: mock.fn((_col: string, _val: unknown) => ({
        eq: mock.fn((_col2: string, _val2: unknown) => ({
          single: mock.fn(() => resolved(giftCard, fetchError)),
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
      if (table === "gift_cards") return giftCardsTable;
      return {};
    }),
  };
}

/** Build a supabase mock for deleteGiftCard */
function makeDeleteGiftCardSupabase(opts: {
  giftCard?: { code: string } | null;
  fetchError?: { message: string } | null;
  deleteError?: { message: string } | null;
} = {}) {
  const {
    giftCard = { code: "GIFT50" },
    fetchError = null,
    deleteError = null,
  } = opts;

  const giftCardsTable = {
    select: mock.fn(() => ({
      eq: mock.fn((_col: string, _val: unknown) => ({
        eq: mock.fn((_col2: string, _val2: unknown) => ({
          single: mock.fn(() => resolved(giftCard, fetchError)),
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
      if (table === "gift_cards") return giftCardsTable;
      return {};
    }),
  };
}

/** Build a supabase mock for topUpGiftCard */
function makeTopUpGiftCardSupabase(opts: {
  giftCard?: { code: string; current_balance: number } | null;
  fetchError?: { message: string } | null;
  updateError?: { message: string } | null;
  transactionError?: { message: string } | null;
} = {}) {
  const {
    giftCard = { code: "GIFT50", current_balance: 50000 },
    fetchError = null,
    updateError = null,
    transactionError = null,
  } = opts;

  const giftCardsTable = {
    select: mock.fn(() => ({
      eq: mock.fn((_col: string, _val: unknown) => ({
        eq: mock.fn((_col2: string, _val2: unknown) => ({
          single: mock.fn(() => resolved(giftCard, fetchError)),
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

  const transactionsTable = {
    insert: mock.fn(() => resolved(null, transactionError)),
  };

  return {
    from: mock.fn((table: string) => {
      if (table === "gift_cards") return giftCardsTable;
      if (table === "gift_card_transactions") return transactionsTable;
      return {};
    }),
  };
}

/** Build a supabase mock for redeemGiftCardCheck */
function makeRedeemGiftCardSupabase(opts: {
  giftCard?: {
    id: string;
    code: string;
    current_balance: number;
    expires_at: string | null;
    is_active: boolean;
  } | null;
  fetchError?: { message: string } | null;
} = {}) {
  const {
    giftCard = {
      id: "gc-1",
      code: "GIFT50",
      current_balance: 50000,
      expires_at: "2030-12-31",
      is_active: true,
    },
    fetchError = null,
  } = opts;

  const giftCardsTable = {
    select: mock.fn(() => ({
      eq: mock.fn((_col: string, _val: unknown) => ({
        eq: mock.fn((_col2: string, _val2: unknown) => ({
          single: mock.fn(() => resolved(giftCard, fetchError)),
        })),
      })),
    })),
  };

  return {
    from: mock.fn((table: string) => {
      if (table === "gift_cards") return giftCardsTable;
      return {};
    }),
  };
}

// ─── Global mocks ───────────────────────────────────────────────────
const captureMock = mock.fn(() => {});
const withDbCaptureMock = mock.fn(async (_name: string, query: Promise<unknown>) => {
  return await query;
});
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

mockMod("@/lib/audit", { logAuditEventWithClient: mock.fn(async () => {}) });
mockMod("next/server", { after: (fn: () => void) => fn() });
mockMod("next/cache", { revalidatePath: mock.fn(() => {}), revalidateTag: mock.fn(() => {}) });
mockMod("server-only", {});
mockMod("@/lib/validation", {
  getString: mock.fn((fd: FormData, key: string) => (fd.get(key) as string) ?? ""),
});

let mockCtx: Record<string, unknown> = mockActionCtx();
mockMod("@/lib/action-utils", {
  requireActionContext: mock.fn(async () => mockCtx),
  requireWriteAction: mock.fn(async () => mockCtx),
  requireAppContext: mock.fn(async () => mockCtx),
});

// ─── Lazy-loaded module ─────────────────────────────────────────────
let createGiftCard: (
  prev: { error?: string } | undefined,
  form: FormData,
) => Promise<unknown>;
let updateGiftCard: (
  prev: { error?: string } | undefined,
  form: FormData,
) => Promise<unknown>;
let toggleGiftCardActive: (
  giftCardId: string,
  isActive: boolean,
) => Promise<unknown>;
let deleteGiftCard: (giftCardId: string) => Promise<unknown>;
let topUpGiftCard: (giftCardId: string, amount: number) => Promise<unknown>;
let redeemGiftCardCheck: (
  code: string,
  organizationId: string,
  saleTotal: number,
) => Promise<unknown>;

test.before(async () => {
  const mod = await import("@/app/(dashboard)/gift-cards/actions");
  createGiftCard = mod.createGiftCard;
  updateGiftCard = mod.updateGiftCard;
  toggleGiftCardActive = mod.toggleGiftCardActive;
  deleteGiftCard = mod.deleteGiftCard;
  topUpGiftCard = mod.topUpGiftCard;
  redeemGiftCardCheck = mod.redeemGiftCardCheck;
});

function resetMocks() {
  captureMock.mock.resetCalls();
  withDbCaptureMock.mock.resetCalls();
  revalidateEntitiesMock.mock.resetCalls();
}

/** Default valid formData for createGiftCard */
function validCreateData(overrides: Record<string, string | null> = {}) {
  return formData({
    code: "GIFT50",
    initial_balance: "50000",
    currency_code: "MNT",
    expires_at: "2030-12-31",
    is_active: "true",
    recipient_name: "Bat",
    recipient_email: "",
    sender_name: "",
    message: "Happy birthday!",
    ...overrides,
  });
}

/** Default valid formData for updateGiftCard */
function validUpdateData(overrides: Record<string, string | null> = {}) {
  return formData({
    id: "gc-1",
    code: "GIFT50",
    currency_code: "MNT",
    expires_at: "2030-12-31",
    is_active: "true",
    recipient_name: "Bat",
    recipient_email: "",
    sender_name: "",
    message: "Happy birthday!",
    ...overrides,
  });
}

// ═══════════════════════════════════════════════════════════════════
// createGiftCard tests
// ═══════════════════════════════════════════════════════════════════

test("createGiftCard rejects missing code", async () => {
  const result = await createGiftCard(undefined, validCreateData({ code: "" }));
  assert.deepStrictEqual(result, { error: "Код шаардлагатай." });
});

test("createGiftCard rejects code with invalid characters", async () => {
  const result = await createGiftCard(
    undefined,
    validCreateData({ code: "HELLO WORLD!" }),
  );
  assert.deepStrictEqual(result, {
    error: "Код зөвхөн үсэг, тоо, зураас, доогуур зураас агуулж болно.",
  });
});

test("createGiftCard rejects zero initial_balance", async () => {
  const result = await createGiftCard(
    undefined,
    validCreateData({ initial_balance: "0" }),
  );
  assert.deepStrictEqual(result, {
    error: "Анхны үлдэгдэл 0-ээс их байх ёстой.",
  });
});

test("createGiftCard rejects negative initial_balance", async () => {
  const result = await createGiftCard(
    undefined,
    validCreateData({ initial_balance: "-5000" }),
  );
  assert.deepStrictEqual(result, {
    error: "Анхны үлдэгдэл 0-ээс их байх ёстой.",
  });
});

test("createGiftCard rejects duplicate code", async () => {
  resetMocks();
  const supabase = makeCreateGiftCardSupabase({ duplicateCode: true });
  mockCtx = mockActionCtx({ supabase });

  const result = await createGiftCard(undefined, validCreateData());
  assert.deepStrictEqual(result, {
    error: '"GIFT50" кодтой бэлгийн карт аль хэдийн бүртгэгдсэн байна.',
  });

  assert.strictEqual(revalidateEntitiesMock.mock.callCount(), 0);
});

test("createGiftCard inserts successfully with issuance transaction", async () => {
  resetMocks();
  const supabase = makeCreateGiftCardSupabase({ giftCardId: "created-gc-123" });
  mockCtx = mockActionCtx({ supabase });

  const result = await createGiftCard(undefined, validCreateData());
  assert.deepStrictEqual(result, { success: true, error: undefined });

  // Verify revalidation
  assert.strictEqual(revalidateEntitiesMock.mock.callCount(), 1);
  assert.deepStrictEqual(revalidateEntitiesMock.mock.calls[0].arguments[0], [
    "gift_cards",
  ]);
});

test("createGiftCard handles insert DB error", async () => {
  resetMocks();
  const supabase = makeCreateGiftCardSupabase({
    insertError: { message: "Database constraint violation" },
  });
  mockCtx = mockActionCtx({ supabase });

  const result = await createGiftCard(undefined, validCreateData());
  assert.deepStrictEqual(result, {
    error: "Бэлгийн карт үүсгэхэд алдаа гарлаа: Database constraint violation",
  });

  assert.strictEqual(revalidateEntitiesMock.mock.callCount(), 0);
});

test("createGiftCard handles issuance transaction error with capture", async () => {
  resetMocks();
  const supabase = makeCreateGiftCardSupabase({
    giftCardId: "created-gc-txerr",
    transactionError: { message: "Transaction insert failed" },
  });
  mockCtx = mockActionCtx({ supabase });

  const result = await createGiftCard(undefined, validCreateData());
  // Should still succeed since the gift card was created
  assert.deepStrictEqual(result, { success: true, error: undefined });

  // Capture should be called for the transaction error
  assert.strictEqual(captureMock.mock.callCount(), 1);
  assert.strictEqual(
    captureMock.mock.calls[0].arguments[1]?.context,
    "createGiftCard: issuance transaction",
  );
});

test("createGiftCard with optional fields omitted", async () => {
  resetMocks();
  const supabase = makeCreateGiftCardSupabase({ giftCardId: "created-gc-min" });
  mockCtx = mockActionCtx({ supabase });

  const result = await createGiftCard(
    undefined,
    validCreateData({
      recipient_name: "",
      message: "",
      currency_code: "", // defaults to MNT
    }),
  );
  assert.deepStrictEqual(result, { success: true, error: undefined });
  assert.strictEqual(revalidateEntitiesMock.mock.callCount(), 1);
});

test("createGiftCard creates inactive card when is_active is false", async () => {
  resetMocks();
  const supabase = makeCreateGiftCardSupabase({ giftCardId: "created-gc-inactive" });
  mockCtx = mockActionCtx({ supabase });

  const result = await createGiftCard(
    undefined,
    validCreateData({ is_active: "false" }),
  );
  assert.deepStrictEqual(result, { success: true, error: undefined });
  assert.strictEqual(revalidateEntitiesMock.mock.callCount(), 1);
});

// ═══════════════════════════════════════════════════════════════════
// updateGiftCard tests
// ═══════════════════════════════════════════════════════════════════

test("updateGiftCard updates successfully", async () => {
  resetMocks();
  const supabase = makeUpdateGiftCardSupabase({ existingId: "gc-1" });
  mockCtx = mockActionCtx({ supabase });

  const result = await updateGiftCard(
    undefined,
    validUpdateData({ code: "GIFT75", recipient_name: "Tuguldur" }),
  );
  assert.deepStrictEqual(result, { success: true, error: undefined });

  assert.strictEqual(revalidateEntitiesMock.mock.callCount(), 1);
  assert.deepStrictEqual(revalidateEntitiesMock.mock.calls[0].arguments[0], [
    "gift_cards",
  ]);
});

test("updateGiftCard rejects missing code", async () => {
  const result = await updateGiftCard(
    undefined,
    validUpdateData({ code: "" }),
  );
  assert.deepStrictEqual(result, { error: "Код шаардлагатай." });
});

test("updateGiftCard rejects code with invalid characters", async () => {
  const result = await updateGiftCard(
    undefined,
    validUpdateData({ code: "INVALID CODE!" }),
  );
  assert.deepStrictEqual(result, {
    error: "Код зөвхөн үсэг, тоо, зураас, доогуур зураас агуулж болно.",
  });
});

test("updateGiftCard handles duplicate code (excluding self)", async () => {
  resetMocks();
  const supabase = makeUpdateGiftCardSupabase({
    existingId: "gc-1",
    duplicateCode: true,
  });
  mockCtx = mockActionCtx({ supabase });

  const result = await updateGiftCard(
    undefined,
    validUpdateData({ code: "EXISTING_GC" }),
  );
  assert.deepStrictEqual(result, {
    error: '"EXISTING_GC" кодтой бэлгийн карт аль хэдийн бүртгэгдсэн байна.',
  });

  assert.strictEqual(revalidateEntitiesMock.mock.callCount(), 0);
});

test("updateGiftCard handles update error", async () => {
  resetMocks();
  const supabase = makeUpdateGiftCardSupabase({
    existingId: "gc-1",
    updateError: { message: "Constraint violation" },
  });
  mockCtx = mockActionCtx({ supabase });

  const result = await updateGiftCard(
    undefined,
    validUpdateData(),
  );
  assert.deepStrictEqual(result, {
    error: "Бэлгийн карт шинэчлэхэд алдаа гарлаа: Constraint violation",
  });

  assert.strictEqual(revalidateEntitiesMock.mock.callCount(), 0);
});

// ═══════════════════════════════════════════════════════════════════
// toggleGiftCardActive tests
// ═══════════════════════════════════════════════════════════════════

test("toggleGiftCardActive toggles on", async () => {
  resetMocks();
  const supabase = makeToggleGiftCardSupabase({
    giftCard: { code: "GIFT50" },
  });
  mockCtx = mockActionCtx({ supabase });

  const result = await toggleGiftCardActive("gc-1", true);
  assert.deepStrictEqual(result, { success: true, error: undefined });

  assert.strictEqual(revalidateEntitiesMock.mock.callCount(), 1);
  assert.deepStrictEqual(revalidateEntitiesMock.mock.calls[0].arguments[0], [
    "gift_cards",
  ]);
});

test("toggleGiftCardActive toggles off", async () => {
  resetMocks();
  const supabase = makeToggleGiftCardSupabase({
    giftCard: { code: "GIFT50" },
  });
  mockCtx = mockActionCtx({ supabase });

  const result = await toggleGiftCardActive("gc-1", false);
  assert.deepStrictEqual(result, { success: true, error: undefined });

  assert.strictEqual(revalidateEntitiesMock.mock.callCount(), 1);
});

test("toggleGiftCardActive returns error when not found", async () => {
  resetMocks();
  const supabase = makeToggleGiftCardSupabase({
    giftCard: null,
    fetchError: { message: "Row not found" },
  });
  mockCtx = mockActionCtx({ supabase });

  const result = await toggleGiftCardActive("nonexistent", true);
  assert.deepStrictEqual(result, { error: "Бэлгийн карт олдсонгүй." });

  assert.strictEqual(revalidateEntitiesMock.mock.callCount(), 0);
});

test("toggleGiftCardActive returns error on update failure", async () => {
  resetMocks();
  const supabase = makeToggleGiftCardSupabase({
    giftCard: { code: "GIFT50" },
    updateError: { message: "Constraint violation" },
  });
  mockCtx = mockActionCtx({ supabase });

  const result = await toggleGiftCardActive("gc-1", true);
  assert.deepStrictEqual(result, {
    error: "Төлөв шинэчлэхэд алдаа гарлаа: Constraint violation",
  });

  assert.strictEqual(revalidateEntitiesMock.mock.callCount(), 0);
});

// ═══════════════════════════════════════════════════════════════════
// deleteGiftCard tests
// ═══════════════════════════════════════════════════════════════════

test("deleteGiftCard deletes successfully", async () => {
  resetMocks();
  const supabase = makeDeleteGiftCardSupabase({
    giftCard: { code: "GIFT50" },
  });
  mockCtx = mockActionCtx({ supabase });

  const result = await deleteGiftCard("gc-1");
  assert.deepStrictEqual(result, { success: true, error: undefined });

  assert.strictEqual(revalidateEntitiesMock.mock.callCount(), 1);
  assert.deepStrictEqual(revalidateEntitiesMock.mock.calls[0].arguments[0], [
    "gift_cards",
  ]);
});

test("deleteGiftCard returns error when not found", async () => {
  resetMocks();
  const supabase = makeDeleteGiftCardSupabase({
    giftCard: null,
    fetchError: { message: "Row not found" },
  });
  mockCtx = mockActionCtx({ supabase });

  const result = await deleteGiftCard("nonexistent");
  assert.deepStrictEqual(result, { error: "Бэлгийн карт олдсонгүй." });

  assert.strictEqual(revalidateEntitiesMock.mock.callCount(), 0);
});

test("deleteGiftCard returns error on delete failure and calls capture", async () => {
  resetMocks();
  const supabase = makeDeleteGiftCardSupabase({
    giftCard: { code: "GIFT50" },
    deleteError: { message: "FK constraint" },
  });
  mockCtx = mockActionCtx({ supabase });

  const result = await deleteGiftCard("gc-1");
  assert.deepStrictEqual(result, {
    error: "Бэлгийн карт устгахад алдаа гарлаа: FK constraint",
  });

  assert.strictEqual(captureMock.mock.callCount(), 1);
  assert.strictEqual(
    captureMock.mock.calls[0].arguments[1]?.context,
    "deleteGiftCard: delete",
  );

  assert.strictEqual(revalidateEntitiesMock.mock.callCount(), 0);
});

// ═══════════════════════════════════════════════════════════════════
// topUpGiftCard tests
// ═══════════════════════════════════════════════════════════════════

test("topUpGiftCard succeeds with valid amount", async () => {
  resetMocks();
  const supabase = makeTopUpGiftCardSupabase({
    giftCard: { code: "GIFT50", current_balance: 50000 },
  });
  mockCtx = mockActionCtx({ supabase });

  const result = await topUpGiftCard("gc-1", 25000);
  assert.deepStrictEqual(result, { success: true, error: undefined });

  assert.strictEqual(revalidateEntitiesMock.mock.callCount(), 1);
  assert.deepStrictEqual(revalidateEntitiesMock.mock.calls[0].arguments[0], [
    "gift_cards",
  ]);
});

test("topUpGiftCard rejects amount <= 0", async () => {
  resetMocks();
  const supabase = makeTopUpGiftCardSupabase();
  mockCtx = mockActionCtx({ supabase });

  let result = await topUpGiftCard("gc-1", 0);
  assert.deepStrictEqual(result, { error: "Дүн 0-ээс их байх ёстой." });

  result = await topUpGiftCard("gc-1", -1000);
  assert.deepStrictEqual(result, { error: "Дүн 0-ээс их байх ёстой." });

  assert.strictEqual(revalidateEntitiesMock.mock.callCount(), 0);
});

test("topUpGiftCard rejects when card not found", async () => {
  resetMocks();
  const supabase = makeTopUpGiftCardSupabase({
    giftCard: null,
    fetchError: { message: "Row not found" },
  });
  mockCtx = mockActionCtx({ supabase });

  const result = await topUpGiftCard("nonexistent", 10000);
  assert.deepStrictEqual(result, { error: "Бэлгийн карт олдсонгүй." });

  assert.strictEqual(revalidateEntitiesMock.mock.callCount(), 0);
});

test("topUpGiftCard records transaction on success", async () => {
  resetMocks();
  const supabase = makeTopUpGiftCardSupabase({
    giftCard: { code: "GIFT50", current_balance: 50000 },
  });
  mockCtx = mockActionCtx({ supabase });

  const result = await topUpGiftCard("gc-1", 30000);
  assert.deepStrictEqual(result, { success: true, error: undefined });

  // Verify supabase was called for transaction insert
  const fromCalls = (supabase.from as ReturnType<typeof mock.fn>).mock.calls;
  const transactionCalls = fromCalls.filter(
    (c: { arguments: [string] }) => c.arguments[0] === "gift_card_transactions",
  );
  assert.ok(transactionCalls.length >= 1, "should call gift_card_transactions");
});

test("topUpGiftCard handles transaction error with capture", async () => {
  resetMocks();
  const supabase = makeTopUpGiftCardSupabase({
    giftCard: { code: "GIFT50", current_balance: 50000 },
    transactionError: { message: "Transaction insert failed" },
  });
  mockCtx = mockActionCtx({ supabase });

  const result = await topUpGiftCard("gc-1", 10000);
  // Card update succeeded, so overall result is success
  assert.deepStrictEqual(result, { success: true, error: undefined });

  assert.strictEqual(captureMock.mock.callCount(), 1);
  assert.strictEqual(
    captureMock.mock.calls[0].arguments[1]?.context,
    "topUpGiftCard: transaction",
  );
});

test("topUpGiftCard handles update error", async () => {
  resetMocks();
  const supabase = makeTopUpGiftCardSupabase({
    giftCard: { code: "GIFT50", current_balance: 50000 },
    updateError: { message: "Update failed" },
  });
  mockCtx = mockActionCtx({ supabase });

  const result = await topUpGiftCard("gc-1", 10000);
  assert.deepStrictEqual(result, {
    error: "Бэлгийн карт цэнэглэхэд алдаа гарлаа: Update failed",
  });
});

// ═══════════════════════════════════════════════════════════════════
// redeemGiftCardCheck tests
// ═══════════════════════════════════════════════════════════════════

test("redeemGiftCardCheck returns valid for active card with sufficient balance", async () => {
  resetMocks();
  const supabase = makeRedeemGiftCardSupabase({
    giftCard: {
      id: "gc-1",
      code: "GIFT50",
      current_balance: 50000,
      expires_at: "2030-12-31",
      is_active: true,
    },
  });
  mockCtx = mockActionCtx({ supabase });

  const result = await redeemGiftCardCheck("GIFT50", "org-1", 30000);
  assert.deepStrictEqual(result, {
    valid: true,
    redeemable_amount: 30000,
    gift_card_id: "gc-1",
  });
});

test("redeemGiftCardCheck caps redeemable_amount to balance when balance < sale total", async () => {
  resetMocks();
  const supabase = makeRedeemGiftCardSupabase({
    giftCard: {
      id: "gc-2",
      code: "SMALL",
      current_balance: 5000,
      expires_at: "2030-12-31",
      is_active: true,
    },
  });
  mockCtx = mockActionCtx({ supabase });

  const result = await redeemGiftCardCheck("SMALL", "org-1", 100000);
  assert.strictEqual(result.valid, true);
  assert.strictEqual(result.redeemable_amount, 5000);
  assert.strictEqual(result.gift_card_id, "gc-2");
});

test("redeemGiftCardCheck rejects empty code", async () => {
  const result = await redeemGiftCardCheck("", "org-1", 1000);
  assert.deepStrictEqual(result, {
    valid: false,
    redeemable_amount: 0,
    gift_card_id: "",
    error: "Бэлгийн картын код шаардлагатай.",
  });
});

test("redeemGiftCardCheck rejects missing organizationId", async () => {
  const result = await redeemGiftCardCheck("GIFT50", "", 1000);
  assert.deepStrictEqual(result, {
    valid: false,
    redeemable_amount: 0,
    gift_card_id: "",
    error: "Байгууллага олдсонгүй.",
  });
});

test("redeemGiftCardCheck returns error when card not found", async () => {
  resetMocks();
  const supabase = makeRedeemGiftCardSupabase({
    giftCard: null,
    fetchError: { message: "Row not found" },
  });
  mockCtx = mockActionCtx({ supabase });

  const result = await redeemGiftCardCheck("NONEXISTENT", "org-1", 1000);
  assert.deepStrictEqual(result, {
    valid: false,
    redeemable_amount: 0,
    gift_card_id: "",
    error: "Бэлгийн карт олдсонгүй.",
  });
});

test("redeemGiftCardCheck rejects inactive card", async () => {
  resetMocks();
  const supabase = makeRedeemGiftCardSupabase({
    giftCard: {
      id: "gc-inactive",
      code: "INACTIVE",
      current_balance: 50000,
      expires_at: "2030-12-31",
      is_active: false,
    },
  });
  mockCtx = mockActionCtx({ supabase });

  const result = await redeemGiftCardCheck("INACTIVE", "org-1", 1000);
  assert.deepStrictEqual(result, {
    valid: false,
    redeemable_amount: 0,
    gift_card_id: "gc-inactive",
    error: "Бэлгийн карт идэвхгүй байна.",
  });
});

test("redeemGiftCardCheck rejects expired card", async () => {
  resetMocks();
  const expiredDate = new Date();
  expiredDate.setFullYear(expiredDate.getFullYear() - 1);
  const supabase = makeRedeemGiftCardSupabase({
    giftCard: {
      id: "gc-expired",
      code: "EXPIRED",
      current_balance: 50000,
      expires_at: expiredDate.toISOString(),
      is_active: true,
    },
  });
  mockCtx = mockActionCtx({ supabase });

  const result = await redeemGiftCardCheck("EXPIRED", "org-1", 1000);
  assert.deepStrictEqual(result, {
    valid: false,
    redeemable_amount: 0,
    gift_card_id: "gc-expired",
    error: "Бэлгийн картын хугацаа дууссан.",
  });
});

test("redeemGiftCardCheck rejects card with zero balance", async () => {
  resetMocks();
  const supabase = makeRedeemGiftCardSupabase({
    giftCard: {
      id: "gc-empty",
      code: "EMPTY",
      current_balance: 0,
      expires_at: "2030-12-31",
      is_active: true,
    },
  });
  mockCtx = mockActionCtx({ supabase });

  const result = await redeemGiftCardCheck("EMPTY", "org-1", 1000);
  assert.deepStrictEqual(result, {
    valid: false,
    redeemable_amount: 0,
    gift_card_id: "gc-empty",
    error: "Бэлгийн картын үлдэгдэл дууссан.",
  });
});

test("redeemGiftCardCheck with no expiry (null expires_at) should be valid", async () => {
  resetMocks();
  const supabase = makeRedeemGiftCardSupabase({
    giftCard: {
      id: "gc-noexpiry",
      code: "NOEXPIRY",
      current_balance: 10000,
      expires_at: null,
      is_active: true,
    },
  });
  mockCtx = mockActionCtx({ supabase });

  const result = await redeemGiftCardCheck("NOEXPIRY", "org-1", 5000);
  assert.strictEqual(result.valid, true);
  assert.strictEqual(result.redeemable_amount, 5000);
});

test("redeemGiftCardCheck handles fetch error", async () => {
  resetMocks();
  const supabase = makeRedeemGiftCardSupabase({
    giftCard: null,
    fetchError: { message: "DB connection error" },
  });
  mockCtx = mockActionCtx({ supabase });

  const result = await redeemGiftCardCheck("ERROR", "org-1", 1000);
  assert.deepStrictEqual(result, {
    valid: false,
    redeemable_amount: 0,
    gift_card_id: "",
    error: "Бэлгийн карт олдсонгүй.",
  });
});

test("redeemGiftCardCheck returns exact balance when sale total and balance match", async () => {
  resetMocks();
  const supabase = makeRedeemGiftCardSupabase({
    giftCard: {
      id: "gc-exact",
      code: "EXACT",
      current_balance: 25000,
      expires_at: "2030-12-31",
      is_active: true,
    },
  });
  mockCtx = mockActionCtx({ supabase });

  const result = await redeemGiftCardCheck("EXACT", "org-1", 25000);
  assert.strictEqual(result.valid, true);
  assert.strictEqual(result.redeemable_amount, 25000);
});

// ═══════════════════════════════════════════════════════════════════
// Additional edge cases
// ═══════════════════════════════════════════════════════════════════

test("createGiftCard with empty optional fields uses defaults", async () => {
  resetMocks();
  const supabase = makeCreateGiftCardSupabase({ giftCardId: "gc-opt" });
  mockCtx = mockActionCtx({ supabase });

  // Only required fields: code, initial_balance
  const result = await createGiftCard(
    undefined,
    formData({
      code: "MINIMAL",
      initial_balance: "10000",
    }),
  );
  assert.deepStrictEqual(result, { success: true, error: undefined });
});

test("createGiftCard with very long code", async () => {
  resetMocks();
  const supabase = makeCreateGiftCardSupabase({ giftCardId: "gc-long" });
  mockCtx = mockActionCtx({ supabase });

  const longCode = "A".repeat(100);
  const result = await createGiftCard(
    undefined,
    validCreateData({ code: longCode }),
  );
  assert.deepStrictEqual(result, { success: true, error: undefined });
  assert.strictEqual(revalidateEntitiesMock.mock.callCount(), 1);
});

test("toggleGiftCardActive twice in succession", async () => {
  resetMocks();
  const supabase = makeToggleGiftCardSupabase({
    giftCard: { code: "TOGGLEGC" },
  });
  mockCtx = mockActionCtx({ supabase });

  // Toggle on
  const result1 = await toggleGiftCardActive("gc-toggle", true);
  assert.deepStrictEqual(result1, { success: true, error: undefined });
  assert.strictEqual(revalidateEntitiesMock.mock.callCount(), 1);

  // Toggle off
  resetMocks();
  const supabase2 = makeToggleGiftCardSupabase({
    giftCard: { code: "TOGGLEGC" },
  });
  mockCtx = mockActionCtx({ supabase2 });

  const result2 = await toggleGiftCardActive("gc-toggle", false);
  assert.deepStrictEqual(result2, { success: true, error: undefined });
  assert.strictEqual(revalidateEntitiesMock.mock.callCount(), 1);

  // Toggle on again
  resetMocks();
  const supabase3 = makeToggleGiftCardSupabase({
    giftCard: { code: "TOGGLEGC" },
  });
  mockCtx = mockActionCtx({ supabase3 });

  const result3 = await toggleGiftCardActive("gc-toggle", true);
  assert.deepStrictEqual(result3, { success: true, error: undefined });
  assert.strictEqual(revalidateEntitiesMock.mock.callCount(), 1);
});

test("deleteGiftCard with non-existing id returns not found", async () => {
  resetMocks();
  const supabase = makeDeleteGiftCardSupabase({
    giftCard: null,
    fetchError: { message: "Not found" },
  });
  mockCtx = mockActionCtx({ supabase });

  const result = await deleteGiftCard("fake-id");
  assert.deepStrictEqual(result, { error: "Бэлгийн карт олдсонгүй." });
});

test("updateGiftCard with missing id field returns error", async () => {
  // The action checks `getString(formData, "id")` and returns error if empty
  const result = await updateGiftCard(
    undefined,
    validUpdateData({ id: "" }),
  );
  assert.deepStrictEqual(result, { error: "Бэлгийн картын ID олдсонгүй." });
});

test("redeemGiftCardCheck with saleTotal = 0 returns redeemable 0", async () => {
  resetMocks();
  const supabase = makeRedeemGiftCardSupabase({
    giftCard: {
      id: "gc-zero-sale",
      code: "ZEROSALE",
      current_balance: 50000,
      expires_at: "2030-12-31",
      is_active: true,
    },
  });
  mockCtx = mockActionCtx({ supabase });

  const result = await redeemGiftCardCheck("ZEROSALE", "org-1", 0);
  // Math.min(50000, 0) = 0, so valid true but redeemable 0
  assert.strictEqual(result.valid, true);
  assert.strictEqual(result.redeemable_amount, 0);
});
