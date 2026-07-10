"use client";

import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useOrgMutation } from "@zuiio/query";
import type { AppointmentDetail } from "@/lib/types";
import { createOrgQuery } from "./factory";
import { appointmentKeys } from "./keys";

// ── Types ──────────────────────────────────────────────────────────

export type AppointmentStatus =
  | "scheduled"
  | "in-progress"
  | "completed"
  | "cancelled";

// ── Fetchers ───────────────────────────────────────────────────────

const fetchAppointments = createOrgQuery<AppointmentDetail[]>("/appointments");

// ── Hooks ──────────────────────────────────────────────────────────

export function useAppointments(
  orgId: string | undefined,
  date: string,
  branchId?: string | null,
  dateRange?: { from: string; to: string },
): UseQueryResult<AppointmentDetail[], Error> {
  return useQuery({
    queryKey: appointmentKeys.list(orgId ?? "", date, branchId, dateRange),
    queryFn: () =>
      fetchAppointments(orgId!, {
        params: {
          date,
          ...(dateRange
            ? { date_from: dateRange.from, date_to: dateRange.to }
            : {}),
          ...(branchId ? { branch_id: branchId } : {}),
        },
      }),
    enabled: !!orgId && (!!date || !!dateRange),
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
