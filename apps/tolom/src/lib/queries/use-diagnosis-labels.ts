import { useOrgMutation } from "@zuiio/query";
import type { DiagnosisLabel } from "@/lib/types";
import { diagnosisLabelKeys } from "./keys";
import { createCrudHooks } from "./use-crud-list";

// ── CRUD hooks via factory ──────────────────────────────────────

const crud = createCrudHooks<DiagnosisLabel>({
  path: "/diagnosis-labels",
  queryKey: (orgId) => diagnosisLabelKeys.list(orgId),
  optimisticCreate: (body, orgId, { optimisticId }) => ({
    id: optimisticId,
    organization_id: orgId,
    name: body.name ?? "",
    name_mn: null,
    color: body.color ?? null,
    sort_order: 0,
    is_active: body.is_active ?? true,
    created_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
  }),
});

export const {
  useList: useDiagnosisLabels,
  useCreate: useCreateDiagnosisLabel,
  useUpdate: useUpdateDiagnosisLabel,
  useDelete: useDeleteDiagnosisLabel,
} = crud;

// ── Reorder (entity-specific, not a standard CRUD op) ──────────

export function useReorderDiagnosisLabels(orgId: string | undefined) {
  return useOrgMutation<DiagnosisLabel, { id: string; sort_order: number }[]>({
    endpoint: `/api/organizations/${orgId}/diagnosis-labels/reorder`,
    method: "PATCH",
    queryKey: diagnosisLabelKeys.list(orgId ?? ""),
    optimisticUpdate: (cached, updates) => {
      const updateMap = new Map(updates.map((u) => [u.id, u.sort_order]));
      return cached.map((l) => {
        const newOrder = updateMap.get(l.id);
        return newOrder !== undefined
          ? {
              ...l,
              sort_order: newOrder,
              updated_at: new Date().toISOString(),
            }
          : l;
      });
    },
  });
}
