import { useQuery } from "@tanstack/react-query";
import type { DiagnosisLabel } from "@/lib/types";
import { createOrgQuery } from "./factory";
import { diagnosisLabelKeys } from "./keys";
import { useOrgMutation } from "@zuiio/query";

const fetchDiagnosisLabels =
  createOrgQuery<DiagnosisLabel[]>("/diagnosis-labels");

export function useDiagnosisLabels(orgId: string | undefined) {
  return useQuery({
    queryKey: diagnosisLabelKeys.list(orgId ?? ""),
    queryFn: () => fetchDiagnosisLabels(orgId!),
    enabled: !!orgId,
    staleTime: 5 * 60_000,
  });
}

export function useCreateDiagnosisLabel(orgId: string | undefined) {
  return useOrgMutation<DiagnosisLabel, Partial<DiagnosisLabel>>({
    endpoint: `/api/organizations/${orgId}/diagnosis-labels`,
    method: "POST",
    queryKey: diagnosisLabelKeys.list(orgId ?? ""),
    optimisticUpdate: (cached, body) => {
      const maxSort = Math.max(...cached.map((l) => l.sort_order ?? 0), 0);
      const optimistic: DiagnosisLabel = {
        id: `temp-${Date.now()}`,
        organization_id: orgId ?? "",
        name: body.name ?? "",
        name_mn: null,
        color: body.color ?? null,
        sort_order: maxSort + 1,
        is_active: body.is_active ?? true,
        created_by: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        deleted_at: null,
      };
      return [...cached, optimistic];
    },
    successMessage: "Label created",
  });
}

export function useUpdateDiagnosisLabel(orgId: string | undefined) {
  return useOrgMutation<
    DiagnosisLabel,
    { id: string; body: Partial<DiagnosisLabel> }
  >({
    endpoint: (vars) =>
      `/api/organizations/${orgId}/diagnosis-labels/${vars.id}`,
    method: "PATCH",
    queryKey: diagnosisLabelKeys.list(orgId ?? ""),
    optimisticUpdate: (cached, { id, body }) =>
      cached.map((l) =>
        l.id === id
          ? { ...l, ...body, updated_at: new Date().toISOString() }
          : l,
      ),
    successMessage: "Label updated",
  });
}

export function useReorderDiagnosisLabels(orgId: string | undefined) {
  return useOrgMutation<DiagnosisLabel, { id: string; sort_order: number }[]>({
    endpoint: `/api/organizations/${orgId}/diagnosis-labels/reorder`,
    method: "PATCH",
    queryKey: diagnosisLabelKeys.list(orgId ?? ""),
    optimisticUpdate: (cached, updates) => {
      const updateMap = new Map(updates.map((u) => [u.id, u.sort_order]));
      return cached.map((l) =>
        updateMap.has(l.id)
          ? {
              ...l,
              sort_order: updateMap.get(l.id)!,
              updated_at: new Date().toISOString(),
            }
          : l,
      );
    },
  });
}

export function useDeleteDiagnosisLabel(orgId: string | undefined) {
  return useOrgMutation<DiagnosisLabel, string>({
    endpoint: (id) => `/api/organizations/${orgId}/diagnosis-labels/${id}`,
    method: "DELETE",
    queryKey: diagnosisLabelKeys.list(orgId ?? ""),
    optimisticUpdate: (cached, id) => cached.filter((l) => l.id !== id),
    successMessage: "Label deleted",
  });
}
