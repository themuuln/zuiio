import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  acceptInvite: vi.fn(),
  auditEvent: vi.fn(),
  checkApiRateLimit: vi.fn(),
  createAdminClient: vi.fn(),
  createClient: vi.fn(),
  extractIp: vi.fn(),
  extractUserAgent: vi.fn(),
}));

vi.mock("@/lib/organizations", () => ({
  acceptInvite: mocks.acceptInvite,
}));
vi.mock("@/lib/rate-limit", () => ({
  checkApiRateLimit: mocks.checkApiRateLimit,
}));
vi.mock("@/lib/supabase/audit", () => ({
  auditEvent: mocks.auditEvent,
  extractIp: mocks.extractIp,
  extractUserAgent: mocks.extractUserAgent,
}));
vi.mock("@/lib/supabase/server", () => ({
  createAdminClient: mocks.createAdminClient,
  createClient: mocks.createClient,
}));

import { DELETE as webhookDelete } from "@/app/api/admin/webhooks/[id]/route";
import { POST as webhookPost } from "@/app/api/admin/webhooks/route";
import { POST as oauthDecisionPost } from "@/app/api/oauth/decision/route";
import { POST as acceptInvitePost } from "@/app/api/org/accept-invite/route";

function request(path: string, body: Record<string, unknown>) {
  return new NextRequest(`https://id.test${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("unauthorized route access", () => {
  beforeEach(() => {
    mocks.checkApiRateLimit.mockResolvedValue({ allowed: true });
    mocks.extractIp.mockReturnValue("127.0.0.1");
    mocks.extractUserAgent.mockReturnValue("security-test");
    mocks.createClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: null,
        }),
      },
    });
    mocks.createAdminClient.mockReset();
    mocks.acceptInvite.mockReset();
  });

  it("rejects OAuth consent decisions without a signed-in user", async () => {
    const response = await oauthDecisionPost(
      request("/api/oauth/decision", {
        authorization_id: "authorization-test",
        decision: "approve",
      }),
    );

    expect(response.status).toBe(401);
    expect(mocks.createAdminClient).not.toHaveBeenCalled();
  });

  it("rejects webhook creation and deletion without a signed-in user", async () => {
    const createResponse = await webhookPost(
      request("/api/admin/webhooks", {
        product_id: "product-test",
        url: "https://example.test/webhook",
      }),
    );
    const deleteResponse = await webhookDelete(
      new NextRequest("https://id.test/api/admin/webhooks/subscription-test", {
        method: "DELETE",
      }),
      { params: Promise.resolve({ id: "subscription-test" }) },
    );

    expect(createResponse.status).toBe(401);
    expect(deleteResponse.status).toBe(401);
    expect(mocks.createAdminClient).not.toHaveBeenCalled();
  });

  it("rejects organization invites without a signed-in user", async () => {
    const response = await acceptInvitePost(
      request("/api/org/accept-invite", { token: "invite-test" }),
    );

    expect(response.status).toBe(401);
    expect(mocks.acceptInvite).not.toHaveBeenCalled();
  });
});
