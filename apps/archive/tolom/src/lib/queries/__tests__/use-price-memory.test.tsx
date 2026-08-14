import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { priceMemoryKeys } from "../keys";
import {
  useCustomerAutoFill,
  useLastVisitData,
  useServiceLastUsedPrices,
} from "../use-price-memory";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

function createWrapper() {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("useLastVisitData", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  it("returns last visit data on success", async () => {
    const apiResponse = {
      data: {
        mechanic_id: "mech-1",
        notes: "Oil change performed",
        owner: { id: "c-1", first_name: "John" },
        services: [
          {
            service_catalog_id: "svc-1",
            service_name: "Oil Change",
            unit_price: "100",
            quantity: "1",
          },
        ],
        parts: [
          {
            part_name: "Oil Filter",
            part_number: "OF-001",
            unit_price: "25",
            quantity: "1",
          },
        ],
      },
    };

    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => apiResponse,
    } as Response);

    const { result } = renderHook(() => useLastVisitData("org-1", "v-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeDefined();
    expect(result.current.data?.mechanic_id).toBe("mech-1");
    expect(result.current.data?.services).toHaveLength(1);
    expect(result.current.data?.services[0].unit_price).toBe(100);
    expect(result.current.data?.parts).toHaveLength(1);
    expect(result.current.data?.parts[0].unit_price).toBe(25);
  });

  it("returns null when api returns null data", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: null }),
    } as Response);

    const { result } = renderHook(() => useLastVisitData("org-1", "v-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
  });

  it("does not fetch when orgId is undefined", async () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(() => useLastVisitData(undefined, "v-1"), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("does not fetch when vehicleId is undefined", async () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(() => useLastVisitData("org-1", undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("handles fetch error", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useLastVisitData("org-1", "v-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true), {
      timeout: 5000,
    });
  });
});

describe("useCustomerAutoFill", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  it("returns customer autofill data on success", async () => {
    const apiResponse = {
      data: {
        vehicles: [
          {
            id: "v-1",
            plate_number: "ABC-123",
            make: "Toyota",
            model: "Camry",
          },
        ],
        lastVehicleId: "v-1",
      },
    };

    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => apiResponse,
    } as Response);

    const { result } = renderHook(() => useCustomerAutoFill("org-1", "c-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeDefined();
    expect(result.current.data?.vehicles).toHaveLength(1);
  });

  it("does not fetch when orgId is undefined", async () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(() => useCustomerAutoFill(undefined, "c-1"), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("does not fetch when customerId is undefined", async () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(
      () => useCustomerAutoFill("org-1", undefined),
      { wrapper: createWrapper() },
    );

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe("useServiceLastUsedPrices", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  it("returns last used prices on success", async () => {
    const apiResponse = {
      data: {
        services: {
          "svc-1": {
            unit_price: 100,
            last_price: 90,
            created_at: "2024-01-01T00:00:00Z",
          },
          "svc-2": { unit_price: 200, created_at: "2024-01-02T00:00:00Z" },
        },
      },
    };

    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => apiResponse,
    } as Response);

    const { result } = renderHook(() => useServiceLastUsedPrices("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeDefined();
    expect(result.current.data?.["svc-1"].unit_price).toBe(100);
    expect(result.current.data?.["svc-2"].unit_price).toBe(200);
  });

  it("does not fetch when orgId is undefined", async () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(() => useServiceLastUsedPrices(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("handles fetch error", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useServiceLastUsedPrices("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true), {
      timeout: 5000,
    });
  });
});

describe("priceMemoryKeys", () => {
  it("constructs correct key shapes", () => {
    expect(priceMemoryKeys.all("org-1")).toEqual([
      "organizations",
      "org-1",
      "price-memory",
    ]);
    expect(priceMemoryKeys.lastVisit("org-1", "v-1")).toEqual([
      "organizations",
      "org-1",
      "price-memory",
      "last-visit",
      "v-1",
    ]);
  });
});
