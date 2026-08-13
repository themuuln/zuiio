/**
 * Tests for src/lib/supabase/proxy.ts — the middleware auth guard.
 *
 * These tests verify the full routing logic of `updateSession`:
 * - Unauthenticated redirects on protected routes
 * - Public route / share / product / cron bypasses
 * - Authenticated session header and auth page redirects
 * - Redirect loop guard
 * - Error fallback
 */

import type { Mock } from "vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ── Mock setup ──────────────────────────────────────────────────────
// The mocks below use closures that capture these variables. vi.mock
// factories are lazy — they execute when the module is first imported
// (inside it()), by which point these declarations have run.

const mockGetClaims = vi.fn();
const mockCreateServerClient = vi.fn();
const mockGetSupabaseEnv = vi.fn();
const mockCapture = vi.fn();
const mockNextResponseNext = vi.fn();
const mockNextResponseRedirect = vi.fn();
const mockNextResponseRewrite = vi.fn();
const mockOrgSlugMaybeSingle = vi.fn();

/** Mock server client: getClaims + organizations.slug resolution. */
function mockServerClient() {
  return {
    auth: { getClaims: mockGetClaims },
    from: vi.fn((table: string) => {
      if (table !== "organizations") {
        throw new Error(`unexpected table: ${table}`);
      }
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({ maybeSingle: mockOrgSlugMaybeSingle })),
        })),
      };
    }),
  };
}

vi.mock("@supabase/ssr", () => ({
  createServerClient: mockCreateServerClient,
}));

vi.mock("@/lib/constants", () => ({
  PUBLIC_ROUTES: [
    "/",
    "/landing",
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/update-password",
    "/organization/new",
    "/sso",
  ],
}));

vi.mock("../env", () => ({
  getSupabaseEnv: mockGetSupabaseEnv,
}));

vi.mock("@zuiio/capture", () => ({
  capture: mockCapture,
}));

vi.mock("server-only", () => ({}));

vi.mock("next/server", () => {
  class MockNextResponse {
    status: number;
    headers: {
      set: Mock;
      append: Mock;
      getSetCookie: Mock;
    };
    cookies: { set: Mock };

    constructor(_body?: string, init?: ResponseInit) {
      this.status = init?.status ?? 200;
      const setCookieHeaders: string[] = [];
      this.headers = {
        set: vi.fn(),
        append: vi.fn((_name: string, value: string) => {
          setCookieHeaders.push(value);
        }),
        getSetCookie: vi.fn(() => [...setCookieHeaders]),
      };
      this.cookies = { set: vi.fn() };
    }

    static next = mockNextResponseNext;
    static redirect = mockNextResponseRedirect;
    static rewrite = mockNextResponseRewrite;
  }

  return { NextResponse: MockNextResponse };
});

// ── Helpers ─────────────────────────────────────────────────────────

function createMockRequest(
  pathname: string,
  search = "",
  cookieValues: Record<string, string> = {},
  host = "zuiio.mn",
) {
  const searchParams = new URLSearchParams(search);
  return {
    nextUrl: {
      pathname,
      search,
      origin: "https://zuiio.mn",
      clone: () => ({
        pathname,
        search,
        origin: "https://zuiio.mn",
        searchParams: new URLSearchParams(search),
      }),
      searchParams,
    },
    headers: {
      get: vi.fn((name: string) =>
        name.toLowerCase() === "host" ? host : null,
      ),
    },
    cookies: {
      get: vi.fn((name: string) => {
        const value = cookieValues[name];
        return value !== undefined ? { name, value } : undefined;
      }),
      getAll: vi.fn(() =>
        Object.entries(cookieValues).map(([name, value]) => ({ name, value })),
      ),
      set: vi.fn(),
    },
  };
}

/**
 * Returns a fresh mock response object suitable as the return value of
 * NextResponse.next() / NextResponse.redirect(). Each call produces an
 * independent set of spies.
 */
function createMockResponse() {
  const setCookieHeaders: string[] = [];
  return {
    headers: {
      set: vi.fn(),
      append: vi.fn((_name: string, value: string) => {
        setCookieHeaders.push(value);
      }),
      getSetCookie: vi.fn(() => [...setCookieHeaders]),
    },
    cookies: {
      set: vi.fn(),
    },
  };
}

// ── Tests ───────────────────────────────────────────────────────────

describe("updateSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Fixtures below assume zuiio.mn is the primary host.
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://zuiio.mn");
    mockGetSupabaseEnv.mockReturnValue({
      url: "https://example.supabase.co",
      anonKey: "test-anon-key",
    });
    mockCreateServerClient.mockReturnValue(mockServerClient());
    mockOrgSlugMaybeSingle.mockResolvedValue({ data: null });
    mockNextResponseNext.mockImplementation(() => createMockResponse());
    mockNextResponseRedirect.mockImplementation(() => createMockResponse());
  });

  // ── Unauthenticated access ──────────────────────────────────────

  describe("unauthenticated access", () => {
    beforeEach(() => {
      mockGetClaims.mockResolvedValue({ data: { claims: { sub: null } } });
    });

    it("redirects to /login with next param on protected routes", async () => {
      const req = createMockRequest("/dashboard");
      const { updateSession } = await import("../proxy");

      await updateSession(req);

      expect(mockNextResponseRedirect).toHaveBeenCalledTimes(1);
      const redirectUrl = mockNextResponseRedirect.mock.calls[0][0];
      expect(redirectUrl.pathname).toBe("/login");
      expect(redirectUrl.searchParams.get("next")).toBe("/dashboard");
    });

    it("allows unauthenticated access to the landing page", async () => {
      const req = createMockRequest("/landing");
      const { updateSession } = await import("../proxy");
      await updateSession(req);

      expect(mockNextResponseRedirect).not.toHaveBeenCalled();
    });

    it("allows unauthenticated access to /login", async () => {
      const req = createMockRequest("/login");
      const { updateSession } = await import("../proxy");
      await updateSession(req);

      expect(mockNextResponseRedirect).not.toHaveBeenCalled();
    });

    it.each([
      "/forgot-password",
      "/reset-password",
      "/update-password",
      "/organization/new",
      "/sso",
    ])("allows unauthenticated access to public route %s", async (route) => {
      const req = createMockRequest(route);
      const { updateSession } = await import("../proxy");
      await updateSession(req);

      expect(mockNextResponseRedirect).not.toHaveBeenCalled();
    });

    it("redirects anonymous visitors on / to the landing page", async () => {
      // Primary host (stubbed as zuiio.mn) — the marketing landing. Custom
      // (admin) hosts go to /login instead (admin-domain test below).
      const req = createMockRequest("/");
      const { updateSession } = await import("../proxy");
      await updateSession(req);

      expect(mockNextResponseRedirect).toHaveBeenCalledTimes(1);
      expect(mockNextResponseRedirect.mock.calls[0][0].pathname).toBe(
        "/landing",
      );
    });

    it("allows unauthenticated access to /r/ share routes", async () => {
      const req = createMockRequest("/r/share-token-abc");
      const { updateSession } = await import("../proxy");
      await updateSession(req);

      expect(mockNextResponseRedirect).not.toHaveBeenCalled();
    });

    it.each(["/my-org/products", "/my-org/products/123"])(
      "allows unauthenticated access to /{slug}/products%#",
      async (path) => {
        mockOrgSlugMaybeSingle.mockResolvedValue({ data: { slug: "my-org" } });
        const req = createMockRequest(path);
        const { updateSession } = await import("../proxy");
        await updateSession(req);

        expect(mockNextResponseRedirect).not.toHaveBeenCalled();
      },
    );

    it("allows unauthenticated access to /api/cron/ routes", async () => {
      const req = createMockRequest("/api/cron/daily-report");
      const { updateSession } = await import("../proxy");
      await updateSession(req);

      expect(mockNextResponseRedirect).not.toHaveBeenCalled();
    });

    // ── Public storefront (default domain) ───────────────────────

    it.each([
      "/my-org",
      "/my-org/cart",
      "/my-org/blog",
      "/my-org/blog/new-season",
      "/my-org/account",
      "/my-org/account/orders",
    ])("allows unauthenticated access to storefront path %s", async (path) => {
      const req = createMockRequest(path);
      const { updateSession } = await import("../proxy");
      await updateSession(req);

      // Non-reserved first segment — classified as a storefront without a
      // DB lookup; the server renders it or 404s.
      expect(mockOrgSlugMaybeSingle).not.toHaveBeenCalled();
      expect(mockNextResponseRedirect).not.toHaveBeenCalled();
    });

    it("still redirects when the first segment is a reserved dashboard route", async () => {
      // "shop" is a reserved ERP segment — dashboard cart stays protected
      // at the edge, with no org lookup.
      const req = createMockRequest("/shop/cart");
      const { updateSession } = await import("../proxy");
      await updateSession(req);

      expect(mockOrgSlugMaybeSingle).not.toHaveBeenCalled();
      expect(mockNextResponseRedirect).toHaveBeenCalledTimes(1);
      expect(mockNextResponseRedirect.mock.calls[0][0].pathname).toBe("/login");
    });

    it.each(["/products", "/settings", "/dashboard", "/shop/cart"])(
      "denies unauthenticated access to dashboard route %s",
      async (path) => {
        const req = createMockRequest(path);
        const { updateSession } = await import("../proxy");
        await updateSession(req);

        expect(mockNextResponseRedirect).toHaveBeenCalledTimes(1);
        expect(
          mockNextResponseRedirect.mock.calls[0][0].searchParams.get("next"),
        ).toBe(path);
      },
    );

    it("allows unknown storefront-looking slugs through — the server 404s", async () => {
      // No org lookup in the proxy: an unknown slug reaches the [slug]
      // route, which renders notFound() instead of a login redirect.
      const req = createMockRequest("/unknown-org/cart");
      const { updateSession } = await import("../proxy");
      await updateSession(req);

      expect(mockOrgSlugMaybeSingle).not.toHaveBeenCalled();
      expect(mockNextResponseRedirect).not.toHaveBeenCalled();
    });

    it("denies org paths under non-storefront subpaths", async () => {
      // "settings" is not a storefront subpath — the second segment decides.
      const req = createMockRequest("/my-org/settings");
      const { updateSession } = await import("../proxy");
      await updateSession(req);

      expect(mockOrgSlugMaybeSingle).not.toHaveBeenCalled();
      expect(mockNextResponseRedirect).toHaveBeenCalledTimes(1);
    });

    it("does not resolve org slugs for authenticated visitors", async () => {
      mockGetClaims.mockResolvedValue({
        data: { claims: { sub: "user-abc-123" } },
      });
      const req = createMockRequest("/my-org/cart");
      const { updateSession } = await import("../proxy");
      const result = await updateSession(req);

      expect(mockOrgSlugMaybeSingle).not.toHaveBeenCalled();
      expect(mockNextResponseRedirect).not.toHaveBeenCalled();
      expect(result.headers.set).toHaveBeenCalledWith(
        "x-authed-user-id",
        "user-abc-123",
      );
    });

    it("increments __redirect_count on redirect", async () => {
      // A reserved dashboard route redirects at the edge (no storefront pass-through).
      const req = createMockRequest("/settings");
      const { updateSession } = await import("../proxy");

      await updateSession(req);

      expect(mockNextResponseRedirect).toHaveBeenCalledTimes(1);
      const redirectRes = mockNextResponseRedirect.mock.results[0].value;
      expect(redirectRes.cookies.set).toHaveBeenCalledWith(
        "__redirect_count",
        "1",
        expect.objectContaining({ path: "/", httpOnly: true }),
      );
    });

    it("does not set x-authed-user-id when user is null", async () => {
      const req = createMockRequest("/landing");
      const { updateSession } = await import("../proxy");
      const result = await updateSession(req);

      expect(result.headers.set).not.toHaveBeenCalledWith(
        "x-authed-user-id",
        expect.any(String),
      );
    });
  });

  // ── Authenticated access ────────────────────────────────────────

  describe("authenticated access", () => {
    beforeEach(() => {
      mockGetClaims.mockResolvedValue({
        data: { claims: { sub: "user-abc-123" } },
      });
    });

    it("sets x-authed-user-id header", async () => {
      const req = createMockRequest("/dashboard");
      const { updateSession } = await import("../proxy");
      const result = await updateSession(req);

      expect(result.headers.set).toHaveBeenCalledWith(
        "x-authed-user-id",
        "user-abc-123",
      );
    });

    it("redirects authenticated users away from /login to /", async () => {
      const req = createMockRequest("/login");
      const { updateSession } = await import("../proxy");
      await updateSession(req);

      expect(mockNextResponseRedirect).toHaveBeenCalledTimes(1);
      expect(mockNextResponseRedirect.mock.calls[0][0].pathname).toBe("/");
    });

    it("redirects authenticated users away from /register to /", async () => {
      const req = createMockRequest("/register");
      const { updateSession } = await import("../proxy");
      await updateSession(req);

      expect(mockNextResponseRedirect).toHaveBeenCalledTimes(1);
      expect(mockNextResponseRedirect.mock.calls[0][0].pathname).toBe("/");
    });

    it("clears __redirect_count cookie on successful page loads", async () => {
      const req = createMockRequest("/dashboard", "", {
        __redirect_count: "2",
      });
      const { updateSession } = await import("../proxy");
      const result = await updateSession(req);

      expect(result.cookies.set).toHaveBeenCalledWith(
        "__redirect_count",
        "",
        expect.objectContaining({ maxAge: 0 }),
      );
    });

    it("does not redirect authenticated users on protected routes", async () => {
      const req = createMockRequest("/dashboard");
      const { updateSession } = await import("../proxy");
      await updateSession(req);

      expect(mockNextResponseRedirect).not.toHaveBeenCalled();
    });
  });

  // ── Redirect loop guard ─────────────────────────────────────────

  describe("redirect loop guard", () => {
    it("returns 500 error page when redirect count reaches max", async () => {
      mockGetClaims.mockResolvedValue({ data: { claims: { sub: null } } });
      const req = createMockRequest("/dashboard", "", {
        __redirect_count: "3",
      });
      const { updateSession } = await import("../proxy");

      const result = await updateSession(req);

      expect(mockCapture).toHaveBeenCalledWith(
        expect.stringContaining("[redirect-loop]"),
        expect.objectContaining({ context: "middleware redirect loop" }),
      );
      expect(mockNextResponseRedirect).not.toHaveBeenCalled();
      expect(result.status).toBe(500);
    });

    it("allows normal redirect when under the threshold", async () => {
      mockGetClaims.mockResolvedValue({ data: { claims: { sub: null } } });
      const req = createMockRequest("/dashboard", "", {
        __redirect_count: "2",
      });
      const { updateSession } = await import("../proxy");
      await updateSession(req);

      expect(mockNextResponseRedirect).toHaveBeenCalledTimes(1);
      expect(mockCapture).not.toHaveBeenCalled();
    });
  });

  // ── Error handling ──────────────────────────────────────────────

  describe("error handling", () => {
    it("treats getClaims rejection as unauthenticated and redirects", async () => {
      mockGetClaims.mockRejectedValue(new Error("Invalid or expired session"));
      const req = createMockRequest("/dashboard");
      const { updateSession } = await import("../proxy");

      await updateSession(req);

      expect(mockCapture).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({ context: "middleware session validation" }),
      );
      expect(mockNextResponseRedirect).toHaveBeenCalledTimes(1);
    });

    it("still allows public routes when getClaims fails", async () => {
      mockGetClaims.mockRejectedValue(new Error("Session error"));
      const req = createMockRequest("/landing");
      const { updateSession } = await import("../proxy");
      await updateSession(req);

      expect(mockCapture).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({ context: "middleware session validation" }),
      );
      expect(mockNextResponseRedirect).not.toHaveBeenCalled();
    });
  });
});

describe("updateSession — custom domains", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Fixtures below assume zuiio.mn is the primary host.
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://zuiio.mn");
    mockGetClaims.mockResolvedValue({ data: { claims: { sub: null } } });
    mockGetSupabaseEnv.mockReturnValue({
      url: "https://example.supabase.co",
      anonKey: "test-anon-key",
    });
    mockCreateServerClient.mockReturnValue(mockServerClient());
    mockOrgSlugMaybeSingle.mockResolvedValue({ data: null });
    mockNextResponseNext.mockImplementation(() => createMockResponse());
    mockNextResponseRewrite.mockImplementation(() => createMockResponse());
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ slug: "my-shop" }),
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("rewrites a subdomain of the primary host to /{slug}", async () => {
    const req = createMockRequest("/products", "", {}, "my-shop.zuiio.mn");
    const { updateSession } = await import("../proxy");
    const result = await updateSession(req);

    expect(mockNextResponseRewrite).toHaveBeenCalledTimes(1);
    const [url] = mockNextResponseRewrite.mock.calls[0];
    expect(url.pathname).toBe("/my-shop/products");
    expect(result).toBeDefined();
  });

  it("rewrites a verified custom domain to /{slug} via domain-resolve", async () => {
    const req = createMockRequest("/", "", {}, "shop.example.com");
    const { updateSession } = await import("../proxy");
    await updateSession(req);

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/domain-resolve?host=shop.example.com"),
      expect.anything(),
    );
    const [url] = mockNextResponseRewrite.mock.calls[0];
    expect(url.pathname).toBe("/my-shop");
  });

  it("does not rewrite the primary host", async () => {
    const req = createMockRequest("/", "", {}, "zuiio.mn");
    const { updateSession } = await import("../proxy");
    await updateSession(req);

    expect(mockNextResponseRewrite).not.toHaveBeenCalled();
  });

  it("does not rewrite when domain-resolve returns not found", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false });
    const req = createMockRequest("/", "", {}, "unknown.example.com");
    const { updateSession } = await import("../proxy");
    await updateSession(req);

    expect(mockNextResponseRewrite).not.toHaveBeenCalled();
  });

  it("does not rewrite API routes on custom domains", async () => {
    const req = createMockRequest(
      "/api/domain-resolve",
      "?host=x",
      {},
      "shop.example.com",
    );
    const { updateSession } = await import("../proxy");
    await updateSession(req);

    expect(mockNextResponseRewrite).not.toHaveBeenCalled();
    expect(mockNextResponseRedirect).toHaveBeenCalledTimes(1); // unauth → login
  });

  it("does not rewrite a verified admin (ERP) domain — dashboard serves it", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ admin: true }),
    });
    const req = createMockRequest("/", "", {}, "erp.example.com");
    const { updateSession } = await import("../proxy");
    const result = await updateSession(req);

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/domain-resolve?host=erp.example.com"),
      expect.anything(),
    );
    expect(mockNextResponseRewrite).not.toHaveBeenCalled();
    // Anonymous root on the admin host goes to the login page, not the
    // marketing landing (custom host ≠ primary host).
    expect(mockNextResponseRedirect).toHaveBeenCalledTimes(1);
    expect(mockNextResponseRedirect.mock.calls[0][0].pathname).toBe("/login");
    expect(result).toBeDefined();
  });

  it("keeps dashboard routes protected on an admin domain", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ admin: true }),
    });
    const req = createMockRequest("/dashboard", "", {}, "erp.example.com");
    const { updateSession } = await import("../proxy");
    await updateSession(req);

    expect(mockNextResponseRewrite).not.toHaveBeenCalled();
    expect(mockNextResponseRedirect).toHaveBeenCalledTimes(1);
    expect(mockNextResponseRedirect.mock.calls[0][0].pathname).toBe("/login");
    expect(
      mockNextResponseRedirect.mock.calls[0][0].searchParams.get("next"),
    ).toBe("/dashboard");
  });
});
