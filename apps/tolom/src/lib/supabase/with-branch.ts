/**
 * Branch query helpers.
 *
 * `withBranchFilter` is re-exported from @zuiio/supabase.
 * `resolveBranchId` is Tolom-specific (schema-dependent) and stays local.
 */

export { withBranchFilter } from "@zuiio/supabase";

import type { SupabaseClient } from "@supabase/supabase-js";
import { ValidationError } from "@/lib/errors";

/**
 * Resolves a branch ID from an optional input, falling back to the
 * organization's main branch when none is provided.
 *
 * @param supabase - Supabase client instance
 * @param orgId - Organization ID to look up branches for
 * @param branchId - Optional branch ID input (`"all"`/`null`/`undefined` triggers fallback)
 * @param options.strict - When true (default), throws ValidationError if no main branch exists.
 * @returns The resolved branch ID, or null if non-strict and no main branch exists
 */
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

  const strict = options?.strict ?? true;
  if (strict) {
    throw new ValidationError(
      "No main branch found for this organization. " +
        "Please create a branch or provide a branch ID.",
    );
  }

  return null;
}
