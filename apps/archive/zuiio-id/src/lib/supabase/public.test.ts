/**
 * Tests for src/lib/supabase/public.ts — the prerender-safe public client
 * contract (next.revalidate injection + cookieless fallback).
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

// --- Mocks ---

const mockGetSupabaseEnv = vi.fn();
vi.mock("./env", () => ({
  getSupabaseEnv: mockGetSupabaseEnv,
}));

type ClientOptions = {
  cookies: {
    getAll(): Array<{ name: string; value: string }>;
    setAll(
      cookies: Array<{ name: string; value: string; options?: unknown }>,
    ): void;
  };
  global?: { fetch: (input: unknown, init?: unknown) => Promise<Response> };
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

function clientOpts(): ClientOptions {
  if (!capturedOpts) throw new Error("createServerClient was not called");
  return capturedOpts;
}

describe("createPrerenderSafeFetch", () => {
  it("injects next.revalidate into fetch init", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("{}", { status: 200 }));

    const { createPrerenderSafeFetch } = await import("./public");
    const safeFetch = createPrerenderSafeFetch(60);

    await safeFetch("https://api.supabase.co/rest/v1/products", {
      headers: { apikey: "test" },
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      "https://api.supabase.co/rest/v1/products",
      expect.objectContaining({ next: { revalidate: 60 } }),
    );
    fetchSpy.mockRestore();
  });

  it("preserves caller-provided init options", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("{}", { status: 200 }));

    const { createPrerenderSafeFetch } = await import("./public");
    const safeFetch = createPrerenderSafeFetch(30);

    await safeFetch("https://api.supabase.co/rest/v1/products", {
      method: "GET",
      headers: { apikey: "test", prefer: "count=exact" },
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      "https://api.supabase.co/rest/v1/products",
      expect.objectContaining({
        method: "GET",
        headers: { apikey: "test", prefer: "count=exact" },
        next: { revalidate: 30 },
      }),
    );
    fetchSpy.mockRestore();
  });
});

describe("createPublicClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSupabaseEnv.mockReturnValue({
      url: "https://test.supabase.co",
      anonKey: "test-anon-key",
    });
  });

  it("creates a cookieless client with the env url and anon key", async () => {
    const { createPublicClient } = await import("./public");
    const client = createPublicClient();

    expect(client).toBeDefined();
    expect(mockCreateServerClient).toHaveBeenCalledWith(
      "https://test.supabase.co",
      "test-anon-key",
      expect.any(Object),
    );
  });

  it("passes empty cookies and a prerender-safe fetch", async () => {
    const { createPublicClient } = await import("./public");
    createPublicClient();

    const opts = clientOpts();
    expect(opts.cookies.getAll()).toEqual([]);
    expect(() => opts.cookies.setAll([])).not.toThrow();
    const safeFetch = opts.global?.fetch;
    expect(safeFetch).toBeTypeOf("function");
    if (!safeFetch) throw new Error("missing global.fetch");

    // The wrapper is a prerender-safe fetch: invoking it forwards next.revalidate.
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("{}", { status: 200 }));

    await safeFetch("https://test.supabase.co/rest/v1/products", {});
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://test.supabase.co/rest/v1/products",
      expect.objectContaining({ next: { revalidate: 60 } }),
    );
    fetchSpy.mockRestore();
  });
});
