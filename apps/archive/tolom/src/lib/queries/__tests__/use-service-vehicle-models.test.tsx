import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  useDeleteServiceVehicleModelPrice,
  useOrgVehicleModels,
  useServiceModelPriceCounts,
  useServiceVehicleModels,
  useUpsertServiceVehicleModelPrice,
} from "../use-service-vehicle-models";

vi.mock("@zuiio/query", () => ({
  useOrgMutation: vi.fn(() => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    isPending: false,
    isError: false,
    error: null,
  })),
}));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

function createWrapper() {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("useServiceVehicleModels", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  it("returns vehicle model prices on success", async () => {
    const models = [
      {
        id: "vm-1",
        vehicle_model_id: "model-1",
        vehicle_model_make: "Toyota",
        vehicle_model_model: "Camry",
        specific_price: 150,
        notes: null,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      },
    ];

    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: models }),
    } as Response);

    const { result } = renderHook(
      () => useServiceVehicleModels("org-1", "svc-1"),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(models);
  });

  it("does not fetch when orgId is undefined", async () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(
      () => useServiceVehicleModels(undefined, "svc-1"),
      { wrapper: createWrapper() },
    );

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("does not fetch when serviceId is undefined", async () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(
      () => useServiceVehicleModels("org-1", undefined),
      { wrapper: createWrapper() },
    );

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("returns empty array when both ids are missing", async () => {
    const { result } = renderHook(
      () => useServiceVehicleModels(undefined, undefined),
      { wrapper: createWrapper() },
    );

    expect(result.current.isPending).toBe(true);
  });

  it("handles fetch error", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(
      () => useServiceVehicleModels("org-1", "svc-1"),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it("handles error response with message", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ error: { message: "Service not found" } }),
    } as Response);

    const { result } = renderHook(
      () => useServiceVehicleModels("org-1", "svc-1"),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("useUpsertServiceVehicleModelPrice", () => {
  it("returns mutation object", () => {
    const { result } = renderHook(
      () => useUpsertServiceVehicleModelPrice("org-1", "svc-1"),
      { wrapper: createWrapper() },
    );

    expect(result.current).toBeDefined();
    expect(typeof result.current.mutate).toBe("function");
  });
});

describe("useDeleteServiceVehicleModelPrice", () => {
  it("returns mutation object", () => {
    const { result } = renderHook(
      () => useDeleteServiceVehicleModelPrice("org-1", "svc-1"),
      { wrapper: createWrapper() },
    );

    expect(result.current).toBeDefined();
    expect(typeof result.current.mutate).toBe("function");
  });
});

describe("useServiceModelPriceCounts", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  it("returns price counts on success", async () => {
    const counts = { "svc-1": 3, "svc-2": 1 };

    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: counts }),
    } as Response);

    const { result } = renderHook(() => useServiceModelPriceCounts("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(counts);
  });

  it("does not fetch when orgId is undefined", async () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(() => useServiceModelPriceCounts(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("handles fetch error", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useServiceModelPriceCounts("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("useOrgVehicleModels", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  it("returns vehicle models on success", async () => {
    const models = [
      { id: "m-1", make: "Toyota", model: "Camry" },
      { id: "m-2", make: "Honda", model: "Civic" },
    ];

    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: models }),
    } as Response);

    const { result } = renderHook(() => useOrgVehicleModels("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(models);
  });

  it("does not fetch when orgId is undefined", async () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(() => useOrgVehicleModels(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
