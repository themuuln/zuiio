import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { inventoryKeys } from "../keys";
import {
  useAddPartsCarPart,
  useCompleteDisassembly,
  useCreateMovement,
  useCreatePartCategory,
  useCreatePartsCar,
  useCreatePurchaseOrder,
  useCreateSupplier,
  useDeletePart,
  useDeletePartsCar,
  useDeleteSupplier,
  useGlobalPartsCatalog,
  useInventoryBalances,
  useInventoryMovements,
  useInventoryTurnover,
  usePartCategories,
  usePartsCar,
  usePartsCarParts,
  usePartsCars,
  usePartsCatalog,
  usePublishPartsCarToCatalog,
  usePurchaseOrderItems,
  usePurchaseOrders,
  useReceiveByBarcode,
  useReceivePurchaseOrder,
  useRemovePartsCarPart,
  useSlowMovingStock,
  useStartDisassembly,
  useStockThresholds,
  useSupplierPriceHistory,
  useSuppliers,
  useUpdatePart,
  useUpdatePartsCar,
  useUpdatePurchaseOrder,
  useUpdateSupplier,
  useUsageTrends,
  useVehicleModelParts,
} from "../use-inventory";

// useOrgMutation (used by mutation hooks) depends on useMutationQueue
vi.mock("@/lib/offline/mutation-queue-provider", () => ({
  useMutationQueue: () => ({ enqueue: vi.fn() }),
  MutationQueueProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

function createWrapper() {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

const samplePartsCatalog = [
  { id: "part-1", name: "Oil Filter", part_number: "OF-101", stock: 50 },
  { id: "part-2", name: "Brake Pad", part_number: "BP-202", stock: 30 },
];

const sampleInventoryBalances = [
  { part_id: "part-1", part_name: "Oil Filter", quantity: 50, avg_cost: 15000 },
  { part_id: "part-2", part_name: "Brake Pad", quantity: 30, avg_cost: 45000 },
];

const sampleInventoryMovements = [
  {
    id: "mov-1",
    part_id: "part-1",
    movement_type: "in",
    quantity: 10,
    created_at: "2024-03-01T10:00:00Z",
  },
  {
    id: "mov-2",
    part_id: "part-2",
    movement_type: "out",
    quantity: 5,
    created_at: "2024-03-02T09:00:00Z",
  },
];

const sampleSuppliers = [
  { id: "sup-1", name: "Auto Parts Co", phone: "976-99110001" },
  { id: "sup-2", name: "Mongolia Spares", phone: "976-99110002" },
];

const samplePurchaseOrders = [
  {
    id: "po-1",
    supplier_id: "sup-1",
    status: "pending",
    total: 150000,
    supplier: { name: "Auto Parts Co" },
  },
  {
    id: "po-2",
    supplier_id: "sup-2",
    status: "received",
    total: 300000,
    supplier: { name: "Mongolia Spares" },
  },
];

const samplePurchaseOrderItems = [
  {
    id: "poi-1",
    part_id: "part-1",
    quantity: 10,
    unit_cost: 15000,
    part_name: "Oil Filter",
  },
  {
    id: "poi-2",
    part_id: "part-2",
    quantity: 5,
    unit_cost: 45000,
    part_name: "Brake Pad",
  },
];

const sampleStockThresholds = [
  { part_id: "part-1", min_quantity: 10, max_quantity: 100 },
  { part_id: "part-2", min_quantity: 5, max_quantity: 50 },
];

const samplePartCategories = [
  { id: "cat-1", name: "Engine Parts" },
  { id: "cat-2", name: "Brake System" },
];

const sampleGlobalPartsCatalog = [
  {
    id: "gp-1",
    name: "Oil Filter",
    part_number: "OF-101",
    manufacturer: "Toyota",
  },
  {
    id: "gp-2",
    name: "Brake Pad",
    part_number: "BP-202",
    manufacturer: "Honda",
  },
];

const samplePartsCars = [
  {
    id: "car-1",
    make: "Toyota",
    model: "Camry",
    year: 2020,
    vin: "VIN001",
    status: "pending",
  },
  {
    id: "car-2",
    make: "Honda",
    model: "Accord",
    year: 2021,
    vin: "VIN002",
    status: "disassembling",
  },
];

const samplePartsCar = {
  id: "car-1",
  make: "Toyota",
  model: "Camry",
  year: 2020,
  vin: "VIN001",
  status: "pending",
};

const samplePartsCarParts = [
  {
    id: "pcp-1",
    car_id: "car-1",
    name: "Engine Block",
    quantity: 1,
    condition: "good",
  },
  {
    id: "pcp-2",
    car_id: "car-1",
    name: "Transmission",
    quantity: 1,
    condition: "used",
  },
];

const sampleInventoryTurnover = {
  period: "2024-Q1",
  turnover_rate: 2.5,
  total_usage: 150,
  average_stock: 60,
};

const sampleUsageTrends = [
  {
    month: "2024-01",
    part_id: "part-1",
    quantity: 10,
    part_name: "Oil Filter",
  },
  { month: "2024-02", part_id: "part-1", quantity: 8, part_name: "Oil Filter" },
];

const sampleSlowMovingStock = [
  {
    part_id: "part-2",
    part_name: "Brake Pad",
    stock: 30,
    monthly_usage: 2,
    months_of_stock: 15,
  },
  {
    part_id: "part-3",
    part_name: "Fuel Pump",
    stock: 5,
    monthly_usage: 1,
    months_of_stock: 5,
  },
];

const sampleVehicleModelParts = [
  { model_id: "model-1", model_name: "Camry", make: "Toyota", year: 2020 },
  { model_id: "model-2", model_name: "RAV4", make: "Toyota", year: 2021 },
];

const sampleSupplierPriceHistory = [
  {
    id: "ph-1",
    supplier_id: "sup-1",
    part_id: "part-1",
    unit_cost: 15000,
    currency: "MNT",
    purchased_at: "2024-01-15",
  },
  {
    id: "ph-2",
    supplier_id: "sup-1",
    part_id: "part-1",
    unit_cost: 14500,
    currency: "MNT",
    purchased_at: "2024-03-01",
  },
];

describe("usePartsCatalog", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  it("returns parts catalog on success", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: { data: samplePartsCatalog } }),
    } as Response);

    const { result } = renderHook(() => usePartsCatalog("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(samplePartsCatalog);
  });

  it("does not fetch when orgId is missing", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(() => usePartsCatalog(undefined), {
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

    const { result } = renderHook(() => usePartsCatalog("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeDefined();
  });
});

describe("useInventoryBalances", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  it("returns inventory balances on success", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: { data: sampleInventoryBalances } }),
    } as Response);

    const { result } = renderHook(() => useInventoryBalances("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(sampleInventoryBalances);
  });

  it("passes branch_id param when branchId is provided", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: { data: [] } }),
    } as Response);

    renderHook(() => useInventoryBalances("org-1", "branch-42"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(fetchSpy).toHaveBeenCalled());
    const url = fetchSpy.mock.calls[0][0] as string;
    expect(url).toContain("branch_id=branch-42");
  });

  it("does not fetch when orgId is missing", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(() => useInventoryBalances(undefined), {
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

    const { result } = renderHook(() => useInventoryBalances("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeDefined();
  });
});

describe("useInventoryMovements", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  it("returns inventory movements on success", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: { data: sampleInventoryMovements } }),
    } as Response);

    const { result } = renderHook(() => useInventoryMovements("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(sampleInventoryMovements);
  });

  it("passes movement_type param when type is provided", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: { data: [] } }),
    } as Response);

    renderHook(() => useInventoryMovements("org-1", "in"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(fetchSpy).toHaveBeenCalled());
    const url = fetchSpy.mock.calls[0][0] as string;
    expect(url).toContain("movement_type=in");
  });

  it("passes branch_id param when branchId is provided", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: { data: [] } }),
    } as Response);

    renderHook(() => useInventoryMovements("org-1", "", "branch-42"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(fetchSpy).toHaveBeenCalled());
    const url = fetchSpy.mock.calls[0][0] as string;
    expect(url).toContain("branch_id=branch-42");
  });

  it("does not fetch when orgId is missing", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(() => useInventoryMovements(undefined), {
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

    const { result } = renderHook(() => useInventoryMovements("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeDefined();
  });
});

describe("useSuppliers", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  it("returns suppliers on success", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: { data: sampleSuppliers } }),
    } as Response);

    const { result } = renderHook(() => useSuppliers("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(sampleSuppliers);
  });

  it("does not fetch when orgId is missing", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(() => useSuppliers(undefined), {
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

    const { result } = renderHook(() => useSuppliers("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeDefined();
  });
});

describe("usePurchaseOrders", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  it("returns purchase orders on success", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: { data: samplePurchaseOrders } }),
    } as Response);

    const { result } = renderHook(() => usePurchaseOrders("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(samplePurchaseOrders);
  });

  it("passes branch_id param when branchId is provided", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: { data: [] } }),
    } as Response);

    renderHook(() => usePurchaseOrders("org-1", "branch-42"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(fetchSpy).toHaveBeenCalled());
    const url = fetchSpy.mock.calls[0][0] as string;
    expect(url).toContain("branch_id=branch-42");
  });

  it("does not fetch when orgId is missing", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(() => usePurchaseOrders(undefined), {
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

    const { result } = renderHook(() => usePurchaseOrders("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeDefined();
  });
});

describe("usePurchaseOrderItems", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  it("returns purchase order items on success", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: { data: samplePurchaseOrderItems } }),
    } as Response);

    const { result } = renderHook(
      () => usePurchaseOrderItems("org-1", "po-1"),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(samplePurchaseOrderItems);
  });

  it("does not fetch when orgId is missing", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(
      () => usePurchaseOrderItems(undefined, "po-1"),
      { wrapper: createWrapper() },
    );

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("does not fetch when poId is missing", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(
      () => usePurchaseOrderItems("org-1", undefined),
      { wrapper: createWrapper() },
    );

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("handles fetch error", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ error: { message: "PO not found" } }),
    } as Response);

    const { result } = renderHook(
      () => usePurchaseOrderItems("org-1", "po-999"),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeDefined();
  });
});

describe("useStockThresholds", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  it("returns stock thresholds on success", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: { data: sampleStockThresholds } }),
    } as Response);

    const { result } = renderHook(() => useStockThresholds("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(sampleStockThresholds);
  });

  it("does not fetch when orgId is missing", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(() => useStockThresholds(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe("usePartCategories", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  it("returns part categories on success", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: samplePartCategories }),
    } as Response);

    const { result } = renderHook(() => usePartCategories("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(samplePartCategories);
  });

  it("does not fetch when orgId is missing", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(() => usePartCategories(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("handles API error with error field", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ error: { message: "Forbidden" } }),
    } as Response);

    const { result } = renderHook(() => usePartCategories("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("Forbidden");
  });

  it("handles fetch error", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: { message: "Server error" } }),
    } as Response);

    const { result } = renderHook(() => usePartCategories("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeDefined();
  });
});

describe("inventoryKeys", () => {
  it("constructs correct key shapes", () => {
    expect(inventoryKeys.all("org-1")).toEqual([
      "organizations",
      "org-1",
      "inventory",
    ]);
    expect(inventoryKeys.parts("org-1")).toEqual([
      "organizations",
      "org-1",
      "inventory",
      "parts",
    ]);
    expect(inventoryKeys.balances("org-1")).toEqual([
      "organizations",
      "org-1",
      "inventory",
      "balances",
    ]);
    expect(inventoryKeys.movements("org-1")).toEqual([
      "organizations",
      "org-1",
      "inventory",
      "movements",
    ]);
    expect(inventoryKeys.suppliers("org-1")).toEqual([
      "organizations",
      "org-1",
      "inventory",
      "suppliers",
    ]);
    expect(inventoryKeys.purchaseOrders("org-1")).toEqual([
      "organizations",
      "org-1",
      "inventory",
      "purchase-orders",
    ]);
    expect(inventoryKeys.purchaseOrderItems("po-1")).toEqual([
      "purchase-order-items",
      "po-1",
    ]);
    expect(inventoryKeys.thresholds("org-1")).toEqual([
      "organizations",
      "org-1",
      "inventory",
      "thresholds",
    ]);
    expect(inventoryKeys.categories("org-1")).toEqual([
      "organizations",
      "org-1",
      "inventory",
      "part-categories",
    ]);
  });
});

describe("useGlobalPartsCatalog", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  it("returns global parts catalog on success", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: sampleGlobalPartsCatalog }),
    } as Response);

    const { result } = renderHook(() => useGlobalPartsCatalog(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(sampleGlobalPartsCatalog);
  });

  it("handles fetch error", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ error: { message: "Catalog unavailable" } }),
    } as Response);

    const { result } = renderHook(() => useGlobalPartsCatalog(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("Catalog unavailable");
  });
});

describe("usePartsCars", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  it("returns parts cars on success", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { data: samplePartsCars } }),
    } as Response);

    const { result } = renderHook(() => usePartsCars("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(samplePartsCars);
  });

  it("does not fetch when orgId is missing", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(() => usePartsCars(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("handles fetch error", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: { message: "Server error" } }),
    } as Response);

    const { result } = renderHook(() => usePartsCars("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeDefined();
  });
});

describe("usePartsCar", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  it("returns parts car on success", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: samplePartsCar }),
    } as Response);

    const { result } = renderHook(() => usePartsCar("org-1", "car-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(samplePartsCar);
  });

  it("does not fetch when orgId is missing", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(() => usePartsCar(undefined, "car-1"), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("does not fetch when carId is missing", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(() => usePartsCar("org-1", undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("handles fetch error", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: { message: "Server error" } }),
    } as Response);

    const { result } = renderHook(() => usePartsCar("org-1", "car-999"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeDefined();
  });
});

describe("usePartsCarParts", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  it("returns parts car parts on success", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { data: samplePartsCarParts } }),
    } as Response);

    const { result } = renderHook(() => usePartsCarParts("org-1", "car-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(samplePartsCarParts);
  });

  it("does not fetch when orgId is missing", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(() => usePartsCarParts(undefined, "car-1"), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("does not fetch when carId is missing", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(() => usePartsCarParts("org-1", undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("handles fetch error", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: { message: "Server error" } }),
    } as Response);

    const { result } = renderHook(() => usePartsCarParts("org-1", "car-999"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeDefined();
  });
});

describe("useInventoryTurnover", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  it("returns inventory turnover on success", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: sampleInventoryTurnover }),
    } as Response);

    const { result } = renderHook(() => useInventoryTurnover("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(sampleInventoryTurnover);
  });

  it("does not fetch when orgId is missing", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(() => useInventoryTurnover(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("handles fetch error", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: { message: "Server error" } }),
    } as Response);

    const { result } = renderHook(() => useInventoryTurnover("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeDefined();
  });
});

describe("useUsageTrends", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  it("returns usage trends on success", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: sampleUsageTrends }),
    } as Response);

    const { result } = renderHook(() => useUsageTrends("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(sampleUsageTrends);
  });

  it("does not fetch when orgId is missing", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(() => useUsageTrends(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("handles fetch error", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: { message: "Server error" } }),
    } as Response);

    const { result } = renderHook(() => useUsageTrends("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeDefined();
  });
});

describe("useSlowMovingStock", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  it("returns slow moving stock on success", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: sampleSlowMovingStock }),
    } as Response);

    const { result } = renderHook(() => useSlowMovingStock("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(sampleSlowMovingStock);
  });

  it("does not fetch when orgId is missing", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(() => useSlowMovingStock(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("handles fetch error", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: { message: "Server error" } }),
    } as Response);

    const { result } = renderHook(() => useSlowMovingStock("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeDefined();
  });
});

describe("useVehicleModelParts", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  it("returns vehicle model parts on success", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: sampleVehicleModelParts }),
    } as Response);

    const { result } = renderHook(
      () => useVehicleModelParts("org-1", "part-1"),
      {
        wrapper: createWrapper(),
      },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(sampleVehicleModelParts);
  });

  it("does not fetch when orgId is missing", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(
      () => useVehicleModelParts(undefined, "part-1"),
      {
        wrapper: createWrapper(),
      },
    );

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("does not fetch when partId is missing", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(
      () => useVehicleModelParts("org-1", undefined),
      {
        wrapper: createWrapper(),
      },
    );

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("handles fetch error", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: { message: "Server error" } }),
    } as Response);

    const { result } = renderHook(
      () => useVehicleModelParts("org-1", "part-999"),
      {
        wrapper: createWrapper(),
      },
    );

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeDefined();
  });
});

describe("useSupplierPriceHistory", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  it("returns supplier price history on success", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: sampleSupplierPriceHistory }),
    } as Response);

    const { result } = renderHook(
      () => useSupplierPriceHistory("org-1", "part-1"),
      {
        wrapper: createWrapper(),
      },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(sampleSupplierPriceHistory);
  });

  it("does not fetch when orgId is missing", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(
      () => useSupplierPriceHistory(undefined, "part-1"),
      {
        wrapper: createWrapper(),
      },
    );

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("does not fetch when partId is missing", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(
      () => useSupplierPriceHistory("org-1", undefined),
      {
        wrapper: createWrapper(),
      },
    );

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("handles fetch error", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: { message: "Server error" } }),
    } as Response);

    const { result } = renderHook(
      () => useSupplierPriceHistory("org-1", "part-999"),
      {
        wrapper: createWrapper(),
      },
    );

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeDefined();
  });
});

describe("useCreatePartCategory", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  it("creates part category successfully", async () => {
    const result = { id: "cat-new", name: "New Category" };
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: result }),
    } as Response);

    const { result: hookResult } = renderHook(
      () => useCreatePartCategory("org-1"),
      { wrapper: createWrapper() },
    );

    const response = await hookResult.current.mutateAsync("Suspension Parts");
    expect(response).toEqual(result);
  });

  it("handles mutation error", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: { message: "Invalid category" } }),
    } as Response);

    const { result: hookResult } = renderHook(
      () => useCreatePartCategory("org-1"),
      { wrapper: createWrapper() },
    );

    await expect(
      hookResult.current.mutateAsync("Suspension Parts"),
    ).rejects.toThrow();
  });
});

describe("useCreateMovement", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  it("creates movement successfully", async () => {
    const result = {
      id: "mov-new",
      part_id: "part-1",
      movement_type: "in",
      quantity: 10,
    };
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: result }),
    } as Response);

    const { result: hookResult } = renderHook(
      () => useCreateMovement("org-1"),
      { wrapper: createWrapper() },
    );

    const response = await hookResult.current.mutateAsync({
      part_id: "part-1",
      quantity: 10,
      movement_type: "in",
    });
    expect(response).toEqual(result);
  });

  it("handles mutation error", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: { message: "Insufficient stock" } }),
    } as Response);

    const { result: hookResult } = renderHook(
      () => useCreateMovement("org-1"),
      { wrapper: createWrapper() },
    );

    await expect(
      hookResult.current.mutateAsync({
        part_id: "part-1",
        quantity: 10,
        movement_type: "in",
      }),
    ).rejects.toThrow();
  });
});

describe("useCreateSupplier", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  it("creates supplier successfully", async () => {
    const result = {
      id: "sup-new",
      name: "New Supplier",
      is_active: true,
    };
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: result }),
    } as Response);

    const { result: hookResult } = renderHook(
      () => useCreateSupplier("org-1"),
      { wrapper: createWrapper() },
    );

    const response = await hookResult.current.mutateAsync({
      name: "New Supplier",
      phone: "976-99110099",
    });
    expect(response).toEqual(result);
  });

  it("handles mutation error", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: { message: "Validation error" } }),
    } as Response);

    const { result: hookResult } = renderHook(
      () => useCreateSupplier("org-1"),
      { wrapper: createWrapper() },
    );

    await expect(
      hookResult.current.mutateAsync({ name: "" }),
    ).rejects.toThrow();
  });
});

describe("useUpdateSupplier", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  it("updates supplier successfully", async () => {
    const result = { id: "sup-1", name: "Updated Co" };
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: result }),
    } as Response);

    const { result: hookResult } = renderHook(
      () => useUpdateSupplier("org-1"),
      { wrapper: createWrapper() },
    );

    const response = await hookResult.current.mutateAsync({
      id: "sup-1",
      body: { name: "Updated Co" },
    });
    expect(response).toEqual(result);
  });

  it("handles mutation error", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ error: { message: "Supplier not found" } }),
    } as Response);

    const { result: hookResult } = renderHook(
      () => useUpdateSupplier("org-1"),
      { wrapper: createWrapper() },
    );

    await expect(
      hookResult.current.mutateAsync({
        id: "sup-999",
        body: { name: "Nope" },
      }),
    ).rejects.toThrow();
  });
});

describe("useDeleteSupplier", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  it("deletes supplier successfully", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { id: "sup-1" } }),
    } as Response);

    const { result: hookResult } = renderHook(
      () => useDeleteSupplier("org-1"),
      { wrapper: createWrapper() },
    );

    const response = await hookResult.current.mutateAsync("sup-1");
    expect(response).toEqual({ id: "sup-1" });
  });

  it("handles mutation error", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ error: { message: "Supplier not found" } }),
    } as Response);

    const { result: hookResult } = renderHook(
      () => useDeleteSupplier("org-1"),
      { wrapper: createWrapper() },
    );

    await expect(hookResult.current.mutateAsync("sup-999")).rejects.toThrow();
  });
});

describe("useUpdatePart", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  it("updates part successfully", async () => {
    const result = { id: "part-1", name: "Updated Filter", stock: 50 };
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: result }),
    } as Response);

    const { result: hookResult } = renderHook(() => useUpdatePart("org-1"), {
      wrapper: createWrapper(),
    });

    const response = await hookResult.current.mutateAsync({
      id: "part-1",
      body: { name: "Updated Filter" },
    });
    expect(response).toEqual(result);
  });

  it("handles mutation error", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ error: { message: "Part not found" } }),
    } as Response);

    const { result: hookResult } = renderHook(() => useUpdatePart("org-1"), {
      wrapper: createWrapper(),
    });

    await expect(
      hookResult.current.mutateAsync({
        id: "part-999",
        body: { name: "Nope" },
      }),
    ).rejects.toThrow();
  });
});

describe("useDeletePart", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  it("deletes part successfully", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { id: "part-1" } }),
    } as Response);

    const { result: hookResult } = renderHook(() => useDeletePart("org-1"), {
      wrapper: createWrapper(),
    });

    const response = await hookResult.current.mutateAsync("part-1");
    expect(response).toEqual({ id: "part-1" });
  });

  it("handles mutation error", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ error: { message: "Part not found" } }),
    } as Response);

    const { result: hookResult } = renderHook(() => useDeletePart("org-1"), {
      wrapper: createWrapper(),
    });

    await expect(hookResult.current.mutateAsync("part-999")).rejects.toThrow();
  });
});

describe("useCreatePurchaseOrder", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  it("creates purchase order successfully", async () => {
    const result = {
      id: "po-new",
      order_number: "PO-001",
      status: "pending",
    };
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: result }),
    } as Response);

    const { result: hookResult } = renderHook(
      () => useCreatePurchaseOrder("org-1"),
      { wrapper: createWrapper() },
    );

    const response = await hookResult.current.mutateAsync({
      order_number: "PO-001",
      items: [{ part_id: "part-1", quantity_ordered: 10, unit_cost: 15000 }],
    });
    expect(response).toEqual(result);
  });

  it("handles mutation error", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: { message: "Invalid order" } }),
    } as Response);

    const { result: hookResult } = renderHook(
      () => useCreatePurchaseOrder("org-1"),
      { wrapper: createWrapper() },
    );

    await expect(
      hookResult.current.mutateAsync({
        order_number: "PO-001",
        items: [],
      }),
    ).rejects.toThrow();
  });
});

describe("useUpdatePurchaseOrder", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  it("updates purchase order successfully", async () => {
    const result = { id: "po-1", status: "cancelled" };
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: result }),
    } as Response);

    const { result: hookResult } = renderHook(
      () => useUpdatePurchaseOrder("org-1"),
      { wrapper: createWrapper() },
    );

    const response = await hookResult.current.mutateAsync({
      id: "po-1",
      body: { status: "cancelled" },
    });
    expect(response).toEqual(result);
  });

  it("handles mutation error", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ error: { message: "PO not found" } }),
    } as Response);

    const { result: hookResult } = renderHook(
      () => useUpdatePurchaseOrder("org-1"),
      { wrapper: createWrapper() },
    );

    await expect(
      hookResult.current.mutateAsync({
        id: "po-999",
        body: { status: "cancelled" },
      }),
    ).rejects.toThrow();
  });
});

describe("useReceivePurchaseOrder", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  it("receives purchase order successfully", async () => {
    const result = { id: "po-1", status: "received" };
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: result }),
    } as Response);

    const { result: hookResult } = renderHook(
      () => useReceivePurchaseOrder("org-1"),
      { wrapper: createWrapper() },
    );

    const response = await hookResult.current.mutateAsync("po-1");
    expect(response).toEqual(result);
  });

  it("handles mutation error", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: { message: "Already received" } }),
    } as Response);

    const { result: hookResult } = renderHook(
      () => useReceivePurchaseOrder("org-1"),
      { wrapper: createWrapper() },
    );

    await expect(hookResult.current.mutateAsync("po-999")).rejects.toThrow();
  });
});

describe("useReceiveByBarcode", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  it("receives item by barcode successfully", async () => {
    const result = { id: "poi-1", part_name: "Oil Filter", quantity: 1 };
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: result }),
    } as Response);

    const { result: hookResult } = renderHook(
      () => useReceiveByBarcode("org-1", "po-1"),
      { wrapper: createWrapper() },
    );

    const response = await hookResult.current.mutateAsync({
      poId: "po-1",
      barcode: "BARCODE-001",
    });
    expect(response).toEqual(result);
  });

  it("handles mutation error", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ error: { message: "Item not found" } }),
    } as Response);

    const { result: hookResult } = renderHook(
      () => useReceiveByBarcode("org-1", "po-1"),
      { wrapper: createWrapper() },
    );

    await expect(
      hookResult.current.mutateAsync({
        poId: "po-1",
        barcode: "INVALID",
      }),
    ).rejects.toThrow();
  });
});

describe("useCreatePartsCar", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  it("creates parts car successfully", async () => {
    const result = { id: "car-new", make: "Toyota", model: "Camry" };
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: result }),
    } as Response);

    const { result: hookResult } = renderHook(
      () => useCreatePartsCar("org-1"),
      { wrapper: createWrapper() },
    );

    const response = await hookResult.current.mutateAsync({
      make: "Toyota",
      model: "Camry",
      year: 2020,
    });
    expect(response).toEqual(result);
  });

  it("handles mutation error", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: { message: "Invalid car data" } }),
    } as Response);

    const { result: hookResult } = renderHook(
      () => useCreatePartsCar("org-1"),
      { wrapper: createWrapper() },
    );

    await expect(
      hookResult.current.mutateAsync({ make: "", model: "" }),
    ).rejects.toThrow();
  });
});

describe("useStartDisassembly", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  it("starts disassembly successfully", async () => {
    const result = { id: "car-1", status: "disassembling" };
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: result }),
    } as Response);

    const { result: hookResult } = renderHook(
      () => useStartDisassembly("org-1"),
      { wrapper: createWrapper() },
    );

    const response = await hookResult.current.mutateAsync("car-1");
    expect(response).toEqual(result);
  });

  it("handles mutation error", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ error: { message: "Car not found" } }),
    } as Response);

    const { result: hookResult } = renderHook(
      () => useStartDisassembly("org-1"),
      { wrapper: createWrapper() },
    );

    await expect(hookResult.current.mutateAsync("car-999")).rejects.toThrow();
  });
});

describe("useCompleteDisassembly", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  it("completes disassembly successfully", async () => {
    const result = { id: "car-1", status: "completed" };
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: result }),
    } as Response);

    const { result: hookResult } = renderHook(
      () => useCompleteDisassembly("org-1"),
      { wrapper: createWrapper() },
    );

    const response = await hookResult.current.mutateAsync("car-1");
    expect(response).toEqual(result);
  });

  it("handles mutation error", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: { message: "Cannot complete" } }),
    } as Response);

    const { result: hookResult } = renderHook(
      () => useCompleteDisassembly("org-1"),
      { wrapper: createWrapper() },
    );

    await expect(hookResult.current.mutateAsync("car-999")).rejects.toThrow();
  });
});

describe("usePublishPartsCarToCatalog", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  it("publishes parts car to catalog successfully", async () => {
    const result = { publishedCount: 2, catalogIds: ["part-3", "part-4"] };
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: result }),
    } as Response);

    const { result: hookResult } = renderHook(
      () => usePublishPartsCarToCatalog("org-1"),
      { wrapper: createWrapper() },
    );

    const response = await hookResult.current.mutateAsync("car-1");
    expect(response).toEqual(result);
  });

  it("handles mutation error", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: { message: "No parts to publish" } }),
    } as Response);

    const { result: hookResult } = renderHook(
      () => usePublishPartsCarToCatalog("org-1"),
      { wrapper: createWrapper() },
    );

    await expect(hookResult.current.mutateAsync("car-999")).rejects.toThrow();
  });
});

describe("useAddPartsCarPart", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  it("adds parts car part successfully", async () => {
    const result = { id: "pcp-new", name: "Door Panel" };
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: result }),
    } as Response);

    const { result: hookResult } = renderHook(
      () => useAddPartsCarPart("org-1"),
      { wrapper: createWrapper() },
    );

    const response = await hookResult.current.mutateAsync({
      carId: "car-1",
      name: "Door Panel",
      quantity: 1,
      condition: "good",
    });
    expect(response).toEqual(result);
  });

  it("handles mutation error", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: { message: "Part already exists" } }),
    } as Response);

    const { result: hookResult } = renderHook(
      () => useAddPartsCarPart("org-1"),
      { wrapper: createWrapper() },
    );

    await expect(
      hookResult.current.mutateAsync({
        carId: "car-1",
        name: "",
      }),
    ).rejects.toThrow();
  });
});

describe("useRemovePartsCarPart", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  it("removes parts car part successfully", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { success: true } }),
    } as Response);

    const { result: hookResult } = renderHook(
      () => useRemovePartsCarPart("org-1"),
      { wrapper: createWrapper() },
    );

    const response = await hookResult.current.mutateAsync({
      carId: "car-1",
      partId: "pcp-1",
    });
    expect(response).toEqual({ success: true });
  });

  it("handles mutation error", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ error: { message: "Part not found on car" } }),
    } as Response);

    const { result: hookResult } = renderHook(
      () => useRemovePartsCarPart("org-1"),
      { wrapper: createWrapper() },
    );

    await expect(
      hookResult.current.mutateAsync({
        carId: "car-1",
        partId: "pcp-999",
      }),
    ).rejects.toThrow();
  });
});

describe("useUpdatePartsCar", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  it("updates parts car successfully", async () => {
    const result = { id: "car-1", notes: "Updated notes" };
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: result }),
    } as Response);

    const { result: hookResult } = renderHook(
      () => useUpdatePartsCar("org-1"),
      { wrapper: createWrapper() },
    );

    const response = await hookResult.current.mutateAsync({
      id: "car-1",
      notes: "Updated notes",
    });
    expect(response).toEqual(result);
  });

  it("handles mutation error", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ error: { message: "Car not found" } }),
    } as Response);

    const { result: hookResult } = renderHook(
      () => useUpdatePartsCar("org-1"),
      { wrapper: createWrapper() },
    );

    await expect(
      hookResult.current.mutateAsync({
        id: "car-999",
        notes: "Nope",
      }),
    ).rejects.toThrow();
  });
});

describe("useDeletePartsCar", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  it("deletes parts car successfully", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { success: true } }),
    } as Response);

    const { result: hookResult } = renderHook(
      () => useDeletePartsCar("org-1"),
      { wrapper: createWrapper() },
    );

    const response = await hookResult.current.mutateAsync("car-1");
    expect(response).toEqual({ success: true });
  });

  it("handles mutation error", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ error: { message: "Car not found" } }),
    } as Response);

    const { result: hookResult } = renderHook(
      () => useDeletePartsCar("org-1"),
      { wrapper: createWrapper() },
    );

    await expect(hookResult.current.mutateAsync("car-999")).rejects.toThrow();
  });
});
