import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { toastRetry } from "@/lib/toast-utils";
import { createOrgQuery } from "./factory";
import { diagnosisLabelKeys } from "@/lib/queries/keys";
import type { DiagnosisLabel } from "@/lib/types";

const fetchDiagnosisLabels =
  createOrgQuery<DiagnosisLabel[]>("/diagnosis-labels");

export function useDiagnosisLabels(orgId: string | undefined) {
  return useQuery({
    queryKey: diagnosisLabelKeys.list(orgId ?? ""),
    queryFn: () => fetchDiagnosisLabels(orgId!),
    enabled: !!orgId,
  });
}

export function useCreateDiagnosisLabel(orgId: string | undefined) {
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (body: Partial<DiagnosisLabel>) => {
      const res = await fetch(`/api/organizations/${orgId}/diagnosis-labels`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to create diagnosis label");
      return res.json();
    },
    onMutate: async (body) => {
      const key = diagnosisLabelKeys.list(orgId ?? "");
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<DiagnosisLabel[]>(key);
      if (previous) {
        const maxSort = Math.max(...previous.map((l) => l.sort_order ?? 0), 0);
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
        qc.setQueryData<DiagnosisLabel[]>(key, [...previous, optimistic]);
      }
      return { previous };
    },
    onError: (err, body, context) => {
      if (context?.previous) {
        qc.setQueryData<DiagnosisLabel[]>(
          diagnosisLabelKeys.list(orgId ?? ""),
          context.previous,
        );
      }
      toastRetry(err.message, () => mutation.mutateAsync(body));
    },
    onSuccess: () => toast.success("Label created"),
    onSettled: () =>
      qc.invalidateQueries({ queryKey: diagnosisLabelKeys.list(orgId ?? "") }),
  });
  return mutation;
}

export function useUpdateDiagnosisLabel(orgId: string | undefined) {
  const qc = useQueryClient();
  const mutation = useMutation({
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
    onMutate: async ({ id, body }) => {
      const key = diagnosisLabelKeys.list(orgId ?? "");
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<DiagnosisLabel[]>(key);
      if (previous) {
        qc.setQueryData<DiagnosisLabel[]>(
          key,
          previous.map((l) =>
            l.id === id
              ? { ...l, ...body, updated_at: new Date().toISOString() }
              : l,
          ),
        );
      }
      return { previous };
    },
    onError: (err, vars, context) => {
      if (context?.previous) {
        qc.setQueryData<DiagnosisLabel[]>(
          diagnosisLabelKeys.list(orgId ?? ""),
          context.previous,
        );
      }
      toastRetry(err.message, () => mutation.mutateAsync(vars));
    },
    onSuccess: () => toast.success("Label updated"),
    onSettled: () =>
      qc.invalidateQueries({ queryKey: diagnosisLabelKeys.list(orgId ?? "") }),
  });
  return mutation;
}

export function useReorderDiagnosisLabels(orgId: string | undefined) {
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (updates: { id: string; sort_order: number }[]) => {
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
    onMutate: async (updates) => {
      const key = diagnosisLabelKeys.list(orgId ?? "");
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<DiagnosisLabel[]>(key);
      if (previous) {
        const updateMap = new Map(updates.map((u) => [u.id, u.sort_order]));
        qc.setQueryData<DiagnosisLabel[]>(
          key,
          previous.map((l) =>
            updateMap.has(l.id)
              ? {
                  ...l,
                  sort_order: updateMap.get(l.id)!,
                  updated_at: new Date().toISOString(),
                }
              : l,
          ),
        );
      }
      return { previous };
    },
    onError: (err, updates, context) => {
      if (context?.previous) {
        qc.setQueryData<DiagnosisLabel[]>(
          diagnosisLabelKeys.list(orgId ?? ""),
          context.previous,
        );
      }
      toastRetry(err.message, () => mutation.mutateAsync(updates));
    },
    onSettled: () =>
      qc.invalidateQueries({ queryKey: diagnosisLabelKeys.list(orgId ?? "") }),
  });
  return mutation;
}

export function useDeleteDiagnosisLabel(orgId: string | undefined) {
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(
        `/api/organizations/${orgId}/diagnosis-labels/${id}`,
        {
          method: "DELETE",
        },
      );
      if (!res.ok) throw new Error("Failed to delete diagnosis label");
    },
    onMutate: async (id) => {
      const key = diagnosisLabelKeys.list(orgId ?? "");
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<DiagnosisLabel[]>(key);
      if (previous) {
        qc.setQueryData<DiagnosisLabel[]>(
          key,
          previous.filter((l) => l.id !== id),
        );
      }
      return { previous };
    },
    onError: (err, id, context) => {
      if (context?.previous) {
        qc.setQueryData<DiagnosisLabel[]>(
          diagnosisLabelKeys.list(orgId ?? ""),
          context.previous,
        );
      }
      toastRetry(err.message, () => mutation.mutateAsync(id));
    },
    onSuccess: () => toast.success("Label deleted"),
    onSettled: () =>
      qc.invalidateQueries({ queryKey: diagnosisLabelKeys.list(orgId ?? "") }),
  });
  return mutation;
}
