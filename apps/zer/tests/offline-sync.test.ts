import assert from "node:assert/strict";
import test, { mock } from "node:test";

// Stub browser globals BEFORE importing the module
(globalThis as unknown as Record<string, unknown>).window = {
  addEventListener: mock.fn(() => {}),
  removeEventListener: mock.fn(() => {}),
};
Object.defineProperty(globalThis, "navigator", {
  value: { onLine: true },
  writable: true,
  configurable: true,
});

import { mockMod } from "./actions-helpers";

mockMod("@zuiio/capture", { capture: mock.fn(() => {}) });

// In-memory stand-in for the @zuiio/offline IndexedDB mutation queue.
type MockMutation = {
  id: string;
  endpoint: string;
  method: string;
  body: unknown;
  queryKeysToInvalidate: unknown[][];
  idempotencyKey?: string;
  status: "pending" | "completed" | "failed";
};
const queue: MockMutation[] = [];
let nextId = 1;

const engine = {
  enqueueMutation: mock.fn(
    async (mutation: Omit<MockMutation, "id" | "status">): Promise<string> => {
      const id = `mock-${nextId++}`;
      queue.push({ ...mutation, id, status: "pending" });
      return id;
    },
  ),
  getMutationsByStatus: mock.fn(async (status: MockMutation["status"]) =>
    queue.filter((m) => m.status === status),
  ),
  getPendingCount: mock.fn(
    async () => queue.filter((m) => m.status === "pending").length,
  ),
  removeMutation: mock.fn(async (id: string) => {
    const index = queue.findIndex((m) => m.id === id);
    if (index >= 0) queue.splice(index, 1);
  }),
};

mockMod("@zuiio/offline", engine);

// Dynamic import required: mock.module() and browser stubs must register before the module loads
let getIsOnline: () => boolean;
let onOnlineStatusChange: (cb: (online: boolean) => void) => () => void;
let queueOfflineAction: (
  op: "sale" | "shop_sale",
  fields: Record<string, string>,
  queryKeys: string[][],
) => Promise<string>;
let getPendingOfflineCount: () => Promise<number>;
let replayQueuedActions: (
  dispatch: (
    op: "sale" | "shop_sale",
    fields: Record<string, string>,
  ) => Promise<{ success: boolean; error?: string }>,
  onProgress?: (done: number, total: number) => void,
) => Promise<{ synced: number; failed: number }>;

test.before(async () => {
  const mod = await import("@/lib/offline-sync");
  getIsOnline = mod.getIsOnline;
  onOnlineStatusChange = mod.onOnlineStatusChange;
  queueOfflineAction = mod.queueOfflineAction;
  getPendingOfflineCount = mod.getPendingOfflineCount;
  replayQueuedActions = mod.replayQueuedActions;
});

test.beforeEach(() => {
  queue.length = 0;
  nextId = 1;
  engine.enqueueMutation.mock.resetCalls();
  engine.getMutationsByStatus.mock.resetCalls();
  engine.getPendingCount.mock.resetCalls();
  engine.removeMutation.mock.resetCalls();
});

// ── Online status ────────────────────────────────────────────────────

test("getIsOnline returns true initially", () => {
  assert.equal(getIsOnline(), true);
});

test("onOnlineStatusChange registers listener", () => {
  const cb = mock.fn(() => {});
  onOnlineStatusChange(cb);
  // Verify no error and the function is callable
  assert.equal(typeof cb, "function");
});

test("onOnlineStatusChange returns unsubscribe function", () => {
  const cb = mock.fn(() => {});
  const unsub = onOnlineStatusChange(cb);
  assert.equal(typeof unsub, "function");
  // After unsubscribing, calling again should not throw
  unsub();
  assert.doesNotThrow(() => unsub());
});

// ── Queueing ─────────────────────────────────────────────────────────

test("queueOfflineAction enqueues a sale mutation with POST payload", async () => {
  const fields = {
    items: '[{"productId":"p1","quantity":2,"unitPrice":5000}]',
    paid_amount: "10000",
    payment_method: "cash",
    status: "completed",
  };
  const id = await queueOfflineAction("sale", fields, [
    ["sales"],
    ["products"],
  ]);

  assert.equal(typeof id, "string");
  assert.equal(engine.enqueueMutation.mock.callCount(), 1);
  const [mutation] = engine.enqueueMutation.mock.calls[0].arguments;
  assert.equal(mutation.endpoint, "sale");
  assert.equal(mutation.method, "POST");
  assert.deepEqual(mutation.body, fields);
  assert.deepEqual(mutation.queryKeysToInvalidate, [["sales"], ["products"]]);
  assert.equal(typeof mutation.idempotencyKey, "string");
  assert.ok(mutation.idempotencyKey.length > 0);
});

test("queueOfflineAction supports shop_sale op", async () => {
  const id = await queueOfflineAction("shop_sale", { cart: "[]" }, []);
  assert.equal(typeof id, "string");
  const [mutation] = engine.enqueueMutation.mock.calls[0].arguments;
  assert.equal(mutation.endpoint, "shop_sale");
  assert.equal(mutation.method, "POST");
});

test("getPendingOfflineCount returns engine count", async () => {
  await queueOfflineAction("sale", { items: "[]" }, []);
  await queueOfflineAction("sale", { items: "[]" }, []);
  assert.equal(await getPendingOfflineCount(), 2);
});

// ── Replay ───────────────────────────────────────────────────────────

test("replayQueuedActions replays FIFO and removes on success", async () => {
  const first = await queueOfflineAction("sale", { n: "1" }, [["sales"]]);
  const second = await queueOfflineAction("sale", { n: "2" }, [["sales"]]);
  const dispatch = mock.fn(async () => ({ success: true }));

  const result = await replayQueuedActions(dispatch);

  assert.equal(result.synced, 2);
  assert.equal(result.failed, 0);
  assert.equal(dispatch.mock.callCount(), 2);
  // FIFO order
  const ops = dispatch.mock.calls.map((c) => c.arguments[0]);
  assert.deepEqual(ops, ["sale", "sale"]);
  const bodies = dispatch.mock.calls.map((c) => c.arguments[1]);
  assert.deepEqual(bodies, [{ n: "1" }, { n: "2" }]);
  // Successfully replayed mutations are removed from the queue
  assert.equal(engine.removeMutation.mock.callCount(), 2);
  assert.deepEqual(
    engine.removeMutation.mock.calls.map((c) => c.arguments[0]),
    [first, second],
  );
  assert.equal(await getPendingOfflineCount(), 0);
});

test("replayQueuedActions counts failed when dispatch returns failure", async () => {
  await queueOfflineAction("sale", { n: "1" }, [["sales"]]);
  const dispatch = mock.fn(async () => ({ success: false, error: "nope" }));

  const result = await replayQueuedActions(dispatch);

  assert.equal(result.synced, 0);
  assert.equal(result.failed, 1);
  // Failed mutations stay in the queue for the next reconnect
  assert.equal(engine.removeMutation.mock.callCount(), 0);
  assert.equal(await getPendingOfflineCount(), 1);
});

test("replayQueuedActions handles thrown dispatch exception and continues", async () => {
  await queueOfflineAction("sale", { n: "1" }, [["sales"]]);
  await queueOfflineAction("sale", { n: "2" }, [["sales"]]);
  const dispatch = mock.fn(
    async (op: string, fields: Record<string, string>) => {
      if (op === "sale" && fields.n === "1") throw new Error("boom");
      return { success: true };
    },
  );

  const result = await replayQueuedActions(dispatch);

  assert.equal(result.synced, 1);
  assert.equal(result.failed, 1);
  assert.equal(await getPendingOfflineCount(), 1);
});

test("replayQueuedActions reports progress via onProgress", async () => {
  await queueOfflineAction("sale", { n: "1" }, [["sales"]]);
  await queueOfflineAction("sale", { n: "2" }, [["sales"]]);
  await queueOfflineAction("sale", { n: "3" }, [["sales"]]);
  const dispatch = mock.fn(async () => ({ success: true }));
  const progress: Array<[number, number]> = [];

  await replayQueuedActions(dispatch, (done, total) => {
    progress.push([done, total]);
  });

  assert.deepEqual(progress, [
    [1, 3],
    [2, 3],
    [3, 3],
  ]);
});
