import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { workOrderKeys } from "../keys";
import type { WorkOrderListItem } from "../use-work-orders";
import { useWorkOrders } from "../use-work-orders";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

function createWrapper() {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

const sampleWorkOrders: WorkOrderListItem[] = [
  {
    id: "wo-1",
    status: "In Progress",
    created_at: "2024-03-01T10:00:00Z",
    mechanic_id: "mech-1",
    mechanic: { id: "mech-1", full_name: "Bob", avatar_url: null },
    customer: { first_name: "Alice", last_name: null },
    vehicle: { plate_number: "XYZ-123", make: "Toyota", model: "Camry" },
    grand_total: 25000,
    services_cost: 10000,
    parts_cost: 15000,
  },
  {
    id: "wo-2",
    status: "New",
    created_at: "2024-03-02T09:00:00Z",
    mechanic_id: null,
    mechanic: null,
    customer: { first_name: "Charlie", last_name: "Brown" },
    vehicle: { plate_number: "ABC-456", make: "Honda", model: "Civic" },
  },
];

describe("useWorkOrders", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  it("returns work orders on success", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: sampleWorkOrders }),
    } as Response);

    const { result } = renderHook(() => useWorkOrders("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(sampleWorkOrders);
  });

  it("passes status filter param", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: sampleWorkOrders }),
    } as Response);

    renderHook(() => useWorkOrders("org-1", "In Progress"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(fetchSpy).toHaveBeenCalled());
    const url = fetchSpy.mock.calls[0][0] as string;
    expect(new URL(url, "http://localhost").searchParams.get("status")).toBe(
      "In Progress",
    );
  });

  it("passes search query param", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    } as Response);

    renderHook(() => useWorkOrders("org-1", "", "Alice"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(fetchSpy).toHaveBeenCalled());
    const url = fetchSpy.mock.calls[0][0] as string;
    expect(url).toContain("q=Alice");
  });

  it("passes branch_id param when branchId is provided", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: sampleWorkOrders }),
    } as Response);

    renderHook(() => useWorkOrders("org-1", "", "", "branch-42"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(fetchSpy).toHaveBeenCalled());
    const url = fetchSpy.mock.calls[0][0] as string;
    expect(url).toContain("branch_id=branch-42");
  });

  it("does not fetch when orgId is missing", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(() => useWorkOrders(undefined), {
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

    const { result } = renderHook(() => useWorkOrders("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeDefined();
  });

  it("handles network failure", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useWorkOrders("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("Network error");
  });
});

describe("workOrderKeys", () => {
  it("constructs correct key shapes", () => {
    expect(workOrderKeys.all("org-1")).toEqual([
      "organizations",
      "org-1",
      "work-orders",
    ]);
    expect(workOrderKeys.list("org-1")).toEqual([
      "organizations",
      "org-1",
      "work-orders",
      "list",
      "All",
    ]);
    expect(workOrderKeys.list("org-1", "In Progress")).toEqual([
      "organizations",
      "org-1",
      "work-orders",
      "list",
      "In Progress",
    ]);
    expect(workOrderKeys.detail("org-1", "wo-1")).toEqual([
      "organizations",
      "org-1",
      "work-orders",
      "detail",
      "wo-1",
    ]);
  });
});
