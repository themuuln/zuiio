import { useQuery } from "@tanstack/react-query";
import type { MechanicCommissionRule } from "@/lib/types";
import { createOrgQuery } from "./factory";
import { commissionKeys } from "./keys";
import { useOrgMutation } from "@zuiio/query";

const fetchCommissionRules =
  createOrgQuery<MechanicCommissionRule[]>("/commission-rules");

export function useCommissionRules(orgId: string | undefined) {
  return useQuery({
    queryKey: commissionKeys.list(orgId ?? ""),
    queryFn: () => fetchCommissionRules(orgId!),
    enabled: !!orgId,
  });
}

export function useCreateCommissionRule(orgId: string | undefined) {
  return useOrgMutation<
    MechanicCommissionRule,
    Partial<MechanicCommissionRule>
  >({
    endpoint: `/api/organizations/${orgId}/commission-rules`,
    method: "POST",
    queryKey: commissionKeys.list(orgId ?? ""),
    optimisticUpdate: (cached, body) => {
      const maxPriority = Math.max(...cached.map((r) => r.priority ?? 0), 0);
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
      return [...cached, optimistic];
    },
    successMessage: "Commission rule created",
  });
}

export function useUpdateCommissionRule(orgId: string | undefined) {
  return useOrgMutation<
    MechanicCommissionRule,
    { id: string; body: Partial<MechanicCommissionRule> }
  >({
    endpoint: (vars) =>
      `/api/organizations/${orgId}/commission-rules/${vars.id}`,
    method: "PATCH",
    queryKey: commissionKeys.list(orgId ?? ""),
    optimisticUpdate: (cached, { id, body }) =>
      cached.map((r) =>
        r.id === id
          ? { ...r, ...body, updated_at: new Date().toISOString() }
          : r,
      ),
    successMessage: "Commission rule updated",
  });
}

export function useDeleteCommissionRule(orgId: string | undefined) {
  return useOrgMutation<MechanicCommissionRule, string>({
    endpoint: (id) => `/api/organizations/${orgId}/commission-rules/${id}`,
    method: "DELETE",
    queryKey: commissionKeys.list(orgId ?? ""),
    optimisticUpdate: (cached, id) => cached.filter((r) => r.id !== id),
    successMessage: "Commission rule deleted",
  });
}
