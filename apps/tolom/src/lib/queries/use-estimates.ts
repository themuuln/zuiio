import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useOrgMutation } from "@zuiio/query";
import { toast } from "sonner";
import type { EstimateDetail, EstimateStatus } from "@/lib/types";
import { estimateKeys } from "./keys";

// ── Types ──────────────────────────────────────────────────────

export interface EstimateListItem {
  id: string;
  estimate_number: string;
  status: EstimateStatus;
  customer_id: string | null;
  vehicle_id: string | null;
  grand_total: number;
  created_at: string;
  valid_until: string | null;
  customer: {
    first_name: string;
    last_name: string | null;
    phone: string | null;
  } | null;
  vehicle: {
    plate_number: string;
    make: string | null;
    model: string | null;
  } | null;
  items: { id: string }[];
  converted_work_order: {
    id: string;
    status: string;
    total: number;
  } | null;
  appointment: {
    id: string;
    title: string;
    scheduled_at: string;
  } | null;
}

export interface PublicEstimateDetail {
  id: string;
  estimate_number: string;
  status: EstimateStatus;
  created_at: string;
  valid_until: string | null;
  notes: string | null;
  terms: string | null;
  subtotal: number;
  discount_amount: number;
  discount_percentage: number;
  discount_total: number;
  tax_total: number;
  grand_total: number;
  customer: {
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
    email: string | null;
  } | null;
  vehicle: {
    plate_number: string | null;
    make: string | null;
    model: string | null;
    year: number | null;
  } | null;
  items: {
    description: string;
    item_type: string;
    quantity: number;
    unit_price: number;
    discount_amount: number;
    discount_percentage: number;
    line_total: number;
  }[];
  organization: {
    name: string;
    phone: string | null;
    email: string | null;
    address: string | null;
  } | null;
}

// ── List Hook ──────────────────────────────────────────────────

export function useEstimates(
  orgId: string | undefined,
  status?: string,
  search?: string,
  branchId?: string | null,
) {
  return useQuery({
    queryKey: estimateKeys.list(orgId ?? "", status, search, branchId),
    queryFn: async (): Promise<EstimateListItem[]> => {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      if (search) params.set("q", search);
      if (branchId) params.set("branch_id", branchId);
      const qs = params.toString();
      const res = await fetch(
        `/api/organizations/${orgId}/estimates${qs ? `?${qs}` : ""}`,
      );
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      return (json.data ?? []) as EstimateListItem[];
    },
    enabled: !!orgId,
    placeholderData: (previousData) => previousData,
    staleTime: 30_000,
  });
}

// ── Detail Hook ────────────────────────────────────────────────

export function useEstimateDetail(
  orgId: string | undefined,
  estimateId: string | undefined,
) {
  return useQuery({
    queryKey: estimateKeys.detail(orgId ?? "", estimateId ?? ""),
    queryFn: async (): Promise<EstimateDetail> => {
      const res = await fetch(
        `/api/organizations/${orgId}/estimates/${estimateId}`,
      );
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      return json.data as EstimateDetail;
    },
    enabled: !!orgId && !!estimateId,
    staleTime: 30_000,
  });
}

export function usePublicEstimate(token: string | undefined) {
  return useQuery({
    queryKey: ["estimate", "public", token ?? ""] as const,
    queryFn: async (): Promise<PublicEstimateDetail> => {
      const res = await fetch(`/api/estimate/public/${token}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      return json.data as PublicEstimateDetail;
    },
    enabled: !!token,
    staleTime: 60_000,
  });
}

// ── Status Mutation ────────────────────────────────────────────

export function useUpdateEstimateStatus(orgId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      estimateId,
      status,
    }: {
      estimateId: string;
      status: EstimateStatus;
    }) => {
      const res = await fetch(
        `/api/organizations/${orgId}/estimates/${estimateId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        },
      );
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      return json.data as EstimateDetail;
    },
    onMutate: async (variables) => {
      const detailKey = estimateKeys.detail(orgId ?? "", variables.estimateId);
      await queryClient.cancelQueries({ queryKey: detailKey });
      const previous = queryClient.getQueryData<EstimateDetail>(detailKey);
      if (previous) {
        queryClient.setQueryData<EstimateDetail>(detailKey, {
          ...previous,
          status: variables.status,
          updated_at: new Date().toISOString(),
        });
      }
      return { previous };
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: estimateKeys.detail(orgId ?? "", variables.estimateId),
      });
      queryClient.invalidateQueries({
        queryKey: estimateKeys.all(orgId ?? ""),
      });
      toast.dismiss();
      toast.success("Status updated");
    },
    onError: (err: Error, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          estimateKeys.detail(orgId ?? "", variables.estimateId),
          context.previous,
        );
      }
      toast.error(err.message ?? "Failed to update status");
    },
  });
}

// ── Convert to Work Order Mutation ─────────────────────────────

export function useConvertEstimate(orgId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ estimateId }: { estimateId: string }) => {
      const res = await fetch(
        `/api/organizations/${orgId}/estimates/${estimateId}/convert`,
        { method: "POST" },
      );
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      return json.data as { id: string };
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: estimateKeys.detail(orgId ?? "", variables.estimateId),
      });
      queryClient.invalidateQueries({
        queryKey: estimateKeys.all(orgId ?? ""),
      });
      toast.dismiss();
      toast.success("Estimate converted to work order");
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Failed to convert estimate");
    },
  });
}

// ── Update Estimate ─────────────────────────────────────────────

export interface UpdateEstimateParams {
  id: string;
  valid_until: string | null;
  notes: string | null;
  terms: string | null;
  discount_amount: number;
  discount_percentage: number;
  tax_total: number;
  items: Array<{
    item_type: string;
    source_service_id: string | null;
    source_part_id: string | null;
    description: string;
    quantity: number;
    unit_price: number;
    discount_amount: number;
    discount_percentage: number;
    sort_order: number;
  }>;
}

export function useUpdateEstimate(orgId: string | undefined) {
  return useOrgMutation<EstimateDetail, UpdateEstimateParams>({
    endpoint: (vars) => `/api/organizations/${orgId}/estimates/${vars.id}`,
    method: "PATCH",
    queryKey: estimateKeys.all(orgId ?? ""),
    bodyFn: (vars) => {
      const { id, ...body } = vars;
      return body;
    },
    successMessage: "Estimate updated",
  });
}

// ── Duplicate Estimate ──────────────────────────────────────────

export interface DuplicateEstimateParams {
  customer_id: string | null;
  vehicle_id: string | null;
  branchId: string | null;
  status: string;
  valid_until: string | null;
  notes: string | null | undefined;
  terms: string | null | undefined;
  discount_amount: number;
  discount_percentage: number;
  tax_total: number;
  items: Array<{
    item_type: string;
    source_service_id: string | null;
    source_part_id: string | null;
    description: string;
    quantity: number;
    unit_price: number;
    discount_amount: number;
    discount_percentage: number;
    sort_order: number;
  }>;
}

export function useDuplicateEstimate(orgId: string | undefined) {
  return useOrgMutation<{ id: string }, DuplicateEstimateParams>({
    endpoint: `/api/organizations/${orgId}/estimates`,
    method: "POST",
    queryKey: estimateKeys.all(orgId ?? ""),
    successMessage: "Estimate duplicated",
  });
}

// ── Send Estimate ───────────────────────────────────────────────

export function useSendEstimate(orgId: string | undefined) {
  return useOrgMutation<unknown, { id: string }>({
    endpoint: (vars) => `/api/organizations/${orgId}/estimates/${vars.id}/send`,
    method: "POST",
    queryKey: estimateKeys.all(orgId ?? ""),
    successMessage: "Estimate sent",
  });
}
