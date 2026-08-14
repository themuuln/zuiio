import type { UseQueryResult } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { useOrgMutation } from "@zuiio/query";
import { createOrgQuery } from "./factory";
import { serviceReminderKeys } from "./keys";

export interface ServiceScheduleItem {
  id: string;
  organization_id: string;
  branch_id: string | null;
  vehicle_id: string;
  service_catalog_id: string | null;
  service_name: string;
  interval_months: number | null;
  interval_km: number | null;
  last_service_date: string | null;
  last_service_odometer: number | null;
  next_due_date: string | null;
  next_due_km: number | null;
  reminder_enabled: boolean;
  notes: string | null;
  contact_status: string;
  contacted_at: string | null;
  created_at: string;
  vehicle: {
    plate_number: string;
    make: string;
    model: string;
    year: number | null;
    customer?: {
      id: string;
      first_name: string | null;
      last_name: string | null;
      phone: string | null;
    } | null;
  } | null;
  service: { name: string } | null;
}

export interface ReminderLogItem {
  id: string;
  vehicle_id: string;
  customer_id: string | null;
  service_name: string;
  reminder_type: string;
  channel: string;
  status: string;
  scheduled_at: string;
  sent_at: string | null;
  created_at: string;
  vehicle: { plate_number: string; make: string; model: string } | null;
  customer: {
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
  } | null;
}

const fetchSchedules =
  createOrgQuery<ServiceScheduleItem[]>("/service-reminders");

export function useServiceSchedules(
  orgId: string | undefined,
  vehicleId?: string,
  branchId?: string | null,
): UseQueryResult<ServiceScheduleItem[], Error> {
  return useQuery({
    queryKey: serviceReminderKeys.list(
      orgId ?? "",
      vehicleId,
      branchId ?? "all",
    ),
    queryFn: () => {
      if (!orgId) throw new Error("orgId required");
      return fetchSchedules(orgId, {
        params: {
          ...(vehicleId ? { vehicle_id: vehicleId } : {}),
          ...(branchId ? { branch_id: branchId } : {}),
        },
      });
    },
    enabled: !!orgId,
    staleTime: 30_000,
  });
}

export function useServiceSchedule(
  orgId: string | undefined,
  id: string,
): UseQueryResult<ServiceScheduleItem, Error> {
  const fetchSchedule = createOrgQuery<ServiceScheduleItem>(
    `/service-reminders/${id}`,
  );
  return useQuery({
    queryKey: serviceReminderKeys.detail(orgId ?? "", id),
    queryFn: () => {
      if (!orgId) throw new Error("orgId required");
      return fetchSchedule(orgId);
    },
    enabled: !!orgId && !!id,
    staleTime: 30_000,
  });
}

const fetchReminderLogs = createOrgQuery<ReminderLogItem[]>(
  "/service-reminder-logs",
);

export function useReminderLogs(
  orgId: string | undefined,
  vehicleId?: string,
  branchId?: string | null,
): UseQueryResult<ReminderLogItem[], Error> {
  return useQuery({
    queryKey: serviceReminderKeys.logs(
      orgId ?? "",
      vehicleId,
      branchId ?? "all",
    ),
    queryFn: () => {
      if (!orgId) throw new Error("orgId required");
      return fetchReminderLogs(orgId, {
        params: {
          ...(vehicleId ? { vehicle_id: vehicleId } : {}),
          ...(branchId ? { branch_id: branchId } : {}),
        },
      });
    },
    enabled: !!orgId,
    staleTime: 30_000,
  });
}

export function useCreateServiceSchedule(orgId: string | undefined) {
  return useOrgMutation<
    ServiceScheduleItem,
    {
      vehicle_id?: string;
      service_catalog_id?: string;
      service_name: string;
      interval_months?: number | null;
      interval_km?: number | null;
      last_service_date?: string | null;
      last_service_odometer?: number | null;
      next_due_date?: string | null;
      next_due_km?: number | null;
      notes?: string;
    }
  >({
    endpoint: `/api/organizations/${orgId}/service-reminders`,
    method: "POST",
    queryKey: serviceReminderKeys.all(orgId ?? ""),
    optimisticMode: "prefix",
    optimisticUpdate: (cached, payload, ctx) => {
      const optimistic: ServiceScheduleItem = {
        id: ctx.optimisticId,
        organization_id: orgId ?? "",
        branch_id: null,
        vehicle_id: payload.vehicle_id ?? "",
        service_catalog_id: payload.service_catalog_id ?? null,
        service_name: payload.service_name,
        interval_months: payload.interval_months ?? null,
        interval_km: payload.interval_km ?? null,
        last_service_date: payload.last_service_date ?? null,
        last_service_odometer: payload.last_service_odometer ?? null,
        next_due_date: payload.next_due_date ?? null,
        next_due_km: payload.next_due_km ?? null,
        reminder_enabled: true,
        notes: payload.notes ?? null,
        contact_status: "pending",
        contacted_at: null,
        created_at: new Date().toISOString(),
        vehicle: null,
        service: null,
      };
      return [...cached, optimistic];
    },
    successMessage: "Schedule created",
  });
}

export function useUpdateServiceSchedule(orgId: string | undefined) {
  return useOrgMutation<
    ServiceScheduleItem,
    {
      id: string;
      service_name?: string;
      interval_months?: number | null;
      interval_km?: number | null;
      last_service_date?: string | null;
      last_service_odometer?: number | null;
      next_due_date?: string | null;
      next_due_km?: number | null;
      reminder_enabled?: boolean;
      notes?: string | null;
    }
  >({
    endpoint: ({ id }) => `/api/organizations/${orgId}/service-reminders/${id}`,
    method: "PATCH",
    queryKey: serviceReminderKeys.all(orgId ?? ""),
    bodyFn: ({ id: _id, ...payload }) => payload,
    optimisticMode: "prefix",
    optimisticUpdate: (cached, { id, ...payload }) =>
      cached.map((item) => (item.id === id ? { ...item, ...payload } : item)),
    successMessage: "Schedule updated",
  });
}

export function useDeleteServiceSchedule(orgId: string | undefined) {
  return useOrgMutation<ServiceScheduleItem, string>({
    endpoint: (id) => `/api/organizations/${orgId}/service-reminders/${id}`,
    method: "DELETE",
    queryKey: serviceReminderKeys.all(orgId ?? ""),
    optimisticMode: "prefix",
    optimisticUpdate: (cached, id) => cached.filter((item) => item.id !== id),
    successMessage: "Schedule deleted",
  });
}

export function useUpdateContactStatus(orgId: string | undefined) {
  return useOrgMutation<ServiceScheduleItem, { id: string; status: string }>({
    endpoint: ({ id }) => `/api/organizations/${orgId}/service-reminders/${id}`,
    method: "PATCH",
    queryKey: serviceReminderKeys.all(orgId ?? ""),
    bodyFn: ({ status }) => ({
      contact_status: status,
      contacted_at: new Date().toISOString(),
    }),
    optimisticMode: "prefix",
    optimisticUpdate: (cached, { id, status }) =>
      cached.map((item) =>
        item.id === id
          ? {
              ...item,
              contact_status: status,
              contacted_at: new Date().toISOString(),
            }
          : item,
      ),
    successMessage: "Contact status updated",
  });
}
