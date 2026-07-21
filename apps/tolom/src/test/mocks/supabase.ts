import { vi } from "vitest";

function chainableMock() {
  const methods: Record<string, ReturnType<typeof vi.fn>> = {};
  const proxy = new Proxy(
    {},
    {
      get(_target, prop: string) {
        if (!(prop in methods)) {
          methods[prop] = vi.fn().mockReturnValue(chainableMock());
        }
        return methods[prop];
      },
    },
  );
  return proxy;
}

/**
 * Creates a mock Supabase client for unit tests.
 *
 * The mock returns a shared query builder (qb) from `.from()`. All chainable
 * methods (`.select()`, `.eq()`, `.insert()`, `.update()`, etc.) return `qb`
 * itself, enabling natural chaining.
 *
 * `qb` is also thenable — `await qb` resolves to `{ data: null, error: null }`
 * by default. Override this by calling `mockReturnValue(qb)` on `.single()` or
 * `.maybeSingle()` before the chain runs.
 *
 * @example
 * // Simple query (no terminal method)
 * db.from("expenses").select.mockResolvedValueOnce({ data: [...], error: null });
 * const result = await getExpenses(db, "org-1");
 *
 * // Query with .single()
 * const thenData = { data: { id: "1" }, error: null };
 * db.from("expenses").single.mockReturnValue(qb); // qb.then() resolves to thenData
 * // ... set thenData before the chain runs
 *
 * // Mutation (update/delete without terminal method)
 * await deleteExpense(db, "exp-1", "org-1", "user-1");
 * // qb is thenable — resolves with { data: null, error: null }
 */
export type MockSupabaseClient = ReturnType<typeof createMockSupabaseClient>;

export function createMockSupabaseClient() {
  const qb: Record<string, ReturnType<typeof vi.fn>> & {
    then: Function;
  } = {} as any;

  // Track what the query builder should resolve to when awaited.
  // Tests set this before the chain runs to control the resolved value.
  let thenResolveData: { data: unknown; error: unknown } = {
    data: null,
    error: null,
  };

  const terminalMethods = ["single", "maybeSingle"];
  const chainableMethods = [
    "select",
    "insert",
    "update",
    "delete",
    "upsert",
    "eq",
    "neq",
    "gt",
    "gte",
    "lt",
    "lte",
    "is",
    "in",
    "contains",
    "like",
    "ilike",
    "or",
    "and",
    "not",
    "order",
    "limit",
    "range",
    "throwOnError",
    "setHeader",
  ];

  for (const method of terminalMethods) {
    qb[method] = vi.fn().mockReturnValue(qb);
  }
  for (const method of chainableMethods) {
    qb[method] = vi.fn().mockReturnValue(qb);
  }
  qb.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });

  // Queue for one-shot resolve values (sequential awaits).
  const resolveOnceQueue: { data: unknown; error: unknown }[] = [];

  // Make qb thenable: `await qb` resolves to thenResolveData.
  // This mirrors real Supabase: .select().eq() is both chainable AND a Promise.
  qb.then = (
    onFulfilled?: (value: any) => any,
    onRejected?: (reason: any) => any,
  ) => {
    // Use resolveOnce queue if available, else persistent resolveWith
    if (resolveOnceQueue.length > 0) {
      return Promise.resolve(resolveOnceQueue.shift()!).then(onFulfilled, onRejected);
    }
    return Promise.resolve(thenResolveData).then(onFulfilled, onRejected);
  };
  qb.catch = (onRejected?: (reason: any) => any) =>
    Promise.resolve(thenResolveData).catch(onRejected);

  // Expose internals so tests can control what the query builder resolves to.
  // Usage: client.__qb.resolveWith({ data: [...], error: null });
  const __qb = {
    /** Set the value that `await qb` resolves to (persistent until next resolve). */
    resolveWith(value: unknown) {
      thenResolveData = value as { data: unknown; error: unknown };
    },
    /** Resolve the NEXT await(s) only, then fall back to resolveWith value.
     *  Each call pushes one item onto a queue — for multi-await scenarios. */
    resolveOnce(value: unknown) {
      resolveOnceQueue.push(value as { data: unknown; error: unknown });
    },
    /** Reset to default { data: null, error: null }. */
    reset() {
      thenResolveData = { data: null, error: null };
      resolveOnceQueue.length = 0;
    },
  };

  // Stub properties required by SupabaseClient type
  const mock = {
    from: vi.fn().mockReturnValue(qb),
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "test-user-id" } },
        error: null,
      }),
      getSession: vi
        .fn()
        .mockResolvedValue({ data: { session: null }, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      onAuthStateChange: vi
        .fn()
        .mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signInWithOtp: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
      setSession: vi.fn(),
    },
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    storage: chainableMock(),
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
    }),
    schema: vi.fn().mockReturnValue(qb),
    removeChannel: vi.fn(),
    removeAllChannels: vi.fn().mockResolvedValue([]),
    getChannels: vi.fn().mockReturnValue([]),
    supabaseUrl: "http://localhost:54321",
    supabaseKey: "test-key",
    authUrl: new URL("http://localhost:54321/auth/v1"),
    storageUrl: new URL("http://localhost:54321/storage/v1"),
    functionsUrl: new URL("http://localhost:54321/functions/v1"),
    realtimeUrl: new URL("ws://localhost:54321/realtime/v1"),
    storageKey: "test-storage-key",
    headers: {},
    fetch: undefined,
    realtime: {} as any,
    rest: {} as any,
    functions: {} as any,
    __qb,
  };

  return mock;
}

// ── Server client mock helper ─────────────────────────────────
// Eliminates boilerplate in module tests that need to mock the
// server-side createClient() from src/lib/supabase/server.ts.
//
// Usage:
//   import { setupMockServerClient, createMockSupabaseClient } from "@/test/mocks/supabase";
//
//   const { mockCreateClient, mockClient } = setupMockServerClient();
//   mockCreateClient.mockResolvedValue(mockClient as never);
//   // mockClient.from(...) works out of the box
//   const { myService } = await import("./my-service");
//   await myService();

/** The mock module to import into tests — exported so beforeEach can clear it. */
export type MockCreateClient = ReturnType<typeof vi.fn>;

export function setupMockServerClient() {
  const mockClient = createMockSupabaseClient();
  const mockCreateClient = vi.fn();
  return { mockClient, mockCreateClient };
}
