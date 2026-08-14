import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { WorkOrderDetail } from "@/lib/types";
import { bayViewKeys } from "../keys";
import {
  useAddHelperToWorkOrder,
  useAssignCustomerToWorkOrder,
  useAssignMechanicToWorkOrder,
  useAssignVehicleToBay,
  useBatchCompleteMutation,
  useRemoveHelperFromWorkOrder,
  useRemoveMechanicFromWorkOrder,
  useRemoveVehicleFromBay,
  useSwapBays,
  useUpdateBayCount,
  useUpdateBayViewStatus,
} from "../use-bay-view";
import {
  type DrawerDetailResponse,
  drawerDetailKeys,
} from "../use-drawer-queries";

// Mock the dynamic import target so mutationFn works synchronously in tests
vi.mock("@/lib/services/bay-view-service.actions", () => ({
  updateWorkOrderStatus: vi.fn(),
  assignVehicleToBay: vi.fn(),
  removeVehicleFromBay: vi.fn(),
  swapBayNumbers: vi.fn(),
  assignMechanicToWorkOrder: vi.fn(),
  unassignMechanicFromWorkOrder: vi.fn(),
  assignHelperToWorkOrder: vi.fn(),
  removeHelperFromWorkOrder: vi.fn(),
  batchCompleteWorkOrders: vi.fn(),
  updateBayCount: vi.fn(),
}));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

function createWrapper() {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("useUpdateBayViewStatus", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.clearAllMocks();
  });

  it("invokes updateWorkOrderStatus with correct arguments", async () => {
    const { result } = renderHook(() => useUpdateBayViewStatus("branch-1"), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync({ woId: "wo-1", status: "Completed" });

    // Dynamic import to get reference to mocked fn — standard Vitest vi.mock access pattern
    const { updateWorkOrderStatus } = await import(
      "@/lib/services/bay-view-service.actions"
    );
    expect(updateWorkOrderStatus).toHaveBeenCalledWith(
      "wo-1",
      "Completed",
      undefined,
    );
  });

  it("accepts notes parameter", async () => {
    const { result } = renderHook(() => useUpdateBayViewStatus("branch-1"), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync({
      woId: "wo-2",
      status: "Ready for Pickup",
      notes: "Customer notified",
    });

    // Dynamic import to get reference to mocked fn — standard Vitest vi.mock access pattern
    const { updateWorkOrderStatus } = await import(
      "@/lib/services/bay-view-service.actions"
    );
    expect(updateWorkOrderStatus).toHaveBeenCalledWith(
      "wo-2",
      "Ready for Pickup",
      "Customer notified",
    );
  });

  it("accepts undefined branchId", () => {
    const { result } = renderHook(() => useUpdateBayViewStatus(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current).toBeDefined();
    expect(typeof result.current.mutateAsync).toBe("function");
  });
});

describe("useAssignVehicleToBay", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.clearAllMocks();
  });

  it("invokes assignVehicleToBay with correct arguments", async () => {
    const { result } = renderHook(() => useAssignVehicleToBay("branch-1"), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync({ workOrderId: "wo-1", bayNumber: 3 });

    // Dynamic import to get reference to mocked fn — standard Vitest vi.mock access pattern
    const { assignVehicleToBay } = await import(
      "@/lib/services/bay-view-service.actions"
    );
    expect(assignVehicleToBay).toHaveBeenCalledWith("wo-1", 3);
  });

  it("accepts undefined branchId", () => {
    const { result } = renderHook(() => useAssignVehicleToBay(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current).toBeDefined();
    expect(typeof result.current.mutateAsync).toBe("function");
  });
});

describe("useRemoveVehicleFromBay", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.clearAllMocks();
  });

  it("invokes removeVehicleFromBay with correct arguments", async () => {
    const { result } = renderHook(() => useRemoveVehicleFromBay("branch-1"), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync({ woId: "wo-1" });

    // Dynamic import to get reference to mocked fn — standard Vitest vi.mock access pattern
    const { removeVehicleFromBay } = await import(
      "@/lib/services/bay-view-service.actions"
    );
    expect(removeVehicleFromBay).toHaveBeenCalledWith("wo-1");
  });

  it("accepts undefined branchId", () => {
    const { result } = renderHook(() => useRemoveVehicleFromBay(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current).toBeDefined();
    expect(typeof result.current.mutateAsync).toBe("function");
  });
});

describe("useSwapBays", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.clearAllMocks();
  });

  it("invokes swapBayNumbers with correct arguments", async () => {
    const { result } = renderHook(() => useSwapBays("branch-1"), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync({
      woIdA: "wo-1",
      bayNumberA: 1,
      woIdB: "wo-2",
      bayNumberB: 2,
    });

    // Dynamic import to get reference to mocked fn — standard Vitest vi.mock access pattern
    const { swapBayNumbers } = await import(
      "@/lib/services/bay-view-service.actions"
    );
    expect(swapBayNumbers).toHaveBeenCalledWith("wo-1", 1, "wo-2", 2);
  });
});

describe("useAssignMechanicToWorkOrder", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.clearAllMocks();
  });

  it("invokes assignMechanicToWorkOrder with correct arguments", async () => {
    const { result } = renderHook(
      () => useAssignMechanicToWorkOrder("branch-1", "org-1"),
      { wrapper: createWrapper() },
    );

    await result.current.mutateAsync({ woId: "wo-1", mechanicId: "mech-1" });

    // Dynamic import to get reference to mocked fn — standard Vitest vi.mock access pattern
    const { assignMechanicToWorkOrder } = await import(
      "@/lib/services/bay-view-service.actions"
    );
    expect(assignMechanicToWorkOrder).toHaveBeenCalledWith("wo-1", "mech-1");
  });
});

describe("useRemoveMechanicFromWorkOrder", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.clearAllMocks();
  });

  it("invokes unassignMechanicFromWorkOrder with correct arguments", async () => {
    const { result } = renderHook(
      () => useRemoveMechanicFromWorkOrder("branch-1", "org-1"),
      { wrapper: createWrapper() },
    );

    await result.current.mutateAsync({ woId: "wo-1" });

    // Dynamic import to get reference to mocked fn — standard Vitest vi.mock access pattern
    const { unassignMechanicFromWorkOrder } = await import(
      "@/lib/services/bay-view-service.actions"
    );
    expect(unassignMechanicFromWorkOrder).toHaveBeenCalledWith("wo-1");
  });
});

describe("useAddHelperToWorkOrder", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.clearAllMocks();
  });

  it("invokes assignHelperToWorkOrder with correct arguments", async () => {
    const { result } = renderHook(
      () => useAddHelperToWorkOrder("branch-1", "org-1"),
      { wrapper: createWrapper() },
    );

    await result.current.mutateAsync({ woId: "wo-1", mechanicId: "mech-2" });

    // Dynamic import to get reference to mocked fn — standard Vitest vi.mock access pattern
    const { assignHelperToWorkOrder } = await import(
      "@/lib/services/bay-view-service.actions"
    );
    expect(assignHelperToWorkOrder).toHaveBeenCalledWith("wo-1", "mech-2");
  });
});

describe("useRemoveHelperFromWorkOrder", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.clearAllMocks();
  });

  it("invokes removeHelperFromWorkOrder with correct arguments", async () => {
    const { result } = renderHook(
      () => useRemoveHelperFromWorkOrder("branch-1", "org-1"),
      { wrapper: createWrapper() },
    );

    await result.current.mutateAsync({ woId: "wo-1", mechanicId: "mech-2" });

    // Dynamic import to get reference to mocked fn — standard Vitest vi.mock access pattern
    const { removeHelperFromWorkOrder } = await import(
      "@/lib/services/bay-view-service.actions"
    );
    expect(removeHelperFromWorkOrder).toHaveBeenCalledWith("wo-1", "mech-2");
  });
});

describe("useAssignCustomerToWorkOrder", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.clearAllMocks();
  });

  it("calls PATCH endpoint with customer_id", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: { id: "wo-1" } }),
    } as Response);

    const { result } = renderHook(
      () => useAssignCustomerToWorkOrder("branch-1", "org-1"),
      { wrapper: createWrapper() },
    );

    await result.current.mutateAsync({
      woId: "wo-1",
      customerId: "cust-1",
      customerName: "John",
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/organizations/org-1/work-orders/wo-1",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ customer_id: "cust-1" }),
      }),
    );
  });

  it("handles API error", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ error: { message: "Not found" } }),
    } as Response);

    const { result } = renderHook(
      () => useAssignCustomerToWorkOrder("branch-1", "org-1"),
      { wrapper: createWrapper() },
    );

    await expect(
      result.current.mutateAsync({ woId: "wo-99", customerId: "cust-1" }),
    ).rejects.toThrow("Not found");
  });
});

describe("useBatchCompleteMutation", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.clearAllMocks();
  });

  it("invokes batchCompleteWorkOrders with correct arguments", async () => {
    const { result } = renderHook(() => useBatchCompleteMutation("branch-1"), {
      wrapper: createWrapper(),
    });

    const resultData = { succeeded: 2, failed: 0 };
    // Dynamic import to get reference to mocked fn — standard Vitest vi.mock access pattern
    const { batchCompleteWorkOrders } = await import(
      "@/lib/services/bay-view-service.actions"
    );
    vi.mocked(batchCompleteWorkOrders).mockResolvedValue(resultData);

    const output = await result.current.mutateAsync(["wo-1", "wo-2"]);

    expect(batchCompleteWorkOrders).toHaveBeenCalledWith(["wo-1", "wo-2"]);
    expect(output).toEqual(resultData);
  });
});

describe("useUpdateBayCount", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.clearAllMocks();
  });

  it("invokes updateBayCount with correct arguments", async () => {
    const { result } = renderHook(() => useUpdateBayCount("branch-1"), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync({ count: 5 });

    // Dynamic import to get reference to mocked fn — standard Vitest vi.mock access pattern
    const { updateBayCount } = await import(
      "@/lib/services/bay-view-service.actions"
    );
    expect(updateBayCount).toHaveBeenCalledWith(5);
  });
});

describe("bayViewKeys", () => {
  it("constructs correct key shapes", () => {
    expect(bayViewKeys.all).toEqual(["bay-view"]);
    expect(bayViewKeys.data("branch-1")).toEqual([
      "bay-view",
      "data",
      "branch-1",
    ]);
    expect(bayViewKeys.data(undefined)).toEqual(["bay-view", "data", "all"]);
    expect(bayViewKeys.shiftReport("branch-1")).toEqual([
      "bay-view",
      "shift-report",
      "branch-1",
    ]);
  });
});

// ── Drawer detail optimistic updates ─────────────────────────
// The open WorkOrderDetailDrawer renders from the drawer detail cache
// (`drawerDetailKeys`), so mechanic/helper mutations must update it in
// onMutate — otherwise the change only appears after the post-mutation
// refetch settles (1-2s).

function makeDrawerWorkOrder(
  overrides: Partial<WorkOrderDetail> = {},
): WorkOrderDetail {
  return {
    id: "wo-1",
    organization_id: "org-1",
    branch_id: null,
    customer_id: null,
    vehicle_id: null,
    mechanic_id: null,
    status: "New",
    complaint: null,
    diagnosis: null,
    description: null,
    notes: null,
    mechanic_notes: null,
    diagnosis_label_id: null,
    bay_number: 1,
    queue_order: 1,
    odometer_at_service: null,
    discount_amount: 0,
    discount_percentage: 0,
    discount_total: 0,
    subtotal: 0,
    total: 0,
    completed_at: null,
    started_at: null,
    created_at: "2026-08-09T09:00:00Z",
    updated_at: "2026-08-09T09:00:00Z",
    created_by: null,
    updated_by: null,
    deleted_at: null,
    customer: null,
    vehicle: null,
    mechanic: null,
    helpers: [],
    services: [],
    parts: [],
    status_history: [],
    service_history: [],
    ...overrides,
  };
}

function seedDrawerDetail(overrides: Partial<WorkOrderDetail> = {}) {
  queryClient.setQueryData<DrawerDetailResponse>(
    drawerDetailKeys.all("org-1", "wo-1"),
    { workOrder: makeDrawerWorkOrder(overrides) },
  );
}

function readDrawerDetail(): WorkOrderDetail | null {
  const cached = queryClient.getQueryData<DrawerDetailResponse>(
    drawerDetailKeys.all("org-1", "wo-1"),
  );
  return cached?.workOrder ?? null;
}

describe("mechanic mutations update the open drawer detail optimistically", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.clearAllMocks();
  });

  it("assign mechanic: drawer cache shows the mechanic", async () => {
    seedDrawerDetail();
    const { result } = renderHook(
      () => useAssignMechanicToWorkOrder("branch-1", "org-1"),
      { wrapper: createWrapper() },
    );

    await result.current.mutateAsync({ woId: "wo-1", mechanicId: "mech-1" });

    expect(readDrawerDetail()?.mechanic).toEqual({
      id: "mech-1",
      full_name: null,
    });
    expect(readDrawerDetail()?.mechanic_id).toBe("mech-1");
    expect(readDrawerDetail()?.status).toBe("In Progress");
  });

  it("remove mechanic: drawer cache clears the mechanic", async () => {
    seedDrawerDetail({
      mechanic: { id: "mech-1", full_name: "Бат" },
      mechanic_id: "mech-1",
    });
    const { result } = renderHook(
      () => useRemoveMechanicFromWorkOrder("branch-1", "org-1"),
      { wrapper: createWrapper() },
    );

    await result.current.mutateAsync({ woId: "wo-1" });

    expect(readDrawerDetail()?.mechanic).toBeNull();
    expect(readDrawerDetail()?.mechanic_id).toBeNull();
  });

  it("add helper: drawer cache gains the helper", async () => {
    seedDrawerDetail();
    const { result } = renderHook(
      () => useAddHelperToWorkOrder("branch-1", "org-1"),
      { wrapper: createWrapper() },
    );

    await result.current.mutateAsync({ woId: "wo-1", mechanicId: "mech-2" });

    expect(readDrawerDetail()?.helpers).toEqual([
      expect.objectContaining({ id: "mech-2", mechanic_id: "mech-2" }),
    ]);
  });

  it("add helper: no-op when the mechanic is already a helper or lead", async () => {
    seedDrawerDetail({
      mechanic: { id: "mech-1", full_name: "Бат" },
      mechanic_id: "mech-1",
      helpers: [{ id: "h-1", mechanic_id: "mech-2", full_name: "Цэцэг" }],
    });
    const { result } = renderHook(
      () => useAddHelperToWorkOrder("branch-1", "org-1"),
      { wrapper: createWrapper() },
    );

    await result.current.mutateAsync({ woId: "wo-1", mechanicId: "mech-1" });

    expect(readDrawerDetail()?.helpers).toHaveLength(1);
  });

  it("remove helper: drawer cache drops the helper", async () => {
    seedDrawerDetail({
      helpers: [{ id: "h-1", mechanic_id: "mech-2", full_name: "Цэцэг" }],
    });
    const { result } = renderHook(
      () => useRemoveHelperFromWorkOrder("branch-1", "org-1"),
      { wrapper: createWrapper() },
    );

    await result.current.mutateAsync({ woId: "wo-1", mechanicId: "mech-2" });

    expect(readDrawerDetail()?.helpers).toEqual([]);
  });

  it("rolls the drawer cache back when the API call fails", async () => {
    seedDrawerDetail();
    const { removeHelperFromWorkOrder } = await import(
      "@/lib/services/bay-view-service.actions"
    );
    vi.mocked(removeHelperFromWorkOrder).mockRejectedValue(new Error("boom"));
    const { result } = renderHook(
      () => useRemoveHelperFromWorkOrder("branch-1", "org-1"),
      { wrapper: createWrapper() },
    );

    await expect(
      result.current.mutateAsync({ woId: "wo-1", mechanicId: "mech-2" }),
    ).rejects.toThrow("boom");

    expect(readDrawerDetail()?.helpers).toEqual([]);
  });
});
