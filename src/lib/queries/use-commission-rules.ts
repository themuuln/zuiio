import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
  return useMutation({
    mutationFn: async (body: Partial<MechanicCommissionRule>) => {
      const res = await fetch(`/api/organizations/${orgId}/commission-rules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to create commission rule");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: commissionKeys.list(orgId ?? "") }),
  });
}

export function useUpdateCommissionRule(orgId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, body }: { id: string; body: Partial<MechanicCommissionRule> }) => {
      const res = await fetch(`/api/organizations/${orgId}/commission-rules/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to update commission rule");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: commissionKeys.list(orgId ?? "") }),
  });
}

export function useDeleteCommissionRule(orgId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/organizations/${orgId}/commission-rules/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete commission rule");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: commissionKeys.list(orgId ?? "") }),
  });
}
