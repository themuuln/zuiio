import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  useCashOut,
  useCashRegisterSession,
  useCashRegisterSessions,
  useCloseSession,
  useCurrentSession,
  useOpenSession,
} from "../use-cash-register";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const mockSuccessToast = vi.fn();
const mockErrorToast = vi.fn();

vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => mockSuccessToast(...args),
    error: (...args: unknown[]) => mockErrorToast(...args),
  },
}));

// useCashOut uses useOrgMutation from @zuiio/query
const mockMutateAsync = vi.fn().mockResolvedValue({
  id: "ce-1",
  amount: 50000,
  description: "Petty cash",
});

vi.mock("@zuiio/query", () => ({
  useOrgMutation: vi.fn(() => ({
    mutate: vi.fn(),
    mutateAsync: mockMutateAsync,
    isPending: false,
  })),
}));

function createWrapper() {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("useCurrentSession", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  const sampleSession = {
    id: "cs-1",
    organization_id: "org-1",
    branch_id: null,
    date: "2025-03-01",
    status: "open",
    opened_at: "2025-03-01T08:00:00Z",
    closed_at: null,
    opening_balance: 50000,
    closing_balance: null,
    expected_balance: null,
    cash_in: 120000,
    cash_out: 30000,
    discrepancy: null,
    discrepancy_note: null,
    opened_by: "user-1",
    closed_by: null,
    created_by: "user-1",
    created_at: "2025-03-01T08:00:00Z",
    updated_at: "2025-03-01T08:00:00Z",
    deleted_at: null,
    entries: [],
  };

  it("returns current session on success", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: sampleSession }),
    } as Response);

    const { result } = renderHook(() => useCurrentSession("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(sampleSession);
  });

  it("passes branch_id when branchId provided", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: sampleSession }),
    } as Response);

    renderHook(() => useCurrentSession("org-1", "branch-42"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
    const calledUrl = fetchSpy.mock.calls[0][0] as string;
    expect(calledUrl).toContain("branch_id=branch-42");
  });

  it("omits branch_id when branchId not provided", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: sampleSession }),
    } as Response);

    renderHook(() => useCurrentSession("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
    const calledUrl = fetchSpy.mock.calls[0][0] as string;
    expect(calledUrl).not.toContain("branch_id");
  });

  it("does not fetch when orgId is missing", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(() => useCurrentSession(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe("useCashRegisterSession", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  const sampleSession = {
    id: "cs-1",
    organization_id: "org-1",
    branch_id: null,
    date: "2025-03-01",
    status: "closed",
    opened_at: "2025-03-01T08:00:00Z",
    closed_at: "2025-03-01T18:00:00Z",
    opening_balance: 50000,
    closing_balance: 165000,
    expected_balance: 165000,
    cash_in: 120000,
    cash_out: 5000,
    discrepancy: 0,
    discrepancy_note: null,
    opened_by: "user-1",
    closed_by: "user-1",
    created_by: "user-1",
    created_at: "2025-03-01T08:00:00Z",
    updated_at: "2025-03-01T18:00:00Z",
    deleted_at: null,
    entries: [
      {
        id: "ce-1",
        session_id: "cs-1",
        organization_id: "org-1",
        entry_type: "in",
        amount: 120000,
        source: "payment",
        source_id: "inv-1",
        description: "Invoice payment",
        created_by: "user-1",
        created_at: "2025-03-01T10:00:00Z",
      },
    ],
  };

  it("returns a single session on success", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: sampleSession }),
    } as Response);

    const { result } = renderHook(
      () => useCashRegisterSession("org-1", "cs-1"),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(sampleSession);
  });

  it("does not fetch when orgId or sessionId is missing", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result: noOrg } = renderHook(
      () => useCashRegisterSession(undefined, "cs-1"),
      { wrapper: createWrapper() },
    );
    const { result: noId } = renderHook(
      () => useCashRegisterSession("org-1", undefined),
      { wrapper: createWrapper() },
    );

    expect(noOrg.current.isPending).toBe(true);
    expect(noId.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe("useCashRegisterSessions", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  const sampleResponse = {
    data: [
      {
        id: "cs-1",
        organization_id: "org-1",
        branch_id: null,
        date: "2025-03-01",
        status: "closed",
        opened_at: "2025-03-01T08:00:00Z",
        closed_at: "2025-03-01T18:00:00Z",
        opening_balance: 50000,
        closing_balance: 165000,
        expected_balance: 165000,
        cash_in: 120000,
        cash_out: 5000,
        discrepancy: 0,
        discrepancy_note: null,
        opened_by: "user-1",
        closed_by: "user-1",
        created_by: "user-1",
        created_at: "2025-03-01T08:00:00Z",
        updated_at: "2025-03-01T18:00:00Z",
        deleted_at: null,
      },
    ],
    total: 1,
  };

  it("returns sessions list on success", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: sampleResponse }),
    } as Response);

    const { result } = renderHook(() => useCashRegisterSessions("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(sampleResponse);
  });

  it("passes filter params", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: sampleResponse }),
    } as Response);

    renderHook(
      () =>
        useCashRegisterSessions("org-1", {
          status: "closed",
          from: "2025-02-01",
          to: "2025-03-01",
          limit: 20,
          offset: 0,
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
    const calledUrl = fetchSpy.mock.calls[0][0] as string;
    expect(calledUrl).toContain("status=closed");
    expect(calledUrl).toContain("from=2025-02-01");
    expect(calledUrl).toContain("to=2025-03-01");
    expect(calledUrl).toContain("limit=20");
    expect(calledUrl).toContain("offset=0");
  });

  it("does not fetch when orgId is missing", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(() => useCashRegisterSessions(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe("useOpenSession", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.clearAllMocks();
  });

  const sampleSession = {
    id: "cs-new",
    organization_id: "org-1",
    branch_id: null,
    date: "2025-03-01",
    status: "open",
    opened_at: "2025-03-01T08:00:00Z",
    closed_at: null,
    opening_balance: 100000,
    closing_balance: null,
    expected_balance: null,
    cash_in: 0,
    cash_out: 0,
    discrepancy: null,
    discrepancy_note: null,
    opened_by: "user-1",
    closed_by: null,
    created_by: "user-1",
    created_at: "2025-03-01T08:00:00Z",
    updated_at: "2025-03-01T08:00:00Z",
    deleted_at: null,
  };

  it("opens a session successfully and updates cache", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: sampleSession }),
    } as Response);

    const { result } = renderHook(() => useOpenSession("org-1"), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync({ opening_balance: 100000 });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(sampleSession);
    expect(mockSuccessToast).toHaveBeenCalledWith("Cash register opened");
  });

  it("throws when orgId is missing", async () => {
    const { result } = renderHook(() => useOpenSession(undefined), {
      wrapper: createWrapper(),
    });

    await expect(
      result.current.mutateAsync({ opening_balance: 100000 }),
    ).rejects.toThrow("No org selected");
  });

  it("handles API error", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: false,
      json: async () => ({
        error: { message: "Session already open" },
      }),
    } as Response);

    const { result } = renderHook(() => useOpenSession("org-1"), {
      wrapper: createWrapper(),
    });

    await expect(
      result.current.mutateAsync({ opening_balance: 100000 }),
    ).rejects.toThrow("Session already open");
    expect(mockErrorToast).toHaveBeenCalledWith("Session already open");
  });
});

describe("useCloseSession", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.clearAllMocks();
  });

  const sampleClosedSession = {
    id: "cs-1",
    organization_id: "org-1",
    branch_id: null,
    date: "2025-03-01",
    status: "closed",
    opened_at: "2025-03-01T08:00:00Z",
    closed_at: "2025-03-01T18:00:00Z",
    opening_balance: 50000,
    closing_balance: 165000,
    expected_balance: 165000,
    cash_in: 120000,
    cash_out: 5000,
    discrepancy: 0,
    discrepancy_note: null,
    opened_by: "user-1",
    closed_by: "user-1",
    created_by: "user-1",
    created_at: "2025-03-01T08:00:00Z",
    updated_at: "2025-03-01T18:00:00Z",
    deleted_at: null,
  };

  it("closes a session successfully", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: sampleClosedSession }),
    } as Response);

    const { result } = renderHook(() => useCloseSession("org-1"), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync({
      sessionId: "cs-1",
      closing_balance: 165000,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(sampleClosedSession);
    expect(mockSuccessToast).toHaveBeenCalledWith("Cash register closed");
  });

  it("throws when orgId is missing", async () => {
    const { result } = renderHook(() => useCloseSession(undefined), {
      wrapper: createWrapper(),
    });

    await expect(
      result.current.mutateAsync({
        sessionId: "cs-1",
        closing_balance: 165000,
      }),
    ).rejects.toThrow("No org selected");
  });

  it("handles API error", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: false,
      json: async () => ({
        error: { message: "Session is already closed" },
      }),
    } as Response);

    const { result } = renderHook(() => useCloseSession("org-1"), {
      wrapper: createWrapper(),
    });

    await expect(
      result.current.mutateAsync({
        sessionId: "cs-1",
        closing_balance: 165000,
      }),
    ).rejects.toThrow("Session is already closed");
    expect(mockErrorToast).toHaveBeenCalledWith("Session is already closed");
  });
});

describe("useCashOut", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns mutation object with expected interface", () => {
    const { result } = renderHook(() => useCashOut("org-1"), {
      wrapper: createWrapper(),
    });

    expect(result.current.mutate).toBeDefined();
    expect(result.current.mutateAsync).toBeDefined();
    expect(result.current.isPending).toBe(false);
  });

  it("calls mutateAsync successfully", async () => {
    const { result } = renderHook(() => useCashOut("org-1"), {
      wrapper: createWrapper(),
    });

    const res = await result.current.mutateAsync({
      sessionId: "cs-1",
      amount: 50000,
      description: "Petty cash",
    });

    expect(res).toEqual({
      id: "ce-1",
      amount: 50000,
      description: "Petty cash",
    });
  });

  it("handles mutation error", async () => {
    mockMutateAsync.mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => useCashOut("org-1"), {
      wrapper: createWrapper(),
    });

    await expect(
      result.current.mutateAsync({
        sessionId: "cs-1",
        amount: 50000,
        description: "Petty cash",
      }),
    ).rejects.toThrow("Network error");
  });
});
