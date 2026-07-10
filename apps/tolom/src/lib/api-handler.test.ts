import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ForbiddenError } from "@/lib/errors";
import { createRouteHandler } from "./api-handler";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockGetUser = vi.fn();
const mockMaybeSingle = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockIs = vi.fn();
const mockFrom = vi.fn();

const mockLoggerInfo = vi.fn();
const mockLoggerError = vi.fn();

const mockRateLimiterCheck = vi.fn();
const mockRequireActiveSubscription = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  })),
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    info: (...args: unknown[]) => mockLoggerInfo(...args),
    error: (...args: unknown[]) => mockLoggerError(...args),
  },
}));

vi.mock("@/lib/rate-limit", () => ({
  mutationRateLimiter: {
    check: (...args: unknown[]) => mockRateLimiterCheck(...args),
  },
}));

vi.mock("@/lib/services/subscription-enforcement", () => ({
  requireActiveSubscription: (...args: unknown[]) =>
    mockRequireActiveSubscription(...args),
}));

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function createRequest(url = "http://localhost:3000/api/orgs/org-123/items") {
  return new NextRequest(url, { method: "GET" });
}

function createRouteContext(
  params: Record<string, string> = { id: "org-123" },
) {
  return { params: Promise.resolve(params) };
}

function createMockUser(overrides: Record<string, unknown> = {}) {
  return {
    id: "user-1",
    email: "test@example.com",
    app_metadata: {},
    user_metadata: {},
    aud: "authenticated",
    created_at: "2024-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function setupSuccessfulAuth(user = createMockUser()) {
  mockGetUser.mockResolvedValue({ data: { user }, error: null });

  // Mock the org membership check chain: from → select → eq → eq → is → maybeSingle
  const selectChain = {
    eq: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    maybeSingle: mockMaybeSingle,
  };
  mockMaybeSingle.mockResolvedValue({
    data: { organization_id: "org-123" },
    error: null,
  });
  mockSelect.mockReturnValue(selectChain);
  mockEq.mockReturnValue(selectChain);
  mockIs.mockReturnValue(selectChain);
  mockFrom.mockImplementation((table: string) => {
    if (table === "organization_users") {
      return { select: mockSelect };
    }
    return { select: vi.fn() };
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("createRouteHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rateLimit option", () => {
    it("calls the handler when rate limit is not exceeded", async () => {
      setupSuccessfulAuth();
      mockRateLimiterCheck.mockResolvedValue({
        allowed: true,
        remaining: 59,
        resetAt: Date.now() + 60000,
      });

      const handler = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ data: "ok" }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );

      const route = createRouteHandler(handler, { rateLimit: true });
      const request = createRequest();
      const context = createRouteContext();

      const response = await route(request, context);
      const body = await response.json();

      expect(mockRateLimiterCheck).toHaveBeenCalledWith("unknown");
      expect(response.status).toBe(200);
      expect(body).toEqual({ data: "ok" });
    });

    it("returns 429 when rate limit is exceeded", async () => {
      setupSuccessfulAuth();
      const resetAt = Date.now() + 60000;
      mockRateLimiterCheck.mockResolvedValue({
        allowed: false,
        remaining: 0,
        resetAt,
      });

      const handler = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ data: "ok" }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );

      const route = createRouteHandler(handler, { rateLimit: true });
      const request = createRequest();
      const context = createRouteContext();

      const response = await route(request, context);
      const body = await response.json();

      expect(mockRateLimiterCheck).toHaveBeenCalledWith("unknown");
      expect(response.status).toBe(429);
      expect(body).toEqual({
        error: { code: "RATE_LIMITED", message: "Too many requests" },
      });
      expect(response.headers.get("Retry-After")).toBe(
        String(Math.ceil((resetAt - Date.now()) / 1000)),
      );
      // Handler should NOT be called when rate limited
      expect(handler).not.toHaveBeenCalled();
    });

    it("does not check rate limit when option is not set", async () => {
      setupSuccessfulAuth();

      const handler = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ data: "ok" }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );

      const route = createRouteHandler(handler); // No options
      const request = createRequest();
      const context = createRouteContext();

      const response = await route(request, context);
      const body = await response.json();

      expect(mockRateLimiterCheck).not.toHaveBeenCalled();
      expect(response.status).toBe(200);
      expect(body).toEqual({ data: "ok" });
    });
  });

  describe("subscription option", () => {
    it("calls the handler when subscription is active", async () => {
      setupSuccessfulAuth();
      mockRequireActiveSubscription.mockResolvedValue(undefined);

      const handler = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ data: "ok" }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );

      const route = createRouteHandler(handler, { subscription: true });
      const request = createRequest();
      const context = createRouteContext();

      const response = await route(request, context);
      const body = await response.json();

      expect(mockRequireActiveSubscription).toHaveBeenCalledWith("org-123");
      expect(response.status).toBe(200);
      expect(body).toEqual({ data: "ok" });
    });

    it("returns 403 when subscription is expired", async () => {
      setupSuccessfulAuth();
      mockRequireActiveSubscription.mockRejectedValue(
        new ForbiddenError("Subscription expired. Please renew to continue."),
      );

      const handler = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ data: "ok" }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );

      const route = createRouteHandler(handler, { subscription: true });
      const request = createRequest();
      const context = createRouteContext();

      const response = await route(request, context);
      const body = await response.json();

      expect(mockRequireActiveSubscription).toHaveBeenCalledWith("org-123");
      expect(response.status).toBe(403);
      expect(body).toEqual({
        error: {
          code: "FORBIDDEN",
          message: "Subscription expired. Please renew to continue.",
        },
      });
      // Handler should NOT be called when subscription check fails
      expect(handler).not.toHaveBeenCalled();
    });

    it("does not check subscription when option is not set", async () => {
      setupSuccessfulAuth();

      const handler = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ data: "ok" }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );

      const route = createRouteHandler(handler); // No options
      const request = createRequest();
      const context = createRouteContext();

      const response = await route(request, context);
      const body = await response.json();

      expect(mockRequireActiveSubscription).not.toHaveBeenCalled();
      expect(response.status).toBe(200);
      expect(body).toEqual({ data: "ok" });
    });
  });

  describe("rateLimit and subscription together", () => {
    it("rate limit check runs before subscription check (429 precedes 403)", async () => {
      setupSuccessfulAuth();
      mockRateLimiterCheck.mockResolvedValue({
        allowed: false,
        remaining: 0,
        resetAt: Date.now() + 60000,
      });

      const handler = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ data: "ok" }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );

      const route = createRouteHandler(handler, {
        rateLimit: true,
        subscription: true,
      });
      const request = createRequest();
      const context = createRouteContext();

      const response = await route(request, context);

      // Rate limit check was called
      expect(mockRateLimiterCheck).toHaveBeenCalled();
      // Subscription check should NOT be called because rate limit failed first
      expect(mockRequireActiveSubscription).not.toHaveBeenCalled();
      // Returns 429 (rate limited), not 403
      expect(response.status).toBe(429);
    });
  });

  describe("error handling", () => {
    it("catches handler errors and returns formatted error response", async () => {
      setupSuccessfulAuth();

      const handler = vi
        .fn()
        .mockRejectedValue(new Error("Something went wrong"));

      const route = createRouteHandler(handler);
      const request = createRequest();
      const context = createRouteContext();

      const response = await route(request, context);
      const body = await response.json();

      // Non-AppError should be caught and converted to 500
      expect(response.status).toBe(500);
      expect(body).toMatchObject({
        error: {
          code: "INTERNAL_ERROR",
        },
      });
    });
  });
});
