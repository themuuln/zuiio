import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AppointmentDetail } from "@/lib/types";
import { appointmentKeys } from "../keys";
import { useAppointments } from "../use-appointments";

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

  const sampleAppointments: AppointmentDetail[] = [
    {
      id: "apt-1",
      title: "Oil Change Appointment",
      notes: null,
      description: null,
      scheduled_at: "2024-02-01T09:00:00Z",
      end_at: null,
      status: "scheduled",
      customer_id: "cust-1",
      vehicle_id: "veh-1",
      mechanic_id: "mech-1",
      branch_id: null,
      source_estimate_id: null,
      organization_id: "org-1",
      created_at: "2024-02-01T08:00:00Z",
      updated_at: "2024-02-01T08:00:00Z",
      created_by: null,
      updated_by: null,
      deleted_at: null,
      customer: {
        id: "cust-1",
        full_name: "Alice",
        phone: null,
        email: null,
        first_name: "Alice",
        last_name: null,
        organization_id: "org-1",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        deleted_at: null,
        notes: null,
        address: null,
        company_name: null,
        contact_person: null,
        customer_user_id: null,
        branch_id: null,
        last_visit_at: null,
        portal_token: null,
        source: null,
        tags: null,
        total_visits: 0,
        type: null,
        created_by: null,
        updated_by: null,
      },
      vehicle: {
        id: "veh-1",
        plate_number: "XYZ-789",
        make: "Toyota",
        model: "Camry",
        organization_id: "org-1",
        customer_id: "cust-1",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        deleted_at: null,
        color: null,
        notes: null,
        body_type: null,
        branch_id: null,
        category: null,
        chassis_number: null,
        country_of_origin: null,
        drivetrain: null,
        engine: null,
        fuel_type: null,
        height: null,
        import_date: null,
        inspection_notes: null,
        last_service_branch_id: null,
        last_visit_at: null,
        last_visit_date: null,
        length: null,
        license_expiry: null,
        license_expiry_at: null,
        next_service_at: null,
        next_service_date: null,
        odometer: null,
        seats: null,
        created_by: null,
        updated_by: null,
      },
      estimate: null,
      mechanic: { id: "mech-1", full_name: "Bob" },
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
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
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
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
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
    const { result: noDate } = renderHook(() => useAppointments("org-1", ""), {
      wrapper: createWrapper(),
    });

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
