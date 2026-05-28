import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { toastRetry } from "@/lib/toast-utils";
import { commissionKeys } from "@/lib/queries/keys";
import type { MechanicCommissionRule } from "@/lib/types";

export function useCommissionRules(orgId: string | undefined) {
  return useQuery({
    queryKey: commissionKeys.list(orgId ?? ""),
    queryFn: async () => {
      const res = await fetch(`/api/organizations/${orgId}/commission-rules`);
      if (!res.ok) throw new Error("Failed to load commission rules");
      const json = await res.json();
      return (json.data ?? []) as MechanicCommissionRule[];
    },
    enabled: !!orgId,
  });
}

export function useCreateCommissionRule(orgId: string | undefined) {
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (body: Partial<MechanicCommissionRule>) => {
      const res = await fetch(`/api/organizations/${orgId}/commission-rules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to create commission rule");
      return res.json();
    },
    onMutate: async (body) => {
      const key = commissionKeys.list(orgId ?? "");
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<MechanicCommissionRule[]>(key);
      if (previous) {
        const maxPriority = Math.max(
          ...previous.map((r) => r.priority ?? 0),
          0,
        );
        const optimistic: MechanicCommissionRule = {
          id: `temp-${Date.now()}`,
          organization_id: orgId ?? "",
          mechanic_id: body.mechanic_id ?? null,
          name: body.name ?? "",
          commission_type: body.commission_type ?? "percentage_of_labor",
          commission_value: body.commission_value ?? 0,
          min_commission: body.min_commission ?? null,
          max_commission: body.max_commission ?? null,
          is_active: body.is_active ?? true,
          priority: body.priority ?? maxPriority + 1,
          created_by: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          deleted_at: null,
        };
        qc.setQueryData<MechanicCommissionRule[]>(key, [
          ...previous,
          optimistic,
        ]);
      }
      return { previous };
    },
    onError: (err, body, context) => {
      if (context?.previous)
        qc.setQueryData<MechanicCommissionRule[]>(
          commissionKeys.list(orgId ?? ""),
          context.previous,
        );
      toastRetry(err.message, () => mutation.mutateAsync(body));
    },
    onSuccess: () => toast.success("Commission rule created"),
    onSettled: () =>
      qc.invalidateQueries({ queryKey: commissionKeys.list(orgId ?? "") }),
  });
  return mutation;
}

export function useUpdateCommissionRule(orgId: string | undefined) {
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body: Partial<MechanicCommissionRule>;
    }) => {
      const res = await fetch(
        `/api/organizations/${orgId}/commission-rules/${id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      if (!res.ok) throw new Error("Failed to update commission rule");
      return res.json();
    },
    onMutate: async ({ id, body }) => {
      const key = commissionKeys.list(orgId ?? "");
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<MechanicCommissionRule[]>(key);
      if (previous) {
        qc.setQueryData<MechanicCommissionRule[]>(
          key,
          previous.map((r) =>
            r.id === id
              ? { ...r, ...body, updated_at: new Date().toISOString() }
              : r,
          ),
        );
      }
      return { previous };
    },
    onError: (err, vars, context) => {
      if (context?.previous)
        qc.setQueryData<MechanicCommissionRule[]>(
          commissionKeys.list(orgId ?? ""),
          context.previous,
        );
      toastRetry(err.message, () => mutation.mutateAsync(vars));
    },
    onSuccess: () => toast.success("Commission rule updated"),
    onSettled: () =>
      qc.invalidateQueries({ queryKey: commissionKeys.list(orgId ?? "") }),
  });
  return mutation;
}

export function useDeleteCommissionRule(orgId: string | undefined) {
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(
        `/api/organizations/${orgId}/commission-rules/${id}`,
        {
          method: "DELETE",
        },
      );
      if (!res.ok) throw new Error("Failed to delete commission rule");
    },
    onMutate: async (id) => {
      const key = commissionKeys.list(orgId ?? "");
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<MechanicCommissionRule[]>(key);
      if (previous) {
        qc.setQueryData<MechanicCommissionRule[]>(
          key,
          previous.filter((r) => r.id !== id),
        );
      }
      return { previous };
    },
    onError: (err, id, context) => {
      if (context?.previous)
        qc.setQueryData<MechanicCommissionRule[]>(
          commissionKeys.list(orgId ?? ""),
          context.previous,
        );
      toastRetry(err.message, () => mutation.mutateAsync(id));
    },
    onSuccess: () => toast.success("Commission rule deleted"),
    onSettled: () =>
      qc.invalidateQueries({ queryKey: commissionKeys.list(orgId ?? "") }),
  });
  return mutation;
}
