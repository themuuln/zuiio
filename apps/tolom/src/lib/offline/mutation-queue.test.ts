import { openDB } from "idb";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "fake-indexeddb/auto";

import {
  cleanupStaleMutations,
  enqueueMutation,
  getAllMutations,
  getMutationsByStatus,
  getPendingCount,
  type QueuedMutation,
  removeMutation,
  replayPendingMutations,
} from "@/lib/offline/mutation-queue";

const DB_NAME = "zuiio-mutation-queue";
const STORE_NAME = "mutations";
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

const fetchMock = vi.fn();

async function resetQueueDb(): Promise<void> {
  const db = await openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("status", "status");
        store.createIndex("createdAt", "createdAt");
      }
    },
  });
  await db.clear(STORE_NAME);
}

async function seedMutation(
  overrides: Partial<QueuedMutation> = {},
): Promise<QueuedMutation> {
  const db = await openDB(DB_NAME, 1);
  const mutation: QueuedMutation = {
    id: `seed-${Math.random()}`,
    endpoint: "/api/organizations/org-1/customers",
    method: "POST",
    body: { name: "Alice" },
    queryKeysToInvalidate: [],
    createdAt: Date.now(),
    status: "pending",
    retries: 0,
    maxRetries: 3,
    ...overrides,
  };
  await db.put(STORE_NAME, mutation);
  return mutation;
}

beforeEach(async () => {
  vi.clearAllMocks();
  await resetQueueDb();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("enqueueMutation", () => {
  it("persists a pending mutation with defaults and returns its id", async () => {
    const id = await enqueueMutation({
      endpoint: "/api/organizations/org-1/customers",
      method: "POST",
      body: { name: "Alice" },
      queryKeysToInvalidate: [["customers"]],
    });

    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(0);

    const pending = await getMutationsByStatus("pending");
    expect(pending).toHaveLength(1);
    expect(pending[0]).toMatchObject({
      id,
      endpoint: "/api/organizations/org-1/customers",
      method: "POST",
      body: { name: "Alice" },
      queryKeysToInvalidate: [["customers"]],
      status: "pending",
      retries: 0,
      maxRetries: 3,
    });
    expect(typeof pending[0].createdAt).toBe("number");
  });
});

describe("queries", () => {
  it("getMutationsByStatus filters by status", async () => {
    const pending = await enqueueMutation({
      endpoint: "/api/a",
      method: "POST",
      body: null,
      queryKeysToInvalidate: [],
    });
    const failed = await seedMutation({ status: "failed" });

    const pendingList = await getMutationsByStatus("pending");
    expect(pendingList.map((m) => m.id)).toEqual([pending]);

    const failedList = await getMutationsByStatus("failed");
    expect(failedList.map((m) => m.id)).toEqual([failed.id]);
  });

  it("getAllMutations returns all mutations oldest first", async () => {
    const older = await seedMutation({ createdAt: 1000 });
    const newer = await seedMutation({ createdAt: 2000 });
    await enqueueMutation({
      endpoint: "/api/c",
      method: "PATCH",
      body: {},
      queryKeysToInvalidate: [],
    });

    const all = await getAllMutations();
    expect(all[0].id).toBe(older.id);
    expect(all[1].id).toBe(newer.id);
    expect(all).toHaveLength(3);
  });

  it("getPendingCount counts only pending mutations", async () => {
    await enqueueMutation({
      endpoint: "/api/a",
      method: "POST",
      body: null,
      queryKeysToInvalidate: [],
    });
    await enqueueMutation({
      endpoint: "/api/b",
      method: "POST",
      body: null,
      queryKeysToInvalidate: [],
    });
    await seedMutation({ status: "failed" });

    await expect(getPendingCount()).resolves.toBe(2);
  });

  it("removeMutation deletes by id and tolerates missing ids", async () => {
    const id = await enqueueMutation({
      endpoint: "/api/a",
      method: "POST",
      body: null,
      queryKeysToInvalidate: [],
    });

    await removeMutation(id);
    await removeMutation("never-existed");

    await expect(getAllMutations()).resolves.toEqual([]);
  });
});

describe("cleanupStaleMutations", () => {
  it("removes completed/failed mutations older than 7 days, keeps the rest", async () => {
    const oldCompleted = await seedMutation({
      status: "completed",
      createdAt: Date.now() - SEVEN_DAYS_MS - 1000,
    });
    const oldFailed = await seedMutation({
      status: "failed",
      createdAt: Date.now() - SEVEN_DAYS_MS - 1000,
    });
    const oldPending = await seedMutation({
      status: "pending",
      createdAt: Date.now() - SEVEN_DAYS_MS - 1000,
    });
    const recentCompleted = await seedMutation({
      status: "completed",
      createdAt: Date.now() - 1000,
    });

    await cleanupStaleMutations();

    const remaining = await getAllMutations();
    const remainingIds = remaining.map((m) => m.id);
    expect(remainingIds).not.toContain(oldCompleted.id);
    expect(remainingIds).not.toContain(oldFailed.id);
    expect(remainingIds).toContain(oldPending.id);
    expect(remainingIds).toContain(recentCompleted.id);
  });
});

describe("replayPendingMutations", () => {
  it("replays a pending mutation successfully and invalidates query keys", async () => {
    const onInvalidate = vi.fn();
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => "",
    });
    vi.stubGlobal("fetch", fetchMock);

    const id = await enqueueMutation({
      endpoint: "/api/organizations/org-1/customers",
      method: "POST",
      body: { name: "Alice" },
      queryKeysToInvalidate: [["customers"], ["vehicles"]],
    });

    await expect(replayPendingMutations(onInvalidate)).resolves.toEqual({
      completed: 1,
      failed: 0,
      errors: [],
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/organizations/org-1/customers",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Alice" }),
      },
    );
    expect(onInvalidate).toHaveBeenCalledWith([["customers"], ["vehicles"]]);

    const completed = await getMutationsByStatus("completed");
    expect(completed.map((m) => m.id)).toEqual([id]);
  });

  it("sends the idempotency key and omits the body when it is null", async () => {
    const onInvalidate = vi.fn();
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => "",
    });
    vi.stubGlobal("fetch", fetchMock);

    await enqueueMutation({
      endpoint: "/api/organizations/org-1/customers",
      method: "DELETE",
      body: null,
      queryKeysToInvalidate: [],
      idempotencyKey: "idem-123",
    });

    await replayPendingMutations(onInvalidate);

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/organizations/org-1/customers",
      expect.objectContaining({
        method: "DELETE",
        headers: expect.objectContaining({ "Idempotency-Key": "idem-123" }),
        body: undefined,
      }),
    );
    expect(onInvalidate).not.toHaveBeenCalled();
  });

  it("keeps a failing mutation pending with retries, then fails it after max retries", async () => {
    const onInvalidate = vi.fn();
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => "boom",
    });
    vi.stubGlobal("fetch", fetchMock);

    const id = await enqueueMutation({
      endpoint: "/api/organizations/org-1/customers",
      method: "POST",
      body: { name: "Alice" },
      queryKeysToInvalidate: [],
    });

    await expect(replayPendingMutations(onInvalidate)).resolves.toEqual({
      completed: 0,
      failed: 0,
      errors: [],
    });
    let mutation = (await getMutationsByStatus("pending"))[0];
    expect(mutation).toMatchObject({
      id,
      status: "pending",
      retries: 1,
      error: "HTTP 500: boom",
    });

    await replayPendingMutations(onInvalidate);
    mutation = (await getMutationsByStatus("pending"))[0];
    expect(mutation.retries).toBe(2);

    await expect(replayPendingMutations(onInvalidate)).resolves.toEqual({
      completed: 0,
      failed: 1,
      errors: [{ id, error: "HTTP 500: boom" }],
    });
    const failed = await getMutationsByStatus("failed");
    expect(failed.map((m) => m.id)).toEqual([id]);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("refuses external endpoints without calling fetch, then fails them", async () => {
    const onInvalidate = vi.fn();
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => "",
    });
    vi.stubGlobal("fetch", fetchMock);

    const fresh = await seedMutation({ endpoint: "https://evil.example/x" });
    const exhausted = await seedMutation({
      endpoint: "https://evil.example/y",
      retries: 2,
    });

    await expect(replayPendingMutations(onInvalidate)).resolves.toEqual({
      completed: 0,
      failed: 1,
      errors: [
        { id: exhausted.id, error: "Invalid endpoint: https://evil.example/y" },
      ],
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(onInvalidate).not.toHaveBeenCalled();

    const pending = await getMutationsByStatus("pending");
    expect(pending.map((m) => m.id)).toEqual([fresh.id]);
    expect(pending[0]).toMatchObject({
      status: "pending",
      retries: 1,
      error: "Invalid endpoint: https://evil.example/x",
    });
  });

  it("fails pending mutations that already exceeded max retries without fetching", async () => {
    const onInvalidate = vi.fn();
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => "",
    });
    vi.stubGlobal("fetch", fetchMock);

    const exhausted = await seedMutation({ retries: 3 });

    await expect(replayPendingMutations(onInvalidate)).resolves.toEqual({
      completed: 0,
      failed: 1,
      errors: [{ id: exhausted.id, error: "Max retries exceeded" }],
    });

    expect(fetchMock).not.toHaveBeenCalled();
    const failed = await getMutationsByStatus("failed");
    expect(failed.map((m) => m.id)).toEqual([exhausted.id]);
  });
});
