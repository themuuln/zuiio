import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { ServiceCatalog, WorkOrderDetail } from "@/lib/types";
import { mechanicKeys, serviceKeys, workOrderKeys } from "./keys";

export async function fetchServicePriceHistory(
  orgId: string,
  serviceCatalogId: string,
  vehicleMake?: string,
  vehicleModel?: string,
): Promise<number[]> {
  const supabase = createClient();
  let query = supabase
    .from("service_price_history")
    .select("unit_price")
    .eq("organization_id", orgId)
    .eq("service_catalog_id", serviceCatalogId)
    .order("created_at", { ascending: false })
    .limit(3);

  if (vehicleMake) query = query.eq("vehicle_make", vehicleMake);
  if (vehicleModel) query = query.eq("vehicle_model", vehicleModel);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? [])
    .map((row) => Number(row.unit_price ?? 0))
    .filter(Boolean);
}

export async function fetchPartPriceHistory(
  orgId: string,
  partName: string,
  vehicleMake?: string,
): Promise<number[]> {
  const supabase = createClient();
  let query = supabase
    .from("part_price_history")
    .select("unit_price")
    .eq("organization_id", orgId)
    .ilike("part_name", partName)
    .order("created_at", { ascending: false })
    .limit(3);

  if (vehicleMake) query = query.eq("vehicle_make", vehicleMake);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? [])
    .map((row) => Number(row.unit_price ?? 0))
    .filter(Boolean);
}

export function useWorkOrderDetail(orgId: string | undefined, woId: string) {
  return useQuery({
    queryKey: workOrderKeys.detail(orgId ?? "", woId),
    queryFn: async () => {
      const res = await fetch(
        `/api/organizations/${orgId}/work-orders/${woId}`,
      );
      if (!res.ok) throw new Error("Failed to load work order");
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      return json.data as WorkOrderDetail;
    },
    enabled: !!orgId,
    staleTime: 15_000,
  });
}

export function useServiceCatalog(orgId: string | undefined) {
  return useQuery({
    queryKey: serviceKeys.list(orgId ?? ""),
    queryFn: async () => {
      const res = await fetch(`/api/organizations/${orgId}/services`);
      if (!res.ok) throw new Error("Failed to load service catalog");
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      return (json.data ?? []) as ServiceCatalog[];
    },
    enabled: !!orgId,
    staleTime: 60_000,
  });
}

export function useMechanicsList(orgId: string | undefined) {
  return useQuery({
    queryKey: mechanicKeys.list(orgId ?? ""),
    queryFn: async () => {
      const res = await fetch(
        `/api/organizations/${orgId}/reports?type=mechanics`,
      );
      if (!res.ok) throw new Error("Failed to load mechanics");
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      return (json.data ?? []) as { id: string; full_name: string }[];
    },
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
    queryFn: async () => fetchPartPriceHistory(orgId as string, partName as string, vehicleMake),
    enabled: !!orgId && !!partName && partName.length >= 2,
    staleTime: 30_000,
    retry: 1,
  });
}

export function useUpdateWorkOrderStatus(orgId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      woId,
      status,
      notes,
    }: {
      woId: string;
      status: string;
      notes?: string;
    }) => {
      const res = await fetch(
        `/api/organizations/${orgId}/work-orders/${woId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status, notes }),
        },
      );
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      return json.data as WorkOrderDetail;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: workOrderKeys.detail(orgId ?? "", variables.woId),
      });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

export function useAssignMechanic(orgId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      woId,
      mechanicId,
    }: {
      woId: string;
      mechanicId: string | null;
    }) => {
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
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: workOrderKeys.detail(orgId ?? "", variables.woId),
      });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

export function useAddService(orgId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
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
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: workOrderKeys.detail(orgId ?? "", variables.woId),
      });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

export function useRemoveService(orgId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      woId,
      serviceId,
    }: {
      woId: string;
      serviceId: string;
    }) => {
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
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: workOrderKeys.detail(orgId ?? "", variables.woId),
      });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

export function useAddPart(orgId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
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
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: workOrderKeys.detail(orgId ?? "", variables.woId),
      });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

export function useRemovePart(orgId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      woId,
      partId,
    }: {
      woId: string;
      partId: string;
    }) => {
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
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: workOrderKeys.detail(orgId ?? "", variables.woId),
      });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

export function useCreateInvoice(orgId: string | undefined) {
  return useMutation({
    mutationFn: async ({ woId }: { woId: string }) => {
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
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}
