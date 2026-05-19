import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { diagnosisLabelKeys } from "@/lib/queries/keys";
import type { DiagnosisLabel } from "@/lib/types";

export function useDiagnosisLabels(orgId: string | undefined) {
  return useQuery({
    queryKey: diagnosisLabelKeys.list(orgId ?? ""),
    queryFn: async () => {
      const res = await fetch(`/api/organizations/${orgId}/diagnosis-labels`);
      if (!res.ok) throw new Error("Failed to load diagnosis labels");
      const json = await res.json();
      return (json.data ?? []) as DiagnosisLabel[];
    },
    enabled: !!orgId,
  });
}

export function useCreateDiagnosisLabel(orgId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Partial<DiagnosisLabel>) => {
      const res = await fetch(`/api/organizations/${orgId}/diagnosis-labels`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to create diagnosis label");
      return res.json();
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: diagnosisLabelKeys.list(orgId ?? "") }),
  });
}

export function useUpdateDiagnosisLabel(orgId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body: Partial<DiagnosisLabel>;
    }) => {
      const res = await fetch(
        `/api/organizations/${orgId}/diagnosis-labels/${id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      if (!res.ok) throw new Error("Failed to update diagnosis label");
      return res.json();
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: diagnosisLabelKeys.list(orgId ?? "") }),
  });
}

export function useReorderDiagnosisLabels(orgId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      updates: { id: string; sort_order: number }[],
    ) => {
      const res = await fetch(
        `/api/organizations/${orgId}/diagnosis-labels/reorder`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ updates }),
        },
      );
      if (!res.ok) throw new Error("Failed to reorder diagnosis labels");
    },
    onSettled: () =>
      qc.invalidateQueries({ queryKey: diagnosisLabelKeys.list(orgId ?? "") }),
  });
}

export function useDeleteDiagnosisLabel(orgId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(
        `/api/organizations/${orgId}/diagnosis-labels/${id}`,
        {
          method: "DELETE",
        },
      );
      if (!res.ok) throw new Error("Failed to delete diagnosis label");
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: diagnosisLabelKeys.list(orgId ?? "") }),
  });
}
