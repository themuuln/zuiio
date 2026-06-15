import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ServiceCatalog, WorkOrderDetail } from "@/lib/types";
import { createOrgQuery } from "./factory";
import {
  inventoryKeys,
  mechanicKeys,
  serviceKeys,
  workOrderKeys,
} from "./keys";
import { useOrgMutation } from "./mutation-factory";

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

  return useOrgMutation<
    WorkOrderDetail,
    {
      woId: string;
      status: string;
      notes?: string;
      loss_reason?: string;
    }
  >({
    endpoint: (vars) => `/api/organizations/${orgId}/work-orders/${vars.woId}`,
    method: "PATCH",
    queryKey: workOrderKeys.all(orgId ?? ""),
    successMessage: (vars) => `Status changed to ${vars.status}`,
    onSuccess: (_data, variables) => {
      // Invalidate inventory cache when WO is completed
      if (variables.status === "Completed") {
        queryClient.invalidateQueries({
          queryKey: inventoryKeys.balances(orgId ?? ""),
        });
        queryClient.invalidateQueries({
          queryKey: inventoryKeys.movements(orgId ?? ""),
        });
      }
    },
  });
}

export function useAssignMechanic(orgId: string | undefined) {
  return useOrgMutation<
    WorkOrderDetail,
    {
      woId: string;
      mechanicId: string | null;
    }
  >({
    endpoint: (vars) => `/api/organizations/${orgId}/work-orders/${vars.woId}`,
    method: "PATCH",
    queryKey: workOrderKeys.all(orgId ?? ""),
    successMessage: "Mechanic assigned",
  });
}

export function useAddService(orgId: string | undefined) {
  return useOrgMutation<
    unknown,
    {
      woId: string;
      body: {
        service_catalog_id: string;
        service_name: string;
        quantity: number;
        unit_price: number;
      };
    }
  >({
    endpoint: (vars) =>
      `/api/organizations/${orgId}/work-orders/${vars.woId}/services`,
    method: "POST",
    queryKey: workOrderKeys.all(orgId ?? ""),
    successMessage: "Service added",
  });
}

export function useRemoveService(orgId: string | undefined) {
  return useOrgMutation<
    unknown,
    {
      woId: string;
      serviceId: string;
    }
  >({
    endpoint: (vars) =>
      `/api/organizations/${orgId}/work-orders/${vars.woId}/services`,
    method: "DELETE",
    queryKey: workOrderKeys.all(orgId ?? ""),
    successMessage: "Service removed",
  });
}

export function useAddPart(orgId: string | undefined) {
  return useOrgMutation<
    unknown,
    {
      woId: string;
      body: {
        part_name: string;
        quantity: number;
        unit_price: number;
      };
    }
  >({
    endpoint: (vars) =>
      `/api/organizations/${orgId}/work-orders/${vars.woId}/parts`,
    method: "POST",
    queryKey: workOrderKeys.all(orgId ?? ""),
    successMessage: "Part added",
  });
}

export function useRemovePart(orgId: string | undefined) {
  return useOrgMutation<
    unknown,
    {
      woId: string;
      partId: string;
    }
  >({
    endpoint: (vars) =>
      `/api/organizations/${orgId}/work-orders/${vars.woId}/parts`,
    method: "DELETE",
    queryKey: workOrderKeys.all(orgId ?? ""),
    successMessage: "Part removed",
  });
}

export function useCreateInvoice(orgId: string | undefined) {
  return useOrgMutation<
    { id: string; invoice_number: string; public_token: string },
    { woId: string }
  >({
    endpoint: `/api/organizations/${orgId}/invoices`,
    method: "POST",
    queryKey: workOrderKeys.all(orgId ?? ""),
    // No success toast — the UI updates via cache invalidation
  });
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
  return useOrgMutation<
    unknown,
    {
      invoiceId: string;
      amount: number;
      method: string;
      reference?: string;
      notes?: string;
    }
  >({
    endpoint: (vars) =>
      `/api/organizations/${orgId}/invoices/${vars.invoiceId}/payments`,
    method: "POST",
    queryKey: ["invoice-payments", orgId ?? ""],
  });
}
