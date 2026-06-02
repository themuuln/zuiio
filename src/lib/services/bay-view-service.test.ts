import { revalidateTag } from "next/cache";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createClient } from "@/lib/supabase/server";
import { createMockSupabaseClient } from "@/test/mocks/supabase";
import { updateWorkOrderStatus } from "./bay-view-service";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));

const mockClient = createMockSupabaseClient();

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(createClient).mockResolvedValue(
    mockClient as unknown as Awaited<ReturnType<typeof createClient>>,
  );
  mockClient.rpc.mockResolvedValue({ data: "org-1", error: null });
});

describe("bay-view updateWorkOrderStatus", () => {
  it("records a history row even when notes are empty", async () => {
    mockClient.from("work_orders").single.mockResolvedValueOnce({
      data: { id: "wo-1", organization_id: "org-1", status: "In Progress" },
      error: null,
    });

    await updateWorkOrderStatus("wo-1", "Diagnosing");

    expect(mockClient.from).toHaveBeenCalledWith("work_order_status_history");
    expect(
      mockClient.from("work_order_status_history").insert,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        work_order_id: "wo-1",
        organization_id: "org-1",
        previous_status: "In Progress",
        status: "Diagnosing",
      }),
    );
  });

  it("does not create a duplicate history row when the status is unchanged", async () => {
    mockClient.from("work_orders").single.mockResolvedValueOnce({
      data: { id: "wo-1", organization_id: "org-1", status: "Diagnosing" },
      error: null,
    });

    await updateWorkOrderStatus("wo-1", "Diagnosing");

    expect(
      mockClient.from("work_order_status_history").insert,
    ).not.toHaveBeenCalled();
  });

  it("revalidates the work-order cache tags", async () => {
    mockClient.from("work_orders").single.mockResolvedValueOnce({
      data: { id: "wo-1", organization_id: "org-1", status: "New" },
      error: null,
    });

    await updateWorkOrderStatus("wo-1", "Diagnosing");

    expect(revalidateTag).toHaveBeenCalledWith(
      expect.stringContaining("work-order:wo-1"),
      "max",
    );
    expect(revalidateTag).toHaveBeenCalledWith(
      expect.stringContaining("work-order-detail:wo-1"),
      "max",
    );
  });
});
