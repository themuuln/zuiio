import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ── Hoisted: mock fns and mutable state ──────────────────────

const { mockCreateServerClient, mockWithCapture, mockCookies } = vi.hoisted(
  () => {
    const cookiesImpl = vi.fn(() => {
      throw new Error("cookies not mocked for this test");
    });
    return {
      mockCreateServerClient: vi.fn((url: string, key: string) => ({
        auth: { getUser: vi.fn(), getSession: vi.fn() },
        from: vi.fn(),
        _url: url,
        _key: key,
      })),
      mockWithCapture: vi.fn(() => vi.fn()),
      /** Mutable reference — set in beforeEach to control per-test behavior. */
      mockCookies: cookiesImpl,
    };
  },
);

// ── Module mocks (hoisted to top, before imports) ─────────────

vi.mock("@supabase/ssr", () => ({
  createServerClient: mockCreateServerClient,
}));

vi.mock("@zuiio/capture", () => ({
  withSupabaseConsoleCapture: mockWithCapture,
}));

vi.mock("next/headers", () => ({
  cookies: mockCookies,
}));

// ── Env restore + module cache reset ──────────────────────────

const ORIGINAL_ENV: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const key of Object.keys(process.env)) {
    ORIGINAL_ENV[key] = process.env[key];
  }
});

afterEach(() => {
  for (const key of Object.keys(process.env)) {
    delete process.env[key];
  }
  for (const [key, val] of Object.entries(ORIGINAL_ENV)) {
    if (val !== undefined) process.env[key] = val;
  }
  // Clear module cache so next import re-evaluates hasSupabaseEnv
  vi.resetModules();
});

// ── Test helpers ──────────────────────────────────────────────

function lastCallUrl(): string {
  return mockCreateServerClient.mock.lastCall?.[0] ?? "";
}

function lastCallKey(): string {
  return mockCreateServerClient.mock.lastCall?.[1] ?? "";
}

function lastCallConfig(): Record<string, unknown> {
  return (mockCreateServerClient.mock.lastCall?.[2] ?? {}) as Record<
    string,
    unknown
  >;
}

// ── No-env path (hasSupabaseEnv = false) ──────────────────────

describe("createClient — no env vars (prerender)", () => {
  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  });

  it("returns a client without error", async () => {
    // Dynamic import: hasSupabaseEnv is evaluated at module load time.
    // vi.resetModules() + await import() is the standard vitest pattern
    // for testing module-level state depending on process.env.
    const { createClient } = await import("./server");
    const client = await createClient();
    expect(client).toBeDefined();
  });

  it("creates a noop client with placeholder URL", async () => {
    const { createClient } = await import("./server");
    await createClient();
    expect(lastCallUrl()).toBe("https://placeholder.supabase.co");
  });

  it("creates a noop client with placeholder key", async () => {
    const { createClient } = await import("./server");
    await createClient();
    expect(lastCallKey()).toBe("placeholder");
  });

  it("includes noopFetch as global.fetch", async () => {
    const { createClient } = await import("./server");
    await createClient();
    const config = lastCallConfig();
    const globalCfg = config?.global as { fetch?: unknown };
    expect(typeof globalCfg?.fetch).toBe("function");
  });

  it("returns empty cookies from noop client", async () => {
    const { createClient } = await import("./server");
    await createClient();
    const cookiesCfg = lastCallConfig()?.cookies as {
      getAll: () => unknown[];
    };
    expect(cookiesCfg.getAll()).toEqual([]);
  });
});

// ── Bad URL (no http prefix) ──────────────────────────────────

describe("createClient — URL without http prefix", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "localhost:54321";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
  });

  it("falls back to noop client (placeholder URL)", async () => {
    const { createClient } = await import("./server");
    await createClient();
    expect(lastCallUrl()).toBe("https://placeholder.supabase.co");
  });
});

// ── Env present, cookies() rejects (prerender) ───────────────

describe("createClient — env present but cookies() throws", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost:54321";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
    mockCookies.mockImplementation(() => {
      throw new Error("prerender");
    });
  });

  it("returns a client without error", async () => {
    const { createClient } = await import("./server");
    const client = await createClient();
    expect(client).toBeDefined();
  });

  it("falls back to noop client when cookie store throws", async () => {
    const { createClient } = await import("./server");
    await createClient();
    expect(lastCallUrl()).toBe("https://placeholder.supabase.co");
  });
});

// ── Happy path (env + cookies work) ──────────────────────────

describe("createClient — env present and cookies() works", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost:54321";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
    mockCookies.mockImplementation(() => ({
      getAll: vi.fn(() => []),
      set: vi.fn(),
    }));
  });

  it("calls createServerClient with the URL from env", async () => {
    const { createClient } = await import("./server");
    await createClient();
    expect(lastCallUrl()).toBe("http://localhost:54321");
  });

  it("calls createServerClient with the anon key from env", async () => {
    const { createClient } = await import("./server");
    await createClient();
    expect(lastCallKey()).toBe("test-anon-key");
  });

  it("prefers publishable key over anon key", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_test";
    const { createClient } = await import("./server");
    await createClient();
    expect(lastCallKey()).toBe("sb_publishable_test");
  });

  it("passes cookie helpers to createServerClient", async () => {
    const { createClient } = await import("./server");
    await createClient();

    const cookiesConfig = lastCallConfig()?.cookies as {
      getAll: () => unknown[];
      setAll: (cookies: unknown[]) => void;
    };

    expect(cookiesConfig).toBeDefined();
    expect(typeof cookiesConfig.getAll).toBe("function");
    expect(typeof cookiesConfig.setAll).toBe("function");
  });

  it("uses withSupabaseConsoleCapture for global.fetch", async () => {
    const { createClient } = await import("./server");
    await createClient();
    const globalCfg = lastCallConfig()?.global as { fetch?: unknown };
    expect(globalCfg?.fetch).toBeDefined();
    expect(typeof globalCfg?.fetch).toBe("function");
  });
});
