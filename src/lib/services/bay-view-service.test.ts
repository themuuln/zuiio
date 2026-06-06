import { beforeEach, describe, expect, it, vi } from "vitest";
import { createClient } from "@/lib/supabase/server";
import { createMockSupabaseClient } from "@/test/mocks/supabase";
import { updateWorkOrderStatus } from "./bay-view-service";
import { updateWorkOrderStatus as canonicalUpdate } from "./work-order-workflow";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("./work-order-workflow", () => ({
  updateWorkOrderStatus: vi.fn(),
}));

const mockClient = createMockSupabaseClient();

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(createClient).mockResolvedValue(
    mockClient as unknown as Awaited<ReturnType<typeof createClient>>,
  );
  mockClient.rpc.mockResolvedValue({ data: "org-1", error: null });
  vi.mocked(canonicalUpdate).mockResolvedValue({} as any);
});

describe("bay-view updateWorkOrderStatus", () => {
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
