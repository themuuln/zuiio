import { describe, expect, it, vi } from "vitest";
import { withOfflineQueue } from "@/lib/offline/with-offline-queue";

const makeContext = (
  overrides: Partial<
    Parameters<Parameters<typeof withOfflineQueue<any, any>>[0]>[1]
  > = {},
) => ({
  isOnline: true,
  queue: { enqueue: vi.fn(async () => "id-1") },
  ...overrides,
});

describe("withOfflineQueue", () => {
  it("delegates to mutationFn when online", async () => {
    const mutationFn = vi.fn(async (vars: { name: string }) => ({
      id: "1",
      ...vars,
    }));
    const wrapped = withOfflineQueue({
      endpoint: "/api/organizations/org-1/customers",
      method: "POST",
      bodyFn: (vars) => vars,
      queryKeys: [["customers"]],
      mutationFn,
    });

    const context = makeContext({ isOnline: true });
    const result = await wrapped({ name: "Alice" }, context);

    expect(mutationFn).toHaveBeenCalledWith({ name: "Alice" });
    expect(context.queue.enqueue).not.toHaveBeenCalled();
    expect(result).toEqual({ id: "1", name: "Alice" });
  });

  it("queues the mutation when offline and returns the queued sentinel", async () => {
    const mutationFn = vi.fn(async () => ({ id: "1" }));
    const wrapped = withOfflineQueue({
      endpoint: "/api/organizations/org-1/customers",
      method: "POST",
      bodyFn: (vars) => vars,
      queryKeys: [["customers"]],
      mutationFn,
    });

    const context = makeContext({ isOnline: false });
    const result = await wrapped({ name: "Alice" }, context);

    expect(mutationFn).not.toHaveBeenCalled();
    expect(context.queue.enqueue).toHaveBeenCalledWith({
      endpoint: "/api/organizations/org-1/customers",
      method: "POST",
      body: { name: "Alice" },
      queryKeysToInvalidate: [["customers"]],
    });
    expect(result).toEqual({ queued: true });
  });

  it("delegates to mutationFn even when offline when skipQueue is set", async () => {
    const mutationFn = vi.fn(async (vars: { file: string }) => ({
      ok: true,
      ...vars,
    }));
    const wrapped = withOfflineQueue({
      endpoint: "/api/organizations/org-1/upload",
      method: "POST",
      bodyFn: (vars) => vars,
      queryKeys: [],
      skipQueue: true,
      mutationFn,
    });

    const context = makeContext({ isOnline: false });
    const result = await wrapped({ file: "f-1" }, context);

    expect(mutationFn).toHaveBeenCalledWith({ file: "f-1" });
    expect(context.queue.enqueue).not.toHaveBeenCalled();
    expect(result).toEqual({ ok: true, file: "f-1" });
  });

  it("rejects external endpoints instead of queueing them", async () => {
    const mutationFn = vi.fn(async () => ({}));
    const wrapped = withOfflineQueue({
      endpoint: "https://evil.example/x",
      method: "POST",
      bodyFn: (vars) => vars,
      queryKeys: [],
      mutationFn,
    });

    const context = makeContext({ isOnline: false });
    await expect(wrapped({}, context)).rejects.toThrow("Invalid endpoint");
    expect(context.queue.enqueue).not.toHaveBeenCalled();
  });
});
