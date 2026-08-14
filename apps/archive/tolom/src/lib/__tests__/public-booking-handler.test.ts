import { NextRequest, NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mutationRateLimiter } from "@/lib/rate-limit";
import { reportServerError } from "@/lib/sentry-report-server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import {
  createMockSupabaseClient,
  type MockSupabaseClient,
} from "@/test/mocks/supabase";
import { createPublicBookingHandler } from "../public-booking-handler";

vi.mock("@/lib/rate-limit", () => ({
  mutationRateLimiter: { check: vi.fn() },
}));
vi.mock("@/lib/sentry-report-server", () => ({ reportServerError: vi.fn() }));
vi.mock("@/lib/supabase/service-role", () => ({
  createServiceRoleClient: vi.fn(),
}));

const mockRateCheck = vi.mocked(mutationRateLimiter.check);
const mockReportServerError = vi.mocked(reportServerError);
const mockCreateServiceRoleClient = vi.mocked(createServiceRoleClient);

const ORG = { id: "org-1", name: "Test Shop", slug: "test-shop" };

function makeRequest(ip = "203.0.113.9"): NextRequest {
  return new NextRequest("http://localhost/api/booking/tok-1", {
    headers: { "x-forwarded-for": ip },
  });
}

let serviceRoleDb: MockSupabaseClient;

beforeEach(() => {
  vi.clearAllMocks();
  serviceRoleDb = createMockSupabaseClient();
  mockCreateServiceRoleClient.mockResolvedValue(serviceRoleDb as never);
  mockRateCheck.mockResolvedValue({ allowed: true, resetAt: 0 });
});

describe("createPublicBookingHandler", () => {
  it("returns 429 with Retry-After when rate limited", async () => {
    mockRateCheck.mockResolvedValue({
      allowed: false,
      resetAt: Date.now() + 60_000,
    });

    const handler = createPublicBookingHandler(async () =>
      NextResponse.json({}, { status: 200 }),
    );
    const response = await handler(makeRequest("198.51.100.4"), {
      params: Promise.resolve({ token: "tok-1" }),
    });

    expect(response.status).toBe(429);
    expect(await response.json()).toEqual({
      error: { code: "RATE_LIMITED", message: "Too many requests" },
    });
    expect(response.headers.get("Retry-After")).toBe("60");
    expect(mockRateCheck).toHaveBeenCalledWith("198.51.100.4");
  });

  it("uses 'unknown' as the IP when x-forwarded-for is missing", async () => {
    mockRateCheck.mockResolvedValue({ allowed: false, resetAt: Date.now() });

    const handler = createPublicBookingHandler(async () =>
      NextResponse.json({}, { status: 200 }),
    );
    await handler(new NextRequest("http://localhost/api/booking/tok-1"), {
      params: Promise.resolve({ token: "tok-1" }),
    });

    expect(mockRateCheck).toHaveBeenCalledWith("unknown");
  });

  it("returns 400 when the booking token is missing", async () => {
    const handler = createPublicBookingHandler(async () =>
      NextResponse.json({}, { status: 200 }),
    );
    const response = await handler(makeRequest(), {
      params: Promise.resolve({}),
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: { code: "BAD_REQUEST", message: "Missing booking token" },
    });
    expect(mockCreateServiceRoleClient).not.toHaveBeenCalled();
  });

  it("returns 404 when the organization lookup fails", async () => {
    serviceRoleDb.from("organizations").single.mockResolvedValueOnce({
      data: null,
      error: { message: "db error" },
    });

    const handler = createPublicBookingHandler(async () =>
      NextResponse.json({}, { status: 200 }),
    );
    const response = await handler(makeRequest(), {
      params: Promise.resolve({ token: "tok-1" }),
    });

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      error: {
        code: "NOT_FOUND",
        message: "Booking link not found or has been deactivated",
      },
    });
  });

  it("returns 404 when no organization matches the token", async () => {
    serviceRoleDb.from("organizations").single.mockResolvedValueOnce({
      data: null,
      error: null,
    });

    const handler = createPublicBookingHandler(async () =>
      NextResponse.json({}, { status: 200 }),
    );
    const response = await handler(makeRequest(), {
      params: Promise.resolve({ token: "tok-1" }),
    });

    expect(response.status).toBe(404);
  });

  it("queries the organization by booking_token scoped to non-deleted rows", async () => {
    const handler = createPublicBookingHandler(async () =>
      NextResponse.json({}, { status: 200 }),
    );
    serviceRoleDb.__qb.resolveWith({ data: ORG, error: null });

    await handler(makeRequest(), {
      params: Promise.resolve({ token: "tok-1" }),
    });

    expect(serviceRoleDb.from).toHaveBeenCalledWith("organizations");
    expect(serviceRoleDb.from("organizations").select).toHaveBeenCalledWith(
      "id, name, slug",
    );
    expect(serviceRoleDb.from("organizations").eq).toHaveBeenCalledWith(
      "booking_token",
      "tok-1",
    );
    expect(serviceRoleDb.from("organizations").is).toHaveBeenCalledWith(
      "deleted_at",
      null,
    );
  });

  it("calls the inner handler with org context and the service-role client", async () => {
    const innerHandler = vi.fn(async () =>
      NextResponse.json({ ok: true }, { status: 200 }),
    );
    serviceRoleDb.__qb.resolveWith({ data: ORG, error: null });

    const handler = createPublicBookingHandler(innerHandler);
    const response = await handler(makeRequest(), {
      params: Promise.resolve({ token: "tok-1" }),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(innerHandler).toHaveBeenCalledTimes(1);
    const [ctx] = innerHandler.mock.calls[0] as [
      { org: typeof ORG; token: string; supabase: MockSupabaseClient },
    ];
    expect(ctx.org).toEqual(ORG);
    expect(ctx.token).toBe("tok-1");
    expect(ctx.supabase).toBe(serviceRoleDb);
  });

  it("returns 500 with the error message when the handler throws", async () => {
    const handler = createPublicBookingHandler(async () => {
      throw new Error("booking exploded");
    });
    serviceRoleDb.__qb.resolveWith({ data: ORG, error: null });

    const response = await handler(makeRequest(), {
      params: Promise.resolve({ token: "tok-1" }),
    });

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: { code: "INTERNAL_ERROR", message: "booking exploded" },
    });
    expect(mockReportServerError).toHaveBeenCalledWith(
      "Unexpected error",
      expect.any(Error),
    );
  });

  it("returns a generic message when a non-Error value is thrown", async () => {
    const handler = createPublicBookingHandler(async () => {
      throw "string error";
    });
    serviceRoleDb.__qb.resolveWith({ data: ORG, error: null });

    const response = await handler(makeRequest(), {
      params: Promise.resolve({ token: "tok-1" }),
    });

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: { code: "INTERNAL_ERROR", message: "Internal server error" },
    });
  });
});
