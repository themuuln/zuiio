import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { dviKeys } from "../keys";
import type { DVInspection } from "../use-dvi";
import {
  useAddDVIItem,
  useConvertDVInspection,
  useCreateDVInspection,
  useDVInspection,
  useDVInspections,
  useRemoveDVIItem,
  useSendDVInspection,
  useUpdateDVIItem,
  useUpdateDVInspection,
} from "../use-dvi";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

interface OrgMutationConfigLike {
  endpoint: string | ((vars: Record<string, unknown>) => string);
  method?: string;
  queryKey: readonly unknown[];
  successMessage?: string;
  bodyFn?: (vars: Record<string, unknown>) => unknown;
}

const { mockUseOrgMutation } = vi.hoisted(() => ({
  mockUseOrgMutation: vi.fn(() => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    isPending: false,
  })),
}));

vi.mock("@zuiio/query", () => ({
  useOrgMutation: mockUseOrgMutation,
}));

function lastMutationConfig(): OrgMutationConfigLike {
  const config = mockUseOrgMutation.mock.calls.at(-1)?.[0];
  if (!config) throw new Error("useOrgMutation was not called");
  return config as OrgMutationConfigLike;
}

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

const sampleInspection: DVInspection = {
  id: "dvi-1",
  organization_id: "org-1",
  vehicle_id: "v-1",
  customer_id: "c-1",
  branch_id: "b-1",
  status: "draft",
  created_by: "user-1",
  notes: "Initial check",
  created_at: "2025-03-01T10:00:00Z",
  updated_at: "2025-03-01T10:00:00Z",
  total_estimated_cost: 250000,
};

describe("useDVInspections", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  it("returns the inspection list on success", async () => {
    const fetchSpy = mockFetchResponse([sampleInspection]);

    const { result } = renderHook(() => useDVInspections("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([sampleInspection]);
    expect(fetchSpy.mock.calls[0][0]).toBe(
      "/api/organizations/org-1/dv-inspections",
    );
  });

  it("passes filter params to the API", async () => {
    const fetchSpy = mockFetchResponse([]);

    renderHook(
      () =>
        useDVInspections("org-1", {
          status: "approved",
          vehicleId: "v-2",
          branchId: "b-1",
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
    expect(fetchSpy.mock.calls[0][0]).toBe(
      "/api/organizations/org-1/dv-inspections?status=approved&vehicle_id=v-2&branch_id=b-1",
    );
  });

  it("does not fetch when orgId is missing", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(() => useDVInspections(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("surfaces API errors", async () => {
    mockFetchError("Failed to load dv-inspections");

    const { result } = renderHook(() => useDVInspections("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("Failed to load dv-inspections");
  });
});

describe("useDVInspection", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  it("returns a single inspection on success", async () => {
    const fetchSpy = mockFetchResponse(sampleInspection);

    const { result } = renderHook(() => useDVInspection("org-1", "dvi-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(sampleInspection);
    expect(fetchSpy.mock.calls[0][0]).toBe(
      "/api/organizations/org-1/dv-inspections?id=dvi-1",
    );
  });

  it("does not fetch when orgId or id is missing", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result: noOrg } = renderHook(
      () => useDVInspection(undefined, "dvi-1"),
      {
        wrapper: createWrapper(),
      },
    );
    const { result: noId } = renderHook(() => useDVInspection("org-1", ""), {
      wrapper: createWrapper(),
    });

    expect(noOrg.current.isPending).toBe(true);
    expect(noId.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("surfaces API errors", async () => {
    mockFetchError("Inspection not found");

    const { result } = renderHook(() => useDVInspection("org-1", "dvi-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("Inspection not found");
  });
});

describe("DVI mutations", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.clearAllMocks();
  });

  it("configures useCreateDVInspection with POST endpoint and key", () => {
    renderHook(() => useCreateDVInspection("org-1"), {
      wrapper: createWrapper(),
    });

    const config = lastMutationConfig();
    expect(config.endpoint).toBe("/api/organizations/org-1/dv-inspections");
    expect(config.method).toBe("POST");
    expect(config.queryKey).toEqual(dviKeys.all("org-1"));
    expect(config.successMessage).toBe("DVI inspection created");
  });

  it("configures useUpdateDVInspection with PATCH endpoint and bodyFn that strips id", () => {
    renderHook(() => useUpdateDVInspection("org-1"), {
      wrapper: createWrapper(),
    });

    const config = lastMutationConfig();
    const endpoint = config.endpoint;
    expect(typeof endpoint).toBe("function");
    expect(
      (endpoint as (vars: Record<string, unknown>) => string)({
        id: "dvi-1",
      }),
    ).toBe("/api/organizations/org-1/dv-inspections/dvi-1");
    expect(config.method).toBe("PATCH");
    expect(config.queryKey).toEqual(dviKeys.all("org-1"));
    expect(config.successMessage).toBe("DVI inspection updated");

    const body = config.bodyFn?.({ id: "dvi-1", notes: "updated" });
    expect(body).toEqual({ notes: "updated" });
  });

  it("configures useAddDVIItem with items endpoint and bodyFn that strips inspection_id", () => {
    renderHook(() => useAddDVIItem("org-1"), {
      wrapper: createWrapper(),
    });

    const config = lastMutationConfig();
    const endpoint = config.endpoint;
    expect(typeof endpoint).toBe("function");
    expect(
      (endpoint as (vars: Record<string, unknown>) => string)({
        inspection_id: "dvi-1",
      }),
    ).toBe("/api/organizations/org-1/dv-inspections/dvi-1/items");
    expect(config.method).toBe("POST");
    expect(config.successMessage).toBe("DVI item added");

    const body = config.bodyFn?.({
      inspection_id: "dvi-1",
      category: "brakes",
      title: "Pads",
      condition: "poor",
      severity: "urgent",
      position: 1,
    });
    expect(body).toEqual({
      category: "brakes",
      title: "Pads",
      condition: "poor",
      severity: "urgent",
      position: 1,
    });
  });

  it("configures useUpdateDVIItem with item PATCH endpoint and bodyFn that strips ids", () => {
    renderHook(() => useUpdateDVIItem("org-1"), {
      wrapper: createWrapper(),
    });

    const config = lastMutationConfig();
    const endpoint = config.endpoint;
    expect(typeof endpoint).toBe("function");
    expect(
      (endpoint as (vars: Record<string, unknown>) => string)({
        inspection_id: "dvi-1",
        item_id: "item-1",
      }),
    ).toBe("/api/organizations/org-1/dv-inspections/dvi-1/items/item-1");
    expect(config.method).toBe("PATCH");
    expect(config.successMessage).toBe("DVI item updated");

    const body = config.bodyFn?.({
      inspection_id: "dvi-1",
      item_id: "item-1",
      severity: "critical",
      estimated_cost: 150000,
    });
    expect(body).toEqual({ severity: "critical", estimated_cost: 150000 });
  });

  it("configures useRemoveDVIItem with DELETE endpoint", () => {
    renderHook(() => useRemoveDVIItem("org-1"), {
      wrapper: createWrapper(),
    });

    const config = lastMutationConfig();
    const endpoint = config.endpoint;
    expect(typeof endpoint).toBe("function");
    expect(
      (endpoint as (vars: Record<string, unknown>) => string)({
        inspection_id: "dvi-1",
        item_id: "item-1",
      }),
    ).toBe("/api/organizations/org-1/dv-inspections/dvi-1/items/item-1");
    expect(config.method).toBe("DELETE");
    expect(config.successMessage).toBe("DVI item removed");
  });

  it("configures useSendDVInspection with send endpoint", () => {
    renderHook(() => useSendDVInspection("org-1"), {
      wrapper: createWrapper(),
    });

    const config = lastMutationConfig();
    const endpoint = config.endpoint;
    expect(typeof endpoint).toBe("function");
    expect(
      (endpoint as (vars: Record<string, unknown>) => string)({ id: "dvi-1" }),
    ).toBe("/api/organizations/org-1/dv-inspections/dvi-1/send");
    expect(config.method).toBe("POST");
    expect(config.queryKey).toEqual(dviKeys.all("org-1"));
    expect(config.successMessage).toBe("DVI inspection sent");
  });

  it("configures useConvertDVInspection with convert endpoint", () => {
    renderHook(() => useConvertDVInspection("org-1"), {
      wrapper: createWrapper(),
    });

    const config = lastMutationConfig();
    const endpoint = config.endpoint;
    expect(typeof endpoint).toBe("function");
    expect(
      (endpoint as (vars: Record<string, unknown>) => string)({ id: "dvi-1" }),
    ).toBe("/api/organizations/org-1/dv-inspections/dvi-1/convert");
    expect(config.method).toBe("POST");
    expect(config.successMessage).toBe(
      "DVI inspection converted to work order",
    );
  });
});
