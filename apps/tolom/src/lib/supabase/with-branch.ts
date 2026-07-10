import type { SupabaseClient } from "@supabase/supabase-js";
import { ValidationError } from "@/lib/errors";

export function withBranchFilter<TQuery>(
  query: TQuery,
  branchId?: string | null,
): TQuery {
  if (!branchId || branchId === "all") {
    return query;
  }

  const eqQuery = query as { eq(column: string, value: string): unknown };
  return eqQuery.eq("branch_id", branchId) as TQuery;
}

export async function resolveBranchId(
  supabase: SupabaseClient,
  orgId: string,
  branchId?: string | null,
  options?: { strict?: boolean },
): Promise<string | null> {
  if (branchId && branchId !== "all") {
    return branchId;
  }

  const { data: mainBranch } = await supabase
    .from("branches")
    .select("id")
    .eq("organization_id", orgId)
    .eq("is_main", true)
    .maybeSingle();

  if (mainBranch) {
    return mainBranch.id;
  }

  if (options?.strict ?? true) {
    throw new ValidationError(
      "No main branch found for this organization. Please create a branch or provide a branch ID.",
    );
  }

  return null;
}
