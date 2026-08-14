import { NextRequest, NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { UnauthorizedError } from "@/lib/errors";
import { authRateLimiter } from "@/lib/rate-limit";
import { reportServerError } from "@/lib/sentry-report-server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import {
  createMockSupabaseClient,
  type MockSupabaseClient,
} from "@/test/mocks/supabase";
import {
  authenticatePortalRequest,
  createPortalRouteHandler,
  type PortalCustomer,
} from "../portal-auth";

vi.mock("@/lib/rate-limit", () => ({
  authRateLimiter: { check: vi.fn() },
}));
vi.mock("@/lib/errors", () => {
  class UnauthorizedError extends Error {
    constructor(message = "Unauthorized") {
      super(message);
      this.name = "UnauthorizedError";
    }
  }
  return {
    UnauthorizedError,
    toApiErrorResponse: vi.fn((error: unknown) => ({
      status: error instanceof UnauthorizedError ? 401 : 500,
      body: {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      headers: {},
    })),
  };
});
vi.mock("@/lib/sentry-report-server", () => ({ reportServerError: vi.fn() }));
vi.mock("@/lib/supabase/query", () => ({
  withDbCapture: vi.fn((_label: string, promise: unknown) => promise),
}));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/supabase/service-role", () => ({
  createServiceRoleClient: vi.fn(),
}));

const mockRateCheck = vi.mocked(authRateLimiter.check);
const mockReportServerError = vi.mocked(reportServerError);
const mockCreateClient = vi.mocked(createClient);
const mockCreateServiceRoleClient = vi.mocked(createServiceRoleClient);

function makeCustomer(overrides: Partial<PortalCustomer> = {}): PortalCustomer {
  return {
    id: "cust-1",
    first_name: "John",
    last_name: "Doe",
    full_name: "John Doe",
    phone: "99112233",
    email: "john@example.com",
    organization_id: "org-1",
    portal_token: "tok-1",
    total_visits: 3,
    last_visit_at: "2026-08-01T10:00:00Z",
    ...overrides,
  };
}

function makePortalRequest(headers: Record<string, string>): NextRequest {
  return new NextRequest("http://localhost/api/portal/bookings", { headers });
}

let db: MockSupabaseClient;
let serviceRoleDb: MockSupabaseClient;

beforeEach(() => {
  vi.clearAllMocks();
  db = createMockSupabaseClient();
  serviceRoleDb = createMockSupabaseClient();
  mockCreateClient.mockResolvedValue(db as never);
  mockCreateServiceRoleClient.mockResolvedValue(serviceRoleDb as never);
  mockRateCheck.mockResolvedValue({ allowed: true, resetAt: 0 });
});

describe("authenticatePortalRequest", () => {
  it("returns the customer found via bearer token with the service-role client", async () => {
    const customer = makeCustomer();
    serviceRoleDb
      .from("customers")
      .maybeSingle.mockResolvedValueOnce({ data: customer, error: null });

    const result = await authenticatePortalRequest(
      makePortalRequest({ authorization: "Bearer tok-1" }),
    );

    expect(result).toEqual(customer);
    expect(mockCreateServiceRoleClient).toHaveBeenCalledTimes(1);
    expect(mockCreateClient).not.toHaveBeenCalled();
    expect(serviceRoleDb.from).toHaveBeenCalledWith("customers");
    expect(serviceRoleDb.from("customers").eq).toHaveBeenCalledWith(
      "portal_token",
      "tok-1",
    );
    expect(serviceRoleDb.from("customers").is).toHaveBeenCalledWith(
      "deleted_at",
      null,
    );
  });

  it("accepts a lowercase bearer scheme", async () => {
    serviceRoleDb.from("customers").maybeSingle.mockResolvedValueOnce({
      data: makeCustomer(),
      error: null,
    });

    const result = await authenticatePortalRequest(
      makePortalRequest({ authorization: "bearer tok-1" }),
    );

    expect(result?.portal_token).toBe("tok-1");
  });

  it("returns null when the token lookup errors", async () => {
    serviceRoleDb.from("customers").maybeSingle.mockResolvedValueOnce({
      data: null,
      error: { message: "db error" },
    });

    const result = await authenticatePortalRequest(
      makePortalRequest({ authorization: "Bearer tok-1" }),
    );

    expect(result).toBeNull();
  });

  it("returns null when the token lookup finds no customer", async () => {
    serviceRoleDb.from("customers").maybeSingle.mockResolvedValueOnce({
      data: null,
      error: null,
    });

    const result = await authenticatePortalRequest(
      makePortalRequest({ authorization: "Bearer tok-1" }),
    );

    expect(result).toBeNull();
  });

  it("returns the customer via the Supabase session when no token is present", async () => {
    const customer = makeCustomer();
    db.from("customers").maybeSingle.mockResolvedValueOnce({
      data: customer,
      error: null,
    });

    const result = await authenticatePortalRequest(makePortalRequest({}));

    expect(result).toEqual(customer);
    expect(mockCreateServiceRoleClient).not.toHaveBeenCalled();
    expect(db.auth.getUser).toHaveBeenCalled();
    expect(db.from).toHaveBeenCalledWith("customers");
    expect(db.from("customers").eq).toHaveBeenCalledWith(
      "customer_user_id",
      "test-user-id",
    );
    expect(db.from("customers").is).toHaveBeenCalledWith("deleted_at", null);
  });

  it("returns null when the session lookup errors", async () => {
    db.from("customers").maybeSingle.mockResolvedValueOnce({
      data: null,
      error: { message: "db error" },
    });

    const result = await authenticatePortalRequest(makePortalRequest({}));

    expect(result).toBeNull();
  });

  it("returns null when there is no token and no session user", async () => {
    db.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

    const result = await authenticatePortalRequest(makePortalRequest({}));

    expect(result).toBeNull();
    expect(db.from).not.toHaveBeenCalled();
  });
});

describe("createPortalRouteHandler", () => {
  it("returns 429 with Retry-After when rate limited", async () => {
    mockRateCheck.mockResolvedValue({
      allowed: false,
      resetAt: Date.now() + 60_000,
    });

    const handler = createPortalRouteHandler(async () =>
      NextResponse.json({}, { status: 200 }),
    );
    const response = await handler(
      makePortalRequest({ "x-forwarded-for": "203.0.113.9" }),
      { params: Promise.resolve({}) },
    );

    expect(response.status).toBe(429);
    expect(await response.json()).toEqual({
      error: "Too many requests. Please try again later.",
    });
    expect(response.headers.get("Retry-After")).toBe("60");
    expect(mockRateCheck).toHaveBeenCalledWith("203.0.113.9");
  });

  it("uses 'unknown' as the IP when x-forwarded-for is missing", async () => {
    mockRateCheck.mockResolvedValue({ allowed: false, resetAt: Date.now() });

    const handler = createPortalRouteHandler(async () =>
      NextResponse.json({}, { status: 200 }),
    );
    await handler(makePortalRequest({}), {
      params: Promise.resolve({}),
    });

    expect(mockRateCheck).toHaveBeenCalledWith("unknown");
  });

  it("calls the handler with the authenticated customer, client, and params", async () => {
    const customer = makeCustomer();
    serviceRoleDb
      .from("customers")
      .maybeSingle.mockResolvedValueOnce({ data: customer, error: null });

    const innerHandler = vi.fn(async () => {
      return NextResponse.json({ ok: true });
    });
    const handler = createPortalRouteHandler(innerHandler);
    const response = await handler(
      makePortalRequest({ authorization: "Bearer tok-1" }),
      { params: Promise.resolve({ bookingId: "b1" }) },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(innerHandler).toHaveBeenCalledTimes(1);
    const [ctx] = innerHandler.mock.calls[0] as [
      {
        customer: PortalCustomer;
        supabase: MockSupabaseClient;
        params: Record<string, string>;
      },
    ];
    expect(ctx.customer).toEqual(customer);
    expect(ctx.supabase).toBe(db);
    expect(ctx.params).toEqual({ bookingId: "b1" });
  });

  it("defaults params to an empty object when no context params are provided", async () => {
    const customer = makeCustomer();
    serviceRoleDb
      .from("customers")
      .maybeSingle.mockResolvedValueOnce({ data: customer, error: null });

    const innerHandler = vi.fn(async () =>
      NextResponse.json({}, { status: 200 }),
    );
    const handler = createPortalRouteHandler(innerHandler);
    await handler(makePortalRequest({ authorization: "Bearer tok-1" }));

    const [ctx] = innerHandler.mock.calls[0] as [
      { params: Record<string, string> },
    ];
    expect(ctx.params).toEqual({});
  });

  it("returns 401 when authentication fails", async () => {
    serviceRoleDb.from("customers").maybeSingle.mockResolvedValueOnce({
      data: null,
      error: null,
    });

    const handler = createPortalRouteHandler(async () => {
      throw new Error("should not be called");
    });
    const response = await handler(
      makePortalRequest({ authorization: "Bearer bad-token" }),
      { params: Promise.resolve({}) },
    );

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Unauthorized" });
    expect(mockReportServerError).toHaveBeenCalledWith(
      "Unexpected error",
      expect.any(UnauthorizedError),
    );
  });

  it("returns the mapped error when the handler throws", async () => {
    serviceRoleDb
      .from("customers")
      .maybeSingle.mockResolvedValueOnce({ data: makeCustomer(), error: null });

    const handler = createPortalRouteHandler(async () => {
      throw new Error("handler exploded");
    });
    const response = await handler(
      makePortalRequest({ authorization: "Bearer tok-1" }),
      { params: Promise.resolve({}) },
    );

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "handler exploded" });
    expect(mockReportServerError).toHaveBeenCalledWith(
      "Unexpected error",
      expect.any(Error),
    );
  });
});
