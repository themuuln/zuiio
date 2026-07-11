import { capture } from "@zuiio/capture";
import { createClient } from "@/lib/supabase/server";
import type { BranchInfo } from "./branches";

/**
 * Returns all branches a user is allowed to see.
 *
 * - Admins/org-wide users (branch_id=NULL on their profile): all branches in their org.
 * - Scoped users (branch_id set): only their assigned branch.
 */
export async function getUserBranches(userId: string): Promise<BranchInfo[]> {
  const supabase = await createClient();

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("organization_id, branch_id")
    .eq("id", userId)
    .single();

  if (profileError) {
    capture(profileError, {
      context: "branches: profile query for branch access",
    });
  }

  if (!profile?.organization_id) return [];

  if (profile.branch_id) {
    const { data, error } = await supabase
      .from("branches")
      .select("id,organization_id,name,slug,address,phone,email,is_default")
      .eq("id", profile.branch_id)
      .eq("organization_id", profile.organization_id);
    if (error)
      capture(error, { context: "[branches] getUserBranches scoped query" });

    return (data ?? []) as BranchInfo[];
  }

  const { data, error } = await supabase
    .from("branches")
    .select("id,organization_id,name,slug,address,phone,email,is_default")
    .eq("organization_id", profile.organization_id)
    .order("name");
  if (error)
    capture(error, { context: "[branches] getUserBranches org-wide query" });

  return (data ?? []) as BranchInfo[];
}

/**
 * Returns the branches accessible to a user within a given organization.
 * Useful when the caller already knows the organization ID.
 *
 * - Org-wide user → all branches in the organization.
 * - Scoped user   → only the single assigned branch.
 */
export async function getAccessibleBranches(
  organizationId: string,
  userId: string,
): Promise<BranchInfo[]> {
  const supabase = await createClient();

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("branch_id")
    .eq("id", userId)
    .eq("organization_id", organizationId)
    .single();

  if (profileError) {
    capture(profileError, { context: "branches: getAccessibleBranches" });
  }

  if (!profile) return [];

  if (profile.branch_id) {
    const { data, error } = await supabase
      .from("branches")
      .select("id,organization_id,name,slug,address,phone,email,is_default")
      .eq("id", profile.branch_id)
      .eq("organization_id", organizationId);
    if (error)
      capture(error, {
        context: "[branches] getAccessibleBranches scoped query",
      });

    return (data ?? []) as BranchInfo[];
  }

  const { data, error } = await supabase
    .from("branches")
    .select("id,organization_id,name,slug,address,phone,email,is_default")
    .eq("organization_id", organizationId)
    .order("name");
  if (error)
    capture(error, {
      context: "[branches] getAccessibleBranches org-wide query",
    });

  return (data ?? []) as BranchInfo[];
}
