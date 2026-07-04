import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import {
  useAppointments,
  type Appointment,
} from "../use-appointments";
import { appointmentKeys } from "../keys";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

function createWrapper() {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("useAppointments", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  const sampleAppointments: Appointment[] = [
    {
      id: "apt-1",
      customer_name: "Alice",
      vehicle_plate: "XYZ-789",
      service_description: "Oil change",
      status: "scheduled",
      scheduled_at: "2024-02-01T09:00:00Z",
      notes: null,
    },
  ];

  it("returns appointments on success", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: sampleAppointments }),
    } as Response);

    const { result } = renderHook(
      () => useAppointments("org-1", "2024-02-01"),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(sampleAppointments);
  });

  it("appends branch_id param when branchId is provided", async () => {
    const fetchSpy = vi
      .spyOn(global, "fetch")
      .mockResolvedValue({
        ok: true,
        json: async () => ({ data: sampleAppointments }),
      } as Response);

    renderHook(() => useAppointments("org-1", "2024-02-01", "branch-42"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));

    const calledUrl = fetchSpy.mock.calls[0][0] as string;
    expect(calledUrl).toContain("branch_id=branch-42");
  });

  it("omits branch_id param when branchId is not provided", async () => {
    const fetchSpy = vi
      .spyOn(global, "fetch")
      .mockResolvedValue({
        ok: true,
        json: async () => ({ data: sampleAppointments }),
      } as Response);

    renderHook(() => useAppointments("org-1", "2024-02-01"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));

    const calledUrl = fetchSpy.mock.calls[0][0] as string;
    expect(calledUrl).not.toContain("branch_id");
  });

  it("does not fetch when orgId or date is missing", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result: noOrg } = renderHook(
      () => useAppointments(undefined, "2024-02-01"),
      { wrapper: createWrapper() },
    );
    const { result: noDate } = renderHook(
      () => useAppointments("org-1", ""),
      { wrapper: createWrapper() },
    );

    expect(noOrg.current.isPending).toBe(true);
    expect(noDate.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("handles fetch error", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: false,
      status: 500,
    } as Response);

    const { result } = renderHook(
      () => useAppointments("org-1", "2024-02-01"),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("appointmentKeys", () => {
  it("constructs correct key shapes", () => {
    expect(appointmentKeys.all("org-1")).toEqual([
      "organizations",
      "org-1",
      "appointments",
    ]);
    expect(appointmentKeys.list("org-1", "2024-02-01")).toEqual([
      "organizations",
      "org-1",
      "appointments",
      "list",
      "2024-02-01",
      "all",
    ]);
    expect(appointmentKeys.list("org-1", "2024-02-01", "branch-42")).toEqual([
      "organizations",
      "org-1",
      "appointments",
      "list",
      "2024-02-01",
      "branch-42",
    ]);
  });
});
