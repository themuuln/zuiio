import { createClient } from "@/lib/supabase/server";

export interface AdminOrg {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  created_at: string;
  subscription: {
    id: string;
    plan_type: string;
    status: string;
    started_at: string;
    expires_at: string | null;
    trial: boolean;
  } | null;
}

export interface AdminSubscriptionUpdate {
  planType: string;
  status?: string;
}

export async function checkSuperAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("super_admins")
    .select("id")
    .maybeSingle();
  return !error && !!data;
}

export async function listOrganizations(): Promise<AdminOrg[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_list_organizations");
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as AdminOrg[];
}

export async function updateOrgSubscription(
  orgId: string,
  params: AdminSubscriptionUpdate,
): Promise<AdminOrg["subscription"]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_update_subscription", {
    target_org_id: orgId,
    new_plan_type: params.planType,
    new_status: params.status ?? "active",
  });
  if (error) throw new Error(error.message);
  return data as AdminOrg["subscription"];
}
