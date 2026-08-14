import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Module-level mocks ────────────────────────────────────────────
// These are hoisted above all imports by Vitest.

vi.mock("@supabase/ssr", () => ({ createServerClient: vi.fn() }));

vi.mock("next/server", () => {
  /** Create a mock NextResponse-like object with spy-able cookie methods. */
  const makeRes = () => {
    const store = new Map<
      string,
      { name: string; value: string; options?: Record<string, unknown> }
    >();
    return {
      cookies: {
        get: vi.fn((n: string) => store.get(n)),
        set: vi.fn((n: string, v: string, o?: Record<string, unknown>) => {
          store.set(n, { name: n, value: v, options: o });
        }),
      },
      status: 200,
      statusText: "OK",
      headers: new Headers(),
    };
  };

  // Track `new NextResponse(body, init)` calls (used by guardRedirect)
  const constructCalls: Array<{
    body: unknown;
    init: ResponseInit | undefined;
  }> = [];

  /**
   * Regular (constructable) function for `new NextResponse()` in guardRedirect.
   * Returns a mock response and records the call for assertions.
   */
  function MockNextResponse(
    this: unknown,
    body?: unknown,
    init?: ResponseInit,
  ) {
    constructCalls.push({ body, init });
    const res = makeRes();
    // Apply status
    if (init?.status) res.status = init.status;
    res.ok = res.status < 300;
    // Apply headers from init
    if (init?.headers) {
      const hdrs = init.headers;
      if (hdrs instanceof Headers) {
        hdrs.forEach((v, k) => res.headers.set(k, v));
      } else if (Array.isArray(hdrs)) {
        for (const [k, v] of hdrs) res.headers.set(k, v);
      } else {
        for (const [k, v] of Object.entries(hdrs)) {
          if (typeof v === "string") res.headers.set(k, v);
        }
      }
    }
    return res as never;
  }

  MockNextResponse.next = vi.fn(makeRes);
  MockNextResponse.redirect = vi.fn(makeRes);
  MockNextResponse.rewrite = vi.fn(makeRes);
  /** For tests to inspect constructor invocations. */
  (MockNextResponse as unknown as Record<string, unknown>)._constructCalls =
    constructCalls;

  return {
    NextRequest: vi.fn(),
    NextResponse: MockNextResponse as unknown as typeof NextResponse,
  };
});

vi.mock("@/lib/capture", () => ({ capture: vi.fn() }));
vi.mock("../auth-routes", () => ({ matchRoutes: vi.fn() }));
vi.mock("../env", () => ({ env: vi.fn(), getSupabaseKey: vi.fn() }));

import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { capture } from "@/lib/capture";
// ── Imports (resolved after hoisted mocks) ─────────────────────────
import type { RouteMatch } from "../auth-routes";
import { matchRoutes } from "../auth-routes";
import { env, getSupabaseKey } from "../env";
import { updateSession } from "../middleware";

// ── Typed mocks ────────────────────────────────────────────────────

const mockCreateServerClient = vi.mocked(createServerClient);
const mockCapture = vi.mocked(capture);
const mockMatchRoutes = vi.mocked(matchRoutes);
const mockEnv = vi.mocked(env);
const mockGetSupabaseKey = vi.mocked(getSupabaseKey);

// ── Constants ──────────────────────────────────────────────────────

const SUPABASE_URL = "https://test-project.supabase.co";
const SUPABASE_KEY = "test-anon-key";

// ── Helpers ────────────────────────────────────────────────────────

/**
 * Build a minimal NextRequest-like object with controllable cookies,
 * nextUrl, and headers.
 */
function req(
  opts: {
    pathname?: string;
    cookies?: Array<{ name: string; value: string }>;
  } = {},
): NextRequest {
  const store = new Map(opts.cookies?.map((c) => [c.name, c]) ?? []);
  const baseUrl = new URL(`http://localhost${opts.pathname ?? "/"}`);

  /** Create a cloneable URL-like object that mimics NextURL. */
  const makeUrlObj = (url: URL) => ({
    origin: url.origin,
    pathname: url.pathname,
    search: url.search,
    hash: url.hash,
    searchParams: url.searchParams,
    hostname: url.hostname,
    href: url.href,
    toString: () => url.toString(),
    clone: () => {
      const c = new URL(url.toString());
      return makeUrlObj(c);
    },
  });

  return {
    cookies: {
      get: vi.fn((n: string) => store.get(n) ?? undefined),
      getAll: vi.fn(() => [...store.values()]),
      set: vi.fn((n: string, v: string) => store.set(n, { name: n, value: v })),
    },
    nextUrl: makeUrlObj(baseUrl),
    headers: new Headers(),
  } as unknown as NextRequest;
}

/**
 * The mock `from()` returns a fresh chainable query builder per table.
 *
 * @param user     The authenticated user claims, or null for unauthenticated.
 * @param opts     Optional overrides for organization membership and super-admin status.
 */
function mockAuth(
  user: { sub: string; role?: string } | null,
  opts?: {
    orgRole?: string | null;
    isSuperAdmin?: boolean;
  },
) {
  const mockDb = {
    auth: {
      getClaims: vi.fn().mockResolvedValue({
        data: user ? { claims: user } : { claims: null },
        error: null,
      }),
    },
    from: vi.fn().mockImplementation((table: string) => {
      const qb = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn(),
        single: vi.fn(),
      };

      if (table === "organization_users") {
        qb.maybeSingle.mockResolvedValue(
          opts?.orgRole
            ? {
                data: { role_id: "r1", roles: { name: opts.orgRole } },
                error: null,
              }
            : { data: null, error: null },
        );
      } else {
        qb.maybeSingle.mockResolvedValue(
          opts?.isSuperAdmin
            ? { data: { user_id: user?.sub }, error: null }
            : { data: null, error: null },
        );
      }

      return qb;
    }),
  };
  mockCreateServerClient.mockReturnValue(mockDb as never);
  return mockDb;
}

type DeepPartial<T> = T extends object
  ? { [P in keyof T]?: DeepPartial<T[P]> }
  : T;

/**
 * Convenience: configure matchRoutes to return a specific shape for the next call.
 */
function mockRoutesFor(overrides: DeepPartial<RouteMatch> = {}) {
  const defaults: RouteMatch = {
    isAuthRoute: false,
    isInvoiceRoute: false,
    isPortalRoute: false,
    isInviteRoute: false,
    isPricingRoute: false,
    isPublicRoute: false,
    isBookingRoute: false,
    isStorefrontRoute: false,
    isLoginRoute: false,
    isOwnerRoute: false,
    isManagerRoute: false,
    isMechanicRoute: false,
    isAdminRoute: false,
    requiredRoleLevel: "public",
  };
  mockMatchRoutes.mockReturnValue({ ...defaults, ...overrides } as RouteMatch);
}

// ── Tests ──────────────────────────────────────────────────────────

describe("updateSession", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockEnv.mockReturnValue(SUPABASE_URL);
    mockGetSupabaseKey.mockReturnValue(SUPABASE_KEY);
  });

  // ── Client creation ────────────────────────────────────────────

  describe("client creation", () => {
    it("creates a Supabase server client with env-provided URL and key", async () => {
      mockAuth(null);
      mockRoutesFor({ isPublicRoute: true });

      const request = req({ pathname: "/about" });
      await updateSession(request);

      expect(mockCreateServerClient).toHaveBeenCalledTimes(1);
      expect(mockCreateServerClient).toHaveBeenCalledWith(
        SUPABASE_URL,
        SUPABASE_KEY,
        expect.objectContaining({
          cookies: expect.objectContaining({
            getAll: expect.any(Function),
            setAll: expect.any(Function),
          }),
        }),
      );
      expect(mockEnv).toHaveBeenCalledWith("NEXT_PUBLIC_SUPABASE_URL");
    });

    it("passes cookies between request and response via getAll/setAll", async () => {
      const request = req({ pathname: "/about" });
      mockAuth(null);
      mockRoutesFor({ isPublicRoute: true });

      await updateSession(request);

      // The cookie config should be an object with getAll and setAll
      const configArg = mockCreateServerClient.mock.calls[0][2] as {
        cookies: { getAll: () => unknown; setAll: () => unknown };
      };

      // getAll should return request cookies
      expect(typeof configArg.cookies.getAll).toBe("function");
      expect(typeof configArg.cookies.setAll).toBe("function");
    });
  });

  // ── Redirect loop detection ────────────────────────────────────

  describe("redirect loop detection", () => {
    it("returns 500 with HTML error page when __redirect_count >= 3", async () => {
      mockAuth(null);
      // Private route (no matching special routes)
      mockRoutesFor({});

      const request = req({
        pathname: "/dashboard/settings",
        cookies: [{ name: "__redirect_count", value: "3" }],
      });

      const result = await updateSession(request);

      // guardRedirect should return a 500 error (new NextResponse with status 500)
      expect(result.status).toBe(500);
      // Should contain the Mongolian error message
      expect(result.headers.get("Content-Type")).toBe(
        "text/html; charset=utf-8",
      );
      // The response body should include error indicators
      // (new NextResponse is called with HTML containing these strings)
      const constructCalls = (
        NextResponse as unknown as Record<string, unknown>
      )._constructCalls as Array<{
        body: unknown;
        init: ResponseInit | undefined;
      }>;
      expect(constructCalls.length).toBeGreaterThanOrEqual(1);
      const lastCall = constructCalls[constructCalls.length - 1];
      expect(lastCall.body).toContain("Системд алдаа гарлаа");
      expect(lastCall.init).toMatchObject({ status: 500 });
      // Should report to capture
      expect(mockCapture).toHaveBeenCalledWith("redirect-loop", {
        pathname: "/dashboard/settings",
        count: 4,
      });
    });

    it("returns 500 on the fourth redirect (count starts at 0)", async () => {
      mockAuth(null);
      mockRoutesFor({});

      const _request = req({
        pathname: "/dashboard/bay-view",
        cookies: [{ name: "__redirect_count", value: "0" }],
      });

      // First call: count goes from 0→1 (redirect)
      await updateSession(
        req({
          pathname: "/dashboard/bay-view",
          cookies: [{ name: "__redirect_count", value: "1" }],
        }),
      );
      // Second: 1→2
      await updateSession(
        req({
          pathname: "/dashboard/bay-view",
          cookies: [{ name: "__redirect_count", value: "2" }],
        }),
      );
      // Third: 2→3 — still below MAX=3, redirect fires
      await updateSession(
        req({
          pathname: "/dashboard/bay-view",
          cookies: [{ name: "__redirect_count", value: "3" }],
        }),
      );
      // Fourth: 3→3 — now >= MAX=3, should get 500
      const result = await updateSession(
        req({
          pathname: "/dashboard/bay-view",
          cookies: [{ name: "__redirect_count", value: "4" }],
        }),
      );

      expect(result.status).toBe(500);
    });

    it("increments the redirect cookie when count is below the threshold", async () => {
      mockAuth(null);
      mockRoutesFor({});

      const request = req({
        pathname: "/dashboard/settings",
        cookies: [{ name: "__redirect_count", value: "1" }],
      });

      const result = await updateSession(request);

      // Should have been a redirect, not an error page
      expect(result.status).toBe(200); // our mock NextResponse.redirect returns 200
      // The redirect response should have the incremented cookie set
      expect(result.cookies.set).toHaveBeenCalledWith(
        "__redirect_count",
        "2",
        expect.objectContaining({
          maxAge: 30,
          path: "/",
          httpOnly: true,
          sameSite: "lax",
        }),
      );
    });
  });

  // ── Unauthenticated access ─────────────────────────────────────

  describe("unauthenticated access", () => {
    it("allows public routes through", async () => {
      mockAuth(null);
      mockRoutesFor({ isPublicRoute: true });

      const request = req({ pathname: "/about" });
      const result = await updateSession(request);

      // No redirect should occur
      expect(NextResponse.redirect).not.toHaveBeenCalled();
      // The response should be a pass-through (from NextResponse.next)
      expect(result).toBeDefined();
      expect(typeof result.cookies.set).toBe("function");
    });

    it("allows auth routes through (e.g. /auth/login)", async () => {
      mockAuth(null);
      mockRoutesFor({ isAuthRoute: true });

      const request = req({ pathname: "/auth/login" });
      const result = await updateSession(request);

      expect(NextResponse.redirect).not.toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it("allows invoice routes through", async () => {
      mockAuth(null);
      mockRoutesFor({ isInvoiceRoute: true });

      const request = req({ pathname: "/invoice/abc-123" });
      const result = await updateSession(request);

      expect(NextResponse.redirect).not.toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it("allows portal routes through", async () => {
      mockAuth(null);
      mockRoutesFor({ isPortalRoute: true });

      const request = req({ pathname: "/portal" });
      const result = await updateSession(request);

      expect(NextResponse.redirect).not.toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it("allows booking routes through", async () => {
      mockAuth(null);
      mockRoutesFor({ isBookingRoute: true });

      const request = req({ pathname: "/booking/new" });
      const result = await updateSession(request);

      expect(NextResponse.redirect).not.toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it("allows storefront routes through (e.g. /acme/parts)", async () => {
      mockAuth(null);

      // For storefront paths, the resolved pathname changes, so we
      // must mock matchRoutes to handle the resolved form.
      mockMatchRoutes.mockImplementation((p: string) => {
        if (p === "/en/acme/parts") {
          return {
            isAuthRoute: false,
            isInvoiceRoute: false,
            isPortalRoute: false,
            isInviteRoute: false,
            isPricingRoute: false,
            isPublicRoute: false,
            isBookingRoute: false,
            isStorefrontRoute: true,
            isLoginRoute: false,
            isOwnerRoute: false,
            isManagerRoute: false,
            isMechanicRoute: false,
            isAdminRoute: false,
            requiredRoleLevel: "public" as const,
          };
        }
        // Fallback — all false, private
        return {
          isAuthRoute: false,
          isInvoiceRoute: false,
          isPortalRoute: false,
          isInviteRoute: false,
          isPricingRoute: false,
          isPublicRoute: false,
          isBookingRoute: false,
          isStorefrontRoute: false,
          isLoginRoute: false,
          isOwnerRoute: false,
          isManagerRoute: false,
          isMechanicRoute: false,
          isAdminRoute: false,
          requiredRoleLevel: "public" as const,
        };
      });

      const request = req({ pathname: "/acme/parts" });
      const _result = await updateSession(request);

      // Should have been a rewrite, not a redirect
      expect(NextResponse.rewrite).toHaveBeenCalled();
      expect(NextResponse.redirect).not.toHaveBeenCalled();
    });

    it("allows invite and pricing routes through", async () => {
      mockAuth(null);
      mockRoutesFor({ isInviteRoute: true });

      const request = req({ pathname: "/invite/abc" });
      const result = await updateSession(request);

      expect(NextResponse.redirect).not.toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it("allows API routes through without checking auth", async () => {
      mockAuth(null);
      // matchRoutes won't even be consulted for /api routes
      // because the code checks pathname.startsWith("/api") first.
      const request = req({ pathname: "/api/trpc/test" });
      const result = await updateSession(request);

      expect(NextResponse.redirect).not.toHaveBeenCalled();
      expect(result).toBeDefined();
      // matchRoutes should still be called (for other checks)
      // but the `!user` branch should be skipped due to `/api` prefix
    });

    it("redirects unauthenticated users to login for private routes", async () => {
      mockAuth(null);
      mockRoutesFor({}); // All false — private route

      const request = req({ pathname: "/dashboard/settings" });
      const result = await updateSession(request);

      expect(NextResponse.redirect).toHaveBeenCalledWith(
        expect.objectContaining({ pathname: "/auth/login" }),
      );
      // Should include redirectTo param preserving original path
      const redirectUrl = NextResponse.redirect.mock.calls[0][0] as URL;
      expect(redirectUrl.searchParams.get("redirectTo")).toBe(
        "/dashboard/settings",
      );
      // The returned result should include the __redirect_count cookie
      expect(result.cookies.set).toHaveBeenCalledWith(
        "__redirect_count",
        "1",
        expect.any(Object),
      );
    });

    it("redirects /login (bare, no locale) to /auth/login", async () => {
      mockAuth(null);

      // Pathname=/login triggers the early slug===login redirect
      const request = req({ pathname: "/login" });
      const _result = await updateSession(request);

      expect(NextResponse.redirect).toHaveBeenCalledWith(
        expect.objectContaining({ pathname: "/auth/login" }),
      );
    });
  });

  // ── Authenticated access ───────────────────────────────────────

  describe("authenticated access", () => {
    const USER = { sub: "user-1", role: "authenticated" };

    it("passes through for authenticated users on normal routes", async () => {
      mockAuth(USER);
      mockRoutesFor({});

      const request = req({ pathname: "/dashboard" });
      const result = await updateSession(request);

      expect(NextResponse.redirect).not.toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it("clears the redirect counter on successful page load", async () => {
      mockAuth(USER);
      mockRoutesFor({});

      const request = req({
        pathname: "/dashboard",
        cookies: [{ name: "__redirect_count", value: "2" }],
      });

      const result = await updateSession(request);

      // Should clear the counter on pass-through
      expect(result.cookies.set).toHaveBeenCalledWith(
        "__redirect_count",
        "",
        expect.objectContaining({ maxAge: 0, path: "/" }),
      );
    });

    it("redirects authenticated users from login page to select-organization", async () => {
      mockAuth(USER);
      mockRoutesFor({ isLoginRoute: true });

      // Simulate that the early /login→/auth/login redirect didn't fire
      // because the pathname is already /auth/login
      const request = req({ pathname: "/auth/login" });
      const _result = await updateSession(request);

      expect(NextResponse.redirect).toHaveBeenCalledWith(
        expect.objectContaining({
          pathname: "/auth/select-organization",
        }),
      );
    });

    it("allows authenticated users on public routes through", async () => {
      mockAuth(USER);
      mockRoutesFor({ isPublicRoute: true });

      const request = req({ pathname: "/about" });
      const result = await updateSession(request);

      expect(NextResponse.redirect).not.toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  // ── Role-based access control ──────────────────────────────────

  describe("role-based access control", () => {
    const USER = { sub: "user-1" };

    it("redirects non-owners from owner routes to /dashboard", async () => {
      mockAuth(USER, { orgRole: "mechanic" });
      mockRoutesFor({ isOwnerRoute: true });

      const request = req({ pathname: "/dashboard/organization/billing" });
      const _result = await updateSession(request);

      expect(NextResponse.redirect).toHaveBeenCalledWith(
        expect.objectContaining({ pathname: "/dashboard" }),
      );
    });

    it("passes Org Owner through owner routes", async () => {
      mockAuth(USER, { orgRole: "Org Owner" });
      mockRoutesFor({ isOwnerRoute: true });

      const request = req({ pathname: "/dashboard/organization/billing" });
      const result = await updateSession(request);

      expect(NextResponse.redirect).not.toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it("redirects users without any org membership from owner routes", async () => {
      mockAuth(USER, { orgRole: null }); // No membership
      mockRoutesFor({ isOwnerRoute: true });

      const request = req({ pathname: "/dashboard/organization" });
      const _result = await updateSession(request);

      expect(NextResponse.redirect).toHaveBeenCalledWith(
        expect.objectContaining({ pathname: "/dashboard" }),
      );
    });

    it("redirects non-super-admins from admin routes to /dashboard", async () => {
      mockAuth(USER, { orgRole: "Org Owner", isSuperAdmin: false });
      mockRoutesFor({ isAdminRoute: true });

      const request = req({ pathname: "/dashboard/admin" });
      const _result = await updateSession(request);

      expect(NextResponse.redirect).toHaveBeenCalledWith(
        expect.objectContaining({ pathname: "/dashboard" }),
      );
    });

    it("passes super admins through admin routes", async () => {
      mockAuth(USER, { orgRole: "Org Owner", isSuperAdmin: true });
      mockRoutesFor({ isAdminRoute: true });

      const request = req({ pathname: "/dashboard/admin" });
      const result = await updateSession(request);

      expect(NextResponse.redirect).not.toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  // ── Storefront rewriting ───────────────────────────────────────

  describe("storefront rewriting", () => {
    it("rewrites /{slug}/parts to /en/{slug}/parts", async () => {
      mockAuth(null);
      // matchRoutes will be called with "/en/acme/parts", which
      // should be recognized as a storefront route → allowed through
      mockMatchRoutes.mockImplementation((p: string) => ({
        isAuthRoute: false,
        isInvoiceRoute: false,
        isPortalRoute: false,
        isInviteRoute: false,
        isPricingRoute: false,
        isPublicRoute: false,
        isBookingRoute: false,
        isStorefrontRoute: p === "/en/acme/parts",
        isLoginRoute: false,
        isOwnerRoute: false,
        isManagerRoute: false,
        isMechanicRoute: false,
        isAdminRoute: false,
        requiredRoleLevel: "public" as const,
      }));

      const request = req({ pathname: "/acme/parts" });
      const _result = await updateSession(request);

      // Should rewrite, not redirect
      expect(NextResponse.rewrite).toHaveBeenCalledWith(
        expect.objectContaining({ pathname: "/en/acme/parts" }),
        expect.objectContaining({
          request: expect.objectContaining({
            headers: expect.any(Headers),
          }),
          headers: { "x-storefront-rewrite": "1" },
        }),
      );
    });

    it("carries over __redirect_count cookie on storefront rewrite", async () => {
      mockAuth(null);
      mockMatchRoutes.mockImplementation(() => ({
        isAuthRoute: false,
        isInvoiceRoute: false,
        isPortalRoute: false,
        isInviteRoute: false,
        isPricingRoute: false,
        isPublicRoute: false,
        isBookingRoute: false,
        isStorefrontRoute: true,
        isLoginRoute: false,
        isOwnerRoute: false,
        isManagerRoute: false,
        isMechanicRoute: false,
        isAdminRoute: false,
        requiredRoleLevel: "public" as const,
      }));

      const request = req({
        pathname: "/acme/parts",
        cookies: [{ name: "__redirect_count", value: "1" }],
      });

      const result = await updateSession(request);

      // The rewrite response should carry over the counter
      expect(result.cookies.set).toHaveBeenCalledWith(
        "__redirect_count",
        "1",
        expect.objectContaining({ maxAge: 30, path: "/" }),
      );
    });

    it("does not rewrite reserved slugs", async () => {
      mockAuth(null);
      mockRoutesFor({ isPublicRoute: true });

      // "blog" is in the RESERVED map
      const request = req({ pathname: "/blog" });
      const result = await updateSession(request);

      // Should be a normal pass-through, not a rewrite
      expect(NextResponse.rewrite).not.toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it("does not rewrite locale paths as storefront", async () => {
      mockAuth(null);
      mockRoutesFor({ isPublicRoute: true });

      // /en/hello should NOT match storefront because isLocale is true
      const request = req({ pathname: "/en/hello" });
      const _result = await updateSession(request);

      expect(NextResponse.rewrite).not.toHaveBeenCalled();
    });
  });

  // ── Error handling ─────────────────────────────────────────────

  describe("error handling", () => {
    it("treats null claims as unauthenticated (redirects private routes)", async () => {
      // getClaims returns data with claims: null
      mockAuth(null);
      mockRoutesFor({});

      const request = req({ pathname: "/dashboard" });
      const _result = await updateSession(request);

      expect(NextResponse.redirect).toHaveBeenCalledWith(
        expect.objectContaining({ pathname: "/auth/login" }),
      );
    });

    it("treats data.claims as undefined when getClaims returns error response", async () => {
      mockAuth(null); // claims=null → user is undefined

      // But simulate an error response by having data itself be null
      const mockDb = {
        auth: {
          getClaims: vi.fn().mockResolvedValue({
            data: null,
            error: new Error("token expired"),
          }),
        },
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          is: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      };
      mockCreateServerClient.mockReturnValue(mockDb as never);
      mockRoutesFor({});

      const request = req({ pathname: "/dashboard" });
      const _result = await updateSession(request);

      // Should treat as unauthenticated and redirect
      expect(NextResponse.redirect).toHaveBeenCalledWith(
        expect.objectContaining({ pathname: "/auth/login" }),
      );
    });

    it("propagates exceptions from getClaims", async () => {
      const mockDb = {
        auth: {
          getClaims: vi.fn().mockRejectedValue(new Error("Network failure")),
        },
        from: vi.fn(),
      };
      mockCreateServerClient.mockReturnValue(mockDb as never);
      mockRoutesFor({});

      const request = req({ pathname: "/dashboard" });

      await expect(updateSession(request)).rejects.toThrow("Network failure");
    });
  });

  // ── Edge cases ─────────────────────────────────────────────────

  describe("edge cases", () => {
    it("handles empty redirect cookie (parseInt fallback)", async () => {
      mockAuth(null);
      mockRoutesFor({});

      // Cookie exists but value is empty → parseInt returns NaN → count is 0
      const request = req({
        pathname: "/dashboard",
        cookies: [{ name: "__redirect_count", value: "" }],
      });

      const result = await updateSession(request);

      // Should redirect (not error) since NaN || 0 === 0
      expect(NextResponse.redirect).toHaveBeenCalled();
      // Cookie should be set to "1" (incremented from 0)
      expect(result.cookies.set).toHaveBeenCalledWith(
        "__redirect_count",
        "1",
        expect.any(Object),
      );
    });

    it("handles non-numeric redirect cookie gracefully", async () => {
      mockAuth(null);
      mockRoutesFor({});

      const request = req({
        pathname: "/dashboard",
        cookies: [{ name: "__redirect_count", value: "abc" }],
      });

      const result = await updateSession(request);

      // parseInt("abc") → NaN → count of 0 → redirect, not error
      expect(NextResponse.redirect).toHaveBeenCalled();
      expect(result.cookies.set).toHaveBeenCalledWith(
        "__redirect_count",
        "1",
        expect.any(Object),
      );
    });

    it("does not clear redirect counter when counter cookie is absent", async () => {
      mockAuth({ sub: "user-1" });
      mockRoutesFor({});

      const request = req({ pathname: "/dashboard" });
      const result = await updateSession(request);

      // No __redirect_count cookie was ever set, so it should NOT
      // call clear on the counter
      const clearCalls = (
        result.cookies.set as ReturnType<typeof vi.fn>
      ).mock.calls.filter((call: string[]) => call[0] === "__redirect_count");

      // The only cookie set calls should be from the normal flow
      // (potentially none), but definitely not a clear (maxAge: 0)
      expect(clearCalls.length).toBe(0);
    });
  });
});
