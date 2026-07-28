import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { dashboardKeys } from "../keys";
import { useDashboard } from "../use-dashboard";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

function createWrapper() {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

const sampleDashboardData = {
  total_revenue: 1500000,
  total_services: 45,
  total_parts: 120,
  total_work_orders: 60,
  total_customers: 30,
  revenue_today: 250000,
  revenue_this_week: 800000,
  revenue_this_month: 1500000,
  avg_order_value: 25000,
  completed_orders: 40,
  pending_orders: 15,
  cancelled_orders: 5,
};

describe("useDashboard", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  it("returns dashboard data with period 'today'", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: sampleDashboardData }),
    } as Response);

    const { result } = renderHook(
      () => useDashboard("org-1", { period: "today" }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(sampleDashboardData);
  });

  it("returns dashboard data with period 'week'", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: sampleDashboardData }),
    } as Response);

    renderHook(() => useDashboard("org-1", { period: "week" }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(fetchSpy).toHaveBeenCalled());
    const url = fetchSpy.mock.calls[0][0] as string;
    expect(url).toContain("period=week");
  });

  it("returns dashboard data with period 'month'", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: sampleDashboardData }),
    } as Response);

    renderHook(() => useDashboard("org-1", { period: "month" }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(fetchSpy).toHaveBeenCalled());
    const url = fetchSpy.mock.calls[0][0] as string;
    expect(url).toContain("period=month");
  });

  it("returns dashboard data with period 'all'", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: sampleDashboardData }),
    } as Response);

    renderHook(() => useDashboard("org-1", { period: "all" }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(fetchSpy).toHaveBeenCalled());
    const url = fetchSpy.mock.calls[0][0] as string;
    expect(url).toContain("period=all");
  });

  it("uses date range params when dateFrom and dateTo provided", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: sampleDashboardData }),
    } as Response);

    renderHook(
      () =>
        useDashboard("org-1", {
          dateFrom: "2024-01-01",
          dateTo: "2024-01-31",
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(fetchSpy).toHaveBeenCalled());
    const url = fetchSpy.mock.calls[0][0] as string;
    expect(url).toContain("date_from=2024-01-01");
    expect(url).toContain("date_to=2024-01-31");
  });

  it("ignores period when date range is set", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: sampleDashboardData }),
    } as Response);

    renderHook(
      () =>
        useDashboard("org-1", {
          dateFrom: "2024-01-01",
          dateTo: "2024-01-31",
          period: "month",
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(fetchSpy).toHaveBeenCalled());
    const url = fetchSpy.mock.calls[0][0] as string;
    expect(url).toContain("date_from=2024-01-01");
    expect(url).toContain("date_to=2024-01-31");
    // 'month' is in the URL but the API will prefer date_from/date_to
    expect(url).not.toContain("period=month");
  });

  it("passes branch_id param when branchId is provided", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: sampleDashboardData }),
    } as Response);

    renderHook(
      () => useDashboard("org-1", { period: "today", branchId: "branch-42" }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(fetchSpy).toHaveBeenCalled());
    const url = fetchSpy.mock.calls[0][0] as string;
    expect(url).toContain("branch=branch-42");
  });

  it("does not fetch when orgId is missing", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(
      () => useDashboard(undefined, { period: "today" }),
      { wrapper: createWrapper() },
    );

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("handles fetch error", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: { message: "Server error" } }),
    } as Response);

    const { result } = renderHook(
      () => useDashboard("org-1", { period: "today" }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeDefined();
  });

  it("handles network failure", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(
      () => useDashboard("org-1", { period: "today" }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("Network error");
  });

  it("sends type=dashboard param", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: sampleDashboardData }),
    } as Response);

    renderHook(() => useDashboard("org-1", { period: "today" }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(fetchSpy).toHaveBeenCalled());
    const url = fetchSpy.mock.calls[0][0] as string;
    expect(url).toContain("type=dashboard");
  });
});

describe("dashboardKeys", () => {
  it("constructs correct key shapes", () => {
    expect(dashboardKeys.all("org-1")).toEqual([
      "organizations",
      "org-1",
      "dashboard",
      "all",
    ]);
    expect(dashboardKeys.all("org-1", "branch-42")).toEqual([
      "organizations",
      "org-1",
      "dashboard",
      "branch-42",
    ]);
    expect(dashboardKeys.summary("org-1", "today")).toEqual([
      "organizations",
      "org-1",
      "dashboard",
      "all",
      "summary",
      "today",
    ]);
    expect(dashboardKeys.summary("org-1", "2024-01-01_2024-01-31")).toEqual([
      "organizations",
      "org-1",
      "dashboard",
      "all",
      "summary",
      "2024-01-01_2024-01-31",
    ]);
    expect(dashboardKeys.summary("org-1", "today", "branch-42")).toEqual([
      "organizations",
      "org-1",
      "dashboard",
      "branch-42",
      "summary",
      "today",
    ]);
  });
});
