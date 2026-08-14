import {
  QueryClient,
  QueryClientProvider,
  type UseQueryResult,
} from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useRealtimeMulti } from "@/lib/hooks/use-realtime-multi";
import { type UserProfile, useProfile } from "@/lib/queries/use-profile";
import { getBayViewDataFresh } from "@/lib/services/bay-view-service.actions";
import type { BayViewData } from "@/lib/services/bay-view-service.types";
import { useBayViewData } from "../_use-bay-view-data";
import type { BayViewDialogsState } from "../_use-bay-view-dialogs";
import type { BayViewPendingState } from "../_use-bay-view-pending";

type ProfileQueryResult = UseQueryResult<UserProfile | null, Error>;

const mockSearchParams = vi.hoisted(() => new URLSearchParams());

vi.mock("next/navigation", () => ({
  useSearchParams: () => mockSearchParams,
}));

vi.mock("@/lib/services/bay-view-service.actions", () => ({
  getBayViewDataFresh: vi.fn(),
}));

vi.mock("@/lib/hooks/use-realtime-multi", () => ({
  useRealtimeMulti: vi.fn(),
}));

vi.mock("@/lib/queries/use-profile", () => ({
  useProfile: vi.fn(),
}));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

function createWrapper() {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

function makeWorkOrder(
  id: string,
  status: string,
  mechanicId: string | null,
  helperIds: string[],
  plate: string,
  make: string,
  model: string,
) {
  return {
    id,
    status,
    bay_number: 1,
    mechanic_id: mechanicId,
    vehicle: { id: `veh-${id}`, plate_number: plate, make, model },
    mechanic: mechanicId
      ? { id: mechanicId, full_name: `Mech ${mechanicId}`, avatar_url: null }
      : null,
    helpers: helperIds.map((h) => ({
      id: h,
      full_name: `Helper ${h}`,
      avatar_url: null,
    })),
    customer_name: `Customer ${id}`,
  } as unknown as NonNullable<BayViewData["bays"][number]["workOrder"]>;
}

function makeData(overrides: Partial<BayViewData> = {}): BayViewData {
  const bay1 = {
    bayNumber: 1,
    workOrder: makeWorkOrder(
      "wo-1",
      "Ready for Pickup",
      "mech-1",
      ["mech-2"],
      "PLATE-1",
      "Toyota",
      "Camry",
    ),
  };
  const bay2 = {
    bayNumber: 2,
    workOrder: makeWorkOrder(
      "wo-2",
      "In Progress",
      "mech-2",
      [],
      "PLATE-2",
      "Honda",
      "Civic",
    ),
  };
  return {
    bayCount: 3,
    bays: [bay1, bay2, { bayNumber: 3, workOrder: null }],
    branches: [{ id: "branch-1", name: "Main" }],
    branchSections: [
      {
        branchId: "branch-1",
        branchName: "Main",
        bayCount: 2,
        bays: [bay1, bay2],
      },
    ],
    waitingQueue: [
      {
        id: "wo-q1",
        queue_order: 0,
        status: "New",
        bay_number: null,
        mechanic_id: null,
        vehicle: null,
      },
      {
        id: "wo-q2",
        queue_order: 1,
        status: "New",
        bay_number: null,
        mechanic_id: null,
        vehicle: null,
      },
    ] as unknown as BayViewData["waitingQueue"],
    mechanics: [
      {
        id: "mech-1",
        full_name: "Mech One",
        current_jobs: 1,
      },
    ] as unknown as BayViewData["mechanics"],
    shiftReport: {
      completedToday: 3,
      revenueToday: 300,
      avgDurationMinutes: 30,
      bayUtilization: 0.5,
      bayCount: 3,
      activeJobs: 2,
      revenuePerLaborHour: 10,
    },
    ...overrides,
  };
}

function makeDialogs(overrides: Partial<BayViewDialogsState> = {}) {
  return {
    open: {},
    show: vi.fn(),
    hide: vi.fn(),
    set: vi.fn(),
    assignBay: null,
    openAssign: vi.fn(),
    closeAssign: vi.fn(),
    detailWoId: null,
    setDetailWoId: vi.fn(),
    drawerInitialAction: null,
    setDrawerInitialAction: vi.fn(),
    openDetail: vi.fn(),
    closeDetail: vi.fn(),
    directAssignBayNumber: null,
    setDirectAssignBayNumber: vi.fn(),
    anyOpen: false,
    ...overrides,
  } as BayViewDialogsState;
}

function makePending(): BayViewPendingState {
  return {
    pending: null,
    clearPending: vi.fn(),
    requestStatusChange: vi.fn(),
    requestPostService: vi.fn(),
    requestPickupComplete: vi.fn(),
  } as unknown as BayViewPendingState;
}

function setup(overrides: {
  orgId?: string;
  branchFilter?: string;
  dialogs?: BayViewDialogsState;
}) {
  const orgId = overrides.orgId ?? "org-1";
  const branchFilter = overrides.branchFilter ?? "branch-1";
  const dialogs = overrides.dialogs ?? makeDialogs();
  return renderHook(
    ({ branch }: { branch: string | undefined }) =>
      useBayViewData(orgId, branch, dialogs, makePending()),
    {
      wrapper: createWrapper(),
      initialProps: { branch: branchFilter },
    },
  );
}

beforeEach(() => {
  queryClient.clear();
  vi.clearAllMocks();
  vi.mocked(useProfile).mockReturnValue({
    data: undefined,
  } as ProfileQueryResult);
  mockSearchParams.delete("woId");
});

describe("useBayViewData", () => {
  it("transforms fetched data into derived state", async () => {
    vi.mocked(getBayViewDataFresh).mockResolvedValue(makeData());
    const { result } = setup({});

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(getBayViewDataFresh).toHaveBeenCalledWith("branch-1");
    expect(result.current.data?.bayCount).toBe(3);
    expect(result.current.shiftReport?.activeJobs).toBe(2);
    expect(result.current.error).toBeNull();
    expect(result.current.isAccessDenied).toBe(false);
    expect(result.current.readyWosCount).toBe(1);
    expect(result.current.occupiedBays).toBe(2);
    expect(result.current.filteredBays).toHaveLength(3);
    expect(result.current.filteredQueue).toHaveLength(2);
    expect(result.current.trendDelta).toBeNull();
    expect(result.current.userIsMechanic).toBeNull();
    expect(result.current.currentProfile).toBeNull();
  });

  it("exposes the error message when the fetch fails", async () => {
    vi.mocked(getBayViewDataFresh).mockRejectedValue(new Error("boom"));
    const { result } = setup({});

    await waitFor(() => expect(result.current.error).toBe("boom"));
    expect(result.current.isAccessDenied).toBe(false);
  });

  it("flags access-denied errors via AppError name and message", async () => {
    const err = new Error("User doesn't have access to this organization");
    err.name = "AppError";
    vi.mocked(getBayViewDataFresh).mockRejectedValue(err);
    const { result } = setup({});

    await waitFor(() => expect(result.current.error).toBeTruthy());
    expect(result.current.isAccessDenied).toBe(true);
  });

  it("treats non-Error rejections as no error surface", async () => {
    vi.mocked(getBayViewDataFresh).mockRejectedValue("plain string");
    const { result } = setup({});

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBeNull();
    expect(result.current.isAccessDenied).toBe(false);
  });

  it("tracks pending work order ids via markPending and clearPending", () => {
    const { result } = setup({});

    act(() => {
      result.current.markPending("wo-1", "wo-2", "");
      result.current.markPending("wo-1");
    });
    expect(result.current.pendingWoIds).toEqual({ "wo-1": true, "wo-2": true });

    act(() => {
      result.current.clearPending("wo-1");
    });
    expect(result.current.pendingWoIds).toEqual({ "wo-2": true });
  });

  it("sets currentProfile from the profile query and detects the mechanic", async () => {
    vi.mocked(getBayViewDataFresh).mockResolvedValue(makeData());
    vi.mocked(useProfile).mockReturnValue({
      data: { id: "mech-1", fullName: "Mech One" },
    } as ProfileQueryResult);
    const { result } = setup({});

    await waitFor(() =>
      expect(result.current.currentProfile).toEqual({
        id: "mech-1",
        full_name: "Mech One",
      }),
    );
    await waitFor(() => expect(result.current.userIsMechanic).toBe(true));
  });

  it("filters bays to the current mechanic's jobs in myJobsOnly mode", async () => {
    vi.mocked(getBayViewDataFresh).mockResolvedValue(makeData());
    vi.mocked(useProfile).mockReturnValue({
      data: { id: "mech-1", fullName: "Mech One" },
    } as ProfileQueryResult);
    const { result } = setup({});

    await waitFor(() => expect(result.current.currentProfile).not.toBeNull());

    act(() => {
      result.current.setMyJobsOnly(true);
    });

    // wo-2 (mechanic mech-2) is not mine; bay 3 is empty — both keep null workOrder
    const bays = result.current.filteredBays;
    expect(bays).toHaveLength(3);
    expect(bays[0].workOrder?.id).toBe("wo-1"); // main mechanic mech-1
    expect(bays[1].workOrder).toBeNull();
    expect(bays[2].workOrder).toBeNull();
  });

  it("filters bays by status when a status filter is set", async () => {
    vi.mocked(getBayViewDataFresh).mockResolvedValue(makeData());
    const { result } = setup({});

    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.setStatusFilter("Diagnosing");
    });

    // No bay matches Diagnosing; only the empty bay survives
    expect(result.current.filteredBays).toHaveLength(1);
    expect(result.current.filteredBays[0].workOrder).toBeNull();
  });

  it("searches bays and branch sections by vehicle attributes", async () => {
    vi.mocked(getBayViewDataFresh).mockResolvedValue(makeData());
    const { result } = setup({});

    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.setBaySearchQuery("toyota");
    });

    const searched = result.current.searchedBays;
    expect(searched).toHaveLength(1);
    expect(searched[0].workOrder?.id).toBe("wo-1");
    expect(result.current.searchedBranchSections?.[0].bays).toHaveLength(1);
    expect(
      result.current.searchedBranchSections?.[0].bays[0].workOrder?.id,
    ).toBe("wo-1");
  });

  it("returns branch sections unfiltered when the search query is empty", async () => {
    vi.mocked(getBayViewDataFresh).mockResolvedValue(makeData());
    const { result } = setup({});

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.searchedBranchSections?.[0].bays).toHaveLength(2);
  });

  it("syncs the detail drawer from the URL on popstate", async () => {
    vi.mocked(getBayViewDataFresh).mockResolvedValue(makeData());
    const dialogs = makeDialogs();
    const { result, rerender } = renderHook(
      () => useBayViewData("org-1", "branch-1", dialogs, makePending()),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    mockSearchParams.set("woId", "wo-42");
    rerender();
    await waitFor(() =>
      expect(dialogs.openDetail).toHaveBeenCalledWith("wo-42"),
    );

    mockSearchParams.delete("woId");
    const dialogsWithDetail = makeDialogs({ detailWoId: "wo-42" });
    const { rerender: rerenderWithDetail } = renderHook(
      () =>
        useBayViewData("org-1", "branch-1", dialogsWithDetail, makePending()),
      { wrapper: createWrapper() },
    );
    rerenderWithDetail();
    await waitFor(() =>
      expect(dialogsWithDetail.closeDetail).toHaveBeenCalled(),
    );
  });

  it("does not open the drawer when the URL woId matches the open drawer", async () => {
    vi.mocked(getBayViewDataFresh).mockResolvedValue(makeData());
    const dialogs = makeDialogs({ detailWoId: "wo-1" });
    mockSearchParams.set("woId", "wo-1");
    const { result } = renderHook(
      () => useBayViewData("org-1", "branch-1", dialogs, makePending()),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(dialogs.openDetail).not.toHaveBeenCalled();
    expect(dialogs.closeDetail).not.toHaveBeenCalled();
  });

  it("refetches data through fetchData", async () => {
    vi.mocked(getBayViewDataFresh).mockResolvedValue(makeData());
    const { result } = setup({});
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(getBayViewDataFresh).toHaveBeenCalledTimes(1);

    await act(async () => {
      await result.current.fetchData();
    });
    expect(getBayViewDataFresh).toHaveBeenCalledTimes(2);
  });

  it("computes shift report trend deltas across refetches", async () => {
    vi.mocked(getBayViewDataFresh).mockResolvedValue(makeData());
    const { result } = setup({});
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.trendDelta).toBeNull();

    vi.mocked(getBayViewDataFresh).mockResolvedValue(
      makeData({
        shiftReport: {
          completedToday: 5,
          revenueToday: 500,
          avgDurationMinutes: 30,
          bayUtilization: 0.7,
          bayCount: 3,
          activeJobs: 3,
          revenuePerLaborHour: 15,
        },
      }),
    );
    await act(async () => {
      await result.current.fetchData();
    });

    await waitFor(() => {
      expect(result.current.trendDelta).not.toBeNull();
      expect(result.current.trendDelta?.activeJobs).toBe(1);
      expect(result.current.trendDelta?.completedToday).toBe(2);
      expect(result.current.trendDelta?.revenueToday).toBe(200);
      expect(result.current.trendDelta?.revenuePerLaborHour).toBe(5);
      expect(result.current.trendDelta?.bayUtilization).toBeCloseTo(0.2);
    });
  });

  it("subscribes to realtime tables with branch-filtered rows while open", async () => {
    vi.mocked(getBayViewDataFresh).mockResolvedValue(makeData());
    const { result } = setup({});
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(useRealtimeMulti).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: true }),
    );
    const tables = vi.mocked(useRealtimeMulti).mock.calls[0][0].tables;
    expect(tables).toHaveLength(3);
    expect(tables[0]).toMatchObject({
      table: "work_orders",
      filter: "organization_id=eq.org-1,branch_id=eq.branch-1",
    });
    expect(tables[1].table).toBe("work_order_helpers");
    expect(tables[2].table).toBe("mechanic_assignments");
  });

  it("pauses realtime subscriptions and polling when a surface is open", async () => {
    vi.mocked(getBayViewDataFresh).mockResolvedValue(makeData());
    const dialogs = makeDialogs({ anyOpen: true });
    const { result } = renderHook(
      () => useBayViewData("org-1", "branch-1", dialogs, makePending()),
      { wrapper: createWrapper() },
    );
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(useRealtimeMulti).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: false }),
    );
  });

  it("uses org-scoped realtime filters when branchFilter is undefined", async () => {
    vi.mocked(getBayViewDataFresh).mockResolvedValue(makeData());
    const { result } = renderHook(
      () => useBayViewData("org-1", undefined, makeDialogs(), makePending()),
      { wrapper: createWrapper() },
    );
    await waitFor(() => expect(result.current.loading).toBe(false));

    const tables = vi.mocked(useRealtimeMulti).mock.calls[0][0].tables;
    expect(tables[0].filter).toBe("organization_id=eq.org-1");
    expect(getBayViewDataFresh).toHaveBeenCalledWith(undefined);
    expect(result.current.branchFilter).toBeUndefined();
  });
});
