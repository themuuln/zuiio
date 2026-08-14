import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabaseClient } from "@/test/mocks/supabase";
import {
  checkSubscriptionStatus,
  createSubscription,
  getOrganizationSubscription,
} from "./subscription-service";

describe("subscription-service", () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;
  const orgId = "org-123";

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("getOrganizationSubscription", () => {
    it("returns subscription data when found", async () => {
      const mockPlan = {
        id: "plan-1",
        plan_type: "pro",
        status: "active",
        starts_at: "2026-01-01T00:00:00Z",
        ends_at: "2027-01-01T00:00:00Z",
        settings: { max_users: 10 },
        organization_id: orgId,
      };
      mockSupabase
        .from("subscription_plans")
        .maybeSingle.mockResolvedValueOnce({
          data: mockPlan,
          error: null,
        });

      const result = await getOrganizationSubscription(
        mockSupabase as any,
        orgId,
      );
      expect(result).not.toBeNull();
      expect(result?.planType).toBe("pro");
    });

    it("returns null when no subscription found", async () => {
      mockSupabase
        .from("subscription_plans")
        .maybeSingle.mockResolvedValueOnce({
          data: null,
          error: null,
        });

      const result = await getOrganizationSubscription(
        mockSupabase as any,
        orgId,
      );
      expect(result).toBeNull();
    });
  });

  describe("checkSubscriptionStatus", () => {
    it("returns status from RPC", async () => {
      mockSupabase.rpc.mockResolvedValueOnce({
        data: { expired: false, status: "active" },
        error: null,
      });

      const result = await checkSubscriptionStatus(mockSupabase as any, orgId);
      expect(result).toBeDefined();
    });
  });

  describe("createSubscription", () => {
    it("creates subscription", async () => {
      const newPlan = {
        id: "plan-new",
        plan_type: "starter",
        status: "active",
        starts_at: "2026-07-20T00:00:00Z",
        ends_at: "2026-08-20T00:00:00Z",
        settings: {},
        organization_id: orgId,
      };
      mockSupabase
        .from("subscription_plans")
        .maybeSingle.mockResolvedValueOnce({ data: newPlan, error: null })
        .mockResolvedValueOnce({ data: newPlan, error: null });

      const result = await createSubscription(mockSupabase as any, orgId);
      expect(result.planType).toBe("starter");
    });
  });
});
