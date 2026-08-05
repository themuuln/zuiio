import { beforeEach, describe, expect, it, vi } from "vitest";

type MockMutation = {
  id: string;
  endpoint: string;
  method: string;
  body: unknown;
  queryKeysToInvalidate: unknown[][];
  idempotencyKey?: string;
  status: "pending" | "completed" | "failed";
};

// In-memory stand-in for the @zuiio/offline IndexedDB mutation queue.
const queue: MockMutation[] = [];
let nextId = 1;

vi.mock("@zuiio/capture", () => ({ capture: vi.fn() }));
vi.mock("@zuiio/offline", () => ({
  enqueueMutation: vi.fn(
    async (mutation: Omit<MockMutation, "id" | "status">): Promise<string> => {
      const id = `vitest-${nextId++}`;
      queue.push({ ...mutation, id, status: "pending" });
      return id;
    },
  ),
  getMutationsByStatus: vi.fn(async (status: MockMutation["status"]) =>
    queue.filter((m) => m.status === status),
  ),
  getPendingCount: vi.fn(
    async () => queue.filter((m) => m.status === "pending").length,
  ),
  removeMutation: vi.fn(async (id: string) => {
    const index = queue.findIndex((m) => m.id === id);
    if (index >= 0) queue.splice(index, 1);
  }),
}));

import { enqueueMutation, removeMutation } from "@zuiio/offline";
import {
  getPendingOfflineCount,
  queueOfflineAction,
  replayQueuedActions,
} from "../../offline-sync";

const mockedEnqueue = vi.mocked(enqueueMutation);
const mockedRemove = vi.mocked(removeMutation);

beforeEach(() => {
  queue.length = 0;
  nextId = 1;
  vi.clearAllMocks();
});

describe("offline-sync", () => {
  it("queueOfflineAction round-trips through replay with a mocked engine", async () => {
    const fields = {
      items: '[{"productId":"p1","quantity":1,"unitPrice":9000}]',
      paid_amount: "9000",
      payment_method: "cash",
      status: "completed",
    };

    const id = await queueOfflineAction("sale", fields, [
      ["sales"],
      ["products"],
    ]);

    // Enqueued with the expected mutation payload
    expect(id).toBe("vitest-1");
    expect(mockedEnqueue).toHaveBeenCalledTimes(1);
    const [mutation] = mockedEnqueue.mock.calls[0];
    expect(mutation.endpoint).toBe("sale");
    expect(mutation.method).toBe("POST");
    expect(mutation.body).toEqual(fields);
    expect(mutation.queryKeysToInvalidate).toEqual([["sales"], ["products"]]);
    expect(mutation.idempotencyKey).toEqual(expect.any(String));
    const idempotencyKey = mutation.idempotencyKey as string;

    // Pending until replayed
    expect(await getPendingOfflineCount()).toBe(1);

    const dispatch = vi.fn(async () => ({ success: true }));
    const result = await replayQueuedActions(dispatch);

    expect(result).toEqual({ synced: 1, failed: 0 });
    // The server action dedupes on the key, so a process death mid-replay
    // cannot double-sell on retry.
    expect(dispatch).toHaveBeenCalledWith("sale", fields, idempotencyKey);
    expect(mockedRemove).toHaveBeenCalledWith(id);
    expect(await getPendingOfflineCount()).toBe(0);
  });

  it("leaves failed actions pending for the next reconnect", async () => {
    await queueOfflineAction("sale", { items: "[]" }, [["sales"]]);

    const result = await replayQueuedActions(async () => ({
      success: false,
      error: "server rejected",
    }));

    expect(result).toEqual({ synced: 0, failed: 1 });
    expect(await getPendingOfflineCount()).toBe(1);
  });
});
