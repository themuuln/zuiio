import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GlobalSearchResult } from "@/lib/services/global-search-service";
import { useGlobalSearch } from "../use-global-search";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

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

const sampleResult: GlobalSearchResult = {
  customers: [{ id: "c-1", name: "John Doe", phone: "+97699112233" }],
  vehicles: [
    {
      id: "v-1",
      plateNumber: "1234ABC",
      make: "Toyota",
      model: "Camry",
      year: 2019,
      ownerName: "John Doe",
    },
  ],
  workOrders: [
    {
      id: "wo-1",
      plateNumber: "1234ABC",
      customerName: "John Doe",
      status: "In Progress",
      createdAt: "2025-03-01T10:00:00Z",
    },
  ],
  parts: [{ id: "p-1", name: "Oil filter", partNumber: "OF-001", stock: 12 }],
};

describe("useGlobalSearch", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  it("returns grouped search results on success", async () => {
    const fetchSpy = mockFetchResponse(sampleResult);

    const { result } = renderHook(() => useGlobalSearch("org-1", "camry"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(sampleResult);
    expect(result.current.data?.customers).toHaveLength(1);
    expect(result.current.data?.vehicles[0]?.plateNumber).toBe("1234ABC");
    expect(fetchSpy.mock.calls[0][0]).toBe(
      "/api/organizations/org-1/global-search?q=camry",
    );
  });

  it("passes the limit option to the API", async () => {
    const fetchSpy = mockFetchResponse(sampleResult);

    renderHook(() => useGlobalSearch("org-1", "camry", { limit: 3 }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
    expect(fetchSpy.mock.calls[0][0]).toBe(
      "/api/organizations/org-1/global-search?q=camry&limit=3",
    );
  });

  it("trims the search term before querying", async () => {
    const fetchSpy = mockFetchResponse(sampleResult);

    renderHook(() => useGlobalSearch("org-1", "  camry  "), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
    expect(fetchSpy.mock.calls[0][0]).toBe(
      "/api/organizations/org-1/global-search?q=camry",
    );
  });

  it("does not fetch when the query is shorter than 2 characters", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(() => useGlobalSearch("org-1", "a"), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("does not fetch for whitespace-only queries", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(() => useGlobalSearch("org-1", "   "), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("does not fetch when orgId is missing", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(() => useGlobalSearch(undefined, "camry"), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("surfaces API errors", async () => {
    mockFetchError("Failed to load global-search");

    const { result } = renderHook(() => useGlobalSearch("org-1", "camry"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("Failed to load global-search");
  });
});
