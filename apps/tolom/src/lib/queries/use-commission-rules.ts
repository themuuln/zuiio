import type { MechanicCommissionRule } from "@/lib/types";
import { commissionKeys } from "./keys";
import { createCrudHooks } from "./use-crud-list";

// ── CRUD hooks via factory ──────────────────────────────────────

const crud = createCrudHooks<MechanicCommissionRule>({
  path: "/commission-rules",
  queryKey: (orgId) => commissionKeys.list(orgId),
  optimisticCreate: (body, orgId, { optimisticId }) => {
    const maxPriority = 0; // Will be recalculated by the factory's default append
    return {
      id: optimisticId,
      organization_id: orgId,
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
  },
});

export const {
  useList: useCommissionRules,
  useCreate: useCreateCommissionRule,
  useUpdate: useUpdateCommissionRule,
  useDelete: useDeleteCommissionRule,
} = crud;
