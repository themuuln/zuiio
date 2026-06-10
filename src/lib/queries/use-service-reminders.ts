import type { UseQueryResult } from "@tanstack/react-query";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useOnlineStatus } from "@/lib/hooks/use-online-status";
import { useMutationQueue } from "@/lib/offline/mutation-queue-provider";
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
    queryFn: () =>
      fetchSchedules(orgId!, {
        params: {
          ...(vehicleId ? { vehicle_id: vehicleId } : {}),
          ...(branchId ? { branch_id: branchId } : {}),
        },
      }),
    enabled: !!orgId,
    staleTime: 15_000,
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
    queryFn: () => fetchSchedule(orgId!),
    enabled: !!orgId && !!id,
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
    queryFn: () =>
      fetchReminderLogs(orgId!, {
        params: {
          ...(vehicleId ? { vehicle_id: vehicleId } : {}),
          ...(branchId ? { branch_id: branchId } : {}),
        },
      }),
    enabled: !!orgId,
    staleTime: 30_000,
  });
}

export function useCreateServiceSchedule(orgId: string | undefined) {
  const queryClient = useQueryClient();
  const isOnline = useOnlineStatus();
  const queue = useMutationQueue();

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
      if (isOnline) {
        const res = await fetch(
          `/api/organizations/${orgId}/service-reminders`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          },
        );
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error?.message ?? "Failed to create schedule");
        }
        return res.json();
      }

      await queue.enqueue({
        endpoint: `/api/organizations/${orgId}/service-reminders`,
        method: "POST",
        body: payload,
        queryKeysToInvalidate: [[...serviceReminderKeys.all(orgId ?? "")]],
      });
      return { queued: true } as unknown as unknown;
    },
    onMutate: async (payload) => {
      const key = serviceReminderKeys.all(orgId ?? "");
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<ServiceScheduleItem[]>(key);

      if (previous) {
        const optimistic: ServiceScheduleItem = {
          id: `temp-${Date.now()}`,
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
        queryClient.setQueryData<ServiceScheduleItem[]>(key, [
          ...previous,
          optimistic,
        ]);
      }

      return { previous };
    },
    onError: (_err, _payload, context) => {
      const key = serviceReminderKeys.all(orgId ?? "");
      if (context?.previous) {
        queryClient.setQueryData(key, context.previous);
      }
      toast.dismiss();
      toast.error("Failed to create schedule");
    },
    onSettled: (data) => {
      const d = data as unknown as Record<string, unknown>;
      const key = serviceReminderKeys.all(orgId ?? "");
      queryClient.invalidateQueries({ queryKey: key });
      if (!d?.queued) {
        toast.dismiss();
        toast.success("Schedule created");
      } else {
        toast.dismiss();
        toast.info("Saved offline — will sync when connected");
      }
    },
  });
}

export function useUpdateServiceSchedule(orgId: string | undefined) {
  const queryClient = useQueryClient();
  const isOnline = useOnlineStatus();
  const queue = useMutationQueue();

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
      if (isOnline) {
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
      }

      await queue.enqueue({
        endpoint: `/api/organizations/${orgId}/service-reminders/${id}`,
        method: "PATCH",
        body: payload,
        queryKeysToInvalidate: [[...serviceReminderKeys.all(orgId ?? "")]],
      });
      return { queued: true } as unknown as unknown;
    },
    onMutate: async ({ id, ...payload }) => {
      const key = serviceReminderKeys.all(orgId ?? "");
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<ServiceScheduleItem[]>(key);

      if (previous) {
        queryClient.setQueryData<ServiceScheduleItem[]>(
          key,
          previous.map((item) =>
            item.id === id ? { ...item, ...payload } : item,
          ),
        );
      }

      return { previous };
    },
    onError: (_err, _payload, context) => {
      const key = serviceReminderKeys.all(orgId ?? "");
      if (context?.previous) {
        queryClient.setQueryData(key, context.previous);
      }
      toast.dismiss();
      toast.error("Failed to update schedule");
    },
    onSettled: (data) => {
      const d = data as unknown as Record<string, unknown>;
      const key = serviceReminderKeys.all(orgId ?? "");
      queryClient.invalidateQueries({ queryKey: key });
      if (!d?.queued) {
        toast.dismiss();
        toast.success("Schedule updated");
      } else {
        toast.dismiss();
        toast.info("Saved offline — will sync when connected");
      }
    },
  });
}

export function useDeleteServiceSchedule(orgId: string | undefined) {
  const queryClient = useQueryClient();
  const isOnline = useOnlineStatus();
  const queue = useMutationQueue();

  return useMutation({
    mutationFn: async (id: string) => {
      if (isOnline) {
        const res = await fetch(
          `/api/organizations/${orgId}/service-reminders/${id}`,
          { method: "DELETE" },
        );
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error?.message ?? "Failed to delete schedule");
        }
        return;
      }

      await queue.enqueue({
        endpoint: `/api/organizations/${orgId}/service-reminders/${id}`,
        method: "DELETE",
        body: undefined,
        queryKeysToInvalidate: [[...serviceReminderKeys.all(orgId ?? "")]],
      });
    },
    onMutate: async (id) => {
      const key = serviceReminderKeys.all(orgId ?? "");
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<ServiceScheduleItem[]>(key);

      if (previous) {
        queryClient.setQueryData<ServiceScheduleItem[]>(
          key,
          previous.filter((item) => item.id !== id),
        );
      }

      return { previous };
    },
    onError: (_err, _id, context) => {
      const key = serviceReminderKeys.all(orgId ?? "");
      if (context?.previous) {
        queryClient.setQueryData(key, context.previous);
      }
      toast.dismiss();
      toast.error("Failed to delete schedule");
    },
    onSettled: (data) => {
      const d = data as unknown as Record<string, unknown> | undefined;
      const key = serviceReminderKeys.all(orgId ?? "");
      queryClient.invalidateQueries({ queryKey: key });
      if (!d?.queued) {
        toast.dismiss();
        toast.success("Schedule deleted");
      } else {
        toast.dismiss();
        toast.info("Saved offline — will sync when connected");
      }
    },
  });
}

export function useUpdateContactStatus(orgId: string | undefined) {
  const queryClient = useQueryClient();
  const isOnline = useOnlineStatus();
  const queue = useMutationQueue();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      if (isOnline) {
        const res = await fetch(
          `/api/organizations/${orgId}/service-reminders/${id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contact_status: status,
              contacted_at: new Date().toISOString(),
            }),
          },
        );
        if (!res.ok) {
          const err = await res.json();
          throw new Error(
            err.error?.message ?? "Failed to update contact status",
          );
        }
        return res.json();
      }

      return queue.enqueue({
        endpoint: `/api/organizations/${orgId}/service-reminders/${id}`,
        method: "PATCH",
        body: {
          contact_status: status,
          contacted_at: new Date().toISOString(),
        },
        queryKeysToInvalidate: [["serviceReminders", orgId ?? ""]],
      });
    },
    onMutate: async ({ id, status }) => {
      const key = serviceReminderKeys.all(orgId ?? "");
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<ServiceScheduleItem[]>(key);

      if (previous) {
        queryClient.setQueryData<ServiceScheduleItem[]>(
          key,
          previous.map((item) =>
            item.id === id
              ? {
                  ...item,
                  contact_status: status,
                  contacted_at: new Date().toISOString(),
                }
              : item,
          ),
        );
      }

      return { previous };
    },
    onError: (_err, _payload, context) => {
      const key = serviceReminderKeys.all(orgId ?? "");
      if (context?.previous) {
        queryClient.setQueryData(key, context.previous);
      }
      toast.dismiss();
      toast.error("Failed to update contact status");
    },
    onSettled: (data) => {
      const d = data as unknown as Record<string, unknown>;
      const key = serviceReminderKeys.all(orgId ?? "");
      queryClient.invalidateQueries({ queryKey: key });
      if (!d?.queued) {
        toast.dismiss();
        toast.success("Contact status updated");
      } else {
        toast.dismiss();
        toast.info("Saved offline — will sync when connected");
      }
    },
  });
}
