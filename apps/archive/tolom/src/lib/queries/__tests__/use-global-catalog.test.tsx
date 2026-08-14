import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { globalCatalogKeys } from "../keys";
import {
  useGlobalPartsCatalog,
  useGlobalServiceCatalog,
} from "../use-global-catalog";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

function createWrapper() {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("useGlobalServiceCatalog", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  it("returns services on success", async () => {
    const services = [
      {
        id: "svc-1",
        name: "Oil Change",
        name_mn: "Тос солих",
        category: "Maintenance",
        description: "Replace engine oil",
        estimated_duration_minutes: 30,
        interval_months: 6,
        interval_km: 5000,
      },
    ];

    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: services }),
    } as Response);

    const { result } = renderHook(() => useGlobalServiceCatalog(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(services);
  });

  it("handles fetch error", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useGlobalServiceCatalog(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true), {
      timeout: 5000,
    });
  });

  it("handles non-ok response", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: false,
      status: 500,
    } as Response);

    const { result } = renderHook(() => useGlobalServiceCatalog(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true), {
      timeout: 5000,
    });
  });

  it("defaults to empty array when data is null", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: null }),
    } as Response);

    const { result } = renderHook(() => useGlobalServiceCatalog(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });
});

describe("useGlobalPartsCatalog", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  it("returns parts on success", async () => {
    const parts = [
      {
        id: "part-1",
        name: "Oil Filter",
        name_mn: "Тосны шүүлтүүр",
        category: "Filters",
        description: "Engine oil filter",
        part_number: "OF-001",
        unit: "pcs",
      },
    ];

    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: parts }),
    } as Response);

    const { result } = renderHook(() => useGlobalPartsCatalog(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(parts);
  });

  it("handles fetch error", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useGlobalPartsCatalog(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true), {
      timeout: 5000,
    });
  });

  it("defaults to empty array when data is null", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: null }),
    } as Response);

    const { result } = renderHook(() => useGlobalPartsCatalog(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });
});

describe("globalCatalogKeys", () => {
  it("constructs correct key shapes", () => {
    expect(globalCatalogKeys.all).toEqual(["global-catalog"]);
    expect(globalCatalogKeys.services()).toEqual([
      "global-catalog",
      "services",
    ]);
    expect(globalCatalogKeys.parts()).toEqual(["global-catalog", "parts"]);
  });
});
