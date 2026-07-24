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
import { beforeEach, describe, expect, it, vi } from "vitest";

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
  }

  return { NextResponse: MockNextResponse };
});

// ── Helpers ─────────────────────────────────────────────────────────

function createMockRequest(
  pathname: string,
  search = "",
  cookieValues: Record<string, string> = {},
) {
  const searchParams = new URLSearchParams(search);
  return {
    nextUrl: {
      pathname,
      search,
      clone: () => ({
        pathname,
        search,
        searchParams: new URLSearchParams(search),
      }),
      searchParams,
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
    mockGetSupabaseEnv.mockReturnValue({
      url: "https://example.supabase.co",
      anonKey: "test-anon-key",
    });
    mockCreateServerClient.mockReturnValue({
      auth: { getClaims: mockGetClaims },
    });
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
      "/",
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

    it("allows unauthenticated access to /r/ share routes", async () => {
      const req = createMockRequest("/r/share-token-abc");
      const { updateSession } = await import("../proxy");
      await updateSession(req);

      expect(mockNextResponseRedirect).not.toHaveBeenCalled();
    });

    it.each(["/my-org/products", "/my-org/products/123"])(
      "allows unauthenticated access to /{slug}/products%#",
      async (path) => {
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

    it("increments __redirect_count on redirect", async () => {
      const req = createMockRequest("/protected-page");
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
      const req = createMockRequest("/");
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
