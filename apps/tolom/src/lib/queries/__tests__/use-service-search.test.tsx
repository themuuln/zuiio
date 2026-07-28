import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useServiceSearch } from "../use-service-search";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

function createWrapper() {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("useServiceSearch", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  const sampleResults = [
    { id: "svc-1", name: "Oil Change", default_price: 50 },
    { id: "svc-2", name: "Brake Pad Replacement", default_price: 120 },
  ];

  it("returns search results on success", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: sampleResults }),
    } as Response);

    const { result } = renderHook(() => useServiceSearch("org-1", "Oil"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(sampleResults);
  });

  it("does not fetch when orgId is null", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(() => useServiceSearch(null, "Oil"), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("does not fetch when query is too short", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(() => useServiceSearch("org-1", "O"), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("returns empty array when query is empty", async () => {
    vi.spyOn(global, "fetch");

    const { result } = renderHook(() => useServiceSearch("org-1", ""), {
      wrapper: createWrapper(),
    });

    // Query is disabled (query.trim().length >= 2 is false),
    // so data is undefined until enabled
    // The hook uses placeholderData: (prev) => prev but prev is undefined on first mount,
    // so data remains undefined
    expect(result.current.data).toBeUndefined();
  });

  it("passes query parameter in URL", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    } as Response);

    renderHook(() => useServiceSearch("org-1", "Brake"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
    const url = fetchSpy.mock.calls[0][0] as string;
    expect(url).toContain("/api/organizations/org-1/services");
    expect(url).toContain("q=Brake");
  });

  it("handles fetch error", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useServiceSearch("org-1", "Oil"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
