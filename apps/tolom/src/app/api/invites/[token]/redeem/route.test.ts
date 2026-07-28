import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock refs
const authRateLimiterCheckMock = vi.fn();
const redeemInviteMock = vi.fn();

vi.mock("@/lib/api-handler", () => ({
  createSimpleRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/rate-limit", () => ({
  authRateLimiter: { check: authRateLimiterCheckMock },
}));

vi.mock("@/lib/services/invite-service", () => ({
  redeemInvite: redeemInviteMock,
}));

const { POST } = await import("./route");

describe("POST /api/invites/[token]/redeem", () => {
  const user = { id: "user-1" };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redeems invite successfully", async () => {
    authRateLimiterCheckMock.mockResolvedValue({
      allowed: true,
      resetAt: Date.now() + 10000,
    });
    redeemInviteMock.mockResolvedValue({
      membershipId: "mem-1",
      role: "member",
    });

    const req = new NextRequest(
      "http://localhost/api/invites/token-abc/redeem",
      { method: "POST" },
    );
    const response = await POST({ request: req, supabase: {}, user });
    const body = await response.json();

    expect(body.data).toEqual({ membershipId: "mem-1", role: "member" });
    expect(redeemInviteMock).toHaveBeenCalledWith({}, "token-abc", "user-1");
  });

  it("returns 429 when rate limited", async () => {
    authRateLimiterCheckMock.mockResolvedValue({
      allowed: false,
      resetAt: Date.now() + 5000,
    });

    const req = new NextRequest(
      "http://localhost/api/invites/token-abc/redeem",
      { method: "POST" },
    );
    const response = await POST({ request: req, supabase: {}, user });

    expect(response.status).toBe(429);
    const body = await response.json();
    expect(body.error.code).toBe("RATE_LIMITED");
    expect(response.headers.get("Retry-After")).toBeDefined();
    expect(redeemInviteMock).not.toHaveBeenCalled();
  });

  it("handles service error", async () => {
    authRateLimiterCheckMock.mockResolvedValue({
      allowed: true,
      resetAt: Date.now() + 10000,
    });
    redeemInviteMock.mockRejectedValue(new Error("Invite expired"));

    const req = new NextRequest(
      "http://localhost/api/invites/token-abc/redeem",
      { method: "POST" },
    );
    await expect(POST({ request: req, supabase: {}, user })).rejects.toThrow(
      "Invite expired",
    );
  });
});
