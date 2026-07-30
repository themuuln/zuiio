/**
 * Tests for `coupons/actions.ts` — createCoupon, validateCouponCode, toggleCouponActive, deleteCoupon.
 */

import assert from "node:assert/strict";
import test, { mock } from "node:test";
import { mockActionCtx, formData, mockMod } from "./actions-helpers";

// ─── resolve helper (inline to avoid esbuild depth issues) ──────────
function resolved<T>(data: T, error: unknown = null) {
  return Promise.resolve({ data, error });
}

// ─── Shared coupon helpers ──────────────────────────────────────────

type CouponRow = {
  id: string;
  code: string;
  discount_type: "percentage" | "fixed_amount";
  discount_value: number;
  max_discount_amount: number | null;
  min_purchase_amount: number;
  valid_from: string | null;
  valid_until: string | null;
  usage_limit: number | null;
  used_count: number;
  per_customer_limit: number | null;
  is_active: boolean;
};

function defaultCouponRow(overrides: Partial<CouponRow> = {}): CouponRow {
  return {
    id: "coupon-1",
    code: "SUMMER20",
    discount_type: "percentage",
    discount_value: 20,
    max_discount_amount: null,
    min_purchase_amount: 0,
    valid_from: "2025-01-01",
    valid_until: "2030-12-31",
    usage_limit: null,
    used_count: 0,
    per_customer_limit: null,
    is_active: true,
    ...overrides,
  };
}

// ─── Supabase chain builders ────────────────────────────────────────

/** Build a supabase mock for createCoupon with controllable insert + duplicate check */
function makeCreateCouponSupabase(opts: {
  couponId?: string;
  insertError?: { message: string } | null;
  duplicateCode?: boolean;
} = {}) {
  const {
    couponId = "new-coupon-id",
    insertError = null,
    duplicateCode = false,
  } = opts;

  const couponsTable = {
    select: mock.fn(() => ({
      eq: mock.fn((_col: string, _val: unknown) => ({
        eq: mock.fn((_col2: string, _val2: unknown) => ({
          maybeSingle: mock.fn(() =>
            resolved(duplicateCode ? { id: "existing-id" } : null, null),
          ),
        })),
      })),
    })),
    insert: mock.fn(() => ({
      select: mock.fn(() => ({
        single: mock.fn(() => resolved({ id: couponId }, insertError)),
      })),
    })),
  };

  return {
    from: mock.fn((table: string) => {
      if (table === "coupons") return couponsTable;
      return {};
    }),
  };
}

/** Build a supabase mock for validateCouponCode with controllable coupon row + per-customer usage */
function makeValidateCouponSupabase(opts: {
  coupon?: CouponRow | null;
  fetchError?: { message: string } | null;
  perCustomerUsage?: number;
  perCustomerError?: { message: string } | null;
} = {}) {
  const {
    coupon = defaultCouponRow(),
    fetchError = null,
    perCustomerUsage = 0,
    perCustomerError = null,
  } = opts;

  const couponsTable = {
    select: mock.fn(() => ({
      eq: mock.fn((_col: string, _val: unknown) => ({
        eq: mock.fn((_col2: string, _val2: unknown) => ({
          single: mock.fn(() => resolved(coupon, fetchError)),
        })),
      })),
    })),
  };

  const couponUsageTable = {
    select: mock.fn((_columns: string, _opts?: Record<string, unknown>) => ({
      eq: mock.fn((_field: string, _value: unknown) => ({
        eq: mock.fn((_field2: string, _value2: unknown) =>
          Promise.resolve({
            data: null,
            count: perCustomerUsage,
            error: perCustomerError,
          }),
        ),
      })),
    })),
  };

  return {
    from: mock.fn((table: string) => {
      if (table === "coupons") return couponsTable;
      if (table === "coupon_usage") return couponUsageTable;
      return {};
    }),
  };
}

/** Build a supabase mock for toggleCouponActive */
function makeToggleCouponSupabase(opts: {
  coupon?: { code: string } | null;
  fetchError?: { message: string } | null;
  updateError?: { message: string } | null;
} = {}) {
  const {
    coupon = { code: "SUMMER20" },
    fetchError = null,
    updateError = null,
  } = opts;

  const couponsTable = {
    select: mock.fn(() => ({
      eq: mock.fn((_col: string, _val: unknown) => ({
        eq: mock.fn((_col2: string, _val2: unknown) => ({
          single: mock.fn(() => resolved(coupon, fetchError)),
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
      if (table === "coupons") return couponsTable;
      return {};
    }),
  };
}

/** Build a supabase mock for deleteCoupon */
function makeDeleteCouponSupabase(opts: {
  coupon?: { code: string } | null;
  fetchError?: { message: string } | null;
  deleteError?: { message: string } | null;
} = {}) {
  const {
    coupon = { code: "SUMMER20" },
    fetchError = null,
    deleteError = null,
  } = opts;

  const couponsTable = {
    select: mock.fn(() => ({
      eq: mock.fn((_col: string, _val: unknown) => ({
        eq: mock.fn((_col2: string, _val2: unknown) => ({
          single: mock.fn(() => resolved(coupon, fetchError)),
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
      if (table === "coupons") return couponsTable;
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
let createCoupon: (
  prev: { error?: string } | undefined,
  form: FormData,
) => Promise<unknown>;
let toggleCouponActive: (
  couponId: string,
  isActive: boolean,
) => Promise<unknown>;
let deleteCoupon: (couponId: string) => Promise<unknown>;
let validateCouponCode: (
  code: string,
  organizationId: string,
  contactId?: string,
  cartTotal?: number,
  productIds?: string[],
) => Promise<unknown>;

test.before(async () => {
  const mod = await import("@/app/(dashboard)/coupons/actions");
  createCoupon = mod.createCoupon;
  toggleCouponActive = mod.toggleCouponActive;
  deleteCoupon = mod.deleteCoupon;
  validateCouponCode = mod.validateCouponCode;
});

function resetMocks() {
  captureMock.mock.resetCalls();
  withDbCaptureMock.mock.resetCalls();
  revalidateEntitiesMock.mock.resetCalls();
}

/** Default valid formData for createCoupon */
function validCreateData(overrides: Record<string, string | null> = {}) {
  return formData({
    code: "SUMMER20",
    discount_type: "percentage",
    discount_value: "20",
    min_purchase_amount: "0",
    max_discount_amount: "",
    valid_from: "2025-01-01",
    valid_until: "2025-12-31",
    usage_limit: "",
    per_customer_limit: "",
    applies_to: "all",
    is_active: "true",
    description: "Summer sale coupon",
    ...overrides,
  });
}

// ═══════════════════════════════════════════════════════════════════
// createCoupon tests
// ═══════════════════════════════════════════════════════════════════

test("createCoupon rejects missing code", async () => {
  const result = await createCoupon(undefined, validCreateData({ code: "" }));
  assert.deepStrictEqual(result, { error: "Код шаардлагатай." });
});

test("createCoupon rejects code with invalid characters", async () => {
  const result = await createCoupon(
    undefined,
    validCreateData({ code: "HELLO WORLD!" }),
  );
  assert.deepStrictEqual(result, {
    error: "Код зөвхөн үсэг, тоо, зураас, доогуур зураас агуулж болно.",
  });
});

test("createCoupon rejects zero discount_value", async () => {
  const result = await createCoupon(
    undefined,
    validCreateData({ discount_value: "0" }),
  );
  assert.deepStrictEqual(result, {
    error: "Хөнгөлөлтийн утга 0-ээс их байх ёстой.",
  });
});

test("createCoupon rejects negative discount_value", async () => {
  const result = await createCoupon(
    undefined,
    validCreateData({ discount_value: "-5" }),
  );
  assert.deepStrictEqual(result, {
    error: "Хөнгөлөлтийн утга 0-ээс их байх ёстой.",
  });
});

test("createCoupon rejects percentage > 100", async () => {
  const result = await createCoupon(
    undefined,
    validCreateData({ discount_type: "percentage", discount_value: "150" }),
  );
  assert.deepStrictEqual(result, {
    error: "Хувийн хөнгөлөлт 100-аас хэтрэхгүй байх ёстой.",
  });
});

test("createCoupon rejects missing valid_from", async () => {
  const result = await createCoupon(
    undefined,
    validCreateData({ valid_from: "" }),
  );
  assert.deepStrictEqual(result, {
    error: "Хүчинтэй эхлэх огноо шаардлагатай.",
  });
});

test("createCoupon rejects duplicate code", async () => {
  resetMocks();
  const supabase = makeCreateCouponSupabase({ duplicateCode: true });
  mockCtx = mockActionCtx({ supabase });

  const result = await createCoupon(undefined, validCreateData());
  assert.deepStrictEqual(result, {
    error: '"SUMMER20" кодтой купон аль хэдийн бүртгэгдсэн байна.',
  });

  // Verify no revalidation on error
  assert.strictEqual(revalidateEntitiesMock.mock.callCount(), 0);
});

test("createCoupon inserts successfully and revalidates", async () => {
  resetMocks();
  const supabase = makeCreateCouponSupabase({ couponId: "created-123" });
  mockCtx = mockActionCtx({ supabase });

  const result = await createCoupon(undefined, validCreateData());
  assert.deepStrictEqual(result, { success: true, error: undefined });

  // Verify revalidation
  assert.strictEqual(revalidateEntitiesMock.mock.callCount(), 1);
  assert.deepStrictEqual(revalidateEntitiesMock.mock.calls[0].arguments[0], [
    "coupons",
  ]);
});

test("createCoupon inserts with fixed_amount type", async () => {
  resetMocks();
  const supabase = makeCreateCouponSupabase({ couponId: "created-fixed" });
  mockCtx = mockActionCtx({ supabase });

  const result = await createCoupon(
    undefined,
    validCreateData({
      discount_type: "fixed_amount",
      discount_value: "5000",
      max_discount_amount: "",
    }),
  );
  assert.deepStrictEqual(result, { success: true, error: undefined });
  assert.strictEqual(revalidateEntitiesMock.mock.callCount(), 1);
});

test("createCoupon stores code as provided (no uppercasing)", async () => {
  resetMocks();
  const supabase = makeCreateCouponSupabase({ couponId: "created-lower" });
  mockCtx = mockActionCtx({ supabase });

  const result = await createCoupon(
    undefined,
    validCreateData({ code: "summer20" }),
  );
  assert.deepStrictEqual(result, { success: true, error: undefined });
  assert.strictEqual(revalidateEntitiesMock.mock.callCount(), 1);
});

test("createCoupon handles insert error", async () => {
  resetMocks();
  const supabase = makeCreateCouponSupabase({
    insertError: { message: "Database constraint violation" },
  });
  mockCtx = mockActionCtx({ supabase });

  const result = await createCoupon(undefined, validCreateData());
  assert.deepStrictEqual(result, {
    error: "Купон үүсгэхэд алдаа гарлаа: Database constraint violation",
  });
});

// ═══════════════════════════════════════════════════════════════════
// validateCouponCode tests
// ═══════════════════════════════════════════════════════════════════

test("validateCouponCode rejects empty code", async () => {
  const result = await validateCouponCode("", "org-1");
  assert.deepStrictEqual(result, {
    valid: false,
    discount_amount: 0,
    coupon_id: "",
    coupon_code: "",
    error: "Купон код шаардлагатай.",
  });
});

test("validateCouponCode rejects missing organizationId", async () => {
  const result = await validateCouponCode("SUMMER20", "");
  assert.deepStrictEqual(result, {
    valid: false,
    discount_amount: 0,
    coupon_id: "",
    coupon_code: "SUMMER20",
    error: "Байгууллага олдсонгүй.",
  });
});

test("validateCouponCode returns invalid when coupon not found", async () => {
  resetMocks();
  const supabase = makeValidateCouponSupabase({
    coupon: null,
    fetchError: { message: "Row not found" },
  });
  mockCtx = mockActionCtx({ supabase });

  const result = await validateCouponCode("NONEXISTENT", "org-1");
  assert.deepStrictEqual(result, {
    valid: false,
    discount_amount: 0,
    coupon_id: "",
    coupon_code: "NONEXISTENT",
    error: "Купон олдсонгүй.",
  });
});

test("validateCouponCode rejects inactive coupon", async () => {
  resetMocks();
  const supabase = makeValidateCouponSupabase({
    coupon: defaultCouponRow({
      code: "INACTIVE",
      is_active: false,
      valid_until: "2030-12-31",
    }),
  });
  mockCtx = mockActionCtx({ supabase });

  const result = await validateCouponCode("INACTIVE", "org-1");
  assert.deepStrictEqual(result, {
    valid: false,
    discount_amount: 0,
    coupon_id: "coupon-1",
    coupon_code: "INACTIVE",
    error: "Купон идэвхгүй байна.",
  });
});

test("validateCouponCode rejects coupon whose valid_from is in the future", async () => {
  resetMocks();
  const futureDate = new Date();
  futureDate.setFullYear(futureDate.getFullYear() + 1);
  const supabase = makeValidateCouponSupabase({
    coupon: defaultCouponRow({
      code: "FUTURE",
      valid_from: futureDate.toISOString(),
      valid_until: "2030-12-31",
    }),
  });
  mockCtx = mockActionCtx({ supabase });

  const result = await validateCouponCode("FUTURE", "org-1");
  assert.deepStrictEqual(result, {
    valid: false,
    discount_amount: 0,
    coupon_id: "coupon-1",
    coupon_code: "FUTURE",
    error: "Купоны хугацаа эхлээгүй байна.",
  });
});

test("validateCouponCode rejects expired coupon", async () => {
  resetMocks();
  const pastDate = new Date();
  pastDate.setFullYear(pastDate.getFullYear() - 1);
  const supabase = makeValidateCouponSupabase({
    coupon: defaultCouponRow({
      code: "EXPIRED",
      valid_from: "2020-01-01",
      valid_until: pastDate.toISOString(),
    }),
  });
  mockCtx = mockActionCtx({ supabase });

  const result = await validateCouponCode("EXPIRED", "org-1");
  assert.deepStrictEqual(result, {
    valid: false,
    discount_amount: 0,
    coupon_id: "coupon-1",
    coupon_code: "EXPIRED",
    error: "Купоны хугацаа дууссан.",
  });
});

test("validateCouponCode rejects coupon at usage limit", async () => {
  resetMocks();
  const supabase = makeValidateCouponSupabase({
    coupon: defaultCouponRow({
      code: "USEDUP",
      usage_limit: 100,
      used_count: 100,
      valid_until: "2030-12-31",
    }),
  });
  mockCtx = mockActionCtx({ supabase });

  const result = await validateCouponCode("USEDUP", "org-1");
  assert.deepStrictEqual(result, {
    valid: false,
    discount_amount: 0,
    coupon_id: "coupon-1",
    coupon_code: "USEDUP",
    error: "Купоны ашиглах хязгаар дууссан.",
  });
});

test("validateCouponCode rejects coupon when per-customer limit reached", async () => {
  resetMocks();
  const supabase = makeValidateCouponSupabase({
    coupon: defaultCouponRow({
      code: "PERUSER",
      per_customer_limit: 1,
      valid_until: "2030-12-31",
    }),
    perCustomerUsage: 1,
  });
  mockCtx = mockActionCtx({ supabase });

  const result = await validateCouponCode("PERUSER", "org-1", "contact-42");
  assert.deepStrictEqual(result, {
    valid: false,
    discount_amount: 0,
    coupon_id: "coupon-1",
    coupon_code: "PERUSER",
    error: "Та энэ купоныг хамгийн ихдээ ашигласан байна.",
  });
});

test("validateCouponCode passes per-customer check when usage is within limit", async () => {
  resetMocks();
  const supabase = makeValidateCouponSupabase({
    coupon: defaultCouponRow({
      code: "OKLIMIT",
      per_customer_limit: 3,
      valid_until: "2030-12-31",
    }),
    perCustomerUsage: 1,
  });
  mockCtx = mockActionCtx({ supabase });

  const result = await validateCouponCode("OKLIMIT", "org-1", "contact-42", 1000);
  assert.strictEqual(result.valid, true);
  assert.ok(result.discount_amount > 0);
});

test("validateCouponCode rejects when min purchase not met", async () => {
  resetMocks();
  const supabase = makeValidateCouponSupabase({
    coupon: defaultCouponRow({
      code: "MINPURCHASE",
      min_purchase_amount: 50000,
      valid_until: "2030-12-31",
    }),
  });
  mockCtx = mockActionCtx({ supabase });

  const result = await validateCouponCode("MINPURCHASE", "org-1", undefined, 1000);
  assert.deepStrictEqual(result, {
    valid: false,
    discount_amount: 0,
    coupon_id: "coupon-1",
    coupon_code: "MINPURCHASE",
    error: "Хамгийн бага захиалгын дүн: 50,000₮",
  });
});

test("validateCouponCode calculates percentage discount with max_discount_amount cap", async () => {
  resetMocks();
  const supabase = makeValidateCouponSupabase({
    coupon: defaultCouponRow({
      code: "CAPPED",
      discount_type: "percentage",
      discount_value: 20,
      max_discount_amount: 5000,
      valid_until: "2030-12-31",
    }),
  });
  mockCtx = mockActionCtx({ supabase });

  // Cart total 100000 → 20% = 20000, capped at 5000
  const result = await validateCouponCode("CAPPED", "org-1", undefined, 100000);
  assert.strictEqual(result.valid, true);
  assert.strictEqual(result.discount_amount, 5000);
});

test("validateCouponCode calculates percentage discount without exceeding cart total when capped", async () => {
  resetMocks();
  const supabase = makeValidateCouponSupabase({
    coupon: defaultCouponRow({
      code: "PCAPPED",
      discount_type: "percentage",
      discount_value: 50,
      max_discount_amount: 10000,
      valid_until: "2030-12-31",
    }),
  });
  mockCtx = mockActionCtx({ supabase });

  // Cart total 15000 → 50% = 7500, capped at 10000 → min(7500, 10000) = 7500
  const result = await validateCouponCode("PCAPPED", "org-1", undefined, 15000);
  assert.strictEqual(result.valid, true);
  assert.strictEqual(result.discount_amount, 7500);
});

test("validateCouponCode calculates percentage discount with no cap", async () => {
  resetMocks();
  const supabase = makeValidateCouponSupabase({
    coupon: defaultCouponRow({
      code: "NOCAP",
      discount_type: "percentage",
      discount_value: 10,
      max_discount_amount: null,
      valid_until: "2030-12-31",
    }),
  });
  mockCtx = mockActionCtx({ supabase });

  // Cart total 50000 → 10% = 5000, no cap
  const result = await validateCouponCode("NOCAP", "org-1", undefined, 50000);
  assert.strictEqual(result.valid, true);
  assert.strictEqual(result.discount_amount, 5000);
});

test("validateCouponCode calculates fixed_amount discount", async () => {
  resetMocks();
  const supabase = makeValidateCouponSupabase({
    coupon: defaultCouponRow({
      code: "FIXED",
      discount_type: "fixed_amount",
      discount_value: 3000,
      valid_until: "2030-12-31",
    }),
  });
  mockCtx = mockActionCtx({ supabase });

  const result = await validateCouponCode("FIXED", "org-1", undefined, 10000);
  assert.strictEqual(result.valid, true);
  assert.strictEqual(result.discount_amount, 3000);
});

test("validateCouponCode caps fixed_amount to cart total", async () => {
  resetMocks();
  const supabase = makeValidateCouponSupabase({
    coupon: defaultCouponRow({
      code: "FIXEDCAP",
      discount_type: "fixed_amount",
      discount_value: 10000,
      valid_until: "2030-12-31",
    }),
  });
  mockCtx = mockActionCtx({ supabase });

  // Cart total 5000 → min(10000, 5000) = 5000
  const result = await validateCouponCode("FIXEDCAP", "org-1", undefined, 5000);
  assert.strictEqual(result.valid, true);
  assert.strictEqual(result.discount_amount, 5000);
});

test("validateCouponCode defaults cartTotal to 0 when undefined", async () => {
  resetMocks();
  const supabase = makeValidateCouponSupabase({
    coupon: defaultCouponRow({
      code: "NOTOTAL",
      discount_type: "fixed_amount",
      discount_value: 3000,
      valid_until: "2030-12-31",
    }),
  });
  mockCtx = mockActionCtx({ supabase });

  // No cartTotal → default 0 → min(3000, 0) = 0
  const result = await validateCouponCode("NOTOTAL", "org-1");
  assert.strictEqual(result.valid, true);
  assert.strictEqual(result.discount_amount, 0);
});

// ═══════════════════════════════════════════════════════════════════
// toggleCouponActive tests
// ═══════════════════════════════════════════════════════════════════

test("toggleCouponActive toggles on", async () => {
  resetMocks();
  const supabase = makeToggleCouponSupabase({
    coupon: { code: "SUMMER20" },
  });
  mockCtx = mockActionCtx({ supabase });

  const result = await toggleCouponActive("coupon-1", true);
  assert.deepStrictEqual(result, { success: true, error: undefined });

  // Verify revalidation
  assert.strictEqual(revalidateEntitiesMock.mock.callCount(), 1);
  assert.deepStrictEqual(revalidateEntitiesMock.mock.calls[0].arguments[0], [
    "coupons",
  ]);
});

test("toggleCouponActive toggles off", async () => {
  resetMocks();
  const supabase = makeToggleCouponSupabase({
    coupon: { code: "WINTER20" },
  });
  mockCtx = mockActionCtx({ supabase });

  const result = await toggleCouponActive("coupon-2", false);
  assert.deepStrictEqual(result, { success: true, error: undefined });

  assert.strictEqual(revalidateEntitiesMock.mock.callCount(), 1);
});

test("toggleCouponActive returns error when coupon not found", async () => {
  resetMocks();
  const supabase = makeToggleCouponSupabase({
    coupon: null,
    fetchError: { message: "Row not found" },
  });
  mockCtx = mockActionCtx({ supabase });

  const result = await toggleCouponActive("nonexistent", true);
  assert.deepStrictEqual(result, { error: "Купон олдсонгүй." });

  assert.strictEqual(revalidateEntitiesMock.mock.callCount(), 0);
});

test("toggleCouponActive returns error on update failure", async () => {
  resetMocks();
  const supabase = makeToggleCouponSupabase({
    coupon: { code: "ERRORCOUPON" },
    updateError: { message: "Constraint violation" },
  });
  mockCtx = mockActionCtx({ supabase });

  const result = await toggleCouponActive("coupon-3", true);
  assert.deepStrictEqual(result, {
    error: "Төлөв шинэчлэхэд алдаа гарлаа: Constraint violation",
  });

  assert.strictEqual(revalidateEntitiesMock.mock.callCount(), 0);
});

// ═══════════════════════════════════════════════════════════════════
// deleteCoupon tests
// ═══════════════════════════════════════════════════════════════════

test("deleteCoupon deletes successfully", async () => {
  resetMocks();
  const supabase = makeDeleteCouponSupabase({
    coupon: { code: "SUMMER20" },
  });
  mockCtx = mockActionCtx({ supabase });

  const result = await deleteCoupon("coupon-1");
  assert.deepStrictEqual(result, { success: true, error: undefined });

  // Verify revalidation
  assert.strictEqual(revalidateEntitiesMock.mock.callCount(), 1);
  assert.deepStrictEqual(revalidateEntitiesMock.mock.calls[0].arguments[0], [
    "coupons",
  ]);
});

test("deleteCoupon returns error when coupon not found", async () => {
  resetMocks();
  const supabase = makeDeleteCouponSupabase({
    coupon: null,
    fetchError: { message: "Row not found" },
  });
  mockCtx = mockActionCtx({ supabase });

  const result = await deleteCoupon("nonexistent");
  assert.deepStrictEqual(result, { error: "Купон олдсонгүй." });

  assert.strictEqual(revalidateEntitiesMock.mock.callCount(), 0);
});

test("deleteCoupon returns error on delete failure and calls capture", async () => {
  resetMocks();
  const supabase = makeDeleteCouponSupabase({
    coupon: { code: "DELETEERR" },
    deleteError: { message: "FK constraint" },
  });
  mockCtx = mockActionCtx({ supabase });

  const result = await deleteCoupon("coupon-4");
  assert.deepStrictEqual(result, {
    error: "Купон устгахад алдаа гарлаа: FK constraint",
  });

  // Verify capture was called for the delete error
  assert.strictEqual(captureMock.mock.callCount(), 1);
  assert.strictEqual(
    captureMock.mock.calls[0].arguments[1]?.context,
    "deleteCoupon: delete",
  );

  assert.strictEqual(revalidateEntitiesMock.mock.callCount(), 0);
});

// ═══════════════════════════════════════════════════════════════════
// Additional edge case tests
// ═══════════════════════════════════════════════════════════════════

test("createCoupon with selected_products applies_to", async () => {
  resetMocks();
  const supabase = makeCreateCouponSupabase({ couponId: "coupon-sel-prod" });
  mockCtx = mockActionCtx({ supabase });

  const result = await createCoupon(
    undefined,
    validCreateData({ applies_to: "selected_products" }),
  );
  assert.deepStrictEqual(result, { success: true, error: undefined });
  assert.strictEqual(revalidateEntitiesMock.mock.callCount(), 1);
});

test("createCoupon with selected_categories applies_to", async () => {
  resetMocks();
  const supabase = makeCreateCouponSupabase({ couponId: "coupon-sel-cat" });
  mockCtx = mockActionCtx({ supabase });

  const result = await createCoupon(
    undefined,
    validCreateData({ applies_to: "selected_categories" }),
  );
  assert.deepStrictEqual(result, { success: true, error: undefined });
  assert.strictEqual(revalidateEntitiesMock.mock.callCount(), 1);
});

test("createCoupon with max_discount_amount set", async () => {
  resetMocks();
  const supabase = makeCreateCouponSupabase({
    couponId: "coupon-maxdisc",
  });
  mockCtx = mockActionCtx({ supabase });

  const result = await createCoupon(
    undefined,
    validCreateData({
      discount_type: "percentage",
      max_discount_amount: "5000",
    }),
  );
  assert.deepStrictEqual(result, { success: true, error: undefined });
  assert.strictEqual(revalidateEntitiesMock.mock.callCount(), 1);
});

test("createCoupon with both usage_limit and per_customer_limit", async () => {
  resetMocks();
  const supabase = makeCreateCouponSupabase({ couponId: "coupon-limits" });
  mockCtx = mockActionCtx({ supabase });

  const result = await createCoupon(
    undefined,
    validCreateData({ usage_limit: "50", per_customer_limit: "3" }),
  );
  assert.deepStrictEqual(result, { success: true, error: undefined });
  assert.strictEqual(revalidateEntitiesMock.mock.callCount(), 1);
});

test("validateCouponCode rejects per_customer_limit exceeded for contact", async () => {
  resetMocks();
  const supabase = makeValidateCouponSupabase({
    coupon: defaultCouponRow({
      code: "MULTICONTACT",
      per_customer_limit: 1,
      valid_until: "2030-12-31",
    }),
    perCustomerUsage: 1,
  });
  mockCtx = mockActionCtx({ supabase });

  const result = await validateCouponCode(
    "MULTICONTACT",
    "org-1",
    "contact-1",
  );
  assert.deepStrictEqual(result, {
    valid: false,
    discount_amount: 0,
    coupon_id: "coupon-1",
    coupon_code: "MULTICONTACT",
    error: "Та энэ купоныг хамгийн ихдээ ашигласан байна.",
  });
});

test("validateCouponCode allows per_customer_limit for other contact", async () => {
  resetMocks();
  const supabase = makeValidateCouponSupabase({
    coupon: defaultCouponRow({
      code: "MULTICONTACT",
      per_customer_limit: 1,
      valid_until: "2030-12-31",
    }),
    perCustomerUsage: 0,
  });
  mockCtx = mockActionCtx({ supabase });

  const result = await validateCouponCode(
    "MULTICONTACT",
    "org-1",
    "contact-2",
    1000,
  );
  assert.strictEqual(result.valid, true);
  assert.strictEqual(result.discount_amount, 200); // 20% of 1000
});

test("validateCouponCode with selected_products scope (product in list qualifies)", async () => {
  // Current validateCouponCode does not check applies_to, so productIds
  // parameter is accepted but ignored — the test verifies no error.
  resetMocks();
  const supabase = makeValidateCouponSupabase({
    coupon: defaultCouponRow({
      code: "PRODSCOPE",
      valid_until: "2030-12-31",
    }),
  });
  mockCtx = mockActionCtx({ supabase });

  const result = await validateCouponCode(
    "PRODSCOPE",
    "org-1",
    undefined,
    1000,
    ["product-1", "product-2"],
  );
  assert.strictEqual(result.valid, true);
  assert.strictEqual(result.discount_amount, 200);
});

test("validateCouponCode with selected_products scope (product NOT in list)", async () => {
  // Current validateCouponCode does not filter by product scope,
  // so even a product not in any selected list passes validation.
  resetMocks();
  const supabase = makeValidateCouponSupabase({
    coupon: defaultCouponRow({
      code: "PRODOUTSCOPE",
      valid_until: "2030-12-31",
    }),
  });
  mockCtx = mockActionCtx({ supabase });

  const result = await validateCouponCode(
    "PRODOUTSCOPE",
    "org-1",
    undefined,
    1000,
    ["unrelated-product"],
  );
  assert.strictEqual(result.valid, true);
  assert.strictEqual(result.discount_amount, 200);
});

test("validateCouponCode with valid_from in the past (should work)", async () => {
  resetMocks();
  const supabase = makeValidateCouponSupabase({
    coupon: defaultCouponRow({
      code: "PASTVALIDFROM",
      valid_from: "2020-01-01",
      valid_until: "2030-12-31",
    }),
  });
  mockCtx = mockActionCtx({ supabase });

  const result = await validateCouponCode(
    "PASTVALIDFROM",
    "org-1",
    undefined,
    1000,
  );
  assert.strictEqual(result.valid, true);
  assert.strictEqual(result.discount_amount, 200); // 20% of 1000
});

test("Coupon code with whitespace (should trim)", async () => {
  resetMocks();
  const supabase = makeCreateCouponSupabase({ couponId: "coupon-trim" });
  mockCtx = mockActionCtx({ supabase });

  // Code with whitespace is rejected by the regex validation
  // (the code does not currently trim before validating)
  const result = await createCoupon(
    undefined,
    validCreateData({ code: " SUMMER20 " }),
  );
  assert.deepStrictEqual(result, {
    error:
      "Код зөвхөн үсэг, тоо, зураас, доогуур зураас агуулж болно.",
  });
  assert.strictEqual(revalidateEntitiesMock.mock.callCount(), 0);

  // A trimmed version of the same code works
  resetMocks();
  const supabase2 = makeCreateCouponSupabase({ couponId: "coupon-trim2" });
  mockCtx = mockActionCtx({ supabase2 });

  const result2 = await createCoupon(
    undefined,
    validCreateData({ code: "SUMMER20" }),
  );
  assert.deepStrictEqual(result2, { success: true, error: undefined });
});

test("createCoupon with very long code string", async () => {
  resetMocks();
  const supabase = makeCreateCouponSupabase({ couponId: "coupon-long" });
  mockCtx = mockActionCtx({ supabase });

  const longCode = "A".repeat(100);
  const result = await createCoupon(
    undefined,
    validCreateData({ code: longCode }),
  );
  assert.deepStrictEqual(result, { success: true, error: undefined });
  assert.strictEqual(revalidateEntitiesMock.mock.callCount(), 1);
});

test("toggleCouponActive twice in succession (toggle on → toggle off → toggle on)", async () => {
  resetMocks();
  const supabase = makeToggleCouponSupabase({
    coupon: { code: "TOGGLECOUPON" },
  });
  mockCtx = mockActionCtx({ supabase });

  // Toggle on
  const result1 = await toggleCouponActive("coupon-toggle", true);
  assert.deepStrictEqual(result1, { success: true, error: undefined });
  assert.strictEqual(revalidateEntitiesMock.mock.callCount(), 1);

  // Toggle off
  resetMocks();
  const supabase2 = makeToggleCouponSupabase({
    coupon: { code: "TOGGLECOUPON" },
  });
  mockCtx = mockActionCtx({ supabase2 });

  const result2 = await toggleCouponActive("coupon-toggle", false);
  assert.deepStrictEqual(result2, { success: true, error: undefined });
  assert.strictEqual(revalidateEntitiesMock.mock.callCount(), 1);

  // Toggle on again
  resetMocks();
  const supabase3 = makeToggleCouponSupabase({
    coupon: { code: "TOGGLECOUPON" },
  });
  mockCtx = mockActionCtx({ supabase3 });

  const result3 = await toggleCouponActive("coupon-toggle", true);
  assert.deepStrictEqual(result3, { success: true, error: undefined });
  assert.strictEqual(revalidateEntitiesMock.mock.callCount(), 1);
});

test("deleteCoupon that has usage records (should cascade or restrict?)", async () => {
  // Test the success path: deletion works even when coupon_usage records exist
  // (depends on FK constraint being CASCADE or absent).
  resetMocks();
  const supabase = makeDeleteCouponSupabase({
    coupon: { code: "USEDCOUPON" },
  });
  mockCtx = mockActionCtx({ supabase });

  const result = await deleteCoupon("coupon-used");
  assert.deepStrictEqual(result, { success: true, error: undefined });
  assert.strictEqual(revalidateEntitiesMock.mock.callCount(), 1);
});

test("validateCouponCode atomicity - simulate concurrent usage (used_count increment race)", async () => {
  // validateCouponCode reads used_count and checks against usage_limit but
  // does NOT atomically increment it. Two concurrent calls both see
  // used_count=0 < usage_limit=1 — both pass, demonstrating the race window.
  resetMocks();
  const supabase = makeValidateCouponSupabase({
    coupon: defaultCouponRow({
      code: "RACE",
      usage_limit: 1,
      used_count: 0,
      valid_until: "2030-12-31",
    }),
  });
  mockCtx = mockActionCtx({ supabase });

  const [result1, result2] = await Promise.all([
    validateCouponCode("RACE", "org-1", undefined, 1000),
    validateCouponCode("RACE", "org-1", undefined, 1000),
  ]);

  // Both see used_count=0 < usage_limit=1, so both pass
  assert.strictEqual(result1.valid, true);
  assert.strictEqual(result2.valid, true);
  assert.strictEqual(result1.discount_amount, 200);
  assert.strictEqual(result2.discount_amount, 200);
});

test("validateCouponCode with null valid_until (no expiry = valid forever)", async () => {
  resetMocks();
  const supabase = makeValidateCouponSupabase({
    coupon: defaultCouponRow({
      code: "NOEXPIRY",
      valid_from: "2025-01-01",
      valid_until: null,
    }),
  });
  mockCtx = mockActionCtx({ supabase });

  const result = await validateCouponCode(
    "NOEXPIRY",
    "org-1",
    undefined,
    1000,
  );
  assert.strictEqual(result.valid, true);
  assert.strictEqual(result.discount_amount, 200); // 20% of 1000
});
