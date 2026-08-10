import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { itpKeys } from "../keys";
import type { ItpHistoryItem, ItpRecordItem, ItpStatsData } from "../use-itp";
import {
  useExpiringItpRecords,
  useItpHistory,
  useItpRecord,
  useItpRecords,
  useItpStats,
  useRecordItpInspection,
  useSendItpReminder,
  useUpdateItpRecord,
} from "../use-itp";

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

const sampleRecord: ItpRecordItem = {
  vehicle_id: "v-1",
  plate_number: "1234ABC",
  make: "Toyota",
  model: "Camry",
  year: 2019,
  itp_expiry_date: "2026-08-01",
  itp_last_passed_date: "2025-08-01",
  itp_notes: null,
  customer_name: "John Doe",
  customer_phone: "+97699112233",
  days_until_expiry: -8,
  itp_status: "expired",
};

const sampleStats: ItpStatsData = {
  total: 4,
  valid: 2,
  expiring_soon: 1,
  expired: 1,
  unknown: 0,
};

const sampleHistoryItem: ItpHistoryItem = {
  id: "h-1",
  organization_id: "org-1",
  vehicle_id: "v-1",
  branch_id: null,
  user_id: "user-1",
  previous_expiry_date: "2025-08-01",
  new_expiry_date: "2026-08-01",
  previous_status: "valid",
  new_status: "valid",
  notes: null,
  action_type: "record_inspection",
  created_at: "2025-08-01T10:00:00Z",
};

describe("useItpRecords", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  it("returns the paged ITP record list on success", async () => {
    mockFetchResponse({ data: [sampleRecord], total: 1 });

    const { result } = renderHook(() => useItpRecords("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ data: [sampleRecord], total: 1 });
    expect(global.fetch).toHaveBeenCalledWith("/api/organizations/org-1/itp");
  });

  it("passes filter params to the API", async () => {
    const fetchSpy = mockFetchResponse({ data: [sampleRecord], total: 1 });

    renderHook(
      () =>
        useItpRecords("org-1", {
          status: "expired",
          search: "camry",
          branchId: "b-1",
          limit: 10,
          offset: 20,
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
    const url = fetchSpy.mock.calls[0][0] as string;
    expect(url).toBe(
      "/api/organizations/org-1/itp?status=expired&search=camry&branch_id=b-1&limit=10&offset=20",
    );
  });

  it("does not fetch when orgId is missing", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(() => useItpRecords(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("surfaces API errors", async () => {
    mockFetchError("Failed to load itp");

    const { result } = renderHook(() => useItpRecords("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("Failed to load itp");
  });
});

describe("useItpStats", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  it("returns stats on success", async () => {
    const fetchSpy = mockFetchResponse(sampleStats);

    const { result } = renderHook(() => useItpStats("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(sampleStats);
    expect(fetchSpy.mock.calls[0][0]).toBe(
      "/api/organizations/org-1/itp?stats=true",
    );
  });

  it("passes branch_id when branchId provided", async () => {
    const fetchSpy = mockFetchResponse(sampleStats);

    renderHook(() => useItpStats("org-1", "b-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
    expect(fetchSpy.mock.calls[0][0]).toBe(
      "/api/organizations/org-1/itp?stats=true&branch_id=b-1",
    );
  });

  it("does not fetch when orgId is missing", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(() => useItpStats(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("surfaces API errors", async () => {
    mockFetchError("Failed to load stats");

    const { result } = renderHook(() => useItpStats("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("Failed to load stats");
  });
});

describe("useExpiringItpRecords", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  it("returns expiring records on success", async () => {
    const fetchSpy = mockFetchResponse([sampleRecord]);

    const { result } = renderHook(() => useExpiringItpRecords("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([sampleRecord]);
    expect(fetchSpy.mock.calls[0][0]).toBe(
      "/api/organizations/org-1/itp?expiring=true",
    );
  });

  it("passes branch_id when branchId provided", async () => {
    const fetchSpy = mockFetchResponse([]);

    renderHook(() => useExpiringItpRecords("org-1", "b-2"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
    expect(fetchSpy.mock.calls[0][0]).toBe(
      "/api/organizations/org-1/itp?expiring=true&branch_id=b-2",
    );
  });

  it("does not fetch when orgId is missing", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(() => useExpiringItpRecords(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("surfaces API errors", async () => {
    mockFetchError("Failed to load expiring");

    const { result } = renderHook(() => useExpiringItpRecords("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("Failed to load expiring");
  });
});

describe("useItpRecord", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  it("returns the single record on success", async () => {
    // The /itp list endpoint returns a paginated envelope; the hook unwraps
    // the first (only) record for the requested vehicle.
    const fetchSpy = mockFetchResponse({ data: [sampleRecord], total: 1 });

    const { result } = renderHook(() => useItpRecord("org-1", "v-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(sampleRecord);
    expect(fetchSpy.mock.calls[0][0]).toBe(
      "/api/organizations/org-1/itp?vehicle_id=v-1",
    );
  });

  it("does not fetch when orgId or vehicleId is missing", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result: noOrg } = renderHook(() => useItpRecord(undefined, "v-1"), {
      wrapper: createWrapper(),
    });
    const { result: noVehicle } = renderHook(() => useItpRecord("org-1", ""), {
      wrapper: createWrapper(),
    });

    expect(noOrg.current.isPending).toBe(true);
    expect(noVehicle.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("surfaces API errors", async () => {
    mockFetchError("Not found");

    const { result } = renderHook(() => useItpRecord("org-1", "v-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("Not found");
  });
});

describe("useItpHistory", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  it("returns history items on success", async () => {
    const fetchSpy = mockFetchResponse([sampleHistoryItem]);

    const { result } = renderHook(() => useItpHistory("org-1", "v-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([sampleHistoryItem]);
    expect(fetchSpy.mock.calls[0][0]).toBe(
      "/api/organizations/org-1/itp?vehicle_id=v-1&include_history=true",
    );
  });

  it("does not fetch when orgId or vehicleId is missing", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result: noOrg } = renderHook(
      () => useItpHistory(undefined, "v-1"),
      {
        wrapper: createWrapper(),
      },
    );
    const { result: noVehicle } = renderHook(() => useItpHistory("org-1", ""), {
      wrapper: createWrapper(),
    });

    expect(noOrg.current.isPending).toBe(true);
    expect(noVehicle.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("surfaces API errors", async () => {
    mockFetchError("Failed to load history");

    const { result } = renderHook(() => useItpHistory("org-1", "v-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("Failed to load history");
  });
});

describe("ITP mutations", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.clearAllMocks();
  });

  it("configures useRecordItpInspection with POST endpoint and key", () => {
    renderHook(() => useRecordItpInspection("org-1"), {
      wrapper: createWrapper(),
    });

    const config = lastMutationConfig();
    expect(config.endpoint).toBe("/api/organizations/org-1/itp");
    expect(config.method).toBe("POST");
    expect(config.queryKey).toEqual(itpKeys.all("org-1"));
    expect(config.successMessage).toBe("ITP inspection recorded");
  });

  it("configures useUpdateItpRecord with PATCH endpoint and bodyFn that strips vehicle_id", () => {
    renderHook(() => useUpdateItpRecord("org-1"), {
      wrapper: createWrapper(),
    });

    const config = lastMutationConfig();
    const endpoint = config.endpoint;
    expect(typeof endpoint).toBe("function");
    expect(
      (endpoint as (vars: Record<string, unknown>) => string)({
        vehicle_id: "v-1",
      }),
    ).toBe("/api/organizations/org-1/itp/v-1");
    expect(config.method).toBe("PATCH");
    expect(config.queryKey).toEqual(itpKeys.all("org-1"));
    expect(config.successMessage).toBe("ITP record updated");

    const body = config.bodyFn?.({
      vehicle_id: "v-1",
      itp_expiry_date: "2026-08-01",
      itp_notes: "manual correction",
    });
    expect(body).toEqual({
      itp_expiry_date: "2026-08-01",
      itp_notes: "manual correction",
    });
  });

  it("configures useSendItpReminder with reminder endpoint", () => {
    renderHook(() => useSendItpReminder("org-1"), {
      wrapper: createWrapper(),
    });

    const config = lastMutationConfig();
    const endpoint = config.endpoint;
    expect(typeof endpoint).toBe("function");
    expect((endpoint as (vars: Record<string, unknown>) => string)("v-1")).toBe(
      "/api/organizations/org-1/itp/v-1/reminder",
    );
    expect(config.method).toBe("POST");
    expect(config.queryKey).toEqual(itpKeys.all("org-1"));
    expect(config.successMessage).toBe("ITP reminder sent");
  });
});
