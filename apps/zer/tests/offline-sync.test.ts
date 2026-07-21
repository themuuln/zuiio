import assert from "node:assert/strict";
import test, { mock } from "node:test";

// Stub browser globals BEFORE importing the module
const storage: Record<string, string> = {};
(globalThis as unknown as Record<string, unknown>).window = {
  addEventListener: mock.fn(() => {}),
  removeEventListener: mock.fn(() => {}),
};
Object.defineProperty(globalThis, "navigator", {
  value: { onLine: true },
  writable: true,
  configurable: true,
});
(globalThis as unknown as Record<string, unknown>).localStorage = {
  getItem: mock.fn((key: string) => storage[key] ?? null),
  setItem: mock.fn((key: string, val: string) => {
    storage[key] = val;
  }),
  removeItem: mock.fn((key: string) => {
    delete storage[key];
  }),
};

import { mockMod } from "./actions-helpers";
mockMod("@zuiio/capture", { capture: mock.fn(() => {}) });

// Dynamic import required: mock.module() and browser stubs must register before the module loads
let getIsOnline: () => boolean;
let onOnlineStatusChange: (cb: (online: boolean) => void) => () => void;
let getQueuedSales: () => Array<Record<string, unknown>>;
let queueSale: (sale: Record<string, unknown>) => void;
let removeSaleFromQueue: (id: string) => void;
let getQueuedCount: () => number;
let syncQueuedSales: (
  syncFn: (sale: Record<string, unknown>) => Promise<boolean>,
) => Promise<{ synced: number; failed: number }>;

test.before(async () => {
  const mod = await import("@/lib/offline-sync");
  getIsOnline = mod.getIsOnline;
  onOnlineStatusChange = mod.onOnlineStatusChange;
  getQueuedSales = mod.getQueuedSales;
  queueSale = mod.queueSale;
  removeSaleFromQueue = mod.removeSaleFromQueue;
  getQueuedCount = mod.getQueuedCount;
  syncQueuedSales = mod.syncQueuedSales;
});

function seedQueue(sales: Record<string, unknown>[]) {
  storage["zer-offline-sales"] = JSON.stringify(sales);
}

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

// ── Queue reads ──────────────────────────────────────────────────────

test("getQueuedSales returns empty array when no localStorage data", () => {
  delete storage["zer-offline-sales"];
  assert.deepEqual(getQueuedSales(), []);
});

test("getQueuedSales returns parsed queue from localStorage", () => {
  seedQueue([
    {
      id: "s1",
      items: [],
      total_amount: 100,
      payment_method: "cash",
      created_at: "2025-01-01T00:00:00Z",
    },
  ]);
  const result = getQueuedSales();
  assert.equal(result.length, 1);
  assert.equal(result[0].id, "s1");
  assert.equal(result[0].total_amount, 100);
});

test("getQueuedSales handles JSON parse error (returns [])", () => {
  storage["zer-offline-sales"] = "{invalid json!!!";
  assert.deepEqual(getQueuedSales(), []);
});

// ── Queue mutations ──────────────────────────────────────────────────

test("queueSale adds sale to queue", () => {
  delete storage["zer-offline-sales"];
  queueSale({
    id: "q1",
    items: [],
    total_amount: 50,
    payment_method: "card",
    created_at: "2025-06-01T00:00:00Z",
  });
  const queue = getQueuedSales();
  assert.equal(queue.length, 1);
  assert.equal(queue[0].id, "q1");
});

test("removeSaleFromQueue removes by id", () => {
  seedQueue([
    {
      id: "r1",
      items: [],
      total_amount: 10,
      payment_method: "cash",
      created_at: "2025-01-01T00:00:00Z",
    },
    {
      id: "r2",
      items: [],
      total_amount: 20,
      payment_method: "card",
      created_at: "2025-01-01T00:00:00Z",
    },
  ]);
  removeSaleFromQueue("r1");
  const queue = getQueuedSales();
  assert.equal(queue.length, 1);
  assert.equal(queue[0].id, "r2");
});

test("getQueuedCount returns correct count", () => {
  seedQueue([
    {
      id: "c1",
      items: [],
      total_amount: 5,
      payment_method: "cash",
      created_at: "2025-01-01T00:00:00Z",
    },
    {
      id: "c2",
      items: [],
      total_amount: 10,
      payment_method: "cash",
      created_at: "2025-01-01T00:00:00Z",
    },
    {
      id: "c3",
      items: [],
      total_amount: 15,
      payment_method: "card",
      created_at: "2025-01-01T00:00:00Z",
    },
  ]);
  assert.equal(getQueuedCount(), 3);
});

// ── Sync ─────────────────────────────────────────────────────────────

test("syncQueuedSales syncs all successfully", async () => {
  seedQueue([
    {
      id: "sync1",
      items: [],
      total_amount: 100,
      payment_method: "cash",
      created_at: "2025-01-01T00:00:00Z",
    },
    {
      id: "sync2",
      items: [],
      total_amount: 200,
      payment_method: "card",
      created_at: "2025-01-01T00:00:00Z",
    },
  ]);
  const syncFn = mock.fn(async () => true);
  const result = await syncQueuedSales(syncFn);
  assert.equal(result.synced, 2);
  assert.equal(result.failed, 0);
  assert.equal(syncFn.mock.callCount(), 2);
  // Queue should be empty after successful sync
  assert.deepEqual(getQueuedSales(), []);
});

test("syncQueuedSales counts failed when sync fn returns false", async () => {
  seedQueue([
    {
      id: "f1",
      items: [],
      total_amount: 50,
      payment_method: "cash",
      created_at: "2025-01-01T00:00:00Z",
    },
    {
      id: "f2",
      items: [],
      total_amount: 75,
      payment_method: "card",
      created_at: "2025-01-01T00:00:00Z",
    },
  ]);
  const syncFn = mock.fn(async () => false);
  const result = await syncQueuedSales(syncFn);
  assert.equal(result.synced, 0);
  assert.equal(result.failed, 2);
  // Queue should still have both items
  assert.equal(getQueuedSales().length, 2);
});

test("syncQueuedSales handles thrown exception (captures and continues)", async () => {
  seedQueue([
    {
      id: "e1",
      items: [],
      total_amount: 10,
      payment_method: "cash",
      created_at: "2025-01-01T00:00:00Z",
    },
    {
      id: "e2",
      items: [],
      total_amount: 20,
      payment_method: "card",
      created_at: "2025-01-01T00:00:00Z",
    },
  ]);
  const syncFn = mock.fn(async (sale: Record<string, unknown>) => {
    if (sale.id === "e1") throw new Error("network boom");
    return true;
  });
  const result = await syncQueuedSales(syncFn);
  assert.equal(result.synced, 1); // e2 succeeded
  assert.equal(result.failed, 1); // e1 threw
  // e2 was removed; only e1 remains
  const remaining = getQueuedSales();
  assert.equal(remaining.length, 1);
  assert.equal(remaining[0].id, "e1");
});
