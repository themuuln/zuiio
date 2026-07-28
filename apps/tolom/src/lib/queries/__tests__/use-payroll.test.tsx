import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  useCalculatePayroll,
  usePayRates,
  usePayRateUpsert,
  usePayrollRecords,
  useUpdatePayrollRecord,
} from "../use-payroll";

vi.mock("@zuiio/hooks", () => ({
  useOnlineStatus: vi.fn(() => true),
}));

vi.mock("@/lib/offline/mutation-queue-provider", () => ({
  useMutationQueue: vi.fn(() => ({
    enqueue: vi.fn(),
  })),
}));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

function createWrapper() {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("usePayRates", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  const samplePayRates = [
    {
      id: "rate-1",
      organization_id: "org-1",
      mechanic_id: "mech-1",
      hourly_rate: 18000,
      effective_from: "2025-01-01",
      effective_to: null,
      mechanic_name: "Bob",
    },
    {
      id: "rate-2",
      organization_id: "org-1",
      mechanic_id: "mech-2",
      hourly_rate: 15000,
      effective_from: "2025-01-01",
      effective_to: null,
      mechanic_name: "Alice",
    },
  ];

  it("returns pay rates on success", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: samplePayRates }),
    } as Response);

    const { result } = renderHook(() => usePayRates("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(samplePayRates);
  });

  it("passes branch_id when branchId provided", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: samplePayRates }),
    } as Response);

    renderHook(() => usePayRates("org-1", "branch-42"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
    const calledUrl = fetchSpy.mock.calls[0][0] as string;
    expect(calledUrl).toContain("branch_id=branch-42");
  });

  it("omits branch_id when branchId not provided", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: samplePayRates }),
    } as Response);

    renderHook(() => usePayRates("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
    const calledUrl = fetchSpy.mock.calls[0][0] as string;
    expect(calledUrl).not.toContain("branch_id");
  });

  it("does not fetch when orgId is missing", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(() => usePayRates(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe("usePayrollRecords", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  const sampleRecords = [
    {
      id: "pr-1",
      organization_id: "org-1",
      mechanic_id: "mech-1",
      period_start: "2025-03-01",
      period_end: "2025-03-31",
      total_hours: 160,
      hourly_rate: 18000,
      gross_pay: 2880000,
      status: "draft",
      paid_at: null,
      notes: null,
      mechanic_name: "Bob",
    },
  ];

  it("returns payroll records on success", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: sampleRecords }),
    } as Response);

    const { result } = renderHook(() => usePayrollRecords("org-1", 2025, 3), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(sampleRecords);
  });

  it("passes year and month params", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: sampleRecords }),
    } as Response);

    renderHook(() => usePayrollRecords("org-1", 2025, 3), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
    const calledUrl = fetchSpy.mock.calls[0][0] as string;
    expect(calledUrl).toContain("year=2025");
    expect(calledUrl).toContain("month=3");
  });

  it("passes branch_id when branchId provided", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: sampleRecords }),
    } as Response);

    renderHook(() => usePayrollRecords("org-1", 2025, 3, "branch-42"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
    const calledUrl = fetchSpy.mock.calls[0][0] as string;
    expect(calledUrl).toContain("branch_id=branch-42");
  });

  it("does not fetch when orgId is missing", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(() => usePayrollRecords(undefined, 2025, 3), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("does not fetch when year is invalid", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result: zeroYear } = renderHook(
      () => usePayrollRecords("org-1", 0, 3),
      { wrapper: createWrapper() },
    );
    const { result: negYear } = renderHook(
      () => usePayrollRecords("org-1", -1, 3),
      { wrapper: createWrapper() },
    );

    expect(zeroYear.current.isPending).toBe(true);
    expect(negYear.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("does not fetch when month is out of range", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result: zeroMonth } = renderHook(
      () => usePayrollRecords("org-1", 2025, 0),
      { wrapper: createWrapper() },
    );
    const { result: overMonth } = renderHook(
      () => usePayrollRecords("org-1", 2025, 13),
      { wrapper: createWrapper() },
    );

    expect(zeroMonth.current.isPending).toBe(true);
    expect(overMonth.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe("usePayRateUpsert", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  it("returns mutation object", () => {
    const { result } = renderHook(() => usePayRateUpsert("org-1"), {
      wrapper: createWrapper(),
    });

    expect(result.current).toBeDefined();
    expect(typeof result.current.mutate).toBe("function");
  });

  it("sends PUT request on mutate", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: { id: "rate-new", hourly_rate: 20000 } }),
    } as Response);

    const { result } = renderHook(() => usePayRateUpsert("org-1"), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      mechanicId: "mech-1",
      hourlyRate: 20000,
      effectiveFrom: "2025-06-01",
    });

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    const [url, opts] = fetchSpy.mock.calls[0];
    expect(url).toBe("/api/organizations/org-1/payroll/pay-rates");
    expect((opts as RequestInit).method).toBe("PUT");
    expect((opts as RequestInit).headers).toEqual({
      "Content-Type": "application/json",
    });
    expect(JSON.parse((opts as RequestInit).body as string)).toEqual({
      mechanicId: "mech-1",
      hourlyRate: 20000,
      effectiveFrom: "2025-06-01",
    });
  });

  it("handles success response", async () => {
    const payRate = {
      id: "rate-new",
      organization_id: "org-1",
      mechanic_id: "mech-1",
      hourly_rate: 20000,
      effective_from: "2025-06-01",
      effective_to: null,
      mechanic_name: null,
    };

    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: payRate }),
    } as Response);

    const { result } = renderHook(() => usePayRateUpsert("org-1"), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      mechanicId: "mech-1",
      hourlyRate: 20000,
      effectiveFrom: "2025-06-01",
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });

  it("handles fetch error", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: false,
      json: async () => ({
        error: { message: "Failed to save pay rate" },
      }),
    } as Response);

    const { result } = renderHook(() => usePayRateUpsert("org-1"), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      mechanicId: "mech-1",
      hourlyRate: 20000,
      effectiveFrom: "2025-06-01",
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });

  it("does not mutate when orgId is missing", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(() => usePayRateUpsert(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current).toBeDefined();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe("useCalculatePayroll", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  it("returns mutation object", () => {
    const { result } = renderHook(() => useCalculatePayroll("org-1"), {
      wrapper: createWrapper(),
    });

    expect(result.current).toBeDefined();
    expect(typeof result.current.mutate).toBe("function");
  });

  it("sends POST request on mutate", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    } as Response);

    const { result } = renderHook(() => useCalculatePayroll("org-1"), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ year: 2025, month: 6 });

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    const [url, opts] = fetchSpy.mock.calls[0];
    expect(url).toBe("/api/organizations/org-1/payroll/calculate");
    expect((opts as RequestInit).method).toBe("POST");
    expect((opts as RequestInit).headers).toEqual({
      "Content-Type": "application/json",
    });
    expect(JSON.parse((opts as RequestInit).body as string)).toEqual({
      year: 2025,
      month: 6,
      branch_id: null,
    });
  });

  it("passes branch_id in body when branchId provided", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    } as Response);

    const { result } = renderHook(
      () => useCalculatePayroll("org-1", "branch-42"),
      { wrapper: createWrapper() },
    );

    result.current.mutate({ year: 2025, month: 6 });

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    const body = JSON.parse(
      (fetchSpy.mock.calls[0][1] as RequestInit).body as string,
    );
    expect(body.branch_id).toBe("branch-42");
  });

  it("handles success response", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    } as Response);

    const { result } = renderHook(() => useCalculatePayroll("org-1"), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ year: 2025, month: 6 });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });

  it("handles fetch error", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: false,
      json: async () => ({
        error: { message: "Payroll calculation failed" },
      }),
    } as Response);

    const { result } = renderHook(() => useCalculatePayroll("org-1"), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ year: 2025, month: 6 });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });

  it("does not mutate when orgId is missing", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(() => useCalculatePayroll(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current).toBeDefined();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe("useUpdatePayrollRecord", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  it("returns mutation object", () => {
    const { result } = renderHook(() => useUpdatePayrollRecord("org-1"), {
      wrapper: createWrapper(),
    });

    expect(result.current).toBeDefined();
    expect(typeof result.current.mutate).toBe("function");
  });

  it("sends PATCH request on mutate", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          id: "pr-1",
          status: "approved",
        },
      }),
    } as Response);

    const { result } = renderHook(() => useUpdatePayrollRecord("org-1"), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      recordId: "pr-1",
      action: "approve",
      year: 2025,
      month: 6,
    });

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    const [url, opts] = fetchSpy.mock.calls[0];
    expect(url).toBe("/api/organizations/org-1/payroll/records/pr-1");
    expect((opts as RequestInit).method).toBe("PATCH");
    expect((opts as RequestInit).headers).toEqual({
      "Content-Type": "application/json",
    });
    expect(JSON.parse((opts as RequestInit).body as string)).toEqual({
      action: "approve",
    });
  });

  it("handles success response", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          id: "pr-1",
          status: "approved",
        },
      }),
    } as Response);

    const { result } = renderHook(() => useUpdatePayrollRecord("org-1"), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      recordId: "pr-1",
      action: "approve",
      year: 2025,
      month: 6,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });

  it("handles fetch error", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: false,
      json: async () => ({
        error: { message: "Failed to update record" },
      }),
    } as Response);

    const { result } = renderHook(() => useUpdatePayrollRecord("org-1"), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      recordId: "pr-1",
      action: "approve",
      year: 2025,
      month: 6,
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });

  it("does not mutate when orgId is missing", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(() => useUpdatePayrollRecord(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current).toBeDefined();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
