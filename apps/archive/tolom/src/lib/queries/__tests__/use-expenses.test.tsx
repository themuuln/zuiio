import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  useExpense,
  useExpenseCategories,
  useExpenseStats,
  useExpenses,
} from "../use-expenses";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

function createWrapper() {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("useExpenses", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  const sampleExpenses = [
    {
      id: "exp-1",
      description: "Brake pads",
      amount: 12000,
      expense_date: "2025-02-01",
      paid_at: null,
      tax_amount: 0,
    },
    {
      id: "exp-2",
      description: "Oil filter",
      amount: 5000,
      expense_date: "2025-02-03",
      paid_at: "2025-02-03T12:00:00Z",
      tax_amount: 400,
    },
  ];

  it("returns expenses on success", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: sampleExpenses }),
    } as Response);

    const { result } = renderHook(() => useExpenses("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(sampleExpenses);
  });

  it("passes filter params", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: sampleExpenses }),
    } as Response);

    renderHook(
      () =>
        useExpenses("org-1", {
          q: "brake",
          categoryId: "cat-1",
          startDate: "2025-01-01",
          endDate: "2025-02-28",
          paid: true,
          overdue: true,
          branchId: "branch-42",
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
    const calledUrl = fetchSpy.mock.calls[0][0] as string;
    expect(calledUrl).toContain("q=brake");
    expect(calledUrl).toContain("categoryId=cat-1");
    expect(calledUrl).toContain("startDate=2025-01-01");
    expect(calledUrl).toContain("endDate=2025-02-28");
    expect(calledUrl).toContain("paid=true");
    expect(calledUrl).toContain("overdue=true");
    expect(calledUrl).toContain("branch_id=branch-42");
  });

  it("does not fetch when orgId is missing", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(() => useExpenses(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe("useExpense", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  const sampleExpense = {
    id: "exp-1",
    description: "Brake pads",
    amount: 12000,
    expense_date: "2025-02-01",
    paid_at: null,
    tax_amount: 0,
  };

  it("returns a single expense on success", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: sampleExpense }),
    } as Response);

    const { result } = renderHook(() => useExpense("org-1", "exp-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(sampleExpense);
  });

  it("does not fetch when orgId or expenseId is missing", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result: noOrg } = renderHook(() => useExpense(undefined, "exp-1"), {
      wrapper: createWrapper(),
    });
    const { result: noId } = renderHook(() => useExpense("org-1", undefined), {
      wrapper: createWrapper(),
    });

    expect(noOrg.current.isPending).toBe(true);
    expect(noId.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe("useExpenseStats", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  const sampleStats = {
    totalExpenses: 25,
    totalAmount: 340000,
    totalTax: 27200,
    paidAmount: 180000,
    unpaidAmount: 160000,
    overdueCount: 3,
    byCategory: [],
    thisMonth: 45000,
    lastMonth: 52000,
  };

  it("returns expense stats on success", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: sampleStats }),
    } as Response);

    const { result } = renderHook(() => useExpenseStats("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(sampleStats);
  });

  it("passes branch_id when branchId provided", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: sampleStats }),
    } as Response);

    renderHook(() => useExpenseStats("org-1", "branch-42"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
    const calledUrl = fetchSpy.mock.calls[0][0] as string;
    expect(calledUrl).toContain("branch_id=branch-42");
  });

  it("omits branch_id when branchId not provided", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: sampleStats }),
    } as Response);

    renderHook(() => useExpenseStats("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
    const calledUrl = fetchSpy.mock.calls[0][0] as string;
    expect(calledUrl).not.toContain("branch_id");
  });

  it("does not fetch when orgId is missing", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(() => useExpenseStats(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe("useExpenseCategories", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  const sampleCategories = [
    {
      id: "cat-1",
      name: "Parts",
      color: "#FF5733",
      icon: "wrench",
      sort_order: 1,
      is_active: true,
    },
    {
      id: "cat-2",
      name: "Services",
      color: "#33FF57",
      icon: "tools",
      sort_order: 2,
      is_active: true,
    },
  ];

  it("returns expense categories on success", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: sampleCategories }),
    } as Response);

    const { result } = renderHook(() => useExpenseCategories("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(sampleCategories);
  });

  it("does not fetch when orgId is missing", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(() => useExpenseCategories(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
