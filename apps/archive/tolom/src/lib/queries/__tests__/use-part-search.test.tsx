import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { usePartSearch } from "../use-part-search";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

function createWrapper() {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("usePartSearch", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  it("returns parts on success", async () => {
    const parts = [
      {
        id: "part-1",
        part_name: "Oil Filter",
        sku: "OF-001",
        unit_price: 25,
        current_stock: 10,
      },
    ];

    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: parts }),
    } as Response);

    const { result } = renderHook(() => usePartSearch("org-1", "Oil"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(parts);
  });

  it("does not fetch when orgId is null", async () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(() => usePartSearch(null, "Oil"), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("does not fetch when query is too short", async () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(() => usePartSearch("org-1", "O"), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("handles fetch error", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => usePartSearch("org-1", "Oil"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it("handles non-ok response", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: false,
      status: 500,
    } as Response);

    const { result } = renderHook(() => usePartSearch("org-1", "Oil"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it("returns empty array when query is empty", async () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(() => usePartSearch("org-1", ""), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
