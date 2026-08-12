import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { estimateKeys } from "../keys";
import {
  useConvertEstimate,
  useDuplicateEstimate,
  useEstimateDetail,
  useEstimates,
  usePublicEstimate,
  useSendEstimate,
  useUpdateEstimate,
  useUpdateEstimateStatus,
} from "../use-estimates";

const orgMutationMocks = vi.hoisted(() => {
  const configs: Array<Record<string, unknown>> = [];
  const mutate = vi.fn();
  const mutateAsync = vi.fn().mockResolvedValue(undefined);

  return {
    configs,
    mutate,
    mutateAsync,
    useOrgMutation: vi.fn((config: Record<string, unknown>) => {
      configs.push(config);
      return {
        mutate,
        mutateAsync,
        isPending: false,
        isError: false,
        error: null,
      };
    }),
  };
});

vi.mock("@zuiio/query", () => ({
  useOrgMutation: orgMutationMocks.useOrgMutation,
}));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

function createWrapper() {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("useEstimates", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  const sampleEstimates = [
    {
      id: "est-1",
      number: "EST-001",
      status: "draft",
      total: 45000,
      customer_name: "Alice",
      vehicle_plate: "XYZ-789",
      created_at: "2025-01-15T10:00:00Z",
    },
    {
      id: "est-2",
      number: "EST-002",
      status: "sent",
      total: 82000,
      customer_name: "Bob",
      vehicle_plate: "ABC-123",
      created_at: "2025-01-16T14:30:00Z",
    },
  ];

  it("returns estimates on success", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: sampleEstimates }),
    } as Response);

    const { result } = renderHook(() => useEstimates("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(sampleEstimates);
  });

  it("appends status filter", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: sampleEstimates }),
    } as Response);

    renderHook(() => useEstimates("org-1", "draft"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
    const calledUrl = fetchSpy.mock.calls[0][0] as string;
    expect(calledUrl).toContain("status=draft");
  });

  it("appends search query", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: sampleEstimates }),
    } as Response);

    renderHook(() => useEstimates("org-1", undefined, "oil change"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
    const calledUrl = fetchSpy.mock.calls[0][0] as string;
    expect(calledUrl).toContain("q=oil+change");
  });

  it("passes branch_id param", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: sampleEstimates }),
    } as Response);

    renderHook(() => useEstimates("org-1", undefined, undefined, "branch-42"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
    const calledUrl = fetchSpy.mock.calls[0][0] as string;
    expect(calledUrl).toContain("branch_id=branch-42");
  });

  it("omits query string when no filters provided", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: sampleEstimates }),
    } as Response);

    renderHook(() => useEstimates("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
    const calledUrl = fetchSpy.mock.calls[0][0] as string;
    expect(calledUrl).not.toContain("?");
  });

  it("does not fetch when orgId is missing", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(() => useEstimates(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("handles fetch error via json.error", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ error: { message: "Failed to load estimates" } }),
    } as Response);

    const { result } = renderHook(() => useEstimates("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

// ── useEstimateDetail ───────────────────────────────────────────

describe("useEstimateDetail", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  const sampleDetail = {
    id: "est-1",
    estimate_number: "EST-001",
    status: "draft",
    customer_id: "c-1",
    vehicle_id: "v-1",
    organization_id: "org-1",
    branch_id: null,
    appointment_id: null,
    converted_work_order_id: null,
    created_at: "2025-01-15T10:00:00Z",
    created_by: null,
    updated_at: "2025-01-15T10:00:00Z",
    updated_by: null,
    deleted_at: null,
    subtotal: 40000,
    discount_amount: 0,
    discount_percentage: 0,
    discount_total: 0,
    tax_total: 5000,
    grand_total: 45000,
    notes: "Routine maintenance",
    terms: null,
    valid_until: "2025-02-15",
    public_token: "tok-public-1",
    customer: {
      id: "c-1",
      first_name: "Alice",
      last_name: null,
      phone: "555-0100",
      email: null,
      organization_id: "org-1",
      created_at: "2025-01-01T00:00:00Z",
      updated_at: "2025-01-01T00:00:00Z",
    },
    vehicle: {
      id: "v-1",
      plate_number: "XYZ-789",
      make: "Toyota",
      model: "Camry",
      year: 2020,
      vin: null,
      color: null,
      customer_id: "c-1",
      organization_id: "org-1",
      created_at: "2025-01-01T00:00:00Z",
      updated_at: "2025-01-01T00:00:00Z",
    },
    items: [],
    converted_work_order: null,
    appointment: null,
  };

  it("returns estimate detail on success", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: sampleDetail }),
    } as Response);

    const { result } = renderHook(() => useEstimateDetail("org-1", "est-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(sampleDetail);
  });

  it("does not fetch when orgId is missing", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(() => useEstimateDetail(undefined, "est-1"), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("does not fetch when estimateId is missing", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(() => useEstimateDetail("org-1", undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("handles fetch error via json.error", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ error: { message: "Failed to load estimate" } }),
    } as Response);

    const { result } = renderHook(() => useEstimateDetail("org-1", "est-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

// ── usePublicEstimate ───────────────────────────────────────────

describe("usePublicEstimate", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  const samplePublic = {
    id: "est-1",
    estimate_number: "EST-001",
    status: "draft" as const,
    created_at: "2025-01-15T10:00:00Z",
    valid_until: "2025-02-15",
    notes: "Routine maintenance",
    terms: null,
    subtotal: 40000,
    discount_amount: 0,
    discount_percentage: 0,
    discount_total: 0,
    tax_total: 5000,
    grand_total: 45000,
    customer: {
      first_name: "Alice",
      last_name: null,
      phone: "555-0100",
      email: null,
    },
    vehicle: {
      plate_number: "XYZ-789",
      make: "Toyota",
      model: "Camry",
      year: 2020,
    },
    items: [
      {
        description: "Oil change",
        item_type: "service",
        quantity: 1,
        unit_price: 40000,
        discount_amount: 0,
        discount_percentage: 0,
        line_total: 40000,
      },
    ],
    organization: {
      name: "Test Garage",
      phone: "555-0001",
      email: "garage@test.com",
      address: "123 Main St",
    },
  };

  it("returns public estimate on success", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: samplePublic }),
    } as Response);

    const { result } = renderHook(() => usePublicEstimate("tok-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(samplePublic);
  });

  it("does not fetch when token is missing", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(() => usePublicEstimate(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("handles fetch error via json.error", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ error: { message: "Invalid token" } }),
    } as Response);

    const { result } = renderHook(() => usePublicEstimate("bad-token"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

// ── useUpdateEstimateStatus ─────────────────────────────────────

describe("useUpdateEstimateStatus", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
    orgMutationMocks.configs.length = 0;
    orgMutationMocks.useOrgMutation.mockClear();
  });

  it("configures the PATCH endpoint and status body", () => {
    renderHook(() => useUpdateEstimateStatus("org-1"), {
      wrapper: createWrapper(),
    });

    const config = orgMutationMocks.configs[0];
    expect(config.method).toBe("PATCH");
    expect(config.queryKey).toEqual(estimateKeys.all("org-1"));
    expect(
      (config.endpoint as (variables: { estimateId: string }) => string)({
        estimateId: "est-1",
      }),
    ).toBe("/api/organizations/org-1/estimates/est-1");
    expect(
      (
        config.bodyFn as (variables: {
          estimateId: string;
          status: string;
        }) => unknown
      )({
        estimateId: "est-1",
        status: "approved",
      }),
    ).toEqual({ status: "approved" });
    expect(config.successMessage).toBe("Status updated");
    expect(typeof config.onOptimisticUpdate).toBe("function");
  });

  it("updates the detail cache optimistically", () => {
    const detailKey = estimateKeys.detail("org-1", "est-1");
    queryClient.setQueryData(detailKey, {
      id: "est-1",
      status: "draft",
      updated_at: "old",
    });

    renderHook(() => useUpdateEstimateStatus("org-1"), {
      wrapper: createWrapper(),
    });

    const config = orgMutationMocks.configs[0];
    const previous = (
      config.onOptimisticUpdate as (
        client: QueryClient,
        variables: { estimateId: string; status: string },
      ) => unknown
    )(queryClient, { estimateId: "est-1", status: "approved" });

    expect(previous).toMatchObject({ id: "est-1", status: "draft" });
    expect(queryClient.getQueryData(detailKey)).toMatchObject({
      status: "approved",
    });
  });
});

// ── useConvertEstimate ──────────────────────────────────────────

describe("useConvertEstimate", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
    orgMutationMocks.configs.length = 0;
    orgMutationMocks.useOrgMutation.mockClear();
  });

  it("configures the conversion endpoint and deterministic idempotency key", () => {
    renderHook(() => useConvertEstimate("org-1"), {
      wrapper: createWrapper(),
    });

    const config = orgMutationMocks.configs[0];
    expect(config.method).toBe("POST");
    expect(config.queryKey).toEqual(estimateKeys.all("org-1"));
    expect(
      (config.endpoint as (variables: { estimateId: string }) => string)({
        estimateId: "est-1",
      }),
    ).toBe("/api/organizations/org-1/estimates/est-1/convert");
    expect(config.successMessage).toBe("Estimate converted to work order");
    expect(
      (config.idempotencyKey as (variables: { estimateId: string }) => string)({
        estimateId: "est-1",
      }),
    ).toBe("convert-org-1-est-1");
  });
});

// ── useUpdateEstimate ───────────────────────────────────────────

describe("useUpdateEstimate", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.clearAllMocks();
  });

  it("renders the mutation hook without crashing", () => {
    const { result } = renderHook(() => useUpdateEstimate("org-1"), {
      wrapper: createWrapper(),
    });

    expect(result.current).toBeDefined();
    expect(typeof result.current.mutate).toBe("function");
  });

  it("accepts undefined orgId", () => {
    const { result } = renderHook(() => useUpdateEstimate(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current).toBeDefined();
  });
});

// ── useDuplicateEstimate ────────────────────────────────────────

describe("useDuplicateEstimate", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.clearAllMocks();
  });

  it("renders the mutation hook without crashing", () => {
    const { result } = renderHook(() => useDuplicateEstimate("org-1"), {
      wrapper: createWrapper(),
    });

    expect(result.current).toBeDefined();
    expect(typeof result.current.mutate).toBe("function");
  });

  it("accepts undefined orgId", () => {
    const { result } = renderHook(() => useDuplicateEstimate(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current).toBeDefined();
  });
});

// ── useSendEstimate ─────────────────────────────────────────────

describe("useSendEstimate", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.clearAllMocks();
  });

  it("renders the mutation hook without crashing", () => {
    const { result } = renderHook(() => useSendEstimate("org-1"), {
      wrapper: createWrapper(),
    });

    expect(result.current).toBeDefined();
    expect(typeof result.current.mutate).toBe("function");
  });

  it("accepts undefined orgId", () => {
    const { result } = renderHook(() => useSendEstimate(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current).toBeDefined();
  });
});
