import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  useMechanics,
  useReport,
  useReportFinanceSummary,
  useReportForecast,
  useReportInsights,
  useReportMechanicLeaderboard,
  useReportPnl,
  useReportRetention,
  useReportServiceBreakdown,
  useReportTargets,
} from "../use-reports";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

function createWrapper() {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("useReport", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  const sampleData = { revenue: 5000, jobs: 12 };

  it("returns report data on success", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: sampleData }),
    } as Response);

    const { result } = renderHook(
      () => useReport("org-1", "daily", { date: "2024-01-15" }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(sampleData);
  });

  it("does not fetch when orgId is undefined", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(
      () => useReport(undefined, "daily", { date: "2024-01-15" }),
      { wrapper: createWrapper() },
    );

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("handles fetch error", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(
      () => useReport("org-1", "daily", { date: "2024-01-15" }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isError).toBe(true), {
      timeout: 5000,
    });
  });
});

describe("useMechanics", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  const sampleMechanics = [
    { id: "mech-1", full_name: "Bob" },
    { id: "mech-2", full_name: "Alice" },
  ];

  it("returns mechanics on success", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: sampleMechanics }),
    } as Response);

    const { result } = renderHook(() => useMechanics("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(sampleMechanics);
  });

  it("does not fetch when orgId is undefined", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(() => useMechanics(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("handles fetch error", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useMechanics("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true), {
      timeout: 5000,
    });
  });
});

describe("useReportInsights", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  const sampleInsights = [
    { type: "trend", message: "Revenue up 20%", severity: "positive" as const },
  ];

  it("returns insights on success", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: sampleInsights }),
    } as Response);

    const { result } = renderHook(
      () => useReportInsights("org-1", "2024-01-01", "2024-01-31"),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(sampleInsights);
  });

  it("does not fetch when orgId is undefined", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(
      () => useReportInsights(undefined, "2024-01-01", "2024-01-31"),
      { wrapper: createWrapper() },
    );

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("respects enabled=false", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(
      () => useReportInsights("org-1", "2024-01-01", "2024-01-31", false),
      { wrapper: createWrapper() },
    );

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("handles fetch error", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(
      () => useReportInsights("org-1", "2024-01-01", "2024-01-31"),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isError).toBe(true), {
      timeout: 5000,
    });
  });
});

describe("useReportForecast", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  it("returns forecast on success", async () => {
    const forecast = { projected_revenue: 15000, confidence: 0.85 };
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: forecast }),
    } as Response);

    const { result } = renderHook(
      () => useReportForecast("org-1", "month", "2024-02-01"),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(forecast);
  });

  it("does not fetch when orgId is undefined", () => {
    const fetchSpy = vi.spyOn(global, "fetch");
    renderHook(() => useReportForecast(undefined, "month", "2024-02-01"), {
      wrapper: createWrapper(),
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe("useReportTargets", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  it("returns targets on success", async () => {
    const targets = [
      { mechanic_id: "m-1", target_revenue: 10000, actual: 8500 },
    ];
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: targets }),
    } as Response);

    const { result } = renderHook(
      () => useReportTargets("org-1", "month", "2024-02-01"),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(targets);
  });

  it("does not fetch when orgId is undefined", () => {
    const fetchSpy = vi.spyOn(global, "fetch");
    renderHook(() => useReportTargets(undefined, "month", "2024-02-01"), {
      wrapper: createWrapper(),
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe("useReportRetention", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  it("returns retention data on success", async () => {
    const data = { returning_customers: 42, new_customers: 18 };
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data }),
    } as Response);

    const { result } = renderHook(
      () => useReportRetention("org-1", "2024-01-01", "2024-01-31"),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(data);
  });

  it("does not fetch when orgId is undefined", () => {
    const fetchSpy = vi.spyOn(global, "fetch");
    renderHook(
      () => useReportRetention(undefined, "2024-01-01", "2024-01-31"),
      { wrapper: createWrapper() },
    );
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe("useReportPnl", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  it("returns P&L on success", async () => {
    const data = { revenue: 50000, expenses: 32000, profit: 18000 };
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data }),
    } as Response);

    const { result } = renderHook(
      () => useReportPnl("org-1", "2024-01-01", "2024-01-31"),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(data);
  });

  it("does not fetch when orgId is undefined", () => {
    const fetchSpy = vi.spyOn(global, "fetch");
    renderHook(() => useReportPnl(undefined, "2024-01-01", "2024-01-31"), {
      wrapper: createWrapper(),
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe("useReportServiceBreakdown", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  it("returns breakdown on success", async () => {
    const data = [{ service_name: "Oil Change", count: 30, revenue: 1500 }];
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data }),
    } as Response);

    const { result } = renderHook(
      () => useReportServiceBreakdown("org-1", "2024-01-01", "2024-01-31"),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(data);
  });

  it("does not fetch when orgId is undefined", () => {
    const fetchSpy = vi.spyOn(global, "fetch");
    renderHook(
      () => useReportServiceBreakdown(undefined, "2024-01-01", "2024-01-31"),
      { wrapper: createWrapper() },
    );
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe("useReportFinanceSummary", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  it("returns finance summary on success", async () => {
    const data = { total_revenue: 100000, total_expenses: 65000 };
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data }),
    } as Response);

    const { result } = renderHook(() => useReportFinanceSummary("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(data);
  });

  it("does not fetch when orgId is undefined", () => {
    const fetchSpy = vi.spyOn(global, "fetch");
    renderHook(() => useReportFinanceSummary(undefined), {
      wrapper: createWrapper(),
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("handles fetch error", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("Network error"));
    const { result } = renderHook(() => useReportFinanceSummary("org-1"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("useReportMechanicLeaderboard", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  it("returns leaderboard on success", async () => {
    const data = [{ mechanic_name: "Bob", revenue: 15000 }];
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data }),
    } as Response);

    const { result } = renderHook(() => useReportMechanicLeaderboard("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(data);
  });

  it("does not fetch when orgId is undefined", () => {
    const fetchSpy = vi.spyOn(global, "fetch");
    renderHook(() => useReportMechanicLeaderboard(undefined), {
      wrapper: createWrapper(),
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
