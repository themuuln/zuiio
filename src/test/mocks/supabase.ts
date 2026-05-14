import { vi } from "vitest";

function chainableMock() {
  const methods: Record<string, ReturnType<typeof vi.fn>> = {};
  const proxy = new Proxy(
    {},
    {
      get(_target, prop) {
        if (typeof prop === "string" && !(prop in methods)) {
          methods[prop] = vi.fn().mockReturnValue(chainableMock());
        }
        return methods[prop];
      },
    },
  );
  return proxy;
}

export function createMockSupabaseClient() {
  return {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      gt: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      contains: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      and: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      single: vi.fn(),
      maybeSingle: vi.fn(),
      throwOnError: vi.fn().mockReturnThis(),
      setHeader: vi.fn().mockReturnThis(),
    }),
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "test-user-id" } },
        error: null,
      }),
      getSession: vi.fn(),
      signOut: vi.fn(),
    },
    rpc: vi.fn(),
    storage: chainableMock(),
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
    }),
    removeChannel: vi.fn(),
  };
}
