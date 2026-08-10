import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DisplayWorkOrder } from "@/app/api/organizations/[id]/display/work-orders/route";
import { useWorkshopDisplay } from "../use-workshop-display";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

function createWrapper() {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

function mockFetchResponse(data: unknown) {
  return vi.spyOn(global, "fetch").mockResolvedValue({
    ok: true,
    json: async () => ({ data }),
  } as Response);
}

function mockFetchError(message: string) {
  return vi.spyOn(global, "fetch").mockResolvedValue({
    ok: true,
    json: async () => ({ error: { message } }),
  } as Response);
}

const sampleWorkOrder: DisplayWorkOrder = {
  id: "wo-1",
  status: "In Progress",
  created_at: "2025-03-01T08:00:00Z",
  started_at: "2025-03-01T08:30:00Z",
  status_changed_at: "2025-03-01T08:30:00Z",
  customer_name: "John Doe",
  plate_number: "1234ABC",
  vehicle_make: "Toyota",
  vehicle_model: "Camry",
  mechanic_name: "Jane Smith",
  services: [{ name: "Oil change" }],
  complaint: "Engine noise",
};

describe("useWorkshopDisplay", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  it("returns display work orders on success", async () => {
    const fetchSpy = mockFetchResponse([sampleWorkOrder]);

    const { result } = renderHook(() => useWorkshopDisplay("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([sampleWorkOrder]);
    expect(fetchSpy.mock.calls[0][0]).toBe(
      "/api/organizations/org-1/display/work-orders",
    );
  });

  it("does not fetch when orgId is missing", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(() => useWorkshopDisplay(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("surfaces API errors", async () => {
    mockFetchError("Failed to load work-orders");

    const { result } = renderHook(() => useWorkshopDisplay("org-1"), {
      wrapper: createWrapper(),
    });

    // The hook sets retry: 2, so the query retries with backoff before erroring.
    await waitFor(() => expect(result.current.isError).toBe(true), {
      timeout: 6_000,
    });
    expect(result.current.error?.message).toBe("Failed to load work-orders");
  });
});
