import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  useMechanicCommissions,
  useMechanicHours,
  useMechanicKpis,
} from "../use-mechanic-performance";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

function createWrapper() {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

const dateRange = { start: "2024-01-01", end: "2024-01-31" };

describe("useMechanicKpis", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  const sampleKpis = {
    mechanic_kpis: [
      {
        mechanic_id: "mech-1",
        mechanic_name: "Bob",
        work_orders_completed: 15,
        services_count: 30,
        parts_count: 10,
        total_revenue: 4500,
        avg_revenue_per_wo: 300,
        avg_satisfaction: 4.5,
        total_reviews: 8,
        recent_reviews: [],
      },
    ],
  };

  it("returns mechanic KPIs on success", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: sampleKpis }),
    } as Response);

    const { result } = renderHook(() => useMechanicKpis("org-1", dateRange), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(sampleKpis);
  });

  it("does not fetch when orgId is undefined", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(() => useMechanicKpis(undefined, dateRange), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("does not fetch when dateRange is null", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(() => useMechanicKpis("org-1", null), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("passes type=custom parameter", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: sampleKpis }),
    } as Response);

    renderHook(() => useMechanicKpis("org-1", dateRange), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
    const url = fetchSpy.mock.calls[0][0] as string;
    expect(url).toContain("type=custom");
    expect(url).toContain("date_from=2024-01-01");
    expect(url).toContain("date_to=2024-01-31");
  });

  it("handles fetch error", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useMechanicKpis("org-1", dateRange), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("useMechanicHours", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  const sampleHours = [
    { mechanic_id: "mech-1", total_hours: 160 },
    { mechanic_id: "mech-2", total_hours: 140 },
  ];

  it("returns mechanic hours on success", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: sampleHours }),
    } as Response);

    const { result } = renderHook(() => useMechanicHours("org-1", dateRange), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(sampleHours);
  });

  it("does not fetch when orgId is undefined", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(
      () => useMechanicHours(undefined, dateRange),
      { wrapper: createWrapper() },
    );

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("does not fetch when dateRange is null", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(() => useMechanicHours("org-1", null), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("handles fetch error", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useMechanicHours("org-1", dateRange), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("useMechanicCommissions", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  const sampleCommissions = [
    { mechanic_id: "mech-1", total_commission: 500 },
    { mechanic_id: "mech-2", total_commission: 350 },
  ];

  it("returns mechanic commissions on success", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: sampleCommissions }),
    } as Response);

    const { result } = renderHook(
      () => useMechanicCommissions("org-1", dateRange),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(sampleCommissions);
  });

  it("does not fetch when orgId is undefined", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(
      () => useMechanicCommissions(undefined, dateRange),
      { wrapper: createWrapper() },
    );

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("does not fetch when dateRange is null", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(() => useMechanicCommissions("org-1", null), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("handles fetch error", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(
      () => useMechanicCommissions("org-1", dateRange),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
