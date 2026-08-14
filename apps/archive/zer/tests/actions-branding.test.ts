/**
 * Tests for `settings/branding/actions.ts` — updateBrandConfig.
 */

import assert from "node:assert/strict";
import test, { mock } from "node:test";
import { formData, mockActionCtx, mockMod, resolved } from "./actions-helpers";

// ─── Global mocks ────────────────────────────────────────────────────

const withDbCaptureMock = mock.fn(async (_name: string, query: unknown) => {
  return await (query as Promise<unknown>);
});
const captureMock = mock.fn(() => {});
mockMod("@zuiio/capture", {
  capture: captureMock,
  withDbCapture: withDbCaptureMock,
});

const revalidateEntitiesMock = mock.fn(() => {});
const revalidateEntityTagMock = mock.fn(() => {});
const revalidateEntityMock = mock.fn(() => {});
mockMod("@/lib/revalidate", {
  revalidateEntities: revalidateEntitiesMock,
  revalidateEntityTag: revalidateEntityTagMock,
  revalidateEntity: revalidateEntityMock,
});

mockMod("@/lib/audit", { logAuditEventWithClient: mock.fn(async () => {}) });
mockMod("next/server", { after: (fn: () => unknown) => fn() });
mockMod("next/cache", {
  revalidatePath: mock.fn(() => {}),
  revalidateTag: mock.fn(() => {}),
});
mockMod("server-only", {});

// ─── Branding-specific mocks ─────────────────────────────────────────

const getThemeMock = mock.fn((theme: string) =>
  theme === "zinc" || theme === "neutral" ? theme : null,
);
const getFontMock = mock.fn((font: string) =>
  font === "Inter" || font === "Noto Sans" ? font : null,
);
const isValidColorValueMock = mock.fn((val: string) =>
  /^#[0-9a-fA-F]{3,6}$/.test(val),
);
mockMod("@/lib/branding", {
  DEFAULT_BRAND_CONFIG: { radius: 0.5, logo_url: null },
  getTheme: getThemeMock,
  getFont: getFontMock,
  isValidColorValue: isValidColorValueMock,
});

// ─── Supabase mock builder ───────────────────────────────────────────

/**
 * Build a minimal supabase client mock for branding tests.
 * - fetchResult: data returned by .from("organizations").select(...).eq(...).single()
 * - updateResult: data/error returned by .from("organizations").update(...).eq(...)
 */
function buildSupabase(
  opts: {
    fetchResult?: { data: unknown; error: unknown };
    updateResult?: { data: unknown; error: unknown };
  } = {},
) {
  const fetch = opts.fetchResult ?? { data: null, error: null };
  const update = opts.updateResult ?? { data: null, error: null };

  const eqForUpdate = mock.fn(() => resolved(update.data, update.error));
  const updateMethod = mock.fn(() => ({ eq: eqForUpdate }));

  const single = mock.fn(() => resolved(fetch.data, fetch.error));
  const eqForSelect = mock.fn(() => ({ single }));
  const selectMethod = mock.fn(() => ({ eq: eqForSelect }));

  const from = mock.fn(() => ({ select: selectMethod, update: updateMethod }));

  return {
    from,
    _select: selectMethod,
    _update: updateMethod,
    _eqForSelect: eqForSelect,
    _eqForUpdate: eqForUpdate,
    _single: single,
  };
}

// ─── Action context ──────────────────────────────────────────────────

const orgId = "org-test-123";
let supabase: ReturnType<typeof buildSupabase>;
let mockCtx: Record<string, unknown>;

mockMod("@/lib/action-utils", {
  requireActionContext: mock.fn(async () => mockCtx),
  requireWriteAction: mock.fn(async () => mockCtx),
});

// ─── Lazy-loaded action ──────────────────────────────────────────────

let updateBrandConfig: (prevState: unknown, fd: FormData) => Promise<unknown>;

test.before(async () => {
  const mod = await import("@/app/(dashboard)/settings/branding/actions");
  updateBrandConfig = mod.updateBrandConfig;
});

// ─── Reset helpers ───────────────────────────────────────────────────

function resetMocks() {
  captureMock.mock.resetCalls();
  revalidateEntityMock.mock.resetCalls();
  getThemeMock.mock.resetCalls();
  getFontMock.mock.resetCalls();
  isValidColorValueMock.mock.resetCalls();
}

function buildCtx(supabaseClient: ReturnType<typeof buildSupabase>) {
  mockCtx = mockActionCtx({
    supabase: supabaseClient,
    organizationId: orgId,
  });
}

// ═════════════════════════════════════════════════════════════════════
// updateBrandConfig
// ═════════════════════════════════════════════════════════════════════

test("updateBrandConfig: rejects missing theme", async () => {
  resetMocks();
  supabase = buildSupabase();
  buildCtx(supabase);

  const result = await updateBrandConfig(undefined, formData({}));

  assert.deepStrictEqual(result, {
    error: "Сэдвийн нэр шаардлагатай.",
  });
});

test("updateBrandConfig: rejects invalid theme", async () => {
  resetMocks();
  supabase = buildSupabase();
  buildCtx(supabase);

  const result = await updateBrandConfig(
    undefined,
    formData({ theme: "nonexistent" }),
  );

  assert.deepStrictEqual(result, {
    error: "Сонгосон сэдэв буруу байна.",
  });
});

test("updateBrandConfig: rejects radius < 0", async () => {
  resetMocks();
  supabase = buildSupabase();
  buildCtx(supabase);

  const result = await updateBrandConfig(
    undefined,
    formData({ theme: "zinc", radius: "-0.5" }),
  );

  assert.deepStrictEqual(result, {
    error: "Булангийн радиус 0-2 хооронд байна.",
  });
});

test("updateBrandConfig: rejects radius > 2", async () => {
  resetMocks();
  supabase = buildSupabase();
  buildCtx(supabase);

  const result = await updateBrandConfig(
    undefined,
    formData({ theme: "zinc", radius: "3.0" }),
  );

  assert.deepStrictEqual(result, {
    error: "Булангийн радиус 0-2 хооронд байна.",
  });
});

test("updateBrandConfig: rejects invalid custom_color value", async () => {
  resetMocks();
  supabase = buildSupabase();
  buildCtx(supabase);

  const result = await updateBrandConfig(
    undefined,
    formData({ theme: "zinc", custom_primary: "not-a-color" }),
  );

  assert.deepStrictEqual(result, {
    error: `"primary" өнгөний утга буруу байна.`,
  });
});

test("updateBrandConfig: rejects invalid font_body", async () => {
  resetMocks();
  supabase = buildSupabase();
  buildCtx(supabase);

  const result = await updateBrandConfig(
    undefined,
    formData({ theme: "zinc", font_body: "Comic Sans" }),
  );

  assert.deepStrictEqual(result, {
    error: "Сонгосон фонт буруу байна.",
  });
});

test("updateBrandConfig: rejects invalid font_heading", async () => {
  resetMocks();
  supabase = buildSupabase();
  buildCtx(supabase);

  const result = await updateBrandConfig(
    undefined,
    formData({ theme: "zinc", font_heading: "Papyrus" }),
  );

  assert.deepStrictEqual(result, {
    error: "Сонгосон гарчиг фонт буруу байна.",
  });
});

test("updateBrandConfig: updates brand config successfully with all fields", async () => {
  resetMocks();
  supabase = buildSupabase({
    fetchResult: {
      data: { brand_config: { logo_url: "existing.png" } },
      error: null,
    },
  });
  buildCtx(supabase);

  const result = await updateBrandConfig(
    undefined,
    formData({
      theme: "neutral",
      radius: "1.5",
      custom_primary: "#ff0000",
      custom_secondary: "#00ff00",
      custom_accent: "#0000ff",
      font_body: "Inter",
      font_heading: "Noto Sans",
    }),
  );

  assert.deepStrictEqual(result, { success: true });

  // Verify select was called for fetching existing config (removeLogo not set)
  assert.strictEqual(supabase._select.mock.callCount(), 1);
  assert.strictEqual(supabase._single.mock.callCount(), 1);

  // Verify update was called with correct config
  const updateCall = supabase._update.mock.calls[0];
  const updateArg = (updateCall.arguments as unknown[])[0] as Record<
    string,
    unknown
  >;
  const config = updateArg.brand_config as Record<string, unknown>;
  assert.strictEqual(config.theme, "neutral");
  assert.strictEqual(config.radius, 1.5);
  assert.deepStrictEqual(config.custom_colors, {
    primary: "#ff0000",
    secondary: "#00ff00",
    accent: "#0000ff",
  });
  assert.strictEqual(config.font_body, "Inter");
  assert.strictEqual(config.font_heading, "Noto Sans");
  assert.strictEqual(config.logo_url, "existing.png");
});

test("updateBrandConfig: preserves logo from existing config when removeLogo=false", async () => {
  resetMocks();
  supabase = buildSupabase({
    fetchResult: {
      data: { brand_config: { logo_url: "old-logo.png" } },
      error: null,
    },
  });
  buildCtx(supabase);

  const result = await updateBrandConfig(
    undefined,
    formData({ theme: "zinc" }),
  );

  assert.deepStrictEqual(result, { success: true });

  // Verify select was called to fetch existing config
  assert.strictEqual(supabase._select.mock.callCount(), 1);
  assert.strictEqual(supabase._single.mock.callCount(), 1);

  const updateCall = supabase._update.mock.calls[0];
  const config = (updateCall.arguments as unknown[])[0] as Record<
    string,
    unknown
  >;
  assert.strictEqual(
    (config.brand_config as Record<string, unknown>).logo_url,
    "old-logo.png",
  );
});

test("updateBrandConfig: uses uploaded logo_url when provided", async () => {
  resetMocks();
  supabase = buildSupabase({
    fetchResult: {
      data: { brand_config: { logo_url: "old-logo.png" } },
      error: null,
    },
  });
  buildCtx(supabase);

  const result = await updateBrandConfig(
    undefined,
    formData({
      theme: "zinc",
      logo_url: "new-logo.png",
    }),
  );

  assert.deepStrictEqual(result, { success: true });

  const updateCall = supabase._update.mock.calls[0];
  const config = (updateCall.arguments as unknown[])[0] as Record<
    string,
    unknown
  >;
  assert.strictEqual(
    (config.brand_config as Record<string, unknown>).logo_url,
    "new-logo.png",
  );
});

test("updateBrandConfig: sets logo_url to null when removeLogo=true", async () => {
  resetMocks();
  supabase = buildSupabase();
  buildCtx(supabase);

  const result = await updateBrandConfig(
    undefined,
    formData({
      theme: "zinc",
      remove_logo: "true",
    }),
  );

  assert.deepStrictEqual(result, { success: true });

  // When removeLogo=true, select should NOT be called (no fetch)
  assert.strictEqual(supabase._select.mock.callCount(), 0);

  const updateCall = supabase._update.mock.calls[0];
  const config = (updateCall.arguments as unknown[])[0] as Record<
    string,
    unknown
  >;
  assert.strictEqual(
    (config.brand_config as Record<string, unknown>).logo_url,
    null,
  );
});

test("updateBrandConfig: handles DB update error", async () => {
  resetMocks();
  supabase = buildSupabase({
    updateResult: { data: null, error: { message: "connection refused" } },
  });
  buildCtx(supabase);

  const result = await updateBrandConfig(
    undefined,
    formData({ theme: "zinc", remove_logo: "true" }),
  );

  assert.deepStrictEqual(result, {
    error: "Хадгалахад алдаа гарлаа: connection refused",
  });
  assert.strictEqual(captureMock.mock.callCount(), 1);
});

test("updateBrandConfig: calls revalidateEntity on success", async () => {
  resetMocks();
  supabase = buildSupabase();
  buildCtx(supabase);

  await updateBrandConfig(
    undefined,
    formData({ theme: "zinc", remove_logo: "true" }),
  );

  assert.strictEqual(revalidateEntityMock.mock.callCount(), 2);
  const calls = revalidateEntityMock.mock.calls;
  assert.strictEqual(calls[0].arguments[0], "branding");
  assert.strictEqual(calls[1].arguments[0], "settings");
});

test("updateBrandConfig: defaults radius to DEFAULT_BRAND_CONFIG.radius when not provided", async () => {
  resetMocks();
  supabase = buildSupabase();
  buildCtx(supabase);

  const result = await updateBrandConfig(
    undefined,
    formData({ theme: "zinc", remove_logo: "true" }),
  );

  assert.deepStrictEqual(result, { success: true });

  const updateCall = supabase._update.mock.calls[0];
  const updateArg = (updateCall.arguments as unknown[])[0] as Record<
    string,
    unknown
  >;
  const config = updateArg.brand_config as Record<string, unknown>;
  assert.strictEqual(config.radius, 0.5);
});
