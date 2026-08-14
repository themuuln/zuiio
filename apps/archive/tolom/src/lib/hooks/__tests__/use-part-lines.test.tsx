import {
  QueryClient,
  QueryClientProvider,
  type UseQueryResult,
} from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { usePartsCatalog } from "@/lib/queries/use-inventory";
import {
  fetchVehiclePartPrice,
  type PriceHistoryData,
  usePriceHistory,
} from "@/lib/queries/use-wizard-data";
import type { PartsCatalogItem } from "@/lib/types";
import { usePartLines } from "../use-part-lines";

vi.mock("@/lib/queries/use-inventory", () => ({
  usePartsCatalog: vi.fn(),
}));

vi.mock("@/lib/queries/use-wizard-data", () => ({
  fetchVehiclePartPrice: vi.fn(),
  usePriceHistory: vi.fn(),
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

const catalogPart: PartsCatalogItem = {
  id: "p-1",
  organization_id: "org-1",
  name: "Oil Filter",
  name_mn: null,
  part_number: "OF-100",
  barcode: null,
  category: "Filter",
  description: null,
  unit: "pcs",
  default_price: 12000,
  purchase_price: null,
  image_url: null,
  location: null,
  is_active: true,
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z",
};

/** Flush microtasks (mock promise chains) inside act. */
async function flush() {
  await act(async () => {});
}

describe("usePartLines", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.clearAllMocks();
    vi.mocked(usePartsCatalog).mockReturnValue({
      data: [],
      isInitialLoading: false,
    } as UseQueryResult<PartsCatalogItem[], Error>);
    vi.mocked(usePriceHistory).mockReturnValue({
      data: { parts: {}, services: {} },
      isInitialLoading: false,
    } as UseQueryResult<PriceHistoryData, Error>);
    vi.mocked(fetchVehiclePartPrice).mockResolvedValue(null);
  });

  it("exposes catalog data and loading state", () => {
    vi.mocked(usePartsCatalog).mockReturnValue({
      data: [catalogPart],
      isInitialLoading: true,
    } as UseQueryResult<PartsCatalogItem[], Error>);

    const { result } = renderHook(
      () => usePartLines("org-1", undefined, undefined),
      { wrapper: createWrapper() },
    );

    expect(result.current.partsCatalog).toEqual([catalogPart]);
    expect(result.current.loading).toBe(true);
    expect(result.current.partLines).toEqual([]);
    expect(result.current.vehiclePartPrices).toEqual({});
  });

  it("addPart appends an empty line", () => {
    const { result } = renderHook(
      () => usePartLines(undefined, undefined, undefined),
      { wrapper: createWrapper() },
    );

    act(() => {
      result.current.addPart();
    });

    expect(result.current.partLines).toHaveLength(1);
    expect(result.current.partLines[0]).toMatchObject({
      part_name: "",
      part_number: "",
      quantity: 1,
      unit_price: 0,
      final_price: 0,
    });
  });

  it("addPartFromCatalog appends the part with its default price", () => {
    const { result } = renderHook(
      () => usePartLines(undefined, undefined, undefined),
      { wrapper: createWrapper() },
    );

    act(() => {
      result.current.addPartFromCatalog(catalogPart);
    });

    expect(result.current.partLines).toHaveLength(1);
    expect(result.current.partLines[0]).toEqual({
      part_name: "Oil Filter",
      part_number: "OF-100",
      quantity: 1,
      unit_price: 12000,
      final_price: 12000,
      last_price: undefined,
    });
  });

  it("applies the fetched vehicle price when org/make/model are set", async () => {
    vi.mocked(fetchVehiclePartPrice).mockResolvedValue(15000);
    const { result } = renderHook(
      () => usePartLines("org-1", "Toyota", "Camry"),
      { wrapper: createWrapper() },
    );

    act(() => {
      result.current.addPartFromCatalog(catalogPart);
    });
    await flush();

    expect(fetchVehiclePartPrice).toHaveBeenCalledWith(
      "org-1",
      "Oil Filter",
      "Toyota",
      "Camry",
    );
    expect(result.current.partLines[0].unit_price).toBe(15000);
    expect(result.current.partLines[0].final_price).toBe(15000);
    expect(result.current.partLines[0].last_price).toBe(15000);
    expect(result.current.vehiclePartPrices).toEqual({ "oil filter": 15000 });

    // Adding the same part again must not re-fetch
    act(() => {
      result.current.addPartFromCatalog(catalogPart);
    });
    await flush();
    expect(fetchVehiclePartPrice).toHaveBeenCalledTimes(1);
  });

  it("does not fetch vehicle prices when orgId or make is missing", () => {
    const { result } = renderHook(
      () => usePartLines(undefined, undefined, undefined),
      { wrapper: createWrapper() },
    );

    act(() => {
      result.current.addPartFromCatalog(catalogPart);
    });
    act(() => {
      result.current.updatePart(0, "part_name", "Brake Pad");
    });

    expect(fetchVehiclePartPrice).not.toHaveBeenCalled();
  });

  it("updatePart applies price history when the line has no unit price", () => {
    vi.mocked(usePriceHistory).mockReturnValue({
      data: { parts: { "oil filter": 8000 }, services: {} },
      isInitialLoading: false,
    } as UseQueryResult<PriceHistoryData, Error>);
    const { result } = renderHook(
      () => usePartLines(undefined, undefined, undefined),
      { wrapper: createWrapper() },
    );

    act(() => {
      result.current.addPart();
    });
    act(() => {
      result.current.updatePart(0, "part_name", "Oil Filter");
    });

    expect(result.current.partLines[0].part_name).toBe("Oil Filter");
    expect(result.current.partLines[0].unit_price).toBe(8000);
    expect(result.current.partLines[0].last_price).toBe(8000);
  });

  it("updatePart recomputes final price from quantity and unit price", () => {
    const { result } = renderHook(
      () => usePartLines(undefined, undefined, undefined),
      { wrapper: createWrapper() },
    );

    act(() => {
      result.current.addPartFromCatalog(catalogPart); // 12000 x 1
    });
    act(() => {
      result.current.updatePart(0, "quantity", 3);
    });
    expect(result.current.partLines[0].final_price).toBe(36000);

    act(() => {
      result.current.updatePart(0, "unit_price", 10000);
    });
    expect(result.current.partLines[0].final_price).toBe(30000);
  });

  it("updatePart applies a fetched vehicle price when unit price is zero", async () => {
    vi.mocked(fetchVehiclePartPrice).mockResolvedValue(9000);
    const { result } = renderHook(
      () => usePartLines("org-1", "Toyota", "Camry"),
      { wrapper: createWrapper() },
    );

    act(() => {
      result.current.addPart();
    });
    act(() => {
      result.current.updatePart(0, "part_name", "Brake Pad");
    });
    await flush();

    expect(fetchVehiclePartPrice).toHaveBeenCalledWith(
      "org-1",
      "Brake Pad",
      "Toyota",
      "Camry",
    );
    expect(result.current.partLines[0].unit_price).toBe(9000);
    expect(result.current.partLines[0].final_price).toBe(9000);
    expect(result.current.partLines[0].last_price).toBe(9000);
  });

  it("keeps a manually set unit price when the fetched vehicle price arrives", async () => {
    vi.mocked(fetchVehiclePartPrice).mockResolvedValue(9999);
    const { result } = renderHook(
      () => usePartLines("org-1", "Toyota", "Camry"),
      { wrapper: createWrapper() },
    );

    act(() => {
      result.current.addPartFromCatalog(catalogPart); // unit_price 12000
    });
    act(() => {
      result.current.updatePart(0, "part_name", "Air Filter");
    });
    await flush();

    expect(result.current.partLines[0].unit_price).toBe(12000);
    expect(result.current.partLines[0].final_price).toBe(12000);
    expect(result.current.partLines[0].last_price).toBeUndefined();
  });

  it("removePart removes the line at the given index", () => {
    const { result } = renderHook(
      () => usePartLines(undefined, undefined, undefined),
      { wrapper: createWrapper() },
    );

    act(() => {
      result.current.addPart();
    });
    act(() => {
      result.current.addPartFromCatalog(catalogPart);
    });
    expect(result.current.partLines).toHaveLength(2);

    act(() => {
      result.current.removePart(0);
    });

    expect(result.current.partLines).toHaveLength(1);
    expect(result.current.partLines[0].part_name).toBe("Oil Filter");
  });
});
