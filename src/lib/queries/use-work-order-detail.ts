import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useOnlineStatus } from "@/lib/hooks/use-online-status";
import { useMutationQueue } from "@/lib/offline/mutation-queue-provider";
import { toastRetry } from "@/lib/toast-utils";
import type { ServiceCatalog, WorkOrderDetail } from "@/lib/types";
import { createOrgQuery } from "./factory";
import {
  inventoryKeys,
  mechanicKeys,
  serviceKeys,
  workOrderKeys,
} from "./keys";

export async function fetchServicePriceHistory(
  orgId: string,
  serviceCatalogId: string,
  vehicleMake?: string,
  vehicleModel?: string,
): Promise<number[]> {
  const params = new URLSearchParams({ service_catalog_id: serviceCatalogId });
  if (vehicleMake) params.set("vehicle_make", vehicleMake);
  if (vehicleModel) params.set("vehicle_model", vehicleModel);

  const res = await fetch(
    `/api/organizations/${orgId}/price-history/service?${params.toString()}`,
  );
  const json = await res.json();
  if (!res.ok) throw new Error("Failed to load service price history");
  if (json.error) throw new Error(json.error.message);

  const data = json.data as { unit_price: number | string | null }[] | null;
  return (data ?? []).flatMap((row) => {
    const price = Number(row.unit_price ?? 0);
    return price ? [price] : [];
  });
}

export async function fetchPartPriceHistory(
  orgId: string,
  partName: string,
  vehicleMake?: string,
): Promise<number[]> {
  const params = new URLSearchParams({ part_name: partName });
  if (vehicleMake) params.set("vehicle_make", vehicleMake);

  const res = await fetch(
    `/api/organizations/${orgId}/price-history/part?${params.toString()}`,
  );
  const json = await res.json();
  if (!res.ok) throw new Error("Failed to load part price history");
  if (json.error) throw new Error(json.error.message);

  const data = json.data as { unit_price: number | string | null }[] | null;
  return (data ?? []).flatMap((row) => {
    const price = Number(row.unit_price ?? 0);
    return price ? [price] : [];
  });
}

export function useWorkOrderDetail(orgId: string | undefined, woId: string) {
  const fetchWorkOrder = createOrgQuery<WorkOrderDetail>(
    `/work-orders/${woId}`,
  );
  return useQuery({
    queryKey: workOrderKeys.detail(orgId ?? "", woId),
    queryFn: () => fetchWorkOrder(orgId!),
    enabled: !!orgId,
    staleTime: 15_000,
  });
}

const fetchServiceCatalog = createOrgQuery<ServiceCatalog[]>("/services");

export function useServiceCatalog(orgId: string | undefined) {
  return useQuery({
    queryKey: serviceKeys.list(orgId ?? ""),
    queryFn: () => fetchServiceCatalog(orgId!),
    enabled: !!orgId,
    staleTime: 300_000, // 5 min — catalog rarely changes after setup
  });
}

const fetchMechanicsList =
  createOrgQuery<
    {
      id: string;
      full_name: string;
    }[]
  >("/reports");

export function useMechanicsList(orgId: string | undefined) {
  return useQuery({
    queryKey: mechanicKeys.list(orgId ?? ""),
    queryFn: () =>
      fetchMechanicsList(orgId!, { params: { type: "mechanics" } }),
    enabled: !!orgId,
    staleTime: 60_000,
  });
}

export function useServicePriceHistory(
  orgId: string | undefined,
  serviceCatalogId: string | undefined,
  vehicleMake?: string,
  vehicleModel?: string,
) {
  return useQuery({
    queryKey: [
      ...workOrderKeys.all(orgId ?? ""),
      "service-price-history",
      serviceCatalogId ?? "",
      vehicleMake ?? "",
      vehicleModel ?? "",
    ],
    queryFn: async () =>
      fetchServicePriceHistory(
        orgId as string,
        serviceCatalogId as string,
        vehicleMake,
        vehicleModel,
      ),
    enabled: !!orgId && !!serviceCatalogId,
    staleTime: 30_000,
    retry: 1,
  });
}

export function usePartPriceHistory(
  orgId: string | undefined,
  partName: string | undefined,
  vehicleMake?: string,
) {
  return useQuery({
    queryKey: [
      ...workOrderKeys.all(orgId ?? ""),
      "part-price-history",
      partName ?? "",
      vehicleMake ?? "",
    ],
    queryFn: async () =>
      fetchPartPriceHistory(orgId as string, partName as string, vehicleMake),
    enabled: !!orgId && !!partName && partName.length >= 2,
    staleTime: 30_000,
    retry: 1,
  });
}

export function useUpdateWorkOrderStatus(orgId: string | undefined) {
  const queryClient = useQueryClient();
  const isOnline = useOnlineStatus();
  const queue = useMutationQueue();

  const mutation = useMutation({
    mutationFn: async ({
      woId,
      status,
      notes,
      loss_reason,
    }: {
      woId: string;
      status: string;
      notes?: string;
      loss_reason?: string;
    }) => {
      if (isOnline) {
        const res = await fetch(
          `/api/organizations/${orgId}/work-orders/${woId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status, notes, loss_reason }),
          },
        );
        const json = await res.json();
        if (json.error) throw new Error(json.error.message);
        return json.data as WorkOrderDetail;
      }

      await queue.enqueue({
        endpoint: `/api/organizations/${orgId}/work-orders/${woId}`,
        method: "PATCH",
        body: { status, notes, loss_reason },
        queryKeysToInvalidate: [[...workOrderKeys.all(orgId ?? "")]],
      });
      return { queued: true } as unknown as WorkOrderDetail;
    },
    onMutate: async (variables) => {
      const detailKey = workOrderKeys.detail(orgId ?? "", variables.woId);
      await queryClient.cancelQueries({ queryKey: detailKey });
      const previous = queryClient.getQueryData<WorkOrderDetail>(detailKey);
      if (previous) {
        queryClient.setQueryData<WorkOrderDetail>(detailKey, {
          ...previous,
          status: variables.status,
          notes: variables.notes ?? previous.notes,
          loss_reason: variables.loss_reason ?? previous.loss_reason,
          updated_at: new Date().toISOString(),
        });
      }
      return { previous };
    },
    onSuccess: (data, variables) => {
      const d = data as unknown as Record<string, unknown>;
      if (d?.queued) {
        toast.info("Saved offline — will sync when connected");
      } else {
        queryClient.invalidateQueries({
          queryKey: workOrderKeys.detail(orgId ?? "", variables.woId),
        });
        queryClient.invalidateQueries({
          queryKey: workOrderKeys.all(orgId ?? ""),
        });

        // Invalidate inventory cache when WO is completed
        if (variables.status === "Completed") {
          queryClient.invalidateQueries({
            queryKey: inventoryKeys.balances(orgId ?? ""),
          });
          queryClient.invalidateQueries({
            queryKey: inventoryKeys.movements(orgId ?? ""),
          });
        }

        toast.success(`Status changed to ${variables.status}`);
      }
    },
    onError: (err: Error, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          workOrderKeys.detail(orgId ?? "", variables.woId),
          context.previous,
        );
      }
      toastRetry(err.message, () => mutation.mutateAsync(variables));
    },
  });
  return mutation;
}

export function useAssignMechanic(orgId: string | undefined) {
  const queryClient = useQueryClient();
  const isOnline = useOnlineStatus();
  const queue = useMutationQueue();

  const mutation = useMutation({
    mutationFn: async ({
      woId,
      mechanicId,
    }: {
      woId: string;
      mechanicId: string | null;
    }) => {
      if (isOnline) {
        const res = await fetch(
          `/api/organizations/${orgId}/work-orders/${woId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ mechanic_id: mechanicId }),
          },
        );
        const json = await res.json();
        if (json.error) throw new Error(json.error.message);
        return json.data as WorkOrderDetail;
      }

      await queue.enqueue({
        endpoint: `/api/organizations/${orgId}/work-orders/${woId}`,
        method: "PATCH",
        body: { mechanic_id: mechanicId },
        queryKeysToInvalidate: [[...workOrderKeys.all(orgId ?? "")]],
      });
      return { queued: true } as unknown as WorkOrderDetail;
    },
    onMutate: async (variables) => {
      const detailKey = workOrderKeys.detail(orgId ?? "", variables.woId);
      await queryClient.cancelQueries({ queryKey: detailKey });
      const previous = queryClient.getQueryData<WorkOrderDetail>(detailKey);
      if (previous) {
        queryClient.setQueryData<WorkOrderDetail>(detailKey, {
          ...previous,
          mechanic_id: variables.mechanicId,
          updated_at: new Date().toISOString(),
        });
      }
      return { previous };
    },
    onSuccess: (data, variables) => {
      const d = data as unknown as Record<string, unknown>;
      if (d?.queued) {
        toast.info("Saved offline — will sync when connected");
      } else {
        queryClient.invalidateQueries({
          queryKey: workOrderKeys.detail(orgId ?? "", variables.woId),
        });
        queryClient.invalidateQueries({
          queryKey: workOrderKeys.all(orgId ?? ""),
        });
        toast.success("Mechanic assigned");
      }
    },
    onError: (err: Error, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          workOrderKeys.detail(orgId ?? "", variables.woId),
          context.previous,
        );
      }
      toastRetry(err.message, () => mutation.mutateAsync(variables));
    },
  });
  return mutation;
}

export function useAddService(orgId: string | undefined) {
  const queryClient = useQueryClient();
  const isOnline = useOnlineStatus();
  const queue = useMutationQueue();

  const mutation = useMutation({
    mutationFn: async ({
      woId,
      body,
    }: {
      woId: string;
      body: {
        service_catalog_id: string;
        service_name: string;
        quantity: number;
        unit_price: number;
      };
    }) => {
      if (isOnline) {
        const res = await fetch(
          `/api/organizations/${orgId}/work-orders/${woId}/services`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          },
        );
        const json = await res.json();
        if (json.error) throw new Error(json.error.message);
        return json.data;
      }

      await queue.enqueue({
        endpoint: `/api/organizations/${orgId}/work-orders/${woId}/services`,
        method: "POST",
        body,
        queryKeysToInvalidate: [[...workOrderKeys.all(orgId ?? "")]],
      });
      return { queued: true } as unknown as unknown;
    },
    onMutate: async (variables) => {
      // Cancel outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({
        queryKey: workOrderKeys.detail(orgId ?? "", variables.woId),
      });
    },
    onSuccess: (data, variables) => {
      const d = data as unknown as Record<string, unknown>;
      if (d?.queued) {
        toast.info("Saved offline — will sync when connected");
      } else {
        queryClient.invalidateQueries({
          queryKey: workOrderKeys.detail(orgId ?? "", variables.woId),
        });
        queryClient.invalidateQueries({
          queryKey: workOrderKeys.all(orgId ?? ""),
        });
        toast.success("Service added");
      }
    },
    onError: (err: Error, variables) => {
      toastRetry(err.message, () => mutation.mutateAsync(variables));
    },
  });
  return mutation;
}

export function useRemoveService(orgId: string | undefined) {
  const queryClient = useQueryClient();
  const isOnline = useOnlineStatus();
  const queue = useMutationQueue();

  const mutation = useMutation({
    mutationFn: async ({
      woId,
      serviceId,
    }: {
      woId: string;
      serviceId: string;
    }) => {
      if (isOnline) {
        const res = await fetch(
          `/api/organizations/${orgId}/work-orders/${woId}/services`,
          {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: serviceId }),
          },
        );
        const json = await res.json();
        if (json.error) throw new Error(json.error.message);
        return json.data;
      }

      await queue.enqueue({
        endpoint: `/api/organizations/${orgId}/work-orders/${woId}/services`,
        method: "DELETE",
        body: { id: serviceId },
        queryKeysToInvalidate: [[...workOrderKeys.all(orgId ?? "")]],
      });
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({
        queryKey: workOrderKeys.detail(orgId ?? "", variables.woId),
      });
    },
    onSuccess: (data, variables) => {
      const d = data as unknown as Record<string, unknown> | undefined;
      if (d?.queued) {
        toast.info("Saved offline — will sync when connected");
      } else {
        queryClient.invalidateQueries({
          queryKey: workOrderKeys.detail(orgId ?? "", variables.woId),
        });
        queryClient.invalidateQueries({
          queryKey: workOrderKeys.all(orgId ?? ""),
        });
        toast.success("Service removed");
      }
    },
    onError: (err: Error, variables) => {
      toastRetry(err.message, () => mutation.mutateAsync(variables));
    },
  });
  return mutation;
}

export function useAddPart(orgId: string | undefined) {
  const queryClient = useQueryClient();
  const isOnline = useOnlineStatus();
  const queue = useMutationQueue();

  const mutation = useMutation({
    mutationFn: async ({
      woId,
      body,
    }: {
      woId: string;
      body: {
        part_name: string;
        quantity: number;
        unit_price: number;
      };
    }) => {
      if (isOnline) {
        const res = await fetch(
          `/api/organizations/${orgId}/work-orders/${woId}/parts`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          },
        );
        const json = await res.json();
        if (json.error) throw new Error(json.error.message);
        return json.data;
      }

      await queue.enqueue({
        endpoint: `/api/organizations/${orgId}/work-orders/${woId}/parts`,
        method: "POST",
        body,
        queryKeysToInvalidate: [[...workOrderKeys.all(orgId ?? "")]],
      });
      return { queued: true } as unknown as unknown;
    },
    onMutate: async (variables) => {
      // Cancel outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({
        queryKey: workOrderKeys.detail(orgId ?? "", variables.woId),
      });
    },
    onSuccess: (data, variables) => {
      const d = data as unknown as Record<string, unknown>;
      if (d?.queued) {
        toast.info("Saved offline — will sync when connected");
      } else {
        queryClient.invalidateQueries({
          queryKey: workOrderKeys.detail(orgId ?? "", variables.woId),
        });
        queryClient.invalidateQueries({
          queryKey: workOrderKeys.all(orgId ?? ""),
        });
        toast.success("Part added");
      }
    },
    onError: (err: Error, variables) => {
      toastRetry(err.message, () => mutation.mutateAsync(variables));
    },
  });
  return mutation;
}

export function useRemovePart(orgId: string | undefined) {
  const queryClient = useQueryClient();
  const isOnline = useOnlineStatus();
  const queue = useMutationQueue();

  const mutation = useMutation({
    mutationFn: async ({ woId, partId }: { woId: string; partId: string }) => {
      if (isOnline) {
        const res = await fetch(
          `/api/organizations/${orgId}/work-orders/${woId}/parts`,
          {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: partId }),
          },
        );
        const json = await res.json();
        if (json.error) throw new Error(json.error.message);
        return json.data;
      }

      await queue.enqueue({
        endpoint: `/api/organizations/${orgId}/work-orders/${woId}/parts`,
        method: "DELETE",
        body: { id: partId },
        queryKeysToInvalidate: [[...workOrderKeys.all(orgId ?? "")]],
      });
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({
        queryKey: workOrderKeys.detail(orgId ?? "", variables.woId),
      });
    },
    onSuccess: (data, variables) => {
      const d = data as unknown as Record<string, unknown> | undefined;
      if (d?.queued) {
        toast.info("Saved offline — will sync when connected");
      } else {
        queryClient.invalidateQueries({
          queryKey: workOrderKeys.detail(orgId ?? "", variables.woId),
        });
        queryClient.invalidateQueries({
          queryKey: workOrderKeys.all(orgId ?? ""),
        });
        toast.success("Part removed");
      }
    },
    onError: (err: Error, variables) => {
      toastRetry(err.message, () => mutation.mutateAsync(variables));
    },
  });
  return mutation;
}

export function useCreateInvoice(orgId: string | undefined) {
  const queryClient = useQueryClient();
  const isOnline = useOnlineStatus();
  const queue = useMutationQueue();

  const mutation = useMutation({
    mutationFn: async ({ woId }: { woId: string }) => {
      if (isOnline) {
        const res = await fetch(`/api/organizations/${orgId}/invoices`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ work_order_id: woId }),
        });
        const json = await res.json();
        if (json.error) throw new Error(json.error.message);
        return json.data as {
          id: string;
          invoice_number: string;
          public_token: string;
        };
      }

      await queue.enqueue({
        endpoint: `/api/organizations/${orgId}/invoices`,
        method: "POST",
        body: { work_order_id: woId },
        queryKeysToInvalidate: [[...workOrderKeys.all(orgId ?? "")]],
      });
      return { queued: true } as unknown as {
        id: string;
        invoice_number: string;
        public_token: string;
      };
    },
    onSuccess: (data, variables) => {
      const d = data as unknown as Record<string, unknown>;
      if (d?.queued) {
        toast.info("Saved offline — will sync when connected");
      } else {
        queryClient.invalidateQueries({
          queryKey: workOrderKeys.detail(orgId ?? "", variables.woId),
        });
        queryClient.invalidateQueries({
          queryKey: workOrderKeys.all(orgId ?? ""),
        });
      }
    },
    onError: (err: Error, variables) => {
      toastRetry(err.message, () => mutation.mutateAsync(variables));
    },
  });
  return mutation;
}

export function useInvoicePayments(
  orgId: string | undefined,
  invoiceId: string | null,
) {
  return useQuery({
    queryKey: ["invoice-payments", orgId, invoiceId],
    queryFn: async () => {
      if (!invoiceId)
        return { payments: [], total_paid: 0, balance_due: 0, status: "" };
      const res = await fetch(
        `/api/organizations/${orgId}/invoices/${invoiceId}`,
      );
      if (!res.ok) throw new Error("Failed to load invoice");
      const json = await res.json();
      return (
        json.data ?? { payments: [], total_paid: 0, balance_due: 0, status: "" }
      );
    },
    enabled: !!orgId && !!invoiceId,
    refetchInterval: 30_000,
  });
}

export function useRecordPayment(orgId: string | undefined) {
  const qc = useQueryClient();
  const isOnline = useOnlineStatus();
  const queue = useMutationQueue();
  const mutation = useMutation({
    mutationFn: async ({
      invoiceId,
      ...body
    }: {
      invoiceId: string;
      amount: number;
      method: string;
      reference?: string;
      notes?: string;
    }) => {
      if (isOnline) {
        const res = await fetch(
          `/api/organizations/${orgId}/invoices/${invoiceId}/payments`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          },
        );
        if (!res.ok) throw new Error("Failed to record payment");
        return res.json();
      }

      await queue.enqueue({
        endpoint: `/api/organizations/${orgId}/invoices/${invoiceId}/payments`,
        method: "POST",
        body,
        queryKeysToInvalidate: [["invoice-payments", orgId, invoiceId]],
      });
      return { queued: true } as unknown as unknown;
    },
    onSuccess: (data, variables) => {
      const d = data as unknown as Record<string, unknown>;
      if (d?.queued) {
        toast.info("Saved offline — will sync when connected");
      } else {
        qc.invalidateQueries({
          queryKey: ["invoice-payments", orgId, variables.invoiceId],
        });
      }
    },
    onError: (err: Error, variables) => {
      toastRetry(err.message, () => mutation.mutateAsync(variables));
    },
  });
  return mutation;
}
