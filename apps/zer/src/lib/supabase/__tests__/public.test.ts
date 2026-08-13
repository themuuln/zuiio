/**
 * Tests for src/lib/supabase/public.ts
 */
import { describe, expect, it, vi } from "vitest";

// --- Mocks ---

const mockGetSupabaseEnv = vi.fn();
vi.mock("../env", () => ({
  getSupabaseEnv: mockGetSupabaseEnv,
}));

const mockCreateServerClient = vi.fn((_url, _key, _opts) => ({}));
vi.mock("@supabase/ssr", () => ({
  createServerClient: mockCreateServerClient,
}));

describe("createPrerenderSafeFetch", () => {
  it("injects next.revalidate into fetch init", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("{}", { status: 200 }));

    const { createPrerenderSafeFetch } = await import("../public");
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

    const { createPrerenderSafeFetch } = await import("../public");
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

  it("creates a cookieless client with the anon key and env url", async () => {
    const { createPublicClient } = await import("../public");
    const client = createPublicClient();

    expect(client).toBeDefined();
    expect(mockCreateServerClient).toHaveBeenCalledWith(
      "https://test.supabase.co",
      "test-anon-key",
      expect.any(Object),
    );
  });

  it("passes empty cookies and a prerender-safe fetch", async () => {
    const { createPublicClient } = await import("../public");
    createPublicClient(60);

    const opts = mockCreateServerClient.mock.calls[0][2];
    expect(opts.cookies.getAll()).toEqual([]);
    expect(opts.global.fetch).toBeTypeOf("function");

    // The wrapper is a prerender-safe fetch: invoking it forwards next.revalidate.
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("{}", { status: 200 }));
    await opts.global.fetch("https://test.supabase.co/rest/v1/x");
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://test.supabase.co/rest/v1/x",
      expect.objectContaining({ next: { revalidate: 60 } }),
    );
    fetchSpy.mockRestore();
  });
});
