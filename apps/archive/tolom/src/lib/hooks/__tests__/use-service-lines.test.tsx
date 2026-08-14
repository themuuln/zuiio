import {
  QueryClient,
  QueryClientProvider,
  type UseQueryResult,
} from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  fetchVehicleServicePrice,
  type PriceHistoryData,
  usePriceHistory,
  useServiceCatalog,
} from "@/lib/queries/use-wizard-data";
import type { ServiceCatalog } from "@/lib/types";
import { useServiceLines } from "../use-service-lines";

vi.mock("@/lib/queries/use-wizard-data", () => ({
  fetchVehicleServicePrice: vi.fn(),
  usePriceHistory: vi.fn(),
  useServiceCatalog: vi.fn(),
}));

vi.mock("@/lib/sentry-report-server", () => ({
  reportServerError: vi.fn(),
}));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

function createWrapper() {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

const oilChange: ServiceCatalog = {
  id: "s-1",
  organization_id: "org-1",
  branch_id: null,
  name: "Oil Change",
  name_mn: null,
  description: null,
  category: null,
  default_price: 50000,
  default_cost: null,
  is_active: true,
  interval_km: null,
  interval_months: null,
  created_at: "2025-01-01T00:00:00Z",
  created_by: null,
  deleted_at: null,
  embedding: null,
  updated_at: "2025-01-01T00:00:00Z",
};

const brakeCheck: ServiceCatalog = {
  ...oilChange,
  id: "s-2",
  name: "Brake Check",
  default_price: 30000,
};

/** Flush microtasks (mock promise chains) inside act. */
async function flush() {
  await act(async () => {});
}

describe("useServiceLines", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.clearAllMocks();
    vi.mocked(useServiceCatalog).mockReturnValue({
      data: [],
      isInitialLoading: false,
    } as UseQueryResult<ServiceCatalog[], Error>);
    vi.mocked(usePriceHistory).mockReturnValue({
      data: { services: {}, parts: {} },
      isInitialLoading: false,
    } as UseQueryResult<PriceHistoryData, Error>);
    vi.mocked(fetchVehicleServicePrice).mockResolvedValue(null);
  });

  it("exposes catalog data and combines loading flags", () => {
    vi.mocked(useServiceCatalog).mockReturnValue({
      data: [oilChange],
      isInitialLoading: true,
    } as UseQueryResult<ServiceCatalog[], Error>);
    vi.mocked(usePriceHistory).mockReturnValue({
      data: { services: {}, parts: {} },
      isInitialLoading: true,
    } as UseQueryResult<PriceHistoryData, Error>);

    const { result } = renderHook(
      () => useServiceLines("org-1", undefined, undefined),
      { wrapper: createWrapper() },
    );

    expect(result.current.catalog).toEqual([oilChange]);
    expect(result.current.loading).toBe(true);
    expect(result.current.serviceLines).toEqual([]);
  });

  it("addService appends a line priced from the catalog default", () => {
    const { result } = renderHook(
      () => useServiceLines(undefined, undefined, undefined),
      { wrapper: createWrapper() },
    );

    act(() => {
      result.current.addService(oilChange);
    });

    expect(result.current.serviceLines).toHaveLength(1);
    expect(result.current.serviceLines[0]).toEqual({
      service_catalog_id: "s-1",
      name: "Oil Change",
      base_price: 50000,
      quantity: 1,
      discount_amount_mnt: 0,
      discount_percent: 0,
      final_price: 50000,
      last_price: undefined,
    });
  });

  it("addService uses the last price from history when available", () => {
    vi.mocked(usePriceHistory).mockReturnValue({
      data: { services: { "s-1": { last_price: 45000 } }, parts: {} },
      isInitialLoading: false,
    } as UseQueryResult<PriceHistoryData, Error>);
    const { result } = renderHook(
      () => useServiceLines(undefined, undefined, undefined),
      { wrapper: createWrapper() },
    );

    act(() => {
      result.current.addService(oilChange);
    });

    expect(result.current.serviceLines[0].base_price).toBe(45000);
    expect(result.current.serviceLines[0].final_price).toBe(45000);
    expect(result.current.serviceLines[0].last_price).toBe(45000);
  });

  it("ignores adding the same service twice", () => {
    const { result } = renderHook(
      () => useServiceLines(undefined, undefined, undefined),
      { wrapper: createWrapper() },
    );

    act(() => {
      result.current.addService(oilChange);
    });
    act(() => {
      result.current.addService(oilChange);
    });

    expect(result.current.serviceLines).toHaveLength(1);
  });

  it("applies the fetched vehicle price when it differs from the base price", async () => {
    vi.mocked(fetchVehicleServicePrice).mockResolvedValue(60000);
    const { result } = renderHook(
      () => useServiceLines("org-1", "Toyota", "Camry"),
      { wrapper: createWrapper() },
    );

    act(() => {
      result.current.addService(oilChange);
    });
    await flush();

    expect(fetchVehicleServicePrice).toHaveBeenCalledWith(
      "org-1",
      "s-1",
      "Toyota",
      "Camry",
    );
    expect(result.current.serviceLines[0].base_price).toBe(60000);
    expect(result.current.serviceLines[0].final_price).toBe(60000);
    expect(result.current.serviceLines[0].last_price).toBe(60000);
    expect(result.current.vehicleServicePrices).toEqual({ "s-1": 60000 });
  });

  it("keeps the default price when the fetched vehicle price matches", async () => {
    vi.mocked(fetchVehicleServicePrice).mockResolvedValue(50000);
    const { result } = renderHook(
      () => useServiceLines("org-1", "Toyota", "Camry"),
      { wrapper: createWrapper() },
    );

    act(() => {
      result.current.addService(oilChange);
    });
    await flush();

    expect(result.current.serviceLines[0].base_price).toBe(50000);
    expect(result.current.serviceLines[0].final_price).toBe(50000);
    expect(result.current.serviceLines[0].last_price).toBeUndefined();
  });

  it("does not fetch vehicle prices when orgId or make is missing", () => {
    const { result } = renderHook(
      () => useServiceLines(undefined, "Toyota", "Camry"),
      { wrapper: createWrapper() },
    );

    act(() => {
      result.current.addService(oilChange);
    });

    expect(fetchVehicleServicePrice).not.toHaveBeenCalled();
  });

  it("updateService recomputes final price from quantity and discounts", () => {
    const { result } = renderHook(
      () => useServiceLines(undefined, undefined, undefined),
      { wrapper: createWrapper() },
    );

    act(() => {
      result.current.addService(oilChange); // base 50000 x 1
    });
    act(() => {
      result.current.updateService(0, "quantity", 2);
    });
    expect(result.current.serviceLines[0].final_price).toBe(100000);

    act(() => {
      result.current.updateService(0, "discount_amount_mnt", 5000);
    });
    expect(result.current.serviceLines[0].final_price).toBe(95000);

    act(() => {
      result.current.updateService(0, "discount_percent", 10);
    });
    expect(result.current.serviceLines[0].final_price).toBe(85000);
  });

  it("clamps final price at zero when discounts exceed the subtotal", () => {
    const { result } = renderHook(
      () => useServiceLines(undefined, undefined, undefined),
      { wrapper: createWrapper() },
    );

    act(() => {
      result.current.addService(oilChange);
    });
    act(() => {
      result.current.updateService(0, "discount_amount_mnt", 60000);
    });

    expect(result.current.serviceLines[0].final_price).toBe(0);
  });

  it("removeService removes the line at the given index", () => {
    const { result } = renderHook(
      () => useServiceLines(undefined, undefined, undefined),
      { wrapper: createWrapper() },
    );

    act(() => {
      result.current.addService(oilChange);
    });
    act(() => {
      result.current.addService(brakeCheck);
    });
    expect(result.current.serviceLines).toHaveLength(2);

    act(() => {
      result.current.removeService(0);
    });

    expect(result.current.serviceLines).toHaveLength(1);
    expect(result.current.serviceLines[0].service_catalog_id).toBe("s-2");
  });
});
