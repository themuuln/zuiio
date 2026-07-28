import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useDashboardBundle } from "../use-dashboard-bundle";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

function createWrapper() {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("useDashboardBundle", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  const sampleBundle = {
    dashboard: {
      summary: {
        totalRevenue: 15000,
        activeWorkOrders: 8,
        completedToday: 3,
        newCustomersToday: 2,
        avgRepairOrderValue: 350,
        partsRevenue: 5000,
        serviceRevenue: 10000,
        grossProfit: 7000,
        marginPercent: 46.7,
        totalCustomers: 120,
        totalVehicles: 180,
      },
      summaryComparison: {
        totalRevenue: 12000,
        activeWorkOrders: 6,
        completedToday: 2,
        newCustomersToday: 1,
        avgRepairOrderValue: 300,
        partsRevenue: 4000,
        serviceRevenue: 8000,
        grossProfit: 5000,
        marginPercent: 41.7,
        totalCustomers: 110,
        totalVehicles: 160,
      },
      insights: ["Revenue increased 25% compared to last period"],
      workOrderStatusDistribution: [],
      revenueTrend: [],
      topServices: [],
      technicianPerformance: [],
      recentWorkOrders: [],
      serviceCategoryBreakdown: [],
      customerAcquisitionTrend: [],
    },
    subscription: {
      status: "active",
      expired: false,
      plan_type: "pro",
      expires_at: null,
      grace_period_end: null,
      trial: false,
    },
  };

  it("returns dashboard bundle on success", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: sampleBundle }),
    } as Response);

    const { result } = renderHook(() => useDashboardBundle("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(sampleBundle);
  });

  it("uses custom period", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: sampleBundle }),
    } as Response);

    renderHook(() => useDashboardBundle("org-1", { period: "today" }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
    const calledUrl = fetchSpy.mock.calls[0][0] as string;
    expect(calledUrl).toContain("period=today");
  });

  it("passes branchId param", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: sampleBundle }),
    } as Response);

    renderHook(() => useDashboardBundle("org-1", { branchId: "branch-42" }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
    const calledUrl = fetchSpy.mock.calls[0][0] as string;
    expect(calledUrl).toContain("branch=branch-42");
  });

  it("defaults period to month", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: sampleBundle }),
    } as Response);

    renderHook(() => useDashboardBundle("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
    const calledUrl = fetchSpy.mock.calls[0][0] as string;
    expect(calledUrl).toContain("period=month");
  });

  it("does not fetch when orgId is missing", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(() => useDashboardBundle(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("handles fetch error", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: false,
      status: 500,
    } as Response);

    const { result } = renderHook(() => useDashboardBundle("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
