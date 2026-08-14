import {
  QueryClient,
  QueryClientProvider,
  type UseQueryResult,
} from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/queries/use-wizard-data", () => ({
  useVehicleSearch: vi.fn(),
}));

import { useVehicleSearch } from "@/lib/queries/use-wizard-data";
import type { Vehicle } from "@/lib/types";
import { useVehicleSelection } from "../use-vehicle-selection";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

function createWrapper() {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

const mockVehicle: Vehicle = {
  id: "v-1",
  organization_id: "org-1",
  customer_id: "c-1",
  plate_number: "ABC-123",
  make: "Toyota",
  model: "Camry",
  year: 2020,
  color: "Silver",
  vin: "1HGCM82633A123456",
  body_type: null,
  branch_id: null,
  chassis_number: null,
  created_at: "2024-01-01T00:00:00Z",
  created_by: null,
  deleted_at: null,
  drivetrain: null,
  engine: null,
  fuel_type: null,
  height: null,
  inspection_notes: null,
  last_service_branch_id: null,
  last_visit_at: null,
  last_visit_date: null,
  length: null,
  license_expiry: null,
  license_expiry_at: null,
  next_service_at: null,
  next_service_date: null,
  notes: null,
  odometer: null,
  tags: null,
  transmission: null,
  trim: null,
  updated_at: "2024-01-01T00:00:00Z",
  updated_by: null,
  weight: null,
  width: null,
};

describe("useVehicleSelection", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.clearAllMocks();
  });

  it("returns initial state with empty search, no vehicles, no selected", () => {
    vi.mocked(useVehicleSearch).mockReturnValue({
      data: undefined,
      isFetching: false,
    } as UseQueryResult<Vehicle[], Error>);

    const { result } = renderHook(
      () => useVehicleSelection("org-1", undefined),
      { wrapper: createWrapper() },
    );

    expect(result.current.vehicleSearch).toBe("");
    expect(result.current.vehicles).toEqual([]);
    expect(result.current.selectedVehicle).toBeNull();
    expect(result.current.showQuickVehicle).toBe(false);
    expect(result.current.vehicleSearching).toBe(false);
  });

  it("populates vehicles from search results when both search and customerId exist", () => {
    vi.mocked(useVehicleSearch).mockReturnValue({
      data: [mockVehicle],
      isFetching: false,
    } as UseQueryResult<Vehicle[], Error>);

    const { result } = renderHook(() => useVehicleSelection("org-1", "c-1"), {
      wrapper: createWrapper(),
    });

    expect(result.current.vehicles).toEqual([mockVehicle]);
    expect(result.current.vehicleSearch).toBe("");
    expect(result.current.selectedVehicle).toBeNull();
  });

  it("clears vehicles when search is empty and customerId is removed", () => {
    vi.mocked(useVehicleSearch).mockReturnValue({
      data: undefined,
      isFetching: false,
    } as UseQueryResult<Vehicle[], Error>);

    const { result, rerender } = renderHook(
      ({ orgId, customerId }: { orgId?: string; customerId?: string }) =>
        useVehicleSelection(orgId, customerId),
      {
        wrapper: createWrapper(),
        initialProps: { orgId: "org-1", customerId: "c-1" },
      },
    );

    // Populate vehicles via the exposed setter
    act(() => {
      result.current.setVehicles([mockVehicle]);
    });

    expect(result.current.vehicles).toEqual([mockVehicle]);

    // Remove customerId — effect should clear vehicles
    rerender({ orgId: "org-1", customerId: undefined });

    expect(result.current.vehicles).toEqual([]);
  });

  it("handleSelectVehicle selects the vehicle and resets search/quick state", () => {
    vi.mocked(useVehicleSearch).mockReturnValue({
      data: [mockVehicle],
      isFetching: false,
    } as UseQueryResult<Vehicle[], Error>);

    const { result } = renderHook(() => useVehicleSelection("org-1", "c-1"), {
      wrapper: createWrapper(),
    });

    // Setup non-default search and quick-vehicle state
    act(() => {
      result.current.setVehicleSearch("ABC");
      result.current.setShowQuickVehicle(true);
    });

    act(() => {
      result.current.handleSelectVehicle(mockVehicle);
    });

    expect(result.current.selectedVehicle).toEqual(mockVehicle);
    expect(result.current.vehicleSearch).toBe("");
    expect(result.current.showQuickVehicle).toBe(false);
  });

  it("reflects loading state via vehicleSearching", () => {
    vi.mocked(useVehicleSearch).mockReturnValue({
      data: undefined,
      isFetching: true,
    } as UseQueryResult<Vehicle[], Error>);

    const { result } = renderHook(() => useVehicleSelection("org-1", "c-1"), {
      wrapper: createWrapper(),
    });

    expect(result.current.vehicleSearching).toBe(true);
  });

  it("does not crash when orgId is undefined", () => {
    vi.mocked(useVehicleSearch).mockReturnValue({
      data: undefined,
      isFetching: false,
    } as UseQueryResult<Vehicle[], Error>);

    const { result } = renderHook(() => useVehicleSelection(undefined, "c-1"), {
      wrapper: createWrapper(),
    });

    expect(result.current.vehicleSearch).toBe("");
    expect(result.current.vehicles).toEqual([]);
    expect(result.current.selectedVehicle).toBeNull();
    expect(result.current.vehicleSearching).toBe(false);
  });
});
