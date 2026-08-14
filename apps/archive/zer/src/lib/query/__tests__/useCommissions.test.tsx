/**
 * Tests for src/lib/query/useCommissions.ts
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

// Mock the commission actions module before any hook imports
const mockGetCommissionSummary = vi.fn();
const mockGetPayoutHistory = vi.fn();
const mockGetUnpaidItems = vi.fn();

vi.mock("@/app/(dashboard)/commissions/actions", () => ({
  getCommissionSummary: mockGetCommissionSummary,
  getPayoutHistory: mockGetPayoutHistory,
  getUnpaidItems: mockGetUnpaidItems,
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe("commission hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("useCommissionSummary queries with correct key and orgId", async () => {
    const mockData = [
      { profile_id: "p1", name: "Хэрэглэгч А", total_commission: 50000 },
    ];
    mockGetCommissionSummary.mockResolvedValue(mockData);

    const { useCommissionSummary } = await import("../useCommissions");
    const { result } = renderHook(() => useCommissionSummary("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockData);
    expect(mockGetCommissionSummary).toHaveBeenCalledWith("org-1");
  });

  it("useCommissionSummary is disabled when orgId is empty", async () => {
    const { useCommissionSummary } = await import("../useCommissions");
    const { result } = renderHook(() => useCommissionSummary(""), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe("idle");
    expect(mockGetCommissionSummary).not.toHaveBeenCalled();
  });

  it("useUnpaidItems queries with correct params", async () => {
    const mockData = [{ sale_id: "s1", item_name: "Product A", amount: 10000 }];
    mockGetUnpaidItems.mockResolvedValue(mockData);

    const { useUnpaidItems } = await import("../useCommissions");
    const { result } = renderHook(() => useUnpaidItems("org-1", "prof-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockData);
    expect(mockGetUnpaidItems).toHaveBeenCalledWith("org-1", "prof-1");
  });

  it("usePayoutHistory queries with correct orgId", async () => {
    const mockData = [
      {
        id: "pay-1",
        profile_id: "p1",
        paid_amount: 30000,
        paid_at: "2026-07-01",
      },
    ];
    mockGetPayoutHistory.mockResolvedValue(mockData);

    const { usePayoutHistory } = await import("../useCommissions");
    const { result } = renderHook(() => usePayoutHistory("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockData);
    expect(mockGetPayoutHistory).toHaveBeenCalledWith("org-1");
  });
});
