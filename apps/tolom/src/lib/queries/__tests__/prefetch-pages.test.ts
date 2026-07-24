import type { SupabaseClient } from "@supabase/supabase-js";
import { QueryClient } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { inventoryKeys, workOrderKeys } from "../keys";

vi.mock("@/lib/services/work-order-service", () => ({
  getWorkOrders: vi.fn(),
}));

import { getWorkOrders } from "@/lib/services/work-order-service";

vi.mock("@/lib/services/inventory-service", () => ({
  getPartsCatalog: vi.fn(),
}));

import { getPartsCatalog } from "@/lib/services/inventory-service";

const mockSupabase = {} as unknown as SupabaseClient;

const mockWorkOrders = [
  {
    id: "wo-1",
    status: "in_progress",
    created_at: "2026-07-22T10:00:00Z",
    mechanic_id: "m-1",
    mechanic: { id: "m-1", full_name: "John", avatar_url: null },
    customer: { first_name: "Alice", last_name: "Smith" },
    vehicle: { plate_number: "ABC123", make: "Toyota", model: "Camry" },
    grand_total: 5000,
    services_cost: 2000,
    parts_cost: 1000,
    services_revenue: 2500,
    parts_revenue: 1500,
    gross_profit: 1000,
    margin_percent: 20,
    loss_reason: null,
  },
];

const mockPartsCatalog = [
  {
    id: "p-1",
    organization_id: "org-1",
    name: "Oil Filter",
    name_mn: "Тосны шүүлтүүр",
    part_number: "OF-001",
    category: "Filters",
    unit: "pcs",
    default_price: 15000,
    is_active: true,
    purchase_price: 10000,
    image_url: null,
    location: "A-12",
    created_at: "2026-01-01T00:00:00Z",
    deleted_at: null,
    global_part_id: null,
    popularity: null,
  },
];

describe("prefetchWorkOrders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("seeds work order list cache with correct key", async () => {
    vi.mocked(getWorkOrders).mockResolvedValue(mockWorkOrders as never);
    const { prefetchWorkOrders } = await import("../prefetch-pages");
    const queryClient = new QueryClient();

    await prefetchWorkOrders(mockSupabase, queryClient, "org-1");

    expect(getWorkOrders).toHaveBeenCalledWith(mockSupabase, "org-1");
    const expectedKey = [...workOrderKeys.list("org-1"), "", "all"];
    expect(queryClient.getQueryData(expectedKey)).toEqual(mockWorkOrders);
  });

  it("does not throw when getWorkOrders fails", async () => {
    vi.mocked(getWorkOrders).mockRejectedValue(new Error("DB error"));
    const { prefetchWorkOrders } = await import("../prefetch-pages");
    const queryClient = new QueryClient();

    await expect(
      prefetchWorkOrders(mockSupabase, queryClient, "org-1"),
    ).resolves.toBeUndefined();

    const expectedKey = [...workOrderKeys.list("org-1"), "", "all"];
    expect(queryClient.getQueryData(expectedKey)).toBeUndefined();
  });
});

describe("prefetchInventory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("seeds parts catalog cache with correct key", async () => {
    vi.mocked(getPartsCatalog).mockResolvedValue(mockPartsCatalog as never);
    const { prefetchInventory } = await import("../prefetch-pages");
    const queryClient = new QueryClient();

    await prefetchInventory(mockSupabase, queryClient, "org-1");

    expect(getPartsCatalog).toHaveBeenCalledWith(mockSupabase, "org-1");
    expect(queryClient.getQueryData(inventoryKeys.parts("org-1"))).toEqual(
      mockPartsCatalog,
    );
  });

  it("does not throw when getPartsCatalog fails", async () => {
    vi.mocked(getPartsCatalog).mockRejectedValue(new Error("DB error"));
    const { prefetchInventory } = await import("../prefetch-pages");
    const queryClient = new QueryClient();

    await expect(
      prefetchInventory(mockSupabase, queryClient, "org-1"),
    ).resolves.toBeUndefined();

    expect(
      queryClient.getQueryData(inventoryKeys.parts("org-1")),
    ).toBeUndefined();
  });
});

describe("key matching", () => {
  it("work order keys match what useWorkOrders produces", () => {
    const key = [...workOrderKeys.list("org-1", ""), "", "all"];
    expect(key).toEqual([
      "organizations",
      "org-1",
      "work-orders",
      "list",
      "",
      "",
      "all",
    ]);
  });

  it("inventory parts keys match what usePartsCatalog produces", () => {
    expect(inventoryKeys.parts("org-1")).toEqual([
      "organizations",
      "org-1",
      "inventory",
      "parts",
    ]);
  });
});
