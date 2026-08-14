import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { refundKeys } from "../keys";
import {
  useCancelRefund,
  useRecordRefund,
  useRefundList,
  useRefundStats,
  useStoreCreditBalance,
} from "../use-refunds";

vi.mock("@zuiio/query", () => ({
  useOrgMutation: vi.fn(() => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    isPending: false,
    isError: false,
    error: null,
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

describe("useRefundList", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  it("returns refunds on success", async () => {
    const refunds = [
      {
        id: "ref-1",
        invoice_id: "inv-1",
        amount: 100,
        status: "completed" as const,
        reason: "Customer return",
        created_at: "2024-01-15T00:00:00Z",
      },
    ];

    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: { data: refunds } }),
    } as Response);

    const { result } = renderHook(() => useRefundList("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(refunds);
  });

  it("does not fetch when orgId is undefined", async () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(() => useRefundList(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("handles fetch error", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useRefundList("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("useRefundStats", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  it("returns refund stats on success", async () => {
    const stats = {
      total_refunded: 500,
      pending_count: 2,
      completed_count: 5,
      failed_count: 1,
    };

    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: stats }),
    } as Response);

    const { result } = renderHook(() => useRefundStats("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(stats);
  });

  it("does not fetch when orgId is undefined", async () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(() => useRefundStats(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("handles fetch error", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useRefundStats("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("useRecordRefund", () => {
  it("returns mutation object", () => {
    const { result } = renderHook(() => useRecordRefund("org-1"), {
      wrapper: createWrapper(),
    });

    expect(result.current).toBeDefined();
    expect(typeof result.current.mutate).toBe("function");
  });
});

describe("useCancelRefund", () => {
  it("returns mutation object", () => {
    const { result } = renderHook(() => useCancelRefund("org-1"), {
      wrapper: createWrapper(),
    });

    expect(result.current).toBeDefined();
    expect(typeof result.current.mutate).toBe("function");
  });
});

describe("useStoreCreditBalance", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  it("returns store credit balance on success", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: { balance: 150 } }),
    } as Response);

    const { result } = renderHook(() => useStoreCreditBalance("org-1", "c-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBe(150);
  });

  it("does not fetch when orgId is undefined", async () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(
      () => useStoreCreditBalance(undefined, "c-1"),
      { wrapper: createWrapper() },
    );

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("does not fetch when customerId is undefined", async () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(
      () => useStoreCreditBalance("org-1", undefined),
      { wrapper: createWrapper() },
    );

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe("refundKeys", () => {
  it("constructs correct key shapes", () => {
    expect(refundKeys.all("org-1")).toEqual([
      "organizations",
      "org-1",
      "refunds",
    ]);
    expect(refundKeys.list("org-1", "pending")).toEqual([
      "organizations",
      "org-1",
      "refunds",
      "list",
      "pending",
    ]);
    expect(refundKeys.stats("org-1")).toEqual([
      "organizations",
      "org-1",
      "refunds",
      "stats",
    ]);
  });
});
