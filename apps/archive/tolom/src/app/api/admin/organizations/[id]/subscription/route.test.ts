import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock refs
const checkSuperAdminMock = vi.fn();
const extendSubscriptionTrialMock = vi.fn();
const updateOrgSubscriptionMock = vi.fn();
const mutationRateLimiterCheckMock = vi.fn();
const apiErrorMock = vi.fn();
const okMock = vi.fn();

vi.mock("@/lib/api-handler", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/api-response", () => ({
  apiError: apiErrorMock,
  ok: okMock,
}));

vi.mock("@/lib/errors", () => ({
  ForbiddenError: class ForbiddenError extends Error {
    constructor() {
      super("Forbidden");
      this.name = "ForbiddenError";
    }
  },
}));

vi.mock("@/lib/rate-limit", () => ({
  mutationRateLimiter: {
    check: mutationRateLimiterCheckMock,
  },
}));

vi.mock("@/lib/services/admin-service", () => ({
  checkSuperAdmin: checkSuperAdminMock,
  extendSubscriptionTrial: extendSubscriptionTrialMock,
  updateOrgSubscription: updateOrgSubscriptionMock,
}));

const { PATCH } = await import("./route");

describe("PATCH /api/admin/organizations/[id]/subscription", () => {
  const user = { id: "user-1" };
  const orgId = "org-1";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("extends trial when action is extend", async () => {
    mutationRateLimiterCheckMock.mockResolvedValue({ allowed: true });
    checkSuperAdminMock.mockResolvedValue(true);
    extendSubscriptionTrialMock.mockResolvedValue({
      id: "sub-1",
      org_id: orgId,
      trial_end: "2026-08-27T00:00:00Z",
    });
    okMock.mockImplementation((data) => {
      return new Response(JSON.stringify({ data }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    });

    const req = new NextRequest(
      new URL("http://localhost/api/admin/organizations/org-1/subscription"),
      { method: "PATCH", body: JSON.stringify({ action: "extend" }) },
    );
    const response = await PATCH({ request: req, supabase: {}, orgId, user });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toEqual({
      id: "sub-1",
      org_id: orgId,
      trial_end: "2026-08-27T00:00:00Z",
    });
    expect(extendSubscriptionTrialMock).toHaveBeenCalledWith({}, orgId);
    expect(mutationRateLimiterCheckMock).toHaveBeenCalledWith("unknown");
    expect(checkSuperAdminMock).toHaveBeenCalledWith({});
    expect(updateOrgSubscriptionMock).not.toHaveBeenCalled();
  });

  it("updates subscription for non-extend actions", async () => {
    mutationRateLimiterCheckMock.mockResolvedValue({ allowed: true });
    checkSuperAdminMock.mockResolvedValue(true);
    updateOrgSubscriptionMock.mockResolvedValue({
      id: "sub-1",
      org_id: orgId,
      plan: "pro",
    });
    okMock.mockImplementation((data) => {
      return new Response(JSON.stringify({ data }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    });

    const req = new NextRequest(
      new URL("http://localhost/api/admin/organizations/org-1/subscription"),
      {
        method: "PATCH",
        body: JSON.stringify({ action: "update", plan: "pro" }),
      },
    );
    const response = await PATCH({ request: req, supabase: {}, orgId, user });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toEqual({
      id: "sub-1",
      org_id: orgId,
      plan: "pro",
    });
    expect(updateOrgSubscriptionMock).toHaveBeenCalledWith({}, orgId, {
      action: "update",
      plan: "pro",
    });
    expect(extendSubscriptionTrialMock).not.toHaveBeenCalled();
  });

  it("returns 429 when rate limited", async () => {
    const resetAt = Date.now() + 60_000;
    mutationRateLimiterCheckMock.mockResolvedValue({
      allowed: false,
      resetAt,
    });
    apiErrorMock.mockReturnValue(
      new Response(
        JSON.stringify({
          error: { code: "RATE_LIMITED", message: "Too many requests" },
        }),
        { status: 429, headers: { "Retry-After": "60" } },
      ),
    );

    const req = new NextRequest(
      new URL("http://localhost/api/admin/organizations/org-1/subscription"),
      {
        method: "PATCH",
        body: JSON.stringify({ action: "extend" }),
      },
    );
    const response = await PATCH({ request: req, supabase: {}, orgId, user });

    expect(response.status).toBe(429);
    const body = await response.json();
    expect(body.error.code).toBe("RATE_LIMITED");
    expect(mutationRateLimiterCheckMock).toHaveBeenCalled();
    expect(checkSuperAdminMock).not.toHaveBeenCalled();
    expect(extendSubscriptionTrialMock).not.toHaveBeenCalled();
  });

  it("throws ForbiddenError when not super admin", async () => {
    mutationRateLimiterCheckMock.mockResolvedValue({ allowed: true });
    checkSuperAdminMock.mockResolvedValue(false);

    const req = new NextRequest(
      new URL("http://localhost/api/admin/organizations/org-1/subscription"),
      {
        method: "PATCH",
        body: JSON.stringify({ action: "extend" }),
      },
    );
    await expect(
      PATCH({ request: req, supabase: {}, orgId, user }),
    ).rejects.toThrow("Forbidden");
    expect(checkSuperAdminMock).toHaveBeenCalledWith({});
    expect(extendSubscriptionTrialMock).not.toHaveBeenCalled();
  });

  it("handles service error on extend", async () => {
    mutationRateLimiterCheckMock.mockResolvedValue({ allowed: true });
    checkSuperAdminMock.mockResolvedValue(true);
    extendSubscriptionTrialMock.mockRejectedValue(
      new Error("Database connection failed"),
    );

    const req = new NextRequest(
      new URL("http://localhost/api/admin/organizations/org-1/subscription"),
      {
        method: "PATCH",
        body: JSON.stringify({ action: "extend" }),
      },
    );
    await expect(
      PATCH({ request: req, supabase: {}, orgId, user }),
    ).rejects.toThrow("Database connection failed");
  });

  it("handles service error on update", async () => {
    mutationRateLimiterCheckMock.mockResolvedValue({ allowed: true });
    checkSuperAdminMock.mockResolvedValue(true);
    updateOrgSubscriptionMock.mockRejectedValue(new Error("Update failed"));

    const req = new NextRequest(
      new URL("http://localhost/api/admin/organizations/org-1/subscription"),
      {
        method: "PATCH",
        body: JSON.stringify({ action: "update" }),
      },
    );
    await expect(
      PATCH({ request: req, supabase: {}, orgId, user }),
    ).rejects.toThrow("Update failed");
  });
});
