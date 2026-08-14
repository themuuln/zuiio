import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { inventoryKeys, stockCountKeys } from "../keys";
import type {
  StockCountItem,
  StockCountSession,
  StockCountSessionWithItems,
} from "../use-stock-counts";
import {
  useAddCountItem,
  useCancelSession,
  useCreateStockCountSession,
  useReconcileSession,
  useRemoveCountItem,
  useStockCountSession,
  useStockCountSessions,
} from "../use-stock-counts";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

interface OrgMutationConfigLike {
  endpoint: string | ((vars: Record<string, unknown>) => string);
  method?: string;
  queryKey: readonly unknown[];
  successMessage?: string;
  bodyFn?: (vars: Record<string, unknown>) => unknown;
  invalidateKeys?: readonly (readonly unknown[])[];
}

const { mockUseOrgMutation } = vi.hoisted(() => ({
  mockUseOrgMutation: vi.fn(() => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    isPending: false,
  })),
}));

vi.mock("@zuiio/query", () => ({
  useOrgMutation: mockUseOrgMutation,
}));

function lastMutationConfig(): OrgMutationConfigLike {
  const config = mockUseOrgMutation.mock.calls.at(-1)?.[0];
  if (!config) throw new Error("useOrgMutation was not called");
  return config as OrgMutationConfigLike;
}

function createWrapper() {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

function mockFetchResponse(data: unknown) {
  return vi.spyOn(global, "fetch").mockResolvedValue({
    ok: true,
    json: async () => ({ data }),
  } as Response);
}

function mockFetchError(message: string) {
  return vi.spyOn(global, "fetch").mockResolvedValue({
    ok: true,
    json: async () => ({ error: { message } }),
  } as Response);
}

const sampleSession: StockCountSession = {
  id: "sc-1",
  organization_id: "org-1",
  branch_id: "b-1",
  status: "in_progress",
  counted_by: "user-1",
  total_items: 3,
  total_variance: 2,
  notes: null,
  started_at: "2025-03-01T09:00:00Z",
  completed_at: null,
};

const sampleItem: StockCountItem = {
  id: "cnt-1",
  session_id: "sc-1",
  part_id: "p-1",
  system_quantity: 5,
  physical_quantity: 7,
  variance: 2,
  notes: null,
  part_name: "Oil filter",
  part_number: "OF-001",
};

const sampleSessionWithItems: StockCountSessionWithItems = {
  ...sampleSession,
  items: [sampleItem],
};

describe("useStockCountSessions", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  it("returns the sessions list on success", async () => {
    const fetchSpy = mockFetchResponse([sampleSession]);

    const { result } = renderHook(() => useStockCountSessions("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([sampleSession]);
    expect(fetchSpy.mock.calls[0][0]).toBe(
      "/api/organizations/org-1/inventory/stock-counts/sessions",
    );
  });

  it("passes the status filter to the API", async () => {
    const fetchSpy = mockFetchResponse([]);

    renderHook(() => useStockCountSessions("org-1", "completed"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
    expect(fetchSpy.mock.calls[0][0]).toBe(
      "/api/organizations/org-1/inventory/stock-counts/sessions?status=completed",
    );
  });

  it("does not fetch when orgId is missing", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(() => useStockCountSessions(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("surfaces API errors", async () => {
    mockFetchError("Failed to load sessions");

    const { result } = renderHook(() => useStockCountSessions("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("Failed to load sessions");
  });
});

describe("useStockCountSession", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  it("returns the session with items on success", async () => {
    const fetchSpy = mockFetchResponse(sampleSessionWithItems);

    const { result } = renderHook(() => useStockCountSession("org-1", "sc-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(sampleSessionWithItems);
    expect(fetchSpy.mock.calls[0][0]).toBe(
      "/api/organizations/org-1/inventory/stock-counts/sessions?sessionId=sc-1",
    );
  });

  it("does not fetch when orgId or sessionId is missing", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result: noOrg } = renderHook(
      () => useStockCountSession(undefined, "sc-1"),
      { wrapper: createWrapper() },
    );
    const { result: noId } = renderHook(
      () => useStockCountSession("org-1", ""),
      {
        wrapper: createWrapper(),
      },
    );

    expect(noOrg.current.isPending).toBe(true);
    expect(noId.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("surfaces API errors", async () => {
    mockFetchError("Session not found");

    const { result } = renderHook(() => useStockCountSession("org-1", "sc-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("Session not found");
  });
});

describe("stock count mutations", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.clearAllMocks();
  });

  it("configures useCreateStockCountSession with POST endpoint and sessions key", () => {
    renderHook(() => useCreateStockCountSession("org-1"), {
      wrapper: createWrapper(),
    });

    const config = lastMutationConfig();
    expect(config.endpoint).toBe(
      "/api/organizations/org-1/inventory/stock-counts/sessions",
    );
    expect(config.method).toBe("POST");
    expect(config.queryKey).toEqual(stockCountKeys.sessions("org-1"));
    expect(config.successMessage).toBe("Stock count session created");
  });

  it("configures useAddCountItem with items endpoint and bodyFn that strips sessionId", () => {
    renderHook(() => useAddCountItem("org-1"), {
      wrapper: createWrapper(),
    });

    const config = lastMutationConfig();
    const endpoint = config.endpoint;
    expect(typeof endpoint).toBe("function");
    expect(
      (endpoint as (vars: Record<string, unknown>) => string)({
        sessionId: "sc-1",
      }),
    ).toBe(
      "/api/organizations/org-1/inventory/stock-counts/sessions/sc-1/items",
    );
    expect(config.method).toBe("POST");
    expect(config.queryKey).toEqual(stockCountKeys.all("org-1"));
    expect(config.successMessage).toBe("Count item added");

    const body = config.bodyFn?.({
      sessionId: "sc-1",
      part_id: "p-1",
      physical_quantity: 7,
      notes: "counted twice",
    });
    expect(body).toEqual({
      part_id: "p-1",
      physical_quantity: 7,
      notes: "counted twice",
    });
  });

  it("configures useRemoveCountItem with DELETE endpoint including itemId", () => {
    renderHook(() => useRemoveCountItem("org-1"), {
      wrapper: createWrapper(),
    });

    const config = lastMutationConfig();
    const endpoint = config.endpoint;
    expect(typeof endpoint).toBe("function");
    expect(
      (endpoint as (vars: Record<string, unknown>) => string)({
        sessionId: "sc-1",
        itemId: "cnt-1",
      }),
    ).toBe(
      "/api/organizations/org-1/inventory/stock-counts/sessions/sc-1/items?itemId=cnt-1",
    );
    expect(config.method).toBe("DELETE");
    expect(config.successMessage).toBe("Count item removed");
  });

  it("configures useReconcileSession with reconcile action and inventory invalidation", () => {
    renderHook(() => useReconcileSession("org-1"), {
      wrapper: createWrapper(),
    });

    const config = lastMutationConfig();
    const endpoint = config.endpoint;
    expect(typeof endpoint).toBe("function");
    expect(
      (endpoint as (vars: Record<string, unknown>) => string)({
        sessionId: "sc-1",
      }),
    ).toBe("/api/organizations/org-1/inventory/stock-counts/sessions/sc-1");
    expect(config.method).toBe("PATCH");
    expect(config.queryKey).toEqual(stockCountKeys.session("org-1", ""));
    expect(config.bodyFn?.({ sessionId: "sc-1" })).toEqual({
      action: "reconcile",
    });
    expect(config.invalidateKeys).toEqual([inventoryKeys.all("org-1")]);
    expect(config.successMessage).toBe("Stock count reconciled");
  });

  it("configures useCancelSession with cancel action", () => {
    renderHook(() => useCancelSession("org-1"), {
      wrapper: createWrapper(),
    });

    const config = lastMutationConfig();
    const endpoint = config.endpoint;
    expect(typeof endpoint).toBe("function");
    expect(
      (endpoint as (vars: Record<string, unknown>) => string)({
        sessionId: "sc-1",
      }),
    ).toBe("/api/organizations/org-1/inventory/stock-counts/sessions/sc-1");
    expect(config.method).toBe("PATCH");
    expect(config.queryKey).toEqual(stockCountKeys.sessions("org-1"));
    expect(config.bodyFn?.({ sessionId: "sc-1" })).toEqual({
      action: "cancel",
    });
    expect(config.successMessage).toBe("Stock count cancelled");
  });
});
