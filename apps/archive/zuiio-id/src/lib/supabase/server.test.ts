/**
 * Tests for src/lib/supabase/server.ts — the empty-store cookies() fallback
 * that keeps createClient usable in prerendered (PPR shell) contexts.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

// --- Mocks ---

const mockGetSupabaseEnv = vi.fn(() => ({
  url: "https://test.supabase.co",
  anonKey: "test-anon-key",
}));
vi.mock("./env", () => ({
  getSupabaseEnv: mockGetSupabaseEnv,
}));

const mockCookies = vi.fn();
vi.mock("next/headers", () => ({
  cookies: mockCookies,
}));

type ClientOptions = {
  cookies: {
    getAll(): Array<{ name: string; value: string }>;
    setAll(
      cookies: Array<{ name: string; value: string; options?: unknown }>,
    ): void;
  };
};

let capturedOpts: ClientOptions | null = null;
const mockCreateServerClient = vi.fn(
  (_url: string, _key: string, opts: ClientOptions) => {
    capturedOpts = opts;
    return {};
  },
);
vi.mock("@supabase/ssr", () => ({
  createServerClient: mockCreateServerClient,
}));

async function clientOpts(): Promise<ClientOptions> {
  const { createClient } = await import("./server");
  await createClient();
  if (!capturedOpts) throw new Error("createServerClient was not called");
  return capturedOpts;
}

describe("createClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCookies.mockReset();
  });

  it("reads cookies when available", async () => {
    mockCookies.mockResolvedValue({
      getAll: () => [{ name: "sb-session", value: "abc" }],
      set: vi.fn(),
    });

    const opts = await clientOpts();
    expect(opts.cookies.getAll()).toEqual([
      { name: "sb-session", value: "abc" },
    ]);
  });

  it("falls back to an empty store when cookies() throws (prerender)", async () => {
    mockCookies.mockRejectedValue(new Error("cookies() outside request scope"));

    const opts = await clientOpts();
    // Client is still constructed; no session is read or written.
    expect(opts.cookies.getAll()).toEqual([]);
    expect(() => opts.cookies.setAll([])).not.toThrow();
  });

  it("swallows getAll/setAll store errors", async () => {
    mockCookies.mockResolvedValue({
      getAll: () => {
        throw new Error("store closed");
      },
      set: () => {
        throw new Error("store closed");
      },
    });

    const opts = await clientOpts();
    expect(opts.cookies.getAll()).toEqual([]);
    expect(() =>
      opts.cookies.setAll([{ name: "a", value: "b", options: {} }]),
    ).not.toThrow();
  });
});
