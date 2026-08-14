import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  useCreateServiceSchedule,
  useDeleteServiceSchedule,
  useReminderLogs,
  useServiceSchedule,
  useServiceSchedules,
  useUpdateContactStatus,
  useUpdateServiceSchedule,
} from "../use-service-reminders";

vi.mock("@zuiio/query", () => ({
  useOrgMutation: vi.fn(() => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
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

describe("useServiceSchedules", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  const sampleSchedules = [
    {
      id: "ss-1",
      organization_id: "org-1",
      branch_id: null,
      vehicle_id: "veh-1",
      service_catalog_id: null,
      service_name: "Oil Change",
      interval_months: 6,
      interval_km: 5000,
      last_service_date: "2024-09-01",
      last_service_odometer: 15000,
      next_due_date: "2025-03-01",
      next_due_km: 20000,
      reminder_enabled: true,
      notes: null,
      contact_status: "not_contacted",
      contacted_at: null,
      created_at: "2024-01-01T00:00:00Z",
      vehicle: {
        plate_number: "XYZ-789",
        make: "Toyota",
        model: "Camry",
        year: 2020,
      },
      service: { name: "Oil Change" },
    },
  ];

  it("returns schedules on success", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: sampleSchedules }),
    } as Response);

    const { result } = renderHook(() => useServiceSchedules("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(sampleSchedules);
  });

  it("passes vehicle_id param when vehicleId provided", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: sampleSchedules }),
    } as Response);

    renderHook(() => useServiceSchedules("org-1", "veh-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
    const calledUrl = fetchSpy.mock.calls[0][0] as string;
    expect(calledUrl).toContain("vehicle_id=veh-1");
  });

  it("passes branch_id param when branchId provided", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: sampleSchedules }),
    } as Response);

    renderHook(() => useServiceSchedules("org-1", undefined, "branch-42"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
    const calledUrl = fetchSpy.mock.calls[0][0] as string;
    expect(calledUrl).toContain("branch_id=branch-42");
  });

  it("passes both vehicle_id and branch_id when both provided", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: sampleSchedules }),
    } as Response);

    renderHook(() => useServiceSchedules("org-1", "veh-1", "branch-42"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
    const calledUrl = fetchSpy.mock.calls[0][0] as string;
    expect(calledUrl).toContain("vehicle_id=veh-1");
    expect(calledUrl).toContain("branch_id=branch-42");
  });

  it("does not fetch when orgId is missing", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(() => useServiceSchedules(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe("useServiceSchedule", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  const sampleSchedule = {
    id: "ss-1",
    organization_id: "org-1",
    branch_id: null,
    vehicle_id: "veh-1",
    service_catalog_id: null,
    service_name: "Oil Change",
    interval_months: 6,
    interval_km: 5000,
    last_service_date: "2024-09-01",
    last_service_odometer: 15000,
    next_due_date: "2025-03-01",
    next_due_km: 20000,
    reminder_enabled: true,
    notes: null,
    contact_status: "not_contacted",
    contacted_at: null,
    created_at: "2024-01-01T00:00:00Z",
    vehicle: {
      plate_number: "XYZ-789",
      make: "Toyota",
      model: "Camry",
      year: 2020,
      customer: {
        id: "cust-1",
        first_name: "Alice",
        last_name: null,
        phone: null,
      },
    },
    service: { name: "Oil Change" },
  };

  it("returns a single schedule on success", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: sampleSchedule }),
    } as Response);

    const { result } = renderHook(() => useServiceSchedule("org-1", "ss-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(sampleSchedule);
  });

  it("does not fetch when orgId is missing or id is empty", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result: noOrg } = renderHook(
      () => useServiceSchedule(undefined, "ss-1"),
      { wrapper: createWrapper() },
    );
    const { result: noId } = renderHook(() => useServiceSchedule("org-1", ""), {
      wrapper: createWrapper(),
    });

    expect(noOrg.current.isPending).toBe(true);
    expect(noId.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe("useReminderLogs", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  const sampleLogs = [
    {
      id: "rl-1",
      vehicle_id: "veh-1",
      customer_id: "cust-1",
      service_name: "Oil Change",
      reminder_type: "overdue",
      channel: "sms",
      status: "sent",
      scheduled_at: "2025-03-01T08:00:00Z",
      sent_at: "2025-03-01T08:05:00Z",
      created_at: "2025-03-01T08:00:00Z",
      vehicle: {
        plate_number: "XYZ-789",
        make: "Toyota",
        model: "Camry",
      },
      customer: {
        first_name: "Alice",
        last_name: null,
        phone: "555-0100",
      },
    },
  ];

  it("returns reminder logs on success", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: sampleLogs }),
    } as Response);

    const { result } = renderHook(() => useReminderLogs("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(sampleLogs);
  });

  it("passes vehicle_id and branch_id params", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: sampleLogs }),
    } as Response);

    renderHook(() => useReminderLogs("org-1", "veh-1", "branch-42"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
    const calledUrl = fetchSpy.mock.calls[0][0] as string;
    expect(calledUrl).toContain("vehicle_id=veh-1");
    expect(calledUrl).toContain("branch_id=branch-42");
  });

  it("does not fetch when orgId is missing", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(() => useReminderLogs(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe("useCreateServiceSchedule", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.clearAllMocks();
  });

  it("returns mutation object with expected API", () => {
    const { result } = renderHook(() => useCreateServiceSchedule("org-1"), {
      wrapper: createWrapper(),
    });

    expect(result.current).toBeDefined();
    expect(typeof result.current.mutate).toBe("function");
    expect(typeof result.current.mutateAsync).toBe("function");
    expect(result.current.isPending).toBe(false);
  });

  it("accepts undefined orgId", () => {
    const { result } = renderHook(() => useCreateServiceSchedule(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current).toBeDefined();
    expect(typeof result.current.mutateAsync).toBe("function");
  });
});

describe("useUpdateServiceSchedule", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.clearAllMocks();
  });

  it("returns mutation object with expected API", () => {
    const { result } = renderHook(() => useUpdateServiceSchedule("org-1"), {
      wrapper: createWrapper(),
    });

    expect(result.current).toBeDefined();
    expect(typeof result.current.mutate).toBe("function");
    expect(typeof result.current.mutateAsync).toBe("function");
    expect(result.current.isPending).toBe(false);
  });

  it("accepts undefined orgId", () => {
    const { result } = renderHook(() => useUpdateServiceSchedule(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current).toBeDefined();
    expect(typeof result.current.mutateAsync).toBe("function");
  });
});

describe("useDeleteServiceSchedule", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.clearAllMocks();
  });

  it("returns mutation object with expected API", () => {
    const { result } = renderHook(() => useDeleteServiceSchedule("org-1"), {
      wrapper: createWrapper(),
    });

    expect(result.current).toBeDefined();
    expect(typeof result.current.mutate).toBe("function");
    expect(typeof result.current.mutateAsync).toBe("function");
    expect(result.current.isPending).toBe(false);
  });

  it("accepts undefined orgId", () => {
    const { result } = renderHook(() => useDeleteServiceSchedule(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current).toBeDefined();
    expect(typeof result.current.mutateAsync).toBe("function");
  });
});

describe("useUpdateContactStatus", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.clearAllMocks();
  });

  it("returns mutation object with expected API", () => {
    const { result } = renderHook(() => useUpdateContactStatus("org-1"), {
      wrapper: createWrapper(),
    });

    expect(result.current).toBeDefined();
    expect(typeof result.current.mutate).toBe("function");
    expect(typeof result.current.mutateAsync).toBe("function");
    expect(result.current.isPending).toBe(false);
  });

  it("accepts undefined orgId", () => {
    const { result } = renderHook(() => useUpdateContactStatus(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current).toBeDefined();
    expect(typeof result.current.mutateAsync).toBe("function");
  });
});
