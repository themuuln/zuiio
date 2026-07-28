import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { vehicleKeys } from "../keys";
import { useVehicle, useVehicles } from "../use-vehicles";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

function createWrapper() {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

const sampleVehicles = [
  {
    id: "veh-1",
    plate_number: "XYZ-789",
    make: "Toyota",
    model: "Camry",
    organization_id: "org-1",
    customer_id: "cust-1",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    deleted_at: null,
    color: "White",
    notes: null,
    body_type: null,
    branch_id: null,
    category: null,
    chassis_number: null,
    country_of_origin: null,
    drivetrain: null,
    engine: null,
    fuel_type: null,
    height: null,
    import_date: null,
    inspection_notes: null,
    last_service_branch_id: null,
    last_visit_at: null,
    last_visit_date: null,
    length: null,
    license_expiry: null,
    license_expiry_at: null,
    next_service_at: null,
    next_service_date: null,
    odometer: null,
    seats: null,
    created_by: null,
    updated_by: null,
  },
  {
    id: "veh-2",
    plate_number: "ABC-456",
    make: "Honda",
    model: "Civic",
    organization_id: "org-1",
    customer_id: "cust-2",
    created_at: "2024-02-01T00:00:00Z",
    updated_at: "2024-02-01T00:00:00Z",
    deleted_at: null,
    color: "Blue",
    notes: null,
    body_type: "Sedan",
    branch_id: "branch-1",
    category: null,
    chassis_number: null,
    country_of_origin: null,
    drivetrain: null,
    engine: null,
    fuel_type: null,
    height: null,
    import_date: null,
    inspection_notes: null,
    last_service_branch_id: null,
    last_visit_at: null,
    last_visit_date: null,
    length: null,
    license_expiry: null,
    license_expiry_at: null,
    next_service_at: null,
    next_service_date: null,
    odometer: null,
    seats: null,
    created_by: null,
    updated_by: null,
  },
];

describe("useVehicles", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  it("returns vehicles on success", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: sampleVehicles }),
    } as Response);

    const { result } = renderHook(() => useVehicles("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(sampleVehicles);
  });

  it("passes search query param", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    } as Response);

    renderHook(() => useVehicles("org-1", "XYZ"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(fetchSpy).toHaveBeenCalled());
    const url = fetchSpy.mock.calls[0][0] as string;
    expect(url).toContain("q=XYZ");
  });

  it("passes branch_id param when branchId is provided", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    } as Response);

    renderHook(() => useVehicles("org-1", "", "branch-42"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(fetchSpy).toHaveBeenCalled());
    const url = fetchSpy.mock.calls[0][0] as string;
    expect(url).toContain("branch_id=branch-42");
  });

  it("does not fetch when orgId is missing", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(() => useVehicles(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("handles fetch error", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: { message: "Server error" } }),
    } as Response);

    const { result } = renderHook(() => useVehicles("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeDefined();
  });

  it("handles network failure", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useVehicles("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("Network error");
  });
});

describe("useVehicle", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  const sampleVehicle = {
    id: "veh-1",
    plate_number: "XYZ-789",
    make: "Toyota",
    model: "Camry",
    organization_id: "org-1",
    customer_id: "cust-1",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    deleted_at: null,
    color: "White",
    notes: null,
    body_type: null,
    branch_id: null,
    category: null,
    chassis_number: null,
    country_of_origin: null,
    drivetrain: null,
    engine: null,
    fuel_type: null,
    height: null,
    import_date: null,
    inspection_notes: null,
    last_service_branch_id: null,
    last_visit_at: null,
    last_visit_date: null,
    length: null,
    license_expiry: null,
    license_expiry_at: null,
    next_service_at: null,
    next_service_date: null,
    odometer: null,
    seats: null,
    created_by: null,
    updated_by: null,
  };

  it("returns vehicle detail on success", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: sampleVehicle }),
    } as Response);

    const { result } = renderHook(() => useVehicle("org-1", "veh-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(sampleVehicle);
  });

  it("does not fetch when orgId is missing", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(() => useVehicle(undefined, "veh-1"), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("does not fetch when vehicleId is missing", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(() => useVehicle("org-1", undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("handles fetch error", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ error: { message: "Vehicle not found" } }),
    } as Response);

    const { result } = renderHook(() => useVehicle("org-1", "veh-999"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeDefined();
  });
});

describe("vehicleKeys", () => {
  it("constructs correct key shapes", () => {
    expect(vehicleKeys.all("org-1")).toEqual([
      "organizations",
      "org-1",
      "vehicles",
    ]);
    expect(vehicleKeys.list("org-1")).toEqual([
      "organizations",
      "org-1",
      "vehicles",
      "list",
      "",
      "all",
    ]);
    expect(vehicleKeys.list("org-1", "XYZ")).toEqual([
      "organizations",
      "org-1",
      "vehicles",
      "list",
      "XYZ",
      "all",
    ]);
    expect(vehicleKeys.list("org-1", "", "branch-42")).toEqual([
      "organizations",
      "org-1",
      "vehicles",
      "list",
      "",
      "branch-42",
    ]);
    expect(vehicleKeys.detail("org-1", "veh-1")).toEqual([
      "organizations",
      "org-1",
      "vehicles",
      "detail",
      "veh-1",
    ]);
  });
});
