import type { SupabaseClient } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";

const checkSubscriptionStatusMock = vi.fn();

vi.mock("@/lib/api-handler", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/api-response", () => ({
  ok: vi.fn(
    (data: unknown) => new Response(JSON.stringify({ data }), { status: 200 }),
  ),
}));

vi.mock("@/lib/services/subscription-service", () => ({
  checkSubscriptionStatus: checkSubscriptionStatusMock,
}));

const { GET } = await import("./route");

interface HandlerContext {
  supabase: SupabaseClient;
  orgId: string;
}

describe("organizations/[id]/subscription/status route", () => {
  const orgId = "org-1";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET", () => {
    it("returns subscription status", async () => {
      const status = { active: true, plan: "pro" };
      checkSubscriptionStatusMock.mockResolvedValue(status);

      const context: HandlerContext = { supabase: {} as SupabaseClient, orgId };
      const response = await GET(context);
      const body = await response.json();

      expect(checkSubscriptionStatusMock).toHaveBeenCalledWith({}, orgId);
      expect(body.data).toEqual(status);
    });

    it("handles service error", async () => {
      checkSubscriptionStatusMock.mockRejectedValue(new Error("Check failed"));

      const context: HandlerContext = { supabase: {} as SupabaseClient, orgId };
      await expect(GET(context)).rejects.toThrow("Check failed");
    });
  });
});
