import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createMockSupabaseClient,
  type MockSupabaseClient,
} from "@/test/mocks/supabase";

vi.mock("@/lib/errors", () => ({
  NotFoundError: class extends Error {
    constructor(msg: string) {
      super(msg);
      this.name = "NotFoundError";
    }
  },
}));
vi.mock("../subscription-enforcement", () => ({
  invalidateSubscriptionCache: vi.fn(),
  checkSubscriptionExpired: vi.fn(),
}));

import { NotFoundError } from "@/lib/errors";
import { invalidateSubscriptionCache } from "../subscription-enforcement";

const mockInvalidateCache = vi.mocked(invalidateSubscriptionCache);

import {
  checkSubscriptionStatus,
  createSubscription,
  getOrganizationSubscription,
  renewSubscription,
  updateSubscription,
} from "../subscription-service";

const ORG_ID = "org-1";

let db: MockSupabaseClient;

function makePlan(overrides: Record<string, unknown> = {}) {
  return {
    id: "sub-1",
    organization_id: ORG_ID,
    plan_type: "premium",
    status: "active",
    started_at: "2025-01-01T00:00:00Z",
    expires_at: "2026-01-01T00:00:00Z",
    grace_period_end: null,
    settings: {},
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  db = createMockSupabaseClient();
});

// ── getOrganizationSubscription ───────────────────────────────

describe("getOrganizationSubscription", () => {
  it("returns subscription when found", async () => {
    const plan = makePlan();
    vi.mocked(db.from("subscription_plans").maybeSingle).mockResolvedValueOnce({
      data: plan,
      error: null,
    });

    const result = await getOrganizationSubscription(db as never, ORG_ID);

    expect(result).not.toBeNull();
    expect(result?.id).toBe("sub-1");
    expect(result?.organizationId).toBe(ORG_ID);
    expect(result?.planType).toBe("premium");
    expect(result?.status).toBe("active");
    expect(result?.trial).toBe(false);
  });

  it("returns null when no subscription exists", async () => {
    const result = await getOrganizationSubscription(db as never, ORG_ID);

    expect(result).toBeNull();
  });

  it("returns trial=true when settings.trial is true", async () => {
    const plan = makePlan({ settings: { trial: true } });
    vi.mocked(db.from("subscription_plans").maybeSingle).mockResolvedValueOnce({
      data: plan,
      error: null,
    });

    const result = await getOrganizationSubscription(db as never, ORG_ID);

    expect(result).not.toBeNull();
    expect(result?.trial).toBe(true);
  });

  it("throws on DB error", async () => {
    vi.mocked(db.from("subscription_plans").maybeSingle).mockResolvedValueOnce({
      data: null,
      error: new Error("DB connection failed"),
    });

    await expect(
      getOrganizationSubscription(db as never, ORG_ID),
    ).rejects.toThrow("DB connection failed");
  });

  it("uses fallback message when error.message is empty", async () => {
    vi.mocked(db.from("subscription_plans").maybeSingle).mockResolvedValueOnce({
      data: null,
      error: { message: null },
    });

    await expect(
      getOrganizationSubscription(db as never, ORG_ID),
    ).rejects.toThrow("Failed to fetch subscription");
  });

  it("queries with correct filters", async () => {
    const plan = makePlan();
    vi.mocked(db.from("subscription_plans").maybeSingle).mockResolvedValueOnce({
      data: plan,
      error: null,
    });

    await getOrganizationSubscription(db as never, ORG_ID);

    expect(db.from).toHaveBeenCalledWith("subscription_plans");
    const qb = db.from("subscription_plans");
    expect(qb.select).toHaveBeenCalledWith(
      "id, organization_id, plan_type, status, started_at, expires_at, grace_period_end, settings, created_at, updated_at",
    );
    expect(qb.eq).toHaveBeenCalledWith("organization_id", ORG_ID);
    expect(qb.order).toHaveBeenCalledWith("created_at", { ascending: false });
    expect(qb.limit).toHaveBeenCalledWith(1);
  });
});

// ── checkSubscriptionStatus ───────────────────────────────────

describe("checkSubscriptionStatus", () => {
  it("returns subscription status", async () => {
    const statusData = {
      status: "active",
      expired: false,
      plan_type: "premium",
    };
    vi.mocked(db.rpc).mockResolvedValueOnce({
      data: statusData,
      error: null,
    });

    const result = await checkSubscriptionStatus(db as never, ORG_ID);

    expect(result).toEqual(statusData);
    expect(db.rpc).toHaveBeenCalledWith("check_org_subscription_status", {
      target_org_id: ORG_ID,
    });
  });

  it("throws on DB error", async () => {
    vi.mocked(db.rpc).mockResolvedValueOnce({
      data: null,
      error: new Error("RPC failed"),
    });

    await expect(checkSubscriptionStatus(db as never, ORG_ID)).rejects.toThrow(
      "RPC failed",
    );
  });

  it("uses fallback message when error.message is empty", async () => {
    vi.mocked(db.rpc).mockResolvedValueOnce({
      data: null,
      error: { message: null },
    });

    await expect(checkSubscriptionStatus(db as never, ORG_ID)).rejects.toThrow(
      "Failed to check subscription status",
    );
  });
});

// ── createSubscription ────────────────────────────────────────

describe("createSubscription", () => {
  it("creates and returns subscription", async () => {
    const plan = makePlan();
    vi.mocked(db.rpc).mockResolvedValueOnce({ data: null, error: null });
    vi.mocked(db.from("subscription_plans").maybeSingle).mockResolvedValueOnce({
      data: plan,
      error: null,
    });

    const result = await createSubscription(db as never, ORG_ID);

    expect(db.rpc).toHaveBeenCalledWith("create_default_subscription", {
      target_org_id: ORG_ID,
    });
    expect(result.id).toBe("sub-1");
    expect(result.organizationId).toBe(ORG_ID);
  });

  it("throws on RPC error", async () => {
    vi.mocked(db.rpc).mockResolvedValueOnce({
      data: null,
      error: new Error("RPC failed"),
    });

    await expect(createSubscription(db as never, ORG_ID)).rejects.toThrow(
      "RPC failed",
    );
  });

  it("throws when subscription not retrievable after creation", async () => {
    vi.mocked(db.rpc).mockResolvedValueOnce({ data: null, error: null });
    // Default maybeSingle returns null — subscription not found after create

    await expect(createSubscription(db as never, ORG_ID)).rejects.toThrow(
      "Subscription was created but could not be retrieved",
    );
  });
});

// ── updateSubscription ────────────────────────────────────────

describe("updateSubscription", () => {
  it("updates and returns subscription with cache invalidation", async () => {
    const currentPlan = makePlan();
    const updatedPlan = makePlan({
      plan_type: "enterprise",
      status: "active",
      updated_at: "2025-06-01T00:00:00Z",
    });

    vi.mocked(db.from("subscription_plans").maybeSingle).mockResolvedValueOnce({
      data: currentPlan,
      error: null,
    });
    db.__qb.resolveOnce({ data: updatedPlan, error: null });

    const result = await updateSubscription(db as never, ORG_ID, {
      planType: "enterprise",
    });

    expect(result.planType).toBe("enterprise");
    expect(result.status).toBe("active");
    expect(mockInvalidateCache).toHaveBeenCalledWith(ORG_ID);
  });

  it("throws NotFoundError when no current subscription", async () => {
    // Default maybeSingle returns null
    await expect(
      updateSubscription(db as never, ORG_ID, { planType: "premium" }),
    ).rejects.toThrow(NotFoundError);
    await expect(
      updateSubscription(db as never, ORG_ID, { planType: "premium" }),
    ).rejects.toThrow("No subscription found for this organization");
  });

  it("throws on update error", async () => {
    const currentPlan = makePlan();
    vi.mocked(db.from("subscription_plans").maybeSingle).mockResolvedValueOnce({
      data: currentPlan,
      error: null,
    });
    db.__qb.resolveOnce({
      data: null,
      error: new Error("Update failed"),
    });

    await expect(
      updateSubscription(db as never, ORG_ID, { planType: "enterprise" }),
    ).rejects.toThrow("Update failed");
  });

  it("calls update with correct params", async () => {
    const currentPlan = makePlan();
    vi.mocked(db.from("subscription_plans").maybeSingle).mockResolvedValueOnce({
      data: currentPlan,
      error: null,
    });
    db.__qb.resolveOnce({
      data: makePlan({ plan_type: "enterprise" }),
      error: null,
    });

    await updateSubscription(db as never, ORG_ID, { planType: "enterprise" });

    const qb = db.from("subscription_plans");
    expect(qb.update).toHaveBeenCalledWith({
      plan_type: "enterprise",
      status: "active",
      updated_at: expect.any(String),
    });
    expect(qb.eq).toHaveBeenCalledWith("id", currentPlan.id);
  });
});

// ── renewSubscription ─────────────────────────────────────────

describe("renewSubscription", () => {
  it("renews and returns subscription with cache invalidation", async () => {
    const renewedData = makePlan({
      expires_at: "2027-01-01T00:00:00Z",
    });
    vi.mocked(db.rpc).mockResolvedValueOnce({
      data: renewedData,
      error: null,
    });

    const result = await renewSubscription(db as never, ORG_ID);

    expect(db.rpc).toHaveBeenCalledWith("renew_organization_subscription", {
      target_org_id: ORG_ID,
    });
    expect(result.expires_at).toBe("2027-01-01T00:00:00Z");
    expect(mockInvalidateCache).toHaveBeenCalledWith(ORG_ID);
  });

  it("throws on RPC error", async () => {
    vi.mocked(db.rpc).mockResolvedValueOnce({
      data: null,
      error: new Error("Renewal failed"),
    });

    await expect(renewSubscription(db as never, ORG_ID)).rejects.toThrow(
      "Renewal failed",
    );
  });
});
