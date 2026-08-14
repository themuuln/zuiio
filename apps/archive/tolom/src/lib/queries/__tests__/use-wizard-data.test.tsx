import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
  CreateCustomerParams,
  CreatePartParams,
  CreateServiceCatalogParams,
  CreateVehicleParams,
} from "@/lib/types";
import {
  useCreateCustomer,
  useCreatePart,
  useCreateService,
  useCreateVehicle,
  useCreateWorkOrder,
  useCustomerSearch,
  useCustomersByPlate,
  useMechanicsWithJobCount,
  usePriceHistory,
  useServiceCatalog,
  useVehicleLastVisit,
  useVehiclePartPrices,
  useVehicleSearch,
  useVehicleServicePrices,
} from "../use-wizard-data";

// useOrgMutation (used by create mutation hooks) depends on useMutationQueue
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

describe("useServiceCatalog", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  const sampleServices = [
    { id: "svc-1", name: "Oil Change", default_price: 50 },
    { id: "svc-2", name: "Brake Pad", default_price: 120 },
  ];

  it("returns service catalog on success", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: sampleServices }),
    } as Response);

    const { result } = renderHook(() => useServiceCatalog("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(sampleServices);
  });

  it("does not fetch when orgId is undefined", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(() => useServiceCatalog(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("handles fetch error", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useServiceCatalog("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true), {
      timeout: 5000,
    });
  });
});

describe("useCustomerSearch", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  const sampleCustomers = [
    { id: "cust-1", full_name: "John Doe", phone: "555-0100" },
  ];

  it("returns customers on success", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: { data: sampleCustomers } }),
    } as Response);

    const { result } = renderHook(() => useCustomerSearch("org-1", "John"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(sampleCustomers);
  });

  it("does not fetch when orgId is undefined or query is empty", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(() => useCustomerSearch(undefined, "John"), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("does not fetch when query is empty", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(() => useCustomerSearch("org-1", ""), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("passes query parameter in URL", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: { data: [] } }),
    } as Response);

    renderHook(() => useCustomerSearch("org-1", "Jane"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
    const url = fetchSpy.mock.calls[0][0] as string;
    expect(url).toContain("/api/organizations/org-1/customers");
    expect(url).toContain("q=Jane");
  });

  it("handles fetch error", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useCustomerSearch("org-1", "John"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true), {
      timeout: 5000,
    });
  });
});

describe("usePriceHistory", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  it("returns price history on success", async () => {
    const priceData = {
      services: { "svc-1": [50, 55] },
      parts: { "Brake Pad": [30] },
    };

    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: priceData }),
    } as Response);

    const { result } = renderHook(() => usePriceHistory("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(priceData);
  });

  it("does not fetch when orgId is undefined", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(() => usePriceHistory(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("handles fetch error", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => usePriceHistory("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true), {
      timeout: 5000,
    });
  });
});

describe("useMechanicsWithJobCount", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  const sampleMechanics = [
    { id: "m1", full_name: "John Smith" },
    { id: "m2", full_name: "Jane Doe" },
  ];

  const sampleWorkOrders = [
    { id: "wo1", status: "In Progress", mechanic_id: "m1" },
    { id: "wo2", status: "Diagnosing", mechanic_id: "m1" },
    { id: "wo3", status: "Completed", mechanic_id: "m2" },
  ];

  it("returns mechanics with job counts on success", async () => {
    vi.spyOn(global, "fetch").mockImplementation((url: RequestInfo | URL) => {
      const str = typeof url === "string" ? url : url.toString();
      if (str.includes("/reports")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: sampleMechanics }),
        } as Response);
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: sampleWorkOrders }),
      } as Response);
    });

    const { result } = renderHook(() => useMechanicsWithJobCount("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([
      { id: "m1", fullName: "John Smith", email: "", current_jobs: 2 },
      { id: "m2", fullName: "Jane Doe", email: "", current_jobs: 0 },
    ]);
  });

  it("does not fetch when orgId is undefined", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(() => useMechanicsWithJobCount(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("handles fetch error", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useMechanicsWithJobCount("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true), {
      timeout: 5000,
    });
  });
});

describe("useCustomersByPlate", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  const sampleCustomers = [
    { id: "cust-1", full_name: "John Doe", phone: "555-0100" },
  ];

  it("returns customers by plate on success", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: sampleCustomers }),
    } as Response);

    const { result } = renderHook(
      () => useCustomersByPlate("org-1", "ABC123"),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(sampleCustomers);
  });

  it("does not fetch when orgId is undefined", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(
      () => useCustomersByPlate(undefined, "ABC123"),
      { wrapper: createWrapper() },
    );

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("does not fetch when plateQuery is empty", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(() => useCustomersByPlate("org-1", ""), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("passes plate parameter in URL", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    } as Response);

    renderHook(() => useCustomersByPlate("org-1", "XYZ789"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
    const url = fetchSpy.mock.calls[0][0] as string;
    expect(url).toContain("/api/organizations/org-1/customers/by-plate");
    expect(url).toContain("plate=XYZ789");
  });

  it("handles fetch error", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(
      () => useCustomersByPlate("org-1", "ABC123"),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isError).toBe(true), {
      timeout: 5000,
    });
  });
});

describe("useVehicleSearch", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  const sampleVehicles = [
    { id: "v1", plate: "ABC123", make: "Toyota", model: "Camry", year: 2020 },
  ];

  it("returns vehicles on success", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: sampleVehicles }),
    } as Response);

    const { result } = renderHook(
      () => useVehicleSearch("org-1", "cust-1", "ABC"),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(sampleVehicles);
  });

  it("normalizes plate by stripping dashes and uppercasing", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    } as Response);

    renderHook(() => useVehicleSearch("org-1", undefined, "abc-123 def"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
    const url = fetchSpy.mock.calls[0][0] as string;
    expect(url).toContain("plate=ABC123DEF");
  });

  it("does not fetch when orgId is undefined", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(
      () => useVehicleSearch(undefined, "cust-1", "ABC"),
      { wrapper: createWrapper() },
    );

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("does not fetch when plateQuery is too short and no customerId", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(
      () => useVehicleSearch("org-1", undefined, "A"),
      { wrapper: createWrapper() },
    );

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("fetches when only customerId is provided without plate", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    } as Response);

    const { result } = renderHook(
      () => useVehicleSearch("org-1", "cust-1", ""),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("handles fetch error", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(
      () => useVehicleSearch("org-1", "cust-1", "ABC"),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isError).toBe(true), {
      timeout: 5000,
    });
  });
});

describe("useVehicleLastVisit", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  const sampleData = {
    services: [
      {
        service_catalog_id: "sc-1",
        service_name: "Oil Change",
        unit_price: 50,
        quantity: 1,
      },
    ],
    parts: [
      {
        part_name: "Oil Filter",
        part_number: "OF-100",
        unit_price: 15,
        quantity: 1,
      },
    ],
    mechanic_id: "m1",
    notes: "Customer complained about noise",
    owner: { id: "cust-1", full_name: "John Doe", phone: "555-0100" },
  };

  it("returns last visit data on success", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: sampleData }),
    } as Response);

    const { result } = renderHook(() => useVehicleLastVisit("org-1", "v1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({
      owner: { id: "cust-1", full_name: "John Doe", phone: "555-0100" },
      lastVisit: {
        services: [
          {
            service_catalog_id: "sc-1",
            service_name: "Oil Change",
            unit_price: 50,
            quantity: 1,
          },
        ],
        parts: [
          {
            part_name: "Oil Filter",
            part_number: "OF-100",
            unit_price: 15,
            quantity: 1,
          },
        ],
        mechanic_id: "m1",
        notes: "Customer complained about noise",
      },
    });
  });

  it("returns null owner and lastVisit when API returns null", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: null }),
    } as Response);

    const { result } = renderHook(() => useVehicleLastVisit("org-1", "v1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ owner: null, lastVisit: null });
  });

  it("does not fetch when orgId is undefined", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(() => useVehicleLastVisit(undefined, "v1"), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("does not fetch when vehicleId is undefined", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(
      () => useVehicleLastVisit("org-1", undefined),
      { wrapper: createWrapper() },
    );

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("handles fetch error", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useVehicleLastVisit("org-1", "v1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true), {
      timeout: 5000,
    });
  });
});

describe("useVehicleServicePrices", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  const samplePrices = [
    {
      unit_price: 50,
      final_price: 50,
      vehicle_make: "Toyota",
      vehicle_model: "Camry",
      created_at: "2025-01-01",
    },
    {
      unit_price: 55,
      final_price: 55,
      vehicle_make: "Toyota",
      vehicle_model: "Camry",
      created_at: "2025-06-01",
    },
  ];

  it("returns service prices on success", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: samplePrices }),
    } as Response);

    const { result } = renderHook(
      () => useVehicleServicePrices("org-1", "sc-1", "Toyota", "Camry"),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(samplePrices);
  });

  it("returns empty array when API returns null", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: null }),
    } as Response);

    const { result } = renderHook(
      () => useVehicleServicePrices("org-1", "sc-1", "Toyota", "Camry"),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });

  it("does not fetch when serviceCatalogId is undefined", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(
      () => useVehicleServicePrices("org-1", undefined, "Toyota", "Camry"),
      { wrapper: createWrapper() },
    );

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("does not fetch when vehicleMake is undefined", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(
      () => useVehicleServicePrices("org-1", "sc-1", undefined, "Camry"),
      { wrapper: createWrapper() },
    );

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("handles fetch error", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(
      () => useVehicleServicePrices("org-1", "sc-1", "Toyota", "Camry"),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isError).toBe(true), {
      timeout: 5000,
    });
  });
});

describe("useVehiclePartPrices", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  const samplePrices = [
    {
      unit_price: 30,
      final_price: 30,
      part_number: "OF-100",
      vehicle_make: "Toyota",
      vehicle_model: "Camry",
      created_at: "2025-01-01",
    },
  ];

  it("returns part prices on success", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: samplePrices }),
    } as Response);

    const { result } = renderHook(
      () => useVehiclePartPrices("org-1", "Oil Filter", "Toyota", "Camry"),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(samplePrices);
  });

  it("returns empty array when API returns null", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: null }),
    } as Response);

    const { result } = renderHook(
      () => useVehiclePartPrices("org-1", "Oil Filter", "Toyota"),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });

  it("does not fetch when partName is undefined", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(
      () => useVehiclePartPrices("org-1", undefined, "Toyota"),
      { wrapper: createWrapper() },
    );

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("does not fetch when vehicleMake is undefined", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(
      () => useVehiclePartPrices("org-1", "Oil Filter", undefined),
      { wrapper: createWrapper() },
    );

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("handles fetch error", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(
      () => useVehiclePartPrices("org-1", "Oil Filter", "Toyota"),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isError).toBe(true), {
      timeout: 5000,
    });
  });
});

describe("useCreateCustomer", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  it("creates a customer on success", async () => {
    const newCustomer = {
      id: "cust-new",
      full_name: "John Doe",
      phone: "555-0100",
    };
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: newCustomer }),
    } as Response);

    const { result } = renderHook(() => useCreateCustomer("org-1"), {
      wrapper: createWrapper(),
    });

    const data = await result.current.mutateAsync({
      full_name: "John Doe",
      phone: "555-0100",
    } as CreateCustomerParams);

    expect(data).toEqual(newCustomer);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("handles mutation error", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useCreateCustomer("org-1"), {
      wrapper: createWrapper(),
    });

    await expect(
      result.current.mutateAsync({
        full_name: "John Doe",
      } as CreateCustomerParams),
    ).rejects.toThrow();

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("useCreateVehicle", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  it("creates a vehicle on success", async () => {
    const newVehicle = {
      id: "v-new",
      plate: "ABC123",
      make: "Toyota",
      model: "Camry",
    };
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: newVehicle }),
    } as Response);

    const { result } = renderHook(() => useCreateVehicle("org-1"), {
      wrapper: createWrapper(),
    });

    const data = await result.current.mutateAsync({
      plate: "ABC123",
      make: "Toyota",
      model: "Camry",
    } as CreateVehicleParams);

    expect(data).toEqual(newVehicle);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("handles mutation error", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useCreateVehicle("org-1"), {
      wrapper: createWrapper(),
    });

    await expect(
      result.current.mutateAsync({
        plate: "ABC123",
      } as CreateVehicleParams),
    ).rejects.toThrow();

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("useCreateWorkOrder", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  it("creates a work order on success", async () => {
    const newWorkOrder = { id: "wo-new" };
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: newWorkOrder }),
    } as Response);

    const { result } = renderHook(() => useCreateWorkOrder("org-1"), {
      wrapper: createWrapper(),
    });

    const data = await result.current.mutateAsync({
      customer_id: "cust-1",
      vehicle_id: "v-1",
      services: [
        {
          service_catalog_id: "sc-1",
          service_name: "Oil Change",
          quantity: 1,
          unit_price: 50,
        },
      ],
      parts: [],
    });

    expect(data).toEqual(newWorkOrder);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("handles mutation error", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useCreateWorkOrder("org-1"), {
      wrapper: createWrapper(),
    });

    await expect(
      result.current.mutateAsync({
        customer_id: "cust-1",
        vehicle_id: "v-1",
        services: [],
        parts: [],
      }),
    ).rejects.toThrow();

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("useCreateService", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  it("creates a service on success", async () => {
    const newService = { id: "svc-new", name: "Oil Change", default_price: 50 };
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: newService }),
    } as Response);

    const { result } = renderHook(() => useCreateService("org-1"), {
      wrapper: createWrapper(),
    });

    const data = await result.current.mutateAsync({
      name: "Oil Change",
      default_price: 50,
    } as CreateServiceCatalogParams);

    expect(data).toEqual(newService);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("handles mutation error", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useCreateService("org-1"), {
      wrapper: createWrapper(),
    });

    await expect(
      result.current.mutateAsync({
        name: "Oil Change",
      } as CreateServiceCatalogParams),
    ).rejects.toThrow();

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("useCreatePart", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  it("creates a part on success", async () => {
    const newPart = {
      id: "part-new",
      part_name: "Oil Filter",
      part_number: "OF-100",
    };
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: newPart }),
    } as Response);

    const { result } = renderHook(() => useCreatePart("org-1"), {
      wrapper: createWrapper(),
    });

    const data = await result.current.mutateAsync({
      part_name: "Oil Filter",
      part_number: "OF-100",
    } as CreatePartParams);

    expect(data).toEqual(newPart);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("handles mutation error", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useCreatePart("org-1"), {
      wrapper: createWrapper(),
    });

    await expect(
      result.current.mutateAsync({
        part_name: "Oil Filter",
      } as CreatePartParams),
    ).rejects.toThrow();

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
