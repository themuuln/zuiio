/**
 * Shared helpers for server action tests using Node's built-in test runner.
 *
 * Usage in each test file:
 *   1. Setup all mocks BEFORE importing the action module
 *   2. Use createMockSupabase() for the supabase client
 *   3. Use mockActionCtx() to control action context
 *   4. Use formData() to build FormData payloads
 */

import { mock } from "node:test";

// ─── Types ───────────────────────────────────────────────────────────

export interface MockBuilder {
  from: ReturnType<typeof mock.fn>;
  rpc: ReturnType<typeof mock.fn>;
  [key: string]: unknown;
}

// ─── Mock helpers ────────────────────────────────────────────────────

/**
 * Create a mock Supabase client with chainable query builder.
 * Each method returns `self` for chaining.
 * Override per-table behavior via `tableOverrides`.
 */
export function createMockSupabase(
  tableOverrides?: Record<string, Record<string, unknown>>,
): MockBuilder {
  const chainDefaults = () => {
    const self: Record<string, unknown> = {};
    self.select = mock.fn(() => self);
    self.insert = mock.fn(() => self);
    self.update = mock.fn(() => self);
    self.delete = mock.fn(() => self);
    self.eq = mock.fn(() => self);
    self.neq = mock.fn(() => self);
    self.gt = mock.fn(() => self);
    self.gte = mock.fn(() => self);
    self.lt = mock.fn(() => self);
    self.in = mock.fn(() => self);
    self.not = mock.fn(() => self);
    self.is = mock.fn(() => self);
    self.single = mock.fn(() => resolved({ id: "test-id" }));
    self.maybeSingle = mock.fn(() => resolved(null, null));
    self.order = mock.fn(() => self);
    self.limit = mock.fn(() => self);
    self.range = mock.fn(() => self);
    self.rpc = mock.fn(() => resolved({}, null));
    self.textSearch = mock.fn(() => self);
    self.abortSignal = mock.fn(() => self);
    self.returns = mock.fn(() => self);
    self.throwOnError = mock.fn(() => self);
    return self;
  };

  const from = mock.fn((table: string) => {
    const overrides = tableOverrides?.[table];
    if (overrides && typeof overrides === "object") {
      return { ...chainDefaults(), ...overrides };
    }
    return chainDefaults();
  });

  return { from, rpc: mock.fn(() => resolved({}, null)) };
}

/**
 * resolved() returns the shape Supabase resolvers use.
 * Provide `data` (defaults null) and optional `error`.
 */
export function resolved<T>(data: T, error: unknown = null) {
  return Promise.resolve({ data, error });
}

/**
 * An unresolved (pending) promise — for asserting that code handles
 * the loading state or for timing control.
 */
export function unresolved<T>(): Promise<T> {
  return new Promise<T>(() => {});
}

// ─── Action context factory ──────────────────────────────────────────

/**
 * Create a mock action context matching the shape returned by
 * requireActionContext / requireWriteAction.
 */
export function mockActionCtx(overrides?: Record<string, unknown>) {
  return {
    supabase: createMockSupabase(),
    organizationId: "test-org-id",
    userId: "test-user-id",
    branchId: "test-branch-id",
    isBranchScoped: false,
    permissions: [] as string[],
    user: { id: "test-user-id", email: "test@test.com" },
    ...overrides,
  };
}

// ─── FormData builder ────────────────────────────────────────────────

/**
 * Build a FormData from a plain object.
 * Values can be strings (single) or string arrays (multiple appends).
 */
export function formData(
  entries: Record<string, string | string[] | null>,
): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    if (value === null || value === undefined) continue;
    if (Array.isArray(value)) {
      for (const v of value) fd.append(key, v);
    } else {
      fd.set(key, value);
    }
  }
  return fd;
}

// ─── Module mock registration ─────────────────────────────────────────

/**
 * Register a named-exports mock for a module.
 * Must be called BEFORE importing the module that depends on it.
 *
 * Uses Node's `mock.module` via an unchecked cast for Bun compat.
 */
export function mockMod(specifier: string, mod: Record<string, unknown>): void {
  (mock.module as (specifier: string, opts: Record<string, unknown>) => void)(
    specifier,
    { namedExports: mod },
  );
}

/**
 * Register mocks for modules that ALL server action tests need.
 * These are modules that no test file needs to customize.
 *
 * NOTE: Does NOT mock @zuiio/capture, @/lib/revalidate, or @/lib/action-utils
 * because individual test files need to customize their behavior.
 * Each test file must mock those explicitly.
 */
export function registerDefaultMocks(): void {
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
}
