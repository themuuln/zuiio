"use client";

import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { createOrgQuery } from "./factory";
import { appointmentKeys } from "./keys";
import { useOrgMutation } from "@zuiio/query";

// ── Types ──────────────────────────────────────────────────────────

export type AppointmentStatus =
  | "scheduled"
  | "in-progress"
  | "completed"
  | "cancelled";

export interface Appointment {
  id: string;
  customer_name: string;
  vehicle_plate: string;
  service_description: string;
  status: AppointmentStatus;
  scheduled_at: string;
  notes: string | null;
}

// ── Fetchers ───────────────────────────────────────────────────────

const fetchAppointments = createOrgQuery<Appointment[]>("/appointments");

// ── Hooks ──────────────────────────────────────────────────────────

export function useAppointments(
  orgId: string | undefined,
  date: string,
  branchId?: string | null,
): UseQueryResult<Appointment[], Error> {
  return useQuery({
    queryKey: appointmentKeys.list(orgId ?? "", date, branchId),
    queryFn: () =>
      fetchAppointments(orgId!, {
        params: {
          date,
          ...(branchId ? { branch_id: branchId } : {}),
        },
      }),
    enabled: !!orgId && !!date,
    staleTime: 30_000,
  });
}

// ── Mutations ──────────────────────────────────────────────────────

interface UpdateStatusVariables {
  id: string;
  status: AppointmentStatus;
}

export function useUpdateAppointmentStatus(orgId: string | undefined) {
  return useOrgMutation<unknown, UpdateStatusVariables>({
    endpoint: (vars) => `/api/organizations/${orgId}/appointments/${vars.id}`,
    method: "PATCH",
    queryKey: appointmentKeys.all(orgId ?? ""),
    bodyFn: (vars) => ({ status: vars.status }),
    successMessage: "Appointment updated",
  });
}

export function useDeleteAppointment(orgId: string | undefined) {
  return useOrgMutation<unknown, { id: string }>({
    endpoint: (vars) => `/api/organizations/${orgId}/appointments/${vars.id}`,
    method: "DELETE",
    queryKey: appointmentKeys.all(orgId ?? ""),
    successMessage: "Appointment cancelled",
  });
}
