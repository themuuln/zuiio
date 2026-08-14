import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabaseClient } from "@/test/mocks/supabase";
import {
  checkSubscriptionExpired,
  invalidateSubscriptionCache,
  requireActiveSubscription,
} from "./subscription-enforcement";

const { mockCreateClient } = vi.hoisted(() => ({
  mockCreateClient: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mockCreateClient,
}));

describe("subscription-enforcement", () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;
  const orgId = "org-123";

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    mockCreateClient.mockResolvedValue(mockSupabase as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
    invalidateSubscriptionCache(orgId);
  });

  describe("checkSubscriptionExpired", () => {
    it("returns expired=false on RPC error", async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: new Error("DB error"),
      });

      const result = await checkSubscriptionExpired(orgId);
      expect(result).toEqual({ expired: false });
    });

    it("returns expired state from RPC result", async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: {
          expired: true,
          message: "Subscription ended",
          status: "expired",
        },
        error: null,
      });

      const result = await checkSubscriptionExpired(orgId);
      expect(result).toEqual({
        expired: true,
        message: "Subscription ended",
        status: "expired",
      });
    });

    it("returns expired=false for non-standard response shape", async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: { foo: "bar" },
        error: null,
      });

      const result = await checkSubscriptionExpired(orgId);
      expect(result).toEqual({ expired: false });
    });

    it("caches result and reuses it within TTL", async () => {
      mockSupabase.rpc.mockResolvedValueOnce({
        data: { expired: true, status: "expired" },
        error: null,
      });

      const first = await checkSubscriptionExpired(orgId);
      expect(first.expired).toBe(true);

      const second = await checkSubscriptionExpired(orgId);
      expect(second.expired).toBe(true);
      expect(mockSupabase.rpc).toHaveBeenCalledTimes(1);
    });
  });

  describe("requireActiveSubscription", () => {
    it("passes when subscription is active", async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: { expired: false },
        error: null,
      });

      await expect(requireActiveSubscription(orgId)).resolves.toBeUndefined();
    });

    it("throws ForbiddenError when expired", async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: { expired: true, message: "Please renew" },
        error: null,
      });

      await expect(requireActiveSubscription(orgId)).rejects.toThrow(
        "Please renew",
      );
    });
  });

  describe("invalidateSubscriptionCache", () => {
    it("forces a fresh RPC call on next check", async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: { expired: true },
        error: null,
      });

      await checkSubscriptionExpired(orgId);
      invalidateSubscriptionCache(orgId);

      mockSupabase.rpc.mockResolvedValue({
        data: { expired: false },
        error: null,
      });

      const result = await checkSubscriptionExpired(orgId);
      expect(result.expired).toBe(false);
      expect(mockSupabase.rpc).toHaveBeenCalledTimes(2);
    });
  });
});
