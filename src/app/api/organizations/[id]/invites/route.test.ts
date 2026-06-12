import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabaseClient } from "@/test/mocks/supabase";

const getOrgInvitesMock = vi.fn();
const createInviteMock = vi.fn();
const resendInviteMock = vi.fn();
const cancelInviteMock = vi.fn();
const requireActiveSubscriptionMock = vi.fn();
const mutationRateLimiterCheckMock = vi.fn(() => ({
  allowed: true,
  resetAt: Date.now() + 1000,
}));

vi.mock("@/lib/api-handler", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/services/invite-service", () => ({
  getOrgInvites: getOrgInvitesMock,
  createInvite: createInviteMock,
  resendInvite: resendInviteMock,
  cancelInvite: cancelInviteMock,
}));

vi.mock("@/lib/services/subscription-enforcement", () => ({
  requireActiveSubscription: requireActiveSubscriptionMock,
}));

vi.mock("@/lib/rate-limit", () => ({
  mutationRateLimiter: {
    check: mutationRateLimiterCheckMock,
  },
}));

const { GET, POST, PATCH, DELETE } = await import("./route");

describe("organizations/[id]/invites route", () => {
  const orgId = "org-1";
  const user = { id: "user-1" };

  beforeEach(() => {
    vi.clearAllMocks();
    mutationRateLimiterCheckMock.mockReturnValue({
      allowed: true,
      resetAt: Date.now() + 1000,
    });
  });

  it("returns invites for the current organization", async () => {
    getOrgInvitesMock.mockResolvedValue([{ id: "invite-1" }]);

    const response = await (GET as any)({
      orgId,
    });
    const body = await response.json();

    expect(getOrgInvitesMock).toHaveBeenCalledWith(orgId);
    expect(body.data).toEqual([{ id: "invite-1" }]);
  });

  it("creates an invite for the current organization", async () => {
    createInviteMock.mockResolvedValue({ id: "invite-1" });
    const supabase = createMockSupabaseClient();

    const request = new NextRequest(
      `http://localhost/api/organizations/${orgId}/invites`,
      {
        method: "POST",
        body: JSON.stringify({ email: "tech@example.com", roleId: "role-1" }),
        headers: { "content-type": "application/json" },
      },
    );

    const response = await (POST as any)({
      request,
      orgId,
      user,
      supabase,
    });
    const body = await response.json();

    expect(requireActiveSubscriptionMock).toHaveBeenCalledWith(orgId);
    expect(createInviteMock).toHaveBeenCalledWith(
      supabase,
      orgId,
      { email: "tech@example.com", roleId: "role-1" },
      user.id,
    );
    expect(body.data).toEqual({ id: "invite-1" });
  });

  it("passes orgId into resendInvite", async () => {
    const supabase = createMockSupabaseClient();
    const request = new NextRequest(
      `http://localhost/api/organizations/${orgId}/invites`,
      {
        method: "PATCH",
        body: JSON.stringify({ inviteId: "invite-1", action: "resend" }),
        headers: { "content-type": "application/json" },
      },
    );

    const response = await (PATCH as any)({
      request,
      orgId,
      supabase,
    });
    const body = await response.json();

    expect(requireActiveSubscriptionMock).toHaveBeenCalledWith(orgId);
    expect(resendInviteMock).toHaveBeenCalledWith(supabase, orgId, "invite-1");
    expect(body.success).toBe(true);
  });

  it("passes orgId into cancelInvite", async () => {
    const supabase = createMockSupabaseClient();
    const request = new NextRequest(
      `http://localhost/api/organizations/${orgId}/invites`,
      {
        method: "DELETE",
        body: JSON.stringify({ inviteId: "invite-1" }),
        headers: { "content-type": "application/json" },
      },
    );

    const response = await (DELETE as any)({
      request,
      orgId,
      supabase,
    });
    const body = await response.json();

    expect(requireActiveSubscriptionMock).toHaveBeenCalledWith(orgId);
    expect(cancelInviteMock).toHaveBeenCalledWith(supabase, orgId, "invite-1");
    expect(body.success).toBe(true);
  });
});
