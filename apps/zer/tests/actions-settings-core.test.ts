/**
 * Tests for `settings/actions.ts` — core settings functions.
 * Covers: updateOrganization, toggleBrandPreset, updateProfile,
 * updateOrgFeatureSetting, updateShopDefaultPaymentMethod,
 * updateOrgLogo, leaveOrganization.
 *
 * Excludes: importBrandPresets, importProductPreset, importProductPresetsByIds.
 */

import assert from "node:assert/strict";
import test, { mock } from "node:test";
import { formData, mockActionCtx, mockMod, resolved } from "./actions-helpers";

// ─── Global mocks ────────────────────────────────────────────────────

const captureMock = mock.fn(() => {});
const withDbCaptureMock = mock.fn(async (_name: string, query: unknown) => {
  return await (query as Promise<unknown>);
});
mockMod("@zuiio/capture", {
  capture: captureMock,
  withDbCapture: withDbCaptureMock,
});
mockMod("next/cache", {
  revalidatePath: mock.fn(() => {}),
  revalidateTag: mock.fn(() => {}),
});
mockMod("next/server", { after: (fn: () => void) => fn() });
mockMod("server-only", {});
const redirectMock = mock.fn(() => {
  throw new Error("REDIRECT");
});
mockMod("next/navigation", { redirect: redirectMock });

const revalidateEntityMock = mock.fn(() => {});
mockMod("@/lib/revalidate", { revalidateEntity: revalidateEntityMock });
mockMod("@/lib/audit", {
  logAuditEventWithClient: mock.fn(async () => {}),
});

// Source file imports createServiceClient but tested functions don't use it.
mockMod("@/lib/supabase/server-service", {
  createServiceClient: mock.fn(),
});

// ─── Mutable supabase mock ──────────────────────────────────────────
//
// Each test reassigns `mockFrom` with factory functions keyed by table name.
// `makeSupabase()` creates a fresh client whose `from(table)` delegates to
// the current factory — or a default error chain if no factory is registered.

let mockFrom: Record<string, () => Record<string, unknown>> = {};

function makeSupabase() {
  return {
    from: mock.fn((table: string) => {
      const factory = mockFrom[table];
      if (factory) return factory();
      // Default: every chain terminates with an error
      return {
        select: mock.fn(() => ({
          eq: mock.fn(() => ({
            single: mock.fn(async () =>
              resolved(null, new Error(`unexpected table: ${table}`)),
            ),
          })),
        })),
        update: mock.fn(() => ({
          eq: mock.fn(async () =>
            resolved(null, new Error(`unexpected table: ${table}`)),
          ),
        })),
      };
    }),
  };
}

// ─── Action context ──────────────────────────────────────────────────

let mockCtx: Record<string, unknown> = mockActionCtx({
  supabase: makeSupabase(),
});

mockMod("@/lib/action-utils", {
  requireActionContext: mock.fn(async () => mockCtx),
  requireWriteAction: mock.fn(async () => mockCtx),
  requireAppContext: mock.fn(async () => ({
    supabase: makeSupabase(),
    userId: "u1",
  })),
});

// ─── Lazy-loaded actions ─────────────────────────────────────────────

let updateOrganization: (prevState: unknown, fd: FormData) => Promise<unknown>;
let toggleBrandPreset: (prevState: unknown, fd: FormData) => Promise<unknown>;
let updateProfile: (prevState: unknown, fd: FormData) => Promise<unknown>;
let updateOrgFeatureSetting: (
  prevState: unknown,
  fd: FormData,
) => Promise<unknown>;
let updateShopDefaultPaymentMethod: (
  prevState: unknown,
  fd: FormData,
) => Promise<unknown>;
let updateOrgLogo: (logoUrl: string | null) => Promise<unknown>;
let leaveOrganization: (fd: FormData) => Promise<unknown>;

test.before(async () => {
  const mod = await import("@/app/(dashboard)/settings/actions");
  updateOrganization = mod.updateOrganization;
  toggleBrandPreset = mod.toggleBrandPreset;
  updateProfile = mod.updateProfile;
  updateOrgFeatureSetting = mod.updateOrgFeatureSetting;
  updateShopDefaultPaymentMethod = mod.updateShopDefaultPaymentMethod;
  updateOrgLogo = mod.updateOrgLogo;
  leaveOrganization = mod.leaveOrganization;
});

// ─── Reset helper ────────────────────────────────────────────────────

const orgId = "test-org-id";

function resetAll() {
  captureMock.mock.resetCalls();
  revalidateEntityMock.mock.resetCalls();
  redirectMock.mock.resetCalls();
  mockFrom = {};
  mockCtx = mockActionCtx({ supabase: makeSupabase(), organizationId: orgId });
}

// ═════════════════════════════════════════════════════════════════════
// updateOrganization
// ═════════════════════════════════════════════════════════════════════

test("updateOrganization: rejects missing name", async () => {
  resetAll();
  const result = await updateOrganization(
    undefined,
    formData({ slug: "valid-slug" }),
  );
  assert.deepStrictEqual(result, {
    error: "Байгууллагын нэр шаардлагатай.",
  });
});

test("updateOrganization: rejects short slug", async () => {
  resetAll();
  const result = await updateOrganization(
    undefined,
    formData({ name: "Test Org", slug: "ab" }),
  );
  assert.deepStrictEqual(result, {
    error: "Холбоос хамгийн багадаа 3 тэмдэгттэй байна.",
  });
});

test("updateOrganization: updates successfully", async () => {
  resetAll();
  let capturedPayload: unknown;
  mockFrom = {
    organizations: () => ({
      update: mock.fn((payload: unknown) => {
        capturedPayload = payload;
        return {
          eq: mock.fn(async () => resolved(null)),
        };
      }),
    }),
  };
  mockCtx = mockActionCtx({
    supabase: makeSupabase(),
    organizationId: orgId,
  });

  const result = await updateOrganization(
    undefined,
    formData({ name: " Test Org ", slug: "test-org", company_type: " tech " }),
  );
  assert.deepStrictEqual(result, { success: true });
  assert.deepStrictEqual(capturedPayload, {
    name: "Test Org",
    slug: "test-org",
    company_type: "tech",
  });
  assert.strictEqual(revalidateEntityMock.mock.callCount(), 1);
});

test("updateOrganization: handles DB error", async () => {
  resetAll();
  mockFrom = {
    organizations: () => ({
      update: mock.fn(() => ({
        eq: mock.fn(async () => resolved(null, new Error("db fail"))),
      })),
    }),
  };
  mockCtx = mockActionCtx({
    supabase: makeSupabase(),
    organizationId: orgId,
  });

  const result = await updateOrganization(
    undefined,
    formData({ name: "Test", slug: "test-org" }),
  );
  assert.ok("error" in result);
  assert.ok(
    (result as { error: string }).error.includes("db fail"),
    `expected error to include "db fail", got: ${(result as { error: string }).error}`,
  );
  assert.strictEqual(captureMock.mock.callCount(), 1);
});

// ═════════════════════════════════════════════════════════════════════
// toggleBrandPreset
// ═════════════════════════════════════════════════════════════════════

test("toggleBrandPreset: enables a brand preset (removes from disabled list)", async () => {
  resetAll();
  const selectData = {
    brand_config: { disabled_brand_names: ["Acme", "Brand2"] },
  };
  let updatePayload: unknown;

  mockFrom = {
    organizations: () => ({
      select: mock.fn(() => ({
        eq: mock.fn(() => ({
          single: mock.fn(async () => resolved(selectData)),
        })),
      })),
      update: mock.fn((payload: unknown) => {
        updatePayload = payload;
        return {
          eq: mock.fn(async () => resolved(null)),
        };
      }),
    }),
  };
  mockCtx = mockActionCtx({
    supabase: makeSupabase(),
    organizationId: orgId,
  });

  const result = await toggleBrandPreset(
    undefined,
    formData({ brand_name: "Acme", enabled: "true" }),
  );
  assert.deepStrictEqual(result, { success: true });
  assert.deepStrictEqual(updatePayload, {
    brand_config: { disabled_brand_names: ["Brand2"] },
  });
  assert.strictEqual(revalidateEntityMock.mock.callCount(), 1);
});

test("toggleBrandPreset: disables a brand preset (adds to disabled list)", async () => {
  resetAll();
  const selectData = {
    brand_config: { disabled_brand_names: ["Brand2"] },
  };
  let updatePayload: unknown;

  mockFrom = {
    organizations: () => ({
      select: mock.fn(() => ({
        eq: mock.fn(() => ({
          single: mock.fn(async () => resolved(selectData)),
        })),
      })),
      update: mock.fn((payload: unknown) => {
        updatePayload = payload;
        return {
          eq: mock.fn(async () => resolved(null)),
        };
      }),
    }),
  };
  mockCtx = mockActionCtx({
    supabase: makeSupabase(),
    organizationId: orgId,
  });

  const result = await toggleBrandPreset(
    undefined,
    formData({ brand_name: "Acme", enabled: "false" }),
  );
  assert.deepStrictEqual(result, { success: true });
  assert.deepStrictEqual(updatePayload, {
    brand_config: { disabled_brand_names: ["Brand2", "Acme"] },
  });
});

test("toggleBrandPreset: rejects missing brand_name", async () => {
  resetAll();
  const result = await toggleBrandPreset(
    undefined,
    formData({ enabled: "true" }),
  );
  assert.deepStrictEqual(result, {
    error: "Брэндийн нэр шаардлагатай.",
  });
});

// ═════════════════════════════════════════════════════════════════════
// updateProfile
// ═════════════════════════════════════════════════════════════════════

test("updateProfile: updates successfully", async () => {
  resetAll();
  let capturedPayload: unknown;
  mockFrom = {
    profiles: () => ({
      update: mock.fn((payload: unknown) => {
        capturedPayload = payload;
        return {
          eq: mock.fn(async () => resolved(null)),
        };
      }),
    }),
  };

  const result = await updateProfile(
    undefined,
    formData({ full_name: "  John Doe  " }),
  );
  assert.deepStrictEqual(result, { success: true });
  assert.deepStrictEqual(capturedPayload, { full_name: "John Doe" });
  assert.strictEqual(revalidateEntityMock.mock.callCount(), 1);
});

test("updateProfile: rejects missing full_name", async () => {
  resetAll();
  const result = await updateProfile(undefined, formData({}));
  assert.deepStrictEqual(result, { error: "Нэр шаардлагатай." });
});

// ═════════════════════════════════════════════════════════════════════
// updateOrgFeatureSetting
// ═════════════════════════════════════════════════════════════════════

test("updateOrgFeatureSetting: updates successfully", async () => {
  resetAll();
  // withDbCapture wraps supabase.from("organizations").update({...}),
  // which for this function returns a Promise-like directly (no .eq()).
  mockFrom = {
    organizations: () => ({
      update: mock.fn(() => Promise.resolve({ data: null, error: null })),
    }),
  };
  mockCtx = mockActionCtx({
    supabase: makeSupabase(),
    organizationId: orgId,
  });

  const result = await updateOrgFeatureSetting(
    undefined,
    formData({ setting: "has_inventory", value: "true" }),
  );
  assert.deepStrictEqual(result, { success: true });
  assert.strictEqual(revalidateEntityMock.mock.callCount(), 1);
});

test("updateOrgFeatureSetting: rejects invalid setting", async () => {
  resetAll();
  mockCtx = mockActionCtx({
    supabase: makeSupabase(),
    organizationId: orgId,
  });

  const result = await updateOrgFeatureSetting(
    undefined,
    formData({ setting: "evil_hack", value: "true" }),
  );
  assert.deepStrictEqual(result, { error: "Буруу тохиргоо." });
});

test("updateOrgFeatureSetting: handles DB error", async () => {
  resetAll();
  mockFrom = {
    organizations: () => ({
      update: mock.fn(() =>
        Promise.resolve({ data: null, error: new Error("db fail") }),
      ),
    }),
  };
  mockCtx = mockActionCtx({
    supabase: makeSupabase(),
    organizationId: orgId,
  });

  const result = await updateOrgFeatureSetting(
    undefined,
    formData({ setting: "has_inventory", value: "true" }),
  );
  assert.ok("error" in result);
  assert.ok(
    (result as { error: string }).error.includes("db fail"),
    `expected error to include "db fail", got: ${(result as { error: string }).error}`,
  );
  assert.strictEqual(captureMock.mock.callCount(), 1);
});

// ═════════════════════════════════════════════════════════════════════
// updateShopDefaultPaymentMethod
// ═════════════════════════════════════════════════════════════════════

test("updateShopDefaultPaymentMethod: updates successfully", async () => {
  resetAll();
  let capturedPayload: unknown;
  mockFrom = {
    organizations: () => ({
      update: mock.fn((payload: unknown) => {
        capturedPayload = payload;
        return {
          eq: mock.fn(async () => resolved(null)),
        };
      }),
    }),
  };
  mockCtx = mockActionCtx({
    supabase: makeSupabase(),
    organizationId: orgId,
  });

  const result = await updateShopDefaultPaymentMethod(
    undefined,
    formData({ payment_method: "card" }),
  );
  assert.deepStrictEqual(result, { success: true });
  assert.deepStrictEqual(capturedPayload, {
    shop_default_payment_method: "card",
  });
  assert.strictEqual(revalidateEntityMock.mock.callCount(), 1);
});

test("updateShopDefaultPaymentMethod: rejects invalid payment method", async () => {
  resetAll();
  mockCtx = mockActionCtx({
    supabase: makeSupabase(),
    organizationId: orgId,
  });

  const result = await updateShopDefaultPaymentMethod(
    undefined,
    formData({ payment_method: "bitcoin" }),
  );
  assert.deepStrictEqual(result, { error: "Буруу төлбөрийн хэлбэр." });
});

// ═════════════════════════════════════════════════════════════════════
// updateOrgLogo
// ═════════════════════════════════════════════════════════════════════

test("updateOrgLogo: sets logo URL", async () => {
  resetAll();
  const existingBrandConfig = { radius: 0.5 };
  let updatePayload: unknown;

  mockFrom = {
    organizations: () => ({
      select: mock.fn(() => ({
        eq: mock.fn(() => ({
          single: mock.fn(async () =>
            resolved({ brand_config: existingBrandConfig }),
          ),
        })),
      })),
      update: mock.fn((payload: unknown) => {
        updatePayload = payload;
        return {
          eq: mock.fn(async () => resolved(null)),
        };
      }),
    }),
  };
  mockCtx = mockActionCtx({
    supabase: makeSupabase(),
    organizationId: orgId,
  });

  const result = await updateOrgLogo("https://example.com/logo.png");
  assert.deepStrictEqual(result, { success: true });
  assert.deepStrictEqual(updatePayload, {
    brand_config: { radius: 0.5, logo_url: "https://example.com/logo.png" },
  });
  // updateOrgLogo revalidates both "settings" and "branding"
  assert.strictEqual(revalidateEntityMock.mock.callCount(), 2);
});

test("updateOrgLogo: clears logo (null)", async () => {
  resetAll();
  let updatePayload: unknown;

  mockFrom = {
    organizations: () => ({
      select: mock.fn(() => ({
        eq: mock.fn(() => ({
          single: mock.fn(async () =>
            resolved({
              brand_config: {
                radius: 0.5,
                logo_url: "https://old.com/logo.png",
              },
            }),
          ),
        })),
      })),
      update: mock.fn((payload: unknown) => {
        updatePayload = payload;
        return {
          eq: mock.fn(async () => resolved(null)),
        };
      }),
    }),
  };
  mockCtx = mockActionCtx({
    supabase: makeSupabase(),
    organizationId: orgId,
  });

  const result = await updateOrgLogo(null);
  assert.deepStrictEqual(result, { success: true });
  assert.deepStrictEqual(updatePayload, {
    brand_config: { radius: 0.5, logo_url: null },
  });
});

// ═════════════════════════════════════════════════════════════════════
// leaveOrganization
// ═════════════════════════════════════════════════════════════════════

test("leaveOrganization: rejects missing confirm_name", async () => {
  resetAll();
  const result = await leaveOrganization(formData({}));
  assert.deepStrictEqual(result, {
    error: "Байгууллагын нэрийг бичнэ үү.",
  });
});

test("leaveOrganization: rejects mismatched org name", async () => {
  resetAll();
  mockFrom = {
    profiles: () => ({
      select: mock.fn(() => ({
        eq: mock.fn(() => ({
          single: mock.fn(async () =>
            resolved({
              organization_id: "org-123",
              organizations: { name: "Test Org" },
            }),
          ),
        })),
      })),
    }),
  };

  const result = await leaveOrganization(
    formData({ confirm_name: "Wrong Name" }),
  );
  assert.deepStrictEqual(result, {
    error: "Байгууллагын нэр тохирохгүй байна.",
  });
});

test("leaveOrganization: handles DB error on profile fetch", async () => {
  resetAll();
  mockFrom = {
    profiles: () => ({
      select: mock.fn(() => ({
        eq: mock.fn(() => ({
          single: mock.fn(async () => resolved(null, new Error("db fail"))),
        })),
      })),
    }),
  };

  const result = await leaveOrganization(
    formData({ confirm_name: "Test Org" }),
  );
  // profile is null → profileError captured → profile?.organization_id is falsy
  assert.deepStrictEqual(result, {
    error: "Та аль хэдийн байгууллагаас гарсан байна.",
  });
  assert.strictEqual(captureMock.mock.callCount(), 1);
});

test("leaveOrganization: leaves successfully and redirects", async () => {
  resetAll();
  let updatePayload: unknown;

  mockFrom = {
    profiles: () => ({
      select: mock.fn(() => ({
        eq: mock.fn(() => ({
          single: mock.fn(async () =>
            resolved({
              organization_id: "org-123",
              organizations: { name: "Test Org" },
            }),
          ),
        })),
      })),
      update: mock.fn((payload: unknown) => {
        updatePayload = payload;
        return {
          eq: mock.fn(async () => resolved(null)),
        };
      }),
    }),
  };

  try {
    await leaveOrganization(formData({ confirm_name: "Test Org" }));
    assert.fail("expected redirect to throw");
  } catch (e) {
    assert.ok(e instanceof Error);
    assert.strictEqual(e.message, "REDIRECT");
  }

  assert.deepStrictEqual(updatePayload, {
    organization_id: null,
    role_id: null,
    role: null,
  });
  assert.strictEqual(redirectMock.mock.callCount(), 1);
  assert.strictEqual(
    redirectMock.mock.calls[0].arguments[0],
    "/organization/new",
  );
});
