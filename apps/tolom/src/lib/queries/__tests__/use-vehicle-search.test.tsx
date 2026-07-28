import { searchVehiclesWithCustomers } from "@/lib/services/bay-view-actions";

vi.mock("@/lib/services/bay-view-actions", () => ({
  searchVehiclesWithCustomers: vi.fn(),
}));

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useVehicleSearch } from "../use-vehicle-search";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

function createWrapper() {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("useVehicleSearch", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
    vi.mocked(searchVehiclesWithCustomers).mockClear();
  });

  it("returns vehicle search results on success", async () => {
    const results = [
      {
        id: "v-1",
        plate_number: "ABC-123",
        make: "Toyota",
        model: "Camry",
        year: 2020,
        color: "Silver",
        customer: {
          id: "c-1",
          first_name: "John",
          last_name: "Doe",
          phone: "555-0100",
        },
      },
    ];

    vi.mocked(searchVehiclesWithCustomers).mockResolvedValue(results);

    const { result } = renderHook(() => useVehicleSearch("ABC"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(results);
  });

  it("does not fetch when search is empty", async () => {
    const { result } = renderHook(() => useVehicleSearch(""), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
    expect(searchVehiclesWithCustomers).not.toHaveBeenCalled();
  });

  it("handles fetch error", async () => {
    vi.mocked(searchVehiclesWithCustomers).mockRejectedValue(
      new Error("Network error"),
    );

    const { result } = renderHook(() => useVehicleSearch("ABC"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it("respects enabled option", async () => {
    const { result } = renderHook(
      () => useVehicleSearch("ABC", { enabled: false }),
      { wrapper: createWrapper() },
    );

    expect(result.current.isPending).toBe(true);
    expect(searchVehiclesWithCustomers).not.toHaveBeenCalled();
  });
});
