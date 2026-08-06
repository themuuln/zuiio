import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotFoundError } from "@/lib/errors";
import {
  createMockSupabaseClient,
  type MockSupabaseClient,
} from "@/test/mocks/supabase";

vi.mock("@/lib/logger", () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    child: vi.fn(),
  },
}));

import { logger } from "@/lib/logger";
import { getWorkOrderDetail } from "../work-order-queries";

const mockLoggerError = vi.mocked(logger.error);

let db: MockSupabaseClient;

beforeEach(() => {
  vi.clearAllMocks();
  db = createMockSupabaseClient();
});

describe("getWorkOrderDetail", () => {
  it("returns the detail from the RPC", async () => {
    const detail = { id: "wo-1", status: "Completed", total: 200 };
    db.rpc.mockResolvedValue({ data: detail, error: null });

    const result = await getWorkOrderDetail(db as never, "wo-1", "org-1");

    expect(result).toEqual(detail);
    expect(db.rpc).toHaveBeenCalledWith("get_work_order_detail", {
      p_wo_id: "wo-1",
      p_org_id: "org-1",
    });
  });

  it("throws NotFoundError and logs when the RPC fails", async () => {
    db.rpc.mockResolvedValue({ data: null, error: { message: "boom" } });

    const promise = getWorkOrderDetail(db as never, "wo-1", "org-1");

    await expect(promise).rejects.toThrow(NotFoundError);
    await expect(promise).rejects.toThrow("Work order not found");
    expect(mockLoggerError).toHaveBeenCalledWith(
      { workOrderId: "wo-1", orgId: "org-1", rpcError: { message: "boom" } },
      "getWorkOrderDetail: RPC call failed",
    );
  });

  it("throws NotFoundError when the RPC succeeds without data", async () => {
    db.rpc.mockResolvedValue({ data: null, error: null });

    const promise = getWorkOrderDetail(db as never, "wo-1", "org-1");

    await expect(promise).rejects.toThrow(NotFoundError);
    await expect(promise).rejects.toThrow("Work order not found");
    expect(mockLoggerError).not.toHaveBeenCalled();
  });
});
