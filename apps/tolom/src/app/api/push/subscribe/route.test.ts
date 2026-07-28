import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabaseClient } from "@/test/mocks/supabase";

const saveSubscriptionMock = vi.fn();

vi.mock("@/lib/api-handler", () => ({
  createSimpleRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/services/push-service", () => ({
  saveSubscription: saveSubscriptionMock,
}));

const { POST } = await import("./route");

describe("POST /api/push/subscribe", () => {
  const user = { id: "user-1" };
  const validBody = {
    endpoint: "https://fcm.googleapis.com/fcm/send/test-endpoint",
    keys: { p256dh: "p256dh-key", auth: "auth-key" },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("saves the subscription and returns success", async () => {
    const supabase = createMockSupabaseClient();
    supabase.__qb.resolveOnce({
      data: { organization_id: "org-1" },
      error: null,
    });
    saveSubscriptionMock.mockResolvedValue({ id: "sub-1" });

    const request = new NextRequest("http://localhost/api/push/subscribe", {
      method: "POST",
      body: JSON.stringify(validBody),
    });

    const response = await POST({ request, supabase, user });
    const body = await response.json();

    expect(body.data).toEqual({ success: true });
    expect(saveSubscriptionMock).toHaveBeenCalledWith(supabase, {
      userId: user.id,
      organizationId: "org-1",
      subscription: {
        endpoint: validBody.endpoint,
        keys: validBody.keys,
      },
      userAgent: undefined,
    });
  });

  it("returns no_organization when profile has no organization", async () => {
    const supabase = createMockSupabaseClient();
    supabase.__qb.resolveOnce({
      data: { organization_id: null },
      error: null,
    });

    const request = new NextRequest("http://localhost/api/push/subscribe", {
      method: "POST",
      body: JSON.stringify(validBody),
    });

    const response = await POST({ request, supabase, user });
    const body = await response.json();

    expect(body.data).toEqual({
      success: false,
      reason: "no_organization",
    });
    expect(saveSubscriptionMock).not.toHaveBeenCalled();
  });

  it("throws Zod error for invalid body", async () => {
    const supabase = createMockSupabaseClient();

    const request = new NextRequest("http://localhost/api/push/subscribe", {
      method: "POST",
      body: JSON.stringify({}),
    });

    await expect(POST({ request, supabase, user })).rejects.toThrow();
  });

  it("propagates service error", async () => {
    const supabase = createMockSupabaseClient();
    supabase.__qb.resolveOnce({
      data: { organization_id: "org-1" },
      error: null,
    });
    saveSubscriptionMock.mockRejectedValue(new Error("DB error"));

    const request = new NextRequest("http://localhost/api/push/subscribe", {
      method: "POST",
      body: JSON.stringify(validBody),
    });

    await expect(POST({ request, supabase, user })).rejects.toThrow("DB error");
  });
});
