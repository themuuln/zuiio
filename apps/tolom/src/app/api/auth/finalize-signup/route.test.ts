import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock refs
const authRateLimiterCheckMock = vi.fn();
const finalizeSignupMock = vi.fn();
const reportServerErrorMock = vi.fn();

vi.mock("@/lib/api-handler", () => ({
  createSimpleRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/rate-limit", () => ({
  authRateLimiter: { check: authRateLimiterCheckMock },
}));

vi.mock("@/lib/services/signup-service", () => ({
  finalizeSignup: finalizeSignupMock,
}));

vi.mock("@/lib/sentry-report-server", () => ({
  reportServerError: reportServerErrorMock,
}));

const { POST } = await import("./route");

describe("POST /api/auth/finalize-signup", () => {
  const user = { id: "user-1" };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("finalizes signup successfully", async () => {
    authRateLimiterCheckMock.mockResolvedValue({
      allowed: true,
      resetAt: Date.now() + 10000,
    });
    finalizeSignupMock.mockResolvedValue({ status: "created" });

    const req = new NextRequest("http://localhost/api/auth/finalize-signup", {
      method: "POST",
      body: JSON.stringify({ orgName: "My Org" }),
    });
    const response = await POST({ request: req, supabase: {}, user });
    const body = await response.json();

    expect(body.data).toEqual({ status: "created" });
    expect(finalizeSignupMock).toHaveBeenCalledWith({}, { orgName: "My Org" });
  });

  it("works without orgName", async () => {
    authRateLimiterCheckMock.mockResolvedValue({
      allowed: true,
      resetAt: Date.now() + 10000,
    });
    finalizeSignupMock.mockResolvedValue({ status: "already_setup" });

    const req = new NextRequest("http://localhost/api/auth/finalize-signup", {
      method: "POST",
      body: JSON.stringify({}),
    });
    const response = await POST({ request: req, supabase: {}, user });
    const body = await response.json();

    expect(body.data).toEqual({ status: "already_setup" });
    expect(finalizeSignupMock).toHaveBeenCalledWith({}, { orgName: undefined });
  });

  it("works with no body", async () => {
    authRateLimiterCheckMock.mockResolvedValue({
      allowed: true,
      resetAt: Date.now() + 10000,
    });
    finalizeSignupMock.mockResolvedValue({ status: "created" });

    const req = new NextRequest("http://localhost/api/auth/finalize-signup", {
      method: "POST",
    });
    const response = await POST({ request: req, supabase: {}, user });
    const body = await response.json();

    expect(body.data).toEqual({ status: "created" });
  });

  it("works with invalid JSON body", async () => {
    authRateLimiterCheckMock.mockResolvedValue({
      allowed: true,
      resetAt: Date.now() + 10000,
    });
    finalizeSignupMock.mockResolvedValue({ status: "created" });

    const req = new NextRequest("http://localhost/api/auth/finalize-signup", {
      method: "POST",
      body: "not json",
    });
    const response = await POST({ request: req, supabase: {}, user });
    const body = await response.json();

    expect(body.data).toEqual({ status: "created" });
  });

  it("returns 429 when rate limited", async () => {
    authRateLimiterCheckMock.mockResolvedValue({
      allowed: false,
      resetAt: Date.now() + 5000,
    });

    const req = new NextRequest("http://localhost/api/auth/finalize-signup", {
      method: "POST",
      body: JSON.stringify({}),
    });
    const response = await POST({ request: req, supabase: {}, user });

    expect(response.status).toBe(429);
    const body = await response.json();
    expect(body.error.code).toBe("RATE_LIMITED");
    expect(response.headers.get("Retry-After")).toBeDefined();
  });

  it("handles service error", async () => {
    authRateLimiterCheckMock.mockResolvedValue({
      allowed: true,
      resetAt: Date.now() + 10000,
    });
    finalizeSignupMock.mockRejectedValue(new Error("Signup error"));

    const req = new NextRequest("http://localhost/api/auth/finalize-signup", {
      method: "POST",
      body: JSON.stringify({}),
    });
    await expect(POST({ request: req, supabase: {}, user })).rejects.toThrow(
      "Signup error",
    );
  });
});
