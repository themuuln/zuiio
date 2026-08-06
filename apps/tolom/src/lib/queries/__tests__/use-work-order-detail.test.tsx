import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  useAddPart,
  useAddService,
  useAssignMechanic,
  useCreateInvoice,
  useInvoicePayments,
  useMechanicsList,
  usePartPriceHistory,
  useRecordPayment,
  useRemovePart,
  useRemoveService,
  useServiceCatalog,
  useServicePriceHistory,
  useUpdateWorkOrderStatus,
  useWorkOrderDetail,
} from "../use-work-order-detail";

vi.mock("@zuiio/query", () => ({
  useOrgMutation: vi.fn(() => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn().mockResolvedValue({}),
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

// ─── Shared fixture data ──────────────────────────────────────────

const sampleDetail = {
  id: "wo-1",
  status: "In Progress",
  customer: { id: "cust-1", full_name: "John Doe" },
  vehicle: { id: "v-1", plate: "ABC123" },
  services: [],
  parts: [],
};

// ─── useWorkOrderDetail ───────────────────────────────────────────

describe("useWorkOrderDetail", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  it("returns work order detail on success", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: sampleDetail }),
    } as Response);

    const { result } = renderHook(() => useWorkOrderDetail("org-1", "wo-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(sampleDetail);
  });

  it("does not fetch when orgId is undefined", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(() => useWorkOrderDetail(undefined, "wo-1"), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("calls the correct endpoint", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: sampleDetail }),
    } as Response);

    renderHook(() => useWorkOrderDetail("org-1", "wo-42"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
    const url = fetchSpy.mock.calls[0][0] as string;
    expect(url).toBe("/api/organizations/org-1/work-orders/wo-42");
  });

  it("handles fetch error", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useWorkOrderDetail("org-1", "wo-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

// ─── useServiceCatalog ────────────────────────────────────────────

describe("useServiceCatalog", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  const sampleCatalog = [
    {
      id: "sc-1",
      organization_id: "org-1",
      branch_id: null,
      name: "Oil Change",
      name_mn: null,
      description: null,
      category: null,
      default_price: 49.99,
      default_cost: null,
      estimated_duration_minutes: null,
      is_active: true,
      interval_km: null,
      interval_months: null,
      global_service_id: null,
      embedding: null,
      created_at: "2024-01-01T00:00:00Z",
      created_by: null,
      updated_at: "2024-01-01T00:00:00Z",
      updated_by: null,
      deleted_at: null,
    },
  ];

  it("returns service catalog on success", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: sampleCatalog }),
    } as Response);

    const { result } = renderHook(() => useServiceCatalog("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(sampleCatalog);
  });

  it("does not fetch when orgId is undefined", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(() => useServiceCatalog(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("calls the correct endpoint", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: sampleCatalog }),
    } as Response);

    renderHook(() => useServiceCatalog("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
    const url = fetchSpy.mock.calls[0][0] as string;
    expect(url).toBe("/api/organizations/org-1/services");
  });

  it("handles fetch error", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useServiceCatalog("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

// ─── useMechanicsList ─────────────────────────────────────────────

describe("useMechanicsList", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  const sampleMechanics = [
    { id: "m-1", full_name: "Alice Smith" },
    { id: "m-2", full_name: "Bob Jones" },
  ];

  it("returns mechanics list on success", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: sampleMechanics }),
    } as Response);

    const { result } = renderHook(() => useMechanicsList("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(sampleMechanics);
  });

  it("does not fetch when orgId is undefined", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(() => useMechanicsList(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("calls the correct endpoint", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: sampleMechanics }),
    } as Response);

    renderHook(() => useMechanicsList("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
    const url = fetchSpy.mock.calls[0][0] as string;
    expect(url).toBe("/api/organizations/org-1/reports?type=mechanics");
  });

  it("handles fetch error", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useMechanicsList("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

// ─── useServicePriceHistory ───────────────────────────────────────

describe("useServicePriceHistory", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  it("returns price points on success", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [
          { unit_price: 49.99 },
          { unit_price: 54.99 },
          { unit_price: 59.99 },
        ],
      }),
    } as Response);

    const { result } = renderHook(
      () => useServicePriceHistory("org-1", "sc-1"),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([49.99, 54.99, 59.99]);
  });

  it("does not fetch when orgId is undefined", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(
      () => useServicePriceHistory(undefined, "sc-1"),
      { wrapper: createWrapper() },
    );

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("does not fetch when serviceCatalogId is undefined", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(
      () => useServicePriceHistory("org-1", undefined),
      { wrapper: createWrapper() },
    );

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("calls the correct endpoint", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: [{ unit_price: 49.99 }] }),
    } as Response);

    renderHook(() => useServicePriceHistory("org-1", "sc-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
    const url = fetchSpy.mock.calls[0][0] as string;
    expect(url).toBe(
      "/api/organizations/org-1/price-history/service?service_catalog_id=sc-1",
    );
  });

  it("passes vehicle make and model query params", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: [{ unit_price: 49.99 }] }),
    } as Response);

    renderHook(
      () => useServicePriceHistory("org-1", "sc-1", "Toyota", "Camry"),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
    const url = fetchSpy.mock.calls[0][0] as string;
    expect(url).toBe(
      "/api/organizations/org-1/price-history/service?service_catalog_id=sc-1&vehicle_make=Toyota&vehicle_model=Camry",
    );
  });

  it("handles fetch error", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(
      () => useServicePriceHistory("org-1", "sc-1"),
      { wrapper: createWrapper() },
    );

    // Hook has retry: 1 — wait for the retry delay + eventual error state
    await waitFor(() => expect(result.current.isError).toBe(true), {
      timeout: 5000,
    });
  });
});

// ─── usePartPriceHistory ──────────────────────────────────────────

describe("usePartPriceHistory", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  it("returns price points on success", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [
          { unit_price: 12.99 },
          { unit_price: 14.99 },
          { unit_price: 16.99 },
        ],
      }),
    } as Response);

    const { result } = renderHook(
      () => usePartPriceHistory("org-1", "Oil Filter"),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([12.99, 14.99, 16.99]);
  });

  it("does not fetch when orgId is undefined", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(
      () => usePartPriceHistory(undefined, "Oil Filter"),
      { wrapper: createWrapper() },
    );

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("does not fetch when partName is undefined", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(
      () => usePartPriceHistory("org-1", undefined),
      { wrapper: createWrapper() },
    );

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("does not fetch when partName is too short", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(() => usePartPriceHistory("org-1", "A"), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("calls the correct endpoint", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: [{ unit_price: 12.99 }] }),
    } as Response);

    renderHook(() => usePartPriceHistory("org-1", "Oil Filter"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
    const url = fetchSpy.mock.calls[0][0] as string;
    expect(url).toBe(
      "/api/organizations/org-1/price-history/part?part_name=Oil+Filter",
    );
  });

  it("passes vehicle make query param", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: [{ unit_price: 12.99 }] }),
    } as Response);

    renderHook(() => usePartPriceHistory("org-1", "Oil Filter", "Toyota"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
    const url = fetchSpy.mock.calls[0][0] as string;
    expect(url).toBe(
      "/api/organizations/org-1/price-history/part?part_name=Oil+Filter&vehicle_make=Toyota",
    );
  });

  it("handles fetch error", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(
      () => usePartPriceHistory("org-1", "Oil Filter"),
      { wrapper: createWrapper() },
    );

    // Hook has retry: 1 — wait for the retry delay + eventual error state
    await waitFor(() => expect(result.current.isError).toBe(true), {
      timeout: 5000,
    });
  });
});

// ─── Mutation hooks (useOrgMutation is mocked above) ─────────────

describe("useUpdateWorkOrderStatus", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.clearAllMocks();
  });

  it("returns mutation object with expected API", () => {
    const { result } = renderHook(() => useUpdateWorkOrderStatus("org-1"), {
      wrapper: createWrapper(),
    });

    expect(result.current).toBeDefined();
    expect(typeof result.current.mutate).toBe("function");
    expect(typeof result.current.mutateAsync).toBe("function");
  });

  it("accepts undefined orgId", () => {
    const { result } = renderHook(() => useUpdateWorkOrderStatus(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current).toBeDefined();
    expect(typeof result.current.mutateAsync).toBe("function");
  });
});

describe("useAssignMechanic", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.clearAllMocks();
  });

  it("returns mutation object with expected API", () => {
    const { result } = renderHook(() => useAssignMechanic("org-1"), {
      wrapper: createWrapper(),
    });

    expect(result.current).toBeDefined();
    expect(typeof result.current.mutate).toBe("function");
    expect(typeof result.current.mutateAsync).toBe("function");
  });

  it("accepts undefined orgId", () => {
    const { result } = renderHook(() => useAssignMechanic(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current).toBeDefined();
    expect(typeof result.current.mutateAsync).toBe("function");
  });
});

describe("useAddService", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.clearAllMocks();
  });

  it("returns mutation object with expected API", () => {
    const { result } = renderHook(() => useAddService("org-1"), {
      wrapper: createWrapper(),
    });

    expect(result.current).toBeDefined();
    expect(typeof result.current.mutate).toBe("function");
    expect(typeof result.current.mutateAsync).toBe("function");
  });

  it("accepts undefined orgId", () => {
    const { result } = renderHook(() => useAddService(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current).toBeDefined();
    expect(typeof result.current.mutateAsync).toBe("function");
  });
});

describe("useRemoveService", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.clearAllMocks();
  });

  it("returns mutation object with expected API", () => {
    const { result } = renderHook(() => useRemoveService("org-1"), {
      wrapper: createWrapper(),
    });

    expect(result.current).toBeDefined();
    expect(typeof result.current.mutate).toBe("function");
    expect(typeof result.current.mutateAsync).toBe("function");
  });

  it("accepts undefined orgId", () => {
    const { result } = renderHook(() => useRemoveService(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current).toBeDefined();
    expect(typeof result.current.mutateAsync).toBe("function");
  });
});

describe("useAddPart", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.clearAllMocks();
  });

  it("returns mutation object with expected API", () => {
    const { result } = renderHook(() => useAddPart("org-1"), {
      wrapper: createWrapper(),
    });

    expect(result.current).toBeDefined();
    expect(typeof result.current.mutate).toBe("function");
    expect(typeof result.current.mutateAsync).toBe("function");
  });

  it("accepts undefined orgId", () => {
    const { result } = renderHook(() => useAddPart(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current).toBeDefined();
    expect(typeof result.current.mutateAsync).toBe("function");
  });
});

describe("useRemovePart", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.clearAllMocks();
  });

  it("returns mutation object with expected API", () => {
    const { result } = renderHook(() => useRemovePart("org-1"), {
      wrapper: createWrapper(),
    });

    expect(result.current).toBeDefined();
    expect(typeof result.current.mutate).toBe("function");
    expect(typeof result.current.mutateAsync).toBe("function");
  });

  it("accepts undefined orgId", () => {
    const { result } = renderHook(() => useRemovePart(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current).toBeDefined();
    expect(typeof result.current.mutateAsync).toBe("function");
  });
});

describe("useCreateInvoice", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.clearAllMocks();
  });

  it("returns mutation object with expected API", () => {
    const { result } = renderHook(() => useCreateInvoice("org-1"), {
      wrapper: createWrapper(),
    });

    expect(result.current).toBeDefined();
    expect(typeof result.current.mutate).toBe("function");
    expect(typeof result.current.mutateAsync).toBe("function");
  });

  it("accepts undefined orgId", () => {
    const { result } = renderHook(() => useCreateInvoice(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current).toBeDefined();
    expect(typeof result.current.mutateAsync).toBe("function");
  });
});

// ─── useInvoicePayments ───────────────────────────────────────────

describe("useInvoicePayments", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  const sampleInvoiceData = {
    data: {
      payments: [
        { id: "p-1", amount: 100, method: "cash", created_at: "2024-01-01" },
      ],
      total_paid: 100,
      balance_due: 50,
      status: "partial",
    },
  };

  it("returns invoice payments on success", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => sampleInvoiceData,
    } as Response);

    const { result } = renderHook(() => useInvoicePayments("org-1", "inv-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(sampleInvoiceData.data);
  });

  it("does not fetch when orgId is undefined", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(
      () => useInvoicePayments(undefined, "inv-1"),
      { wrapper: createWrapper() },
    );

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("does not fetch when invoiceId is null", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    renderHook(() => useInvoicePayments("org-1", null), {
      wrapper: createWrapper(),
    });

    // When invoiceId is null the queryFn still runs synchronously and returns a default object
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("calls the correct endpoint", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => sampleInvoiceData,
    } as Response);

    renderHook(() => useInvoicePayments("org-1", "inv-42"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
    const url = fetchSpy.mock.calls[0][0] as string;
    expect(url).toBe("/api/organizations/org-1/invoices/inv-42");
  });

  it("handles fetch error", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useInvoicePayments("org-1", "inv-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

// ─── useRecordPayment ─────────────────────────────────────────────

describe("useRecordPayment", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.clearAllMocks();
  });

  it("returns mutation object with expected API", () => {
    const { result } = renderHook(() => useRecordPayment("org-1"), {
      wrapper: createWrapper(),
    });

    expect(result.current).toBeDefined();
    expect(typeof result.current.mutate).toBe("function");
    expect(typeof result.current.mutateAsync).toBe("function");
  });

  it("accepts undefined orgId", () => {
    const { result } = renderHook(() => useRecordPayment(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current).toBeDefined();
    expect(typeof result.current.mutateAsync).toBe("function");
  });
});
