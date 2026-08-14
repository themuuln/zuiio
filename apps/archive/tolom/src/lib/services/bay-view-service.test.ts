import type { SupabaseClient } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createClient } from "@/lib/supabase/server";
import { createMockSupabaseClient } from "@/test/mocks/supabase";
import { updateWorkOrderStatus } from "./bay-view-service.actions";
import { updateWorkOrderStatus as canonicalUpdate } from "./work-order-workflow";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));
vi.mock("./work-order-workflow", () => ({
  updateWorkOrderStatus: vi.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyDb = SupabaseClient<any, "public", any>;
type MockDb = ReturnType<typeof createMockSupabaseClient>;

const mockClient = createMockSupabaseClient();

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(createClient).mockResolvedValue(
    mockClient as unknown as Awaited<ReturnType<typeof createClient>>,
  );
  mockClient.rpc.mockResolvedValue({ data: "org-1", error: null });
  vi.mocked(canonicalUpdate).mockResolvedValue({} as any);
});

describe("bay-view updateWorkOrderStatus (server action)", () => {
  it("delegates to the canonical work-order-workflow version", async () => {
    await updateWorkOrderStatus("wo-1", "Diagnosing", "note");

    expect(canonicalUpdate).toHaveBeenCalledWith(
      mockClient,
      "wo-1",
      "org-1",
      "Diagnosing",
      "note",
    );
  });

  it("creates its own Supabase client and resolves orgId", async () => {
    await updateWorkOrderStatus("wo-1", "Completed");

    expect(createClient).toHaveBeenCalled();
    // getOrgId calls rpc
    expect(mockClient.rpc).toHaveBeenCalled();
  });

  it("passes notes through to the canonical version", async () => {
    await updateWorkOrderStatus("wo-1", "In Progress", "mechanic assigned");

    expect(canonicalUpdate).toHaveBeenCalledWith(
      mockClient,
      "wo-1",
      "org-1",
      "In Progress",
      "mechanic assigned",
    );
  });

  it("omits notes when not provided", async () => {
    await updateWorkOrderStatus("wo-1", "New");

    expect(canonicalUpdate).toHaveBeenCalledWith(
      mockClient,
      "wo-1",
      "org-1",
      "New",
      undefined,
    );
  });
});

describe("bay-view pure service functions", () => {
  function asDb(mock: MockDb): AnyDb {
    return mock as unknown as AnyDb;
  }

  it("updateWorkOrderStatus accepts db and orgId as first params", async () => {
    const { updateWorkOrderStatus: pureUpdate } = await import(
      "./bay-view-service"
    );
    const mockDb = createMockSupabaseClient();

    await pureUpdate(asDb(mockDb), "org-1", "wo-1", "Diagnosing", "note");

    expect(canonicalUpdate).toHaveBeenCalledWith(
      asDb(mockDb),
      "wo-1",
      "org-1",
      "Diagnosing",
      "note",
    );
  });

  it("getBayViewData accepts db and orgId as first params", async () => {
    const { getBayViewData } = await import("./bay-view-service");
    const mockDb = createMockSupabaseClient();
    const mockChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    };
    mockDb.from.mockReturnValue(mockChain as any);

    const result = await getBayViewData(asDb(mockDb), "org-1", undefined);

    expect(result).toBeDefined();
    expect(result).toHaveProperty("bays");
    expect(result).toHaveProperty("branches");
    expect(result).toHaveProperty("waitingQueue");
    expect(result).toHaveProperty("mechanics");
    expect(result).toHaveProperty("shiftReport");
  });

  it("assignVehicleToBay accepts db and orgId as first params", async () => {
    const { assignVehicleToBay } = await import("./bay-view-service");
    const mockDb = createMockSupabaseClient();
    mockDb.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
    } as any);

    await expect(
      assignVehicleToBay(asDb(mockDb), "org-1", "wo-1", 1),
    ).resolves.toBeUndefined();
  });

  describe("batchCompleteWorkOrders", () => {
    it("calls updateWorkOrderStatusCanonical for each work order", async () => {
      const { batchCompleteWorkOrders } = await import("./bay-view-service");
      const mockDb = createMockSupabaseClient();

      const result = await batchCompleteWorkOrders(asDb(mockDb), "org-1", [
        "wo-1",
        "wo-2",
        "wo-3",
      ]);

      expect(canonicalUpdate).toHaveBeenCalledTimes(3);
      expect(canonicalUpdate).toHaveBeenCalledWith(
        asDb(mockDb),
        "wo-1",
        "org-1",
        "Completed",
      );
      expect(canonicalUpdate).toHaveBeenCalledWith(
        asDb(mockDb),
        "wo-2",
        "org-1",
        "Completed",
      );
      expect(canonicalUpdate).toHaveBeenCalledWith(
        asDb(mockDb),
        "wo-3",
        "org-1",
        "Completed",
      );
      expect(result.succeeded).toBe(3);
      expect(result.failed).toBe(0);
      expect(result.errors).toEqual([]);
    });

    it("reports partial success when some work orders fail", async () => {
      const { batchCompleteWorkOrders } = await import("./bay-view-service");
      const mockDb = createMockSupabaseClient();

      vi.mocked(canonicalUpdate)
        .mockResolvedValueOnce({} as any) // wo-1 succeeds
        .mockRejectedValueOnce(new Error("Network error")) // wo-2 fails
        .mockResolvedValueOnce({} as any); // wo-3 succeeds

      const result = await batchCompleteWorkOrders(asDb(mockDb), "org-1", [
        "wo-1",
        "wo-2",
        "wo-3",
      ]);

      expect(result.succeeded).toBe(2);
      expect(result.failed).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].woId).toBe("wo-2");
      expect(result.errors[0].error).toBe("Network error");
    });

    it("reports total failure when all work orders fail", async () => {
      const { batchCompleteWorkOrders } = await import("./bay-view-service");
      const mockDb = createMockSupabaseClient();

      vi.mocked(canonicalUpdate).mockRejectedValue(new Error("Server error"));

      const result = await batchCompleteWorkOrders(asDb(mockDb), "org-1", [
        "wo-1",
        "wo-2",
      ]);

      expect(result.succeeded).toBe(0);
      expect(result.failed).toBe(2);
      expect(result.errors).toHaveLength(2);
    });

    it("returns zero counts for empty input", async () => {
      const { batchCompleteWorkOrders } = await import("./bay-view-service");
      const mockDb = createMockSupabaseClient();

      const result = await batchCompleteWorkOrders(asDb(mockDb), "org-1", []);

      expect(canonicalUpdate).not.toHaveBeenCalled();
      expect(result.succeeded).toBe(0);
      expect(result.failed).toBe(0);
      expect(result.errors).toEqual([]);
    });
  });
});
