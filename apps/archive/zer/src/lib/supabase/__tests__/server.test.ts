/**
 * Tests for src/lib/supabase/server.ts
 */
import { describe, expect, it, vi } from "vitest";

// --- Mocks ---

const mockCookieGetAll = vi.fn();
const mockCookieSet = vi.fn();
const mockCookies = vi.fn(() => ({
  getAll: mockCookieGetAll,
  set: mockCookieSet,
}));

vi.mock("next/headers", () => ({
  cookies: mockCookies,
}));

const mockGetSupabaseEnv = vi.fn();
vi.mock("../env", () => ({
  getSupabaseEnv: mockGetSupabaseEnv,
}));

const mockSupabaseFetch = vi.fn();
const mockWithSupabaseConsoleCapture = vi.fn(() => mockSupabaseFetch);
vi.mock("@zuiio/capture", () => ({
  withSupabaseConsoleCapture: mockWithSupabaseConsoleCapture,
}));

const mockCreateServerClient = vi.fn((_url, _key, _opts) => ({}));
vi.mock("@supabase/ssr", () => ({
  createServerClient: mockCreateServerClient,
}));

describe("createClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns a supabase client when env vars are set", async () => {
    mockGetSupabaseEnv.mockReturnValue({
      url: "https://test.supabase.co",
      anonKey: "test-anon-key",
    });

    const { createClient } = await import("../server");
    const client = await createClient();

    expect(client).toBeDefined();
    expect(mockCreateServerClient).toHaveBeenCalledTimes(1);
  });

  it("calls getSupabaseEnv to get url and anonKey", async () => {
    const testUrl = "https://test.supabase.co";
    const testKey = "test-anon-key";
    mockGetSupabaseEnv.mockReturnValue({ url: testUrl, anonKey: testKey });

    const { createClient } = await import("../server");
    await createClient();

    expect(mockGetSupabaseEnv).toHaveBeenCalledTimes(1);
    expect(mockCreateServerClient).toHaveBeenCalledWith(
      testUrl,
      testKey,
      expect.objectContaining({
        cookies: expect.any(Object),
      }),
    );
  });

  it("passes cookies.getAll handler that delegates to cookieStore.getAll", async () => {
    mockGetSupabaseEnv.mockReturnValue({
      url: "https://test.supabase.co",
      anonKey: "test-anon-key",
    });
    const cookiesData = [
      { name: "sb-auth", value: "token123" },
      { name: "prefs", value: "dark" },
    ];
    mockCookieGetAll.mockReturnValue(cookiesData);

    const { createClient } = await import("../server");
    await createClient();

    const cookiesConfig = mockCreateServerClient.mock.calls[0][2].cookies;
    const result = cookiesConfig.getAll();

    expect(mockCookieGetAll).toHaveBeenCalledTimes(1);
    expect(result).toEqual(cookiesData);
  });

  it("handles cookie store errors in getAll by returning empty array", async () => {
    mockGetSupabaseEnv.mockReturnValue({
      url: "https://test.supabase.co",
      anonKey: "test-anon-key",
    });
    mockCookieGetAll.mockImplementation(() => {
      throw new Error("cookies unavailable during prerender");
    });

    const { createClient } = await import("../server");
    await createClient();

    const cookiesConfig = mockCreateServerClient.mock.calls[0][2].cookies;
    const result = cookiesConfig.getAll();

    expect(result).toEqual([]);
  });

  it("falls back to an empty cookie store when cookies() rejects during prerendering", async () => {
    mockGetSupabaseEnv.mockReturnValue({
      url: "https://test.supabase.co",
      anonKey: "test-anon-key",
    });
    mockCookies.mockRejectedValueOnce(
      new Error("During prerendering, cookies() rejects when the prerender terminates"),
    );

    const { createClient } = await import("../server");
    // Must NOT throw — React.cache would memoize the rejected promise and
    // poison every later request on this module.
    const client = await createClient();

    expect(client).toBeDefined();
    const cookiesConfig = mockCreateServerClient.mock.calls[0][2].cookies;
    expect(cookiesConfig.getAll()).toEqual([]);
  });

  it("passes cookies.setAll handler that delegates to cookieStore.set", async () => {
    mockGetSupabaseEnv.mockReturnValue({
      url: "https://test.supabase.co",
      anonKey: "test-anon-key",
    });

    const { createClient } = await import("../server");
    await createClient();

    const cookiesToSet = [
      { name: "sb-auth", value: "token456", options: { path: "/" } },
    ];
    const cookiesConfig = mockCreateServerClient.mock.calls[0][2].cookies;
    cookiesConfig.setAll(cookiesToSet);

    expect(mockCookieSet).toHaveBeenCalledTimes(1);
    expect(mockCookieSet).toHaveBeenCalledWith("sb-auth", "token456", {
      path: "/",
    });
  });

  it("handles cookie store errors in setAll silently", async () => {
    mockGetSupabaseEnv.mockReturnValue({
      url: "https://test.supabase.co",
      anonKey: "test-anon-key",
    });
    mockCookieSet.mockImplementation(() => {
      throw new Error("set failed");
    });

    const { createClient } = await import("../server");
    await createClient();

    const cookiesToSet = [
      { name: "sb-fail", value: "oops", options: { path: "/" } },
    ];
    const cookiesConfig = mockCreateServerClient.mock.calls[0][2].cookies;

    expect(() => cookiesConfig.setAll(cookiesToSet)).not.toThrow();
  });

  it("calls withSupabaseConsoleCapture and passes result as global.fetch", async () => {
    mockGetSupabaseEnv.mockReturnValue({
      url: "https://test.supabase.co",
      anonKey: "test-anon-key",
    });

    const { createClient } = await import("../server");
    await createClient();

    expect(mockWithSupabaseConsoleCapture).toHaveBeenCalledTimes(1);
    const globalConfig = mockCreateServerClient.mock.calls[0][2].global;
    expect(globalConfig.fetch).toBe(mockSupabaseFetch);
  });
});
