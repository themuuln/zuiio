/**
 * Tests for src/lib/org-settings.ts — checkOrgSetting.
 */

import assert from "node:assert/strict";
import test, { mock } from "node:test";

// ─── Mocks: must be before any module imports ─────────────────────────
// server-only throws at import in non-server context - must be mocked first
const _serverOnlyMock = mock.module("server-only", {
  exports: {},
});

const captureSpy = mock.fn();
mock.module("@zuiio/capture", {
  exports: { capture: captureSpy },
});

import { resolved } from "./actions-helpers";

let mockOrgSetting: Record<string, boolean | null> | null = null;
let mockQueryError: Error | null = null;

function makeSupabase() {
  return {
    from: mock.fn((table: string) => {
      assert.equal(table, "organizations");
      return {
        select: mock.fn(() => ({
          eq: mock.fn(() => ({
            single: mock.fn(async () => {
              if (mockQueryError) return { data: null, error: mockQueryError };
              return resolved(mockOrgSetting);
            }),
          })),
        })),
      };
    }),
  };
}

let checkOrgSetting: (
  supabase: unknown,
  organizationId: string,
  setting: string,
) => Promise<boolean>;

test.before(async () => {
  const mod = await import("@/lib/org-settings");
  checkOrgSetting = mod.checkOrgSetting;
});

test.beforeEach(() => {
  captureSpy.mock.resetCalls();
  mockOrgSetting = null;
  mockQueryError = null;
});

// ─── Tests ────────────────────────────────────────────────────────────

test("checkOrgSetting returns true when setting is explicitly true", async () => {
  mockOrgSetting = { has_inventory: true };
  const result = await checkOrgSetting(
    makeSupabase(),
    "org-123",
    "has_inventory",
  );
  assert.equal(result, true);
});

test("checkOrgSetting returns false when setting is explicitly false", async () => {
  mockOrgSetting = { has_inventory: false };
  const result = await checkOrgSetting(
    makeSupabase(),
    "org-123",
    "has_inventory",
  );
  assert.equal(result, false);
});

test("checkOrgSetting returns true when setting is null (default)", async () => {
  mockOrgSetting = { has_variants: null };
  const result = await checkOrgSetting(
    makeSupabase(),
    "org-123",
    "has_variants",
  );
  assert.equal(result, true);
});

test("checkOrgSetting returns true when setting is undefined in data", async () => {
  mockOrgSetting = {};
  const result = await checkOrgSetting(
    makeSupabase(),
    "org-123",
    "has_variants",
  );
  assert.equal(result, true);
});

test("checkOrgSetting returns false on query error and captures it", async () => {
  mockQueryError = new Error("DB connection failed");
  const result = await checkOrgSetting(
    makeSupabase(),
    "org-123",
    "has_inventory",
  );
  assert.equal(result, false);
  assert.equal(captureSpy.mock.calls.length, 1);
  const callArg = captureSpy.mock.calls[0].arguments[0];
  assert.equal(callArg.message, "DB connection failed");
});

test("checkOrgSetting throws for invalid setting column", async () => {
  await assert.rejects(
    () => checkOrgSetting(makeSupabase(), "org-123", "invalid_column_name"),
    /Invalid org setting column/,
  );
});

test("checkOrgSetting: has_suppliers is a valid setting", async () => {
  mockOrgSetting = { has_suppliers: true };
  const result = await checkOrgSetting(
    makeSupabase(),
    "org-123",
    "has_suppliers",
  );
  assert.equal(result, true);
});

test("checkOrgSetting: onboarding_completed is a valid setting", async () => {
  mockOrgSetting = { onboarding_completed: false };
  const result = await checkOrgSetting(
    makeSupabase(),
    "org-123",
    "onboarding_completed",
  );
  assert.equal(result, false);
});
