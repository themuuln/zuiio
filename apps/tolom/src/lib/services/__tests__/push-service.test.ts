import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createMockSupabaseClient,
  type MockSupabaseClient,
} from "@/test/mocks/supabase";

vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));
vi.mock("@/lib/audit", () => ({ logAuditAfter: vi.fn() }));
vi.mock("@/lib/errors", () => ({
  NotFoundError: class extends Error {
    constructor(m: string) {
      super(m);
      this.name = "NotFoundError";
    }
  },
  ValidationError: class extends Error {
    constructor(m: string) {
      super(m);
      this.name = "ValidationError";
    }
  },
}));
vi.mock("@/lib/sentry-report-server", () => ({ reportServerError: vi.fn() }));
vi.mock("@zuiio/capture", () => ({ capture: vi.fn() }));
vi.mock("@/lib/web-push", () => ({
  getVapidPublicKey: vi.fn(),
  sendPush: vi.fn(),
}));

import { capture } from "@zuiio/capture";
import { revalidateTag } from "next/cache";
import { logAuditAfter } from "@/lib/audit";
import { reportServerError } from "@/lib/sentry-report-server";
import { getVapidPublicKey, sendPush } from "@/lib/web-push";

import {
  removeExpiredSubscriptions,
  removeSubscription,
  saveSubscription,
  sendPushToOrganization,
  sendPushToUser,
  sendPushToUsers,
} from "../push-service";

const _mockRevalidateTag = vi.mocked(revalidateTag);
const _mockLogAudit = vi.mocked(logAuditAfter);
const _mockReportServerError = vi.mocked(reportServerError);
const mockCapture = vi.mocked(capture);
const mockSendPush = vi.mocked(sendPush);
const mockGetVapidPublicKey = vi.mocked(getVapidPublicKey);

// ── Constants ──────────────────────────────────────────────────

const USER_ID = "user-1";
const ORG_ID = "org-1";
const ENDPOINT = "https://fcm.googleapis.com/fcm/send/abc123";
const P256DH = "BEv8eT3mG6CG7S8WxHy9t0UvW3z4K5l6M7n8O9p0Q1r2S3t4U5v6W7x8Y9z0A1";
const AUTH = "aGVsbG8vdGhpcyBpcyBhdXRo";
const SUB_ID = "sub-1";

const SUBSCRIPTION = {
  endpoint: ENDPOINT,
  keys: { p256dh: P256DH, auth: AUTH },
};

const NOTIFICATION = {
  title: "New Work Order",
  body: "You have been assigned a new work order",
  url: "/work-orders/wo-1",
  tag: "work-order-assignment",
};

function makeSubscriptionRow(overrides: Record<string, unknown> = {}) {
  return {
    endpoint: ENDPOINT,
    p256dh: P256DH,
    auth: AUTH,
    ...overrides,
  };
}

// ── Setup ──────────────────────────────────────────────────────

let db: MockSupabaseClient;

beforeEach(() => {
  vi.clearAllMocks();
  db = createMockSupabaseClient();
});

// ── saveSubscription ───────────────────────────────────────────

describe("saveSubscription", () => {
  const params = {
    userId: USER_ID,
    organizationId: ORG_ID,
    subscription: SUBSCRIPTION,
    userAgent: "Mozilla/5.0 Test Browser",
  };

  it("should upsert a subscription and return its id", async () => {
    db.__qb.resolveOnce({ data: { id: SUB_ID }, error: null });

    const result = await saveSubscription(db, params);

    expect(result).toEqual({ id: SUB_ID });
    expect(db.from).toHaveBeenCalledWith("push_subscriptions");
    expect(db.from("push_subscriptions").upsert).toHaveBeenCalledWith(
      {
        user_id: USER_ID,
        organization_id: ORG_ID,
        endpoint: ENDPOINT,
        p256dh: P256DH,
        auth: AUTH,
        user_agent: "Mozilla/5.0 Test Browser",
      },
      { onConflict: "endpoint" },
    );
  });

  it("should store null for user_agent when not provided", async () => {
    db.__qb.resolveOnce({ data: { id: SUB_ID }, error: null });

    await saveSubscription(db, {
      userId: USER_ID,
      organizationId: ORG_ID,
      subscription: SUBSCRIPTION,
    });

    expect(db.from("push_subscriptions").upsert).toHaveBeenCalledWith(
      expect.objectContaining({ user_agent: null }),
      { onConflict: "endpoint" },
    );
  });

  it("should throw and capture error on upsert failure", async () => {
    const dbError = new Error("duplicate key value violates unique constraint");
    db.__qb.resolveOnce({
      data: null,
      error: dbError as never,
    });

    await expect(saveSubscription(db, params)).rejects.toThrow(
      "duplicate key value violates unique constraint",
    );

    expect(mockCapture).toHaveBeenCalledWith(dbError, {
      context: "push_save_subscription",
    });
  });
});

// ── removeSubscription ─────────────────────────────────────────

describe("removeSubscription", () => {
  it("should delete the subscription by endpoint", async () => {
    db.__qb.resolveOnce({ data: null, error: null });

    await removeSubscription(db, ENDPOINT);

    expect(db.from).toHaveBeenCalledWith("push_subscriptions");
    expect(db.from("push_subscriptions").delete).toHaveBeenCalled();
    expect(db.from("push_subscriptions").eq).toHaveBeenCalledWith(
      "endpoint",
      ENDPOINT,
    );
  });

  it("should throw and capture error on delete failure", async () => {
    const dbError = new Error("permission denied for table push_subscriptions");
    db.__qb.resolveOnce({
      data: null,
      error: dbError as never,
    });

    await expect(removeSubscription(db, ENDPOINT)).rejects.toThrow(
      "permission denied",
    );

    expect(mockCapture).toHaveBeenCalledWith(dbError, {
      context: "push_remove_subscription",
    });
  });
});

// ── removeExpiredSubscriptions ─────────────────────────────────

describe("removeExpiredSubscriptions", () => {
  it("should delete all endpoints in the list", async () => {
    const endpoints = [ENDPOINT, "https://push.example.com/def"];
    db.__qb.resolveOnce({ data: null, error: null });

    await removeExpiredSubscriptions(db, endpoints);

    expect(db.from).toHaveBeenCalledWith("push_subscriptions");
    expect(db.from("push_subscriptions").delete).toHaveBeenCalled();
    expect(db.from("push_subscriptions").in).toHaveBeenCalledWith(
      "endpoint",
      endpoints,
    );
  });

  it("should do nothing when endpoints array is empty", async () => {
    await removeExpiredSubscriptions(db, []);

    expect(db.from).not.toHaveBeenCalled();
  });

  it("should capture but not throw on delete error", async () => {
    const dbError = new Error("connection failure");
    db.__qb.resolveOnce({
      data: null,
      error: dbError as never,
    });

    await expect(
      removeExpiredSubscriptions(db, [ENDPOINT]),
    ).resolves.toBeUndefined();

    expect(mockCapture).toHaveBeenCalledWith(dbError, {
      context: "push_remove_expired",
    });
  });
});

// ── sendPushToUser ─────────────────────────────────────────────

describe("sendPushToUser", () => {
  it("should send push to all subscriptions of a user", async () => {
    const row1 = makeSubscriptionRow();
    const row2 = makeSubscriptionRow({
      endpoint: "https://fcm.googleapis.com/fcm/send/def456",
      p256dh: "BDef456",
      auth: "auth-def",
    });

    db.__qb.resolveOnce({
      data: [row1, row2],
      error: null,
    });

    mockSendPush.mockResolvedValue({ success: true });

    const results = await sendPushToUser(db, USER_ID, NOTIFICATION);

    expect(results).toHaveLength(2);
    expect(results.every((r) => r.success)).toBe(true);
    expect(mockSendPush).toHaveBeenCalledTimes(2);
    expect(db.from).toHaveBeenCalledWith("push_subscriptions");
    expect(db.from("push_subscriptions").eq).toHaveBeenCalledWith(
      "user_id",
      USER_ID,
    );
  });

  it("should return empty array when user has no subscriptions", async () => {
    db.__qb.resolveOnce({ data: [], error: null });

    const results = await sendPushToUser(db, USER_ID, NOTIFICATION);

    expect(results).toEqual([]);
    expect(mockSendPush).not.toHaveBeenCalled();
  });

  it("should return empty array on query error and capture it", async () => {
    const dbError = new Error("database unavailable");
    db.__qb.resolveOnce({
      data: null,
      error: dbError as never,
    });

    const results = await sendPushToUser(db, USER_ID, NOTIFICATION);

    expect(results).toEqual([]);
    expect(mockSendPush).not.toHaveBeenCalled();
    expect(mockCapture).toHaveBeenCalledWith(dbError, {
      context: "push_fetch_user_subs",
    });
  });

  it("should remove expired subscriptions (404/410)", async () => {
    db.__qb.resolveOnce({
      data: [makeSubscriptionRow(), makeSubscriptionRow()],
      error: null,
    });

    mockSendPush
      .mockResolvedValueOnce({ success: false, status: 404 })
      .mockResolvedValueOnce({ success: false, status: 410 });

    const results = await sendPushToUser(db, USER_ID, NOTIFICATION);

    expect(results).toHaveLength(2);
    expect(results[0]).toEqual({ success: false, status: 404 });
    expect(results[1]).toEqual({ success: false, status: 410 });

    // The internal removeExpiredSubscriptions should have been called
    // due to 404/410 responses
    expect(db.from("push_subscriptions").delete).toHaveBeenCalled();
    expect(db.from("push_subscriptions").in).toHaveBeenCalledWith(
      "endpoint",
      expect.arrayContaining([ENDPOINT]),
    );
  });

  it("should keep non-expired errors in results without removing", async () => {
    db.__qb.resolveOnce({
      data: [makeSubscriptionRow()],
      error: null,
    });

    mockSendPush.mockResolvedValue({
      success: false,
      status: 500,
      reason: "Internal server error from push service",
    });

    const results = await sendPushToUser(db, USER_ID, NOTIFICATION);

    expect(results).toHaveLength(1);
    expect(results[0]).toEqual({
      success: false,
      status: 500,
      reason: "Internal server error from push service",
    });
    // Should NOT try to delete — 500 is not 404/410
    expect(db.from("push_subscriptions").delete).not.toHaveBeenCalled();
  });
});

// ── sendPushToOrganization ─────────────────────────────────────

describe("sendPushToOrganization", () => {
  it("should send push to all subscriptions in an organization", async () => {
    const row = makeSubscriptionRow();
    db.__qb.resolveOnce({ data: [row], error: null });
    mockSendPush.mockResolvedValue({ success: true });

    const results = await sendPushToOrganization(db, ORG_ID, NOTIFICATION);

    expect(results).toHaveLength(1);
    expect(results[0].success).toBe(true);
    expect(db.from("push_subscriptions").eq).toHaveBeenCalledWith(
      "organization_id",
      ORG_ID,
    );
    expect(mockSendPush).toHaveBeenCalledTimes(1);
  });

  it("should return empty array when org has no subscriptions", async () => {
    db.__qb.resolveOnce({ data: [], error: null });
    mockSendPush.mockResolvedValue({ success: true });

    const results = await sendPushToOrganization(db, ORG_ID, NOTIFICATION);

    expect(results).toEqual([]);
    expect(mockSendPush).not.toHaveBeenCalled();
  });

  it("should return empty array on query error and capture it", async () => {
    const dbError = new Error("timeout");
    db.__qb.resolveOnce({ data: null, error: dbError as never });

    const results = await sendPushToOrganization(db, ORG_ID, NOTIFICATION);

    expect(results).toEqual([]);
    expect(mockCapture).toHaveBeenCalledWith(dbError, {
      context: "push_fetch_org_subs",
    });
  });
});

// ── sendPushToUsers ────────────────────────────────────────────

describe("sendPushToUsers", () => {
  it("should send push to subscriptions matching any of the user IDs", async () => {
    const row1 = makeSubscriptionRow({ endpoint: "https://example.com/1" });
    const row2 = makeSubscriptionRow({
      endpoint: "https://example.com/2",
      user_id: "user-2",
    });

    db.__qb.resolveOnce({ data: [row1, row2], error: null });
    mockSendPush.mockResolvedValue({ success: true });

    const results = await sendPushToUsers(
      db,
      [USER_ID, "user-2"],
      NOTIFICATION,
    );

    expect(results).toHaveLength(2);
    expect(results.every((r) => r.success)).toBe(true);
    expect(db.from("push_subscriptions").in).toHaveBeenCalledWith("user_id", [
      USER_ID,
      "user-2",
    ]);
    expect(mockSendPush).toHaveBeenCalledTimes(2);
  });

  it("should return empty array when userIds list is empty", async () => {
    const results = await sendPushToUsers(db, [], NOTIFICATION);

    expect(results).toEqual([]);
    expect(db.from).not.toHaveBeenCalled();
    expect(mockSendPush).not.toHaveBeenCalled();
  });

  it("should return empty array when no subscriptions found", async () => {
    db.__qb.resolveOnce({ data: [], error: null });
    mockSendPush.mockResolvedValue({ success: true });

    const results = await sendPushToUsers(db, [USER_ID], NOTIFICATION);

    expect(results).toEqual([]);
    expect(mockSendPush).not.toHaveBeenCalled();
  });

  it("should return empty array on query error and capture it", async () => {
    const dbError = new Error("permission denied");
    db.__qb.resolveOnce({ data: null, error: dbError as never });

    const results = await sendPushToUsers(db, [USER_ID], NOTIFICATION);

    expect(results).toEqual([]);
    expect(mockSendPush).not.toHaveBeenCalled();
    expect(mockCapture).toHaveBeenCalledWith(dbError, {
      context: "push_fetch_multi_user_subs",
    });
  });
});

// ── getVapidKey ────────────────────────────────────────────────

describe("getVapidPublicKey exported via @/lib/web-push", () => {
  it("should return the VAPID public key", () => {
    mockGetVapidPublicKey.mockReturnValue("BFakePublicKeyForTesting123");

    const key = getVapidPublicKey();

    expect(key).toBe("BFakePublicKeyForTesting123");
    expect(getVapidPublicKey).toHaveBeenCalled();
  });
});
