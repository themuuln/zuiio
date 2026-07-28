import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  useCarBrands,
  useCarModels,
  useFilteredCarBrands,
  useSmartCarLookup,
} from "../use-car-catalog";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

function createWrapper() {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("useCarBrands", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  const sampleBrands = [
    { id: "b-1", name: "Toyota", name_en: "Toyota" },
    { id: "b-2", name: "Honda", name_en: "Honda" },
  ];

  it("returns car brands on success", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: sampleBrands }),
    } as Response);

    const { result } = renderHook(() => useCarBrands(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(sampleBrands);
  });

  it("calls /api/car-brands endpoint", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    } as Response);

    renderHook(() => useCarBrands(), { wrapper: createWrapper() });

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
    expect(fetchSpy.mock.calls[0][0]).toBe("/api/car-brands");
  });

  it("handles fetch error", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useCarBrands(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("useCarModels", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  const sampleModels = [
    { id: "mod-1", brand_id: "b-1", make: "Toyota", model: "Camry" },
    { id: "mod-2", brand_id: "b-1", make: "Toyota", model: "Corolla" },
  ];

  it("returns car models on success", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: sampleModels }),
    } as Response);

    const { result } = renderHook(() => useCarModels("b-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(sampleModels);
  });

  it("does not fetch when brandId is null", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(() => useCarModels(null), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("calls the correct endpoint", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    } as Response);

    renderHook(() => useCarModels("b-42"), { wrapper: createWrapper() });

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
    expect(fetchSpy.mock.calls[0][0]).toBe("/api/car-brands/b-42/models");
  });

  it("handles fetch error", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useCarModels("b-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("useFilteredCarBrands", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  it("returns all brands when niche is disabled", async () => {
    const brands = [
      { id: "b-1", name: "Toyota", name_en: "Toyota" },
      { id: "b-2", name: "Honda", name_en: "Honda" },
    ];

    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: brands }),
    } as Response);

    const { result } = renderHook(
      () =>
        useFilteredCarBrands({
          vehicle_niche: { enabled: false, brand_ids: [], model_ids: [] },
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(brands);
  });

  it("filters brands when niche is enabled with brand_ids", async () => {
    const brands = [
      { id: "b-1", name: "Toyota", name_en: "Toyota" },
      { id: "b-2", name: "Honda", name_en: "Honda" },
    ];

    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: brands }),
    } as Response);

    const { result } = renderHook(
      () =>
        useFilteredCarBrands({
          vehicle_niche: { enabled: true, brand_ids: ["b-2"], model_ids: [] },
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([brands[1]]);
  });
});

describe("useSmartCarLookup", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  const sampleLookup = {
    plateNumber: "ABC123",
    make: "Toyota",
    model: "Camry",
    year: 2022,
    vin: "VIN123456789",
    category: "sedan",
    engineCc: 2000,
    transmission: "automatic",
    fuelType: "gasoline",
    steering: "left",
    seats: 5,
    bodyType: "sedan",
    country: "Japan",
    color: "White",
    height: "1450mm",
    width: "1820mm",
    length: "4600mm",
    weight: "1500kg",
    importDate: "2022-06-01",
  };

  it("returns data on success", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: sampleLookup }),
    } as Response);

    const { result } = renderHook(() => useSmartCarLookup("ABC1234"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(sampleLookup);
  });

  it("does not fetch when plate is null", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(() => useSmartCarLookup(null), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("does not fetch when plate is too short", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(() => useSmartCarLookup("AB"), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("handles fetch error", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useSmartCarLookup("ABC1234"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true), {
      timeout: 5000,
    });
  });
});
