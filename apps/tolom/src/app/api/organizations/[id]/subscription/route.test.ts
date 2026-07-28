import type { SupabaseClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getOrganizationSubscriptionMock = vi.fn();
const createSubscriptionMock = vi.fn();
const renewSubscriptionMock = vi.fn();
const updateSubscriptionMock = vi.fn();

vi.mock("@/lib/api-handler", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/api-response", () => ({
  ok: vi.fn(
    (data: unknown) => new Response(JSON.stringify({ data }), { status: 200 }),
  ),
}));

vi.mock("@/lib/services/subscription-service", () => ({
  getOrganizationSubscription: getOrganizationSubscriptionMock,
  createSubscription: createSubscriptionMock,
  renewSubscription: renewSubscriptionMock,
  updateSubscription: updateSubscriptionMock,
}));

const { GET, PATCH } = await import("./route");

interface HandlerContext {
  request?: NextRequest;
  supabase: SupabaseClient;
  orgId: string;
}

describe("organizations/[id]/subscription route", () => {
  const orgId = "org-1";
  const baseUrl = `http://localhost/api/organizations/${orgId}/subscription`;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET", () => {
    it("returns subscription", async () => {
      const subscription = { id: "sub-1", plan: "pro" };
      getOrganizationSubscriptionMock.mockResolvedValue(subscription);

      const context: HandlerContext = { supabase: {} as SupabaseClient, orgId };
      const response = await GET(context);
      const body = await response.json();

      expect(getOrganizationSubscriptionMock).toHaveBeenCalledWith({}, orgId);
      expect(body.data).toEqual(subscription);
    });

    it("handles service error", async () => {
      getOrganizationSubscriptionMock.mockRejectedValue(
        new Error("Fetch failed"),
      );

      const context: HandlerContext = { supabase: {} as SupabaseClient, orgId };
      await expect(GET(context)).rejects.toThrow("Fetch failed");
    });
  });

  describe("PATCH", () => {
    it("starts trial when action=start-trial", async () => {
      const subscription = { id: "sub-1", status: "trial" };
      createSubscriptionMock.mockResolvedValue(subscription);

      const req = new NextRequest(new URL(baseUrl), {
        method: "PATCH",
        body: JSON.stringify({ action: "start-trial" }),
      });
      const context: HandlerContext = {
        request: req,
        supabase: {} as SupabaseClient,
        orgId,
      };
      const response = await PATCH(context);
      const body = await response.json();

      expect(createSubscriptionMock).toHaveBeenCalledWith({}, orgId);
      expect(body.data).toEqual(subscription);
    });

    it("renews subscription when action=renew", async () => {
      const subscription = { id: "sub-1", status: "active" };
      renewSubscriptionMock.mockResolvedValue(subscription);

      const req = new NextRequest(new URL(baseUrl), {
        method: "PATCH",
        body: JSON.stringify({ action: "renew" }),
      });
      const context: HandlerContext = {
        request: req,
        supabase: {} as SupabaseClient,
        orgId,
      };
      const response = await PATCH(context);
      const body = await response.json();

      expect(renewSubscriptionMock).toHaveBeenCalledWith({}, orgId);
      expect(body.data).toEqual(subscription);
    });

    it("updates subscription with planType", async () => {
      const subscription = { id: "sub-1", plan: "pro" };
      updateSubscriptionMock.mockResolvedValue(subscription);
      const payload = { planType: "pro" };

      const req = new NextRequest(new URL(baseUrl), {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      const context: HandlerContext = {
        request: req,
        supabase: {} as SupabaseClient,
        orgId,
      };
      const response = await PATCH(context);
      const body = await response.json();

      expect(updateSubscriptionMock).toHaveBeenCalledWith({}, orgId, payload);
      expect(body.data).toEqual(subscription);
    });

    it("throws ValidationError when no planType or action", async () => {
      const req = new NextRequest(new URL(baseUrl), {
        method: "PATCH",
        body: JSON.stringify({}),
      });
      const context: HandlerContext = {
        request: req,
        supabase: {} as SupabaseClient,
        orgId,
      };
      await expect(PATCH(context)).rejects.toThrow(
        "planType or action is required",
      );
    });

    it("handles service error", async () => {
      updateSubscriptionMock.mockRejectedValue(new Error("Update failed"));

      const req = new NextRequest(new URL(baseUrl), {
        method: "PATCH",
        body: JSON.stringify({ planType: "pro" }),
      });
      const context: HandlerContext = {
        request: req,
        supabase: {} as SupabaseClient,
        orgId,
      };
      await expect(PATCH(context)).rejects.toThrow("Update failed");
    });
  });
});
