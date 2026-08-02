import { beforeEach, describe, expect, it, vi } from "vitest";

// VAPID keys must be present before push.ts is imported (module-level consts).
vi.hoisted(() => {
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = "test-public-key";
  process.env.VAPID_PRIVATE_KEY = "test-private-key";
  process.env.VAPID_SUBJECT = "mailto:test@example.com";
});

const mocks = vi.hoisted(() => ({
  capture: vi.fn(),
  withDbCapture: vi.fn(async (_label: string, promise: unknown) => promise),
  setVapidDetails: vi.fn(),
  sendNotification: vi.fn(async () => undefined),
}));

vi.mock("@zuiio/capture", () => ({
  capture: mocks.capture,
  withDbCapture: mocks.withDbCapture,
}));
vi.mock("web-push", () => ({
  default: {
    setVapidDetails: mocks.setVapidDetails,
    sendNotification: mocks.sendNotification,
  },
  setVapidDetails: mocks.setVapidDetails,
  sendNotification: mocks.sendNotification,
}));

import {
  deletePushSubscription,
  isWebPushConfigured,
  savePushSubscription,
  sendWebPush,
} from "../push";

/**
 * Builds a promise-backed supabase query chain. Terminal methods (upsert,
 * insert, eq) resolve to `result`; intermediate methods (select, delete)
 * return the chain so `.select().eq()` builders keep working. No thenable
 * hacks — every awaited expression is a real Promise.
 */
function makeChain(result: unknown, insertLog?: unknown[]) {
  const chain = {
    select: vi.fn(),
    eq: vi.fn(),
    upsert: vi.fn(),
    delete: vi.fn(),
    insert: vi.fn(),
  };

  chain.select.mockReturnValue(chain);
  chain.delete.mockReturnValue(chain);
  chain.upsert.mockReturnValue(Promise.resolve(result));
  chain.insert.mockImplementation((payload: unknown) => {
    insertLog?.push(payload);
    return Promise.resolve(result);
  });
  chain.eq.mockReturnValue(Promise.resolve(result));

  return chain;
}

interface TableQueue {
  [table: string]: unknown[];
}

function makeClient(queue: TableQueue) {
  const insertLog: unknown[] = [];
  const from = vi.fn((table: string) => {
    const results = queue[table] ?? [{ data: null, error: null }];
    return makeChain(results.shift() ?? { data: null, error: null }, insertLog);
  });
  return { client: { from }, insertLog };
}

const SUB_A = {
  endpoint: "https://push.example.com/sub-a",
  p256dh: "p256dh-a",
  auth: "auth-a",
};
const SUB_B = {
  endpoint: "https://push.example.com/sub-b",
  p256dh: "p256dh-b",
  auth: "auth-b",
};

describe("isWebPushConfigured", () => {
  it("is true when all VAPID env vars are set", () => {
    expect(isWebPushConfigured()).toBe(true);
  });

  it("is false when a VAPID key is missing", async () => {
    vi.resetModules();
    delete process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    delete process.env.VAPID_PRIVATE_KEY;
    delete process.env.VAPID_SUBJECT;

    const fresh = await import("../push");
    expect(fresh.isWebPushConfigured()).toBe(false);
  });
});

describe("savePushSubscription", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("upserts the subscription by endpoint", async () => {
    const { client, insertLog } = makeClient({});

    const ok = await savePushSubscription(client as never, "org-1", "user-1", {
      endpoint: SUB_A.endpoint,
      p256dh: SUB_A.p256dh,
      auth: SUB_A.auth,
    });

    expect(ok).toBe(true);
    expect(client.from).toHaveBeenCalledWith("push_subscriptions");
    const chain = client.from.mock.results[0].value;
    expect(chain.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        organization_id: "org-1",
        user_id: "user-1",
        endpoint: SUB_A.endpoint,
        p256dh: SUB_A.p256dh,
        auth: SUB_A.auth,
      }),
      { onConflict: "endpoint" },
    );
    expect(insertLog).toEqual([]);
    expect(mocks.capture).not.toHaveBeenCalled();
  });
});

describe("deletePushSubscription", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deletes the row matching the endpoint", async () => {
    const { client } = makeClient({});

    const ok = await deletePushSubscription(client as never, SUB_A.endpoint);

    expect(ok).toBe(true);
    expect(client.from).toHaveBeenCalledWith("push_subscriptions");
    const chain = client.from.mock.results[0].value;
    expect(chain.delete).toHaveBeenCalledOnce();
    expect(chain.eq).toHaveBeenCalledWith("endpoint", SUB_A.endpoint);
  });
});

describe("sendWebPush", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns early when the org has no subscriptions", async () => {
    const { client } = makeClient({
      push_subscriptions: [{ data: null, error: null }],
    });

    const result = await sendWebPush(client as never, "org-1", {
      title: "Title",
      body: "Body",
      url: "/sales",
    });

    expect(result).toEqual({ success: true, sent: 0, failed: 0 });
    expect(mocks.setVapidDetails).not.toHaveBeenCalled();
    expect(mocks.sendNotification).not.toHaveBeenCalled();
  });

  it("sends to every subscription and logs the outcome", async () => {
    const { client, insertLog } = makeClient({
      push_subscriptions: [{ data: [SUB_A, SUB_B], error: null }],
      notifications: [{ data: null, error: null }],
    });

    const result = await sendWebPush(client as never, "org-1", {
      title: "Шинэ борлуулалт",
      body: "Бүтээгдэхүүн\nНийт дүн: 12,000₮",
      url: "/sales",
      eventType: "new_sale",
    });

    expect(result).toEqual({ success: true, sent: 2, failed: 0 });
    expect(mocks.setVapidDetails).toHaveBeenCalledWith(
      "mailto:test@example.com",
      "test-public-key",
      "test-private-key",
    );
    expect(mocks.sendNotification).toHaveBeenCalledTimes(2);
    expect(mocks.sendNotification).toHaveBeenNthCalledWith(
      1,
      {
        endpoint: SUB_A.endpoint,
        keys: { p256dh: SUB_A.p256dh, auth: SUB_A.auth },
      },
      JSON.stringify({
        title: "Шинэ борлуулалт",
        body: "Бүтээгдэхүүн\nНийт дүн: 12,000₮",
        url: "/sales",
      }),
    );
    expect(mocks.sendNotification).toHaveBeenNthCalledWith(
      2,
      {
        endpoint: SUB_B.endpoint,
        keys: { p256dh: SUB_B.p256dh, auth: SUB_B.auth },
      },
      JSON.stringify({
        title: "Шинэ борлуулалт",
        body: "Бүтээгдэхүүн\nНийт дүн: 12,000₮",
        url: "/sales",
      }),
    );

    expect(insertLog).toHaveLength(1);
    expect(insertLog[0]).toEqual(
      expect.objectContaining({
        organization_id: "org-1",
        channel: "web_push",
        event_type: "new_sale",
        title: "Шинэ борлуулалт",
        status: "sent",
      }),
    );
  });

  it("captures per-subscription failures and logs a failed outcome", async () => {
    mocks.sendNotification.mockRejectedValueOnce(new Error("410 Gone"));
    const { client, insertLog } = makeClient({
      push_subscriptions: [{ data: [SUB_A], error: null }],
      notifications: [{ data: null, error: null }],
    });

    const result = await sendWebPush(client as never, "org-1", {
      title: "Бага нөөц",
      body: "Бүтээгдэхүүн\nҮлдэгдэл: 2 ширхэг",
      eventType: "low_stock",
    });

    expect(result.success).toBe(false);
    expect(result.sent).toBe(0);
    expect(result.failed).toBe(1);
    expect(mocks.capture).toHaveBeenCalledTimes(1);
    expect(insertLog[0]).toEqual(
      expect.objectContaining({
        channel: "web_push",
        event_type: "low_stock",
        status: "failed",
        error_message: "410 Gone",
      }),
    );
  });
});
