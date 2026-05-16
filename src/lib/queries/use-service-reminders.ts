import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UseQueryResult } from "@tanstack/react-query";
import { serviceReminderKeys } from "./keys";

export interface ServiceScheduleItem {
  id: string;
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
  created_at: string;
  vehicle: {
    plate_number: string;
    make: string;
    model: string;
    year: number | null;
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

export function useServiceSchedules(
  orgId: string | undefined,
  vehicleId?: string,
): UseQueryResult<ServiceScheduleItem[], Error> {
  return useQuery({
    queryKey: serviceReminderKeys.list(orgId ?? "", vehicleId),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (vehicleId) params.set("vehicle_id", vehicleId);
      const qs = params.toString();
      const url = `/api/organizations/${orgId}/service-reminders${qs ? `?${qs}` : ""}`;
      const res = await fetch(url);
      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error?.message ?? `Failed to load (${res.status})`);
      }
      return (json.data ?? []) as ServiceScheduleItem[];
    },
    enabled: !!orgId,
    staleTime: 15_000,
  });
}

export function useServiceSchedule(
  orgId: string | undefined,
  id: string,
): UseQueryResult<ServiceScheduleItem, Error> {
  return useQuery({
    queryKey: serviceReminderKeys.detail(orgId ?? "", id),
    queryFn: async () => {
      const res = await fetch(
        `/api/organizations/${orgId}/service-reminders/${id}`,
      );
      if (!res.ok) throw new Error("Failed to load service schedule");
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      return json.data as ServiceScheduleItem;
    },
    enabled: !!orgId && !!id,
  });
}

export function useReminderLogs(
  orgId: string | undefined,
  vehicleId?: string,
): UseQueryResult<ReminderLogItem[], Error> {
  return useQuery({
    queryKey: serviceReminderKeys.logs(orgId ?? "", vehicleId),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (vehicleId) params.set("vehicle_id", vehicleId);
      const qs = params.toString();
      const url = `/api/organizations/${orgId}/service-reminder-logs${qs ? `?${qs}` : ""}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to load reminder logs");
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      return (json.data ?? []) as ReminderLogItem[];
    },
    enabled: !!orgId,
    staleTime: 30_000,
  });
}

export function useCreateServiceSchedule(orgId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
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
    }) => {
      const res = await fetch(`/api/organizations/${orgId}/service-reminders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message ?? "Failed to create schedule");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: serviceReminderKeys.all(orgId ?? ""),
      });
    },
  });
}

export function useUpdateServiceSchedule(orgId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...payload
    }: {
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
    }) => {
      const res = await fetch(
        `/api/organizations/${orgId}/service-reminders/${id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message ?? "Failed to update schedule");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: serviceReminderKeys.all(orgId ?? ""),
      });
    },
  });
}

export function useDeleteServiceSchedule(orgId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(
        `/api/organizations/${orgId}/service-reminders/${id}`,
        { method: "DELETE" },
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message ?? "Failed to delete schedule");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: serviceReminderKeys.all(orgId ?? ""),
      });
    },
  });
}
