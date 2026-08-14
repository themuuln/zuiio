import type { SupabaseClient } from "@supabase/supabase-js";
import { invalidateSubscriptionCache } from "./subscription-enforcement";

export type AdminRole = "super_admin" | "seller" | "marketing_manager";

export interface AdminUser {
  id: string;
  user_id: string;
  role: AdminRole;
  created_at: string;
}

export interface SellerAssignment {
  id: string;
  seller_id: string;
  organization_id: string;
  organization_name?: string;
  organization_slug?: string;
  created_at: string;
}

export interface MarketingCampaign {
  id: string;
  organization_id: string | null;
  organization_name?: string;
  name: string;
  type: string;
  status: string;
  target_count: number;
  sent_count: number;
  opened_count: number;
  clicked_count: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

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

export async function getAdminUser(
  db: SupabaseClient,
): Promise<AdminUser | null> {
  const supabase = db;
  const { data, error } = await supabase
    .from("super_admins")
    .select("id, user_id, role, created_at")
    .maybeSingle();
  if (error || !data) return null;
  return data as AdminUser;
}

export async function checkSuperAdmin(db: SupabaseClient): Promise<boolean> {
  const user = await getAdminUser(db);
  return user?.role === "super_admin";
}

export async function checkAdminRole(
  db: SupabaseClient,
  role: AdminRole,
): Promise<boolean> {
  const user = await getAdminUser(db);
  return user?.role === role || user?.role === "super_admin";
}

export async function listOrganizations(
  db: SupabaseClient,
): Promise<AdminOrg[]> {
  const supabase = db;
  const { data, error } = await supabase.rpc("admin_list_organizations");
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as AdminOrg[];
}

export async function updateOrgSubscription(
  db: SupabaseClient,
  orgId: string,
  params: AdminSubscriptionUpdate,
): Promise<AdminOrg["subscription"]> {
  const supabase = db;
  const { data, error } = await supabase.rpc("admin_update_subscription", {
    target_org_id: orgId,
    new_plan_type: params.planType,
    new_status: params.status ?? "active",
  });
  if (error) throw new Error(error.message);
  invalidateSubscriptionCache(orgId);
  return data as AdminOrg["subscription"];
}

export async function extendSubscriptionTrial(
  db: SupabaseClient,
  orgId: string,
): Promise<AdminOrg["subscription"]> {
  const supabase = db;
  const { data, error } = await supabase.rpc("admin_extend_subscription", {
    target_org_id: orgId,
  });
  if (error) throw new Error(error.message);
  invalidateSubscriptionCache(orgId);
  return data as AdminOrg["subscription"];
}

// ── Seller Management ──────────────────────────────────────────

export async function listSellerAssignments(
  db: SupabaseClient,
  sellerId: string,
): Promise<SellerAssignment[]> {
  const supabase = db;
  const { data, error } = await supabase
    .from("seller_assignments")
    .select(
      "id, seller_id, organization_id, created_at, organizations(name, slug)",
    )
    .eq("seller_id", sellerId);
  if (error) throw new Error(error.message);
  return (data ?? []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    seller_id: row.seller_id as string,
    organization_id: row.organization_id as string,
    organization_name: (row.organizations as Record<string, unknown>)
      ?.name as string,
    organization_slug: (row.organizations as Record<string, unknown>)
      ?.slug as string,
    created_at: row.created_at as string,
  }));
}

export async function assignSellerToOrg(
  db: SupabaseClient,
  sellerId: string,
  orgId: string,
): Promise<SellerAssignment> {
  const supabase = db;
  const { data, error } = await supabase
    .from("seller_assignments")
    .insert({ seller_id: sellerId, organization_id: orgId })
    .select("id, seller_id, organization_id, created_at")
    .single();
  if (error) throw new Error(error.message);
  return data as SellerAssignment;
}

export async function removeSellerAssignment(
  db: SupabaseClient,
  assignmentId: string,
): Promise<void> {
  const supabase = db;
  const { error } = await supabase
    .from("seller_assignments")
    .delete()
    .eq("id", assignmentId);
  if (error) throw new Error(error.message);
}

// ── Marketing Campaigns ────────────────────────────────────────

export async function listCampaigns(
  db: SupabaseClient,
): Promise<MarketingCampaign[]> {
  const supabase = db;
  const { data, error } = await supabase
    .from("marketing_campaigns")
    .select("*, organizations(name)")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row: Record<string, unknown>) => ({
    ...row,
    organization_name: (row.organizations as Record<string, unknown>)
      ?.name as string,
  })) as MarketingCampaign[];
}

export async function createCampaign(
  db: SupabaseClient,
  params: {
    name: string;
    type: string;
    organization_id?: string;
    created_by?: string;
  },
): Promise<MarketingCampaign> {
  const supabase = db;
  const { data, error } = await supabase
    .from("marketing_campaigns")
    .insert({
      name: params.name,
      type: params.type,
      organization_id: params.organization_id ?? null,
      created_by: params.created_by ?? null,
    })
    .select("*, organizations(name)")
    .single();
  if (error) throw new Error(error.message);
  return {
    ...data,
    organization_name: (data as Record<string, unknown>).organizations
      ? ((
          (data as Record<string, unknown>).organizations as Record<
            string,
            unknown
          >
        ).name as string)
      : undefined,
  } as MarketingCampaign;
}

export async function updateCampaign(
  db: SupabaseClient,
  campaignId: string,
  params: Partial<Pick<MarketingCampaign, "name" | "type" | "status">>,
): Promise<MarketingCampaign> {
  const supabase = db;
  const { data, error } = await supabase
    .from("marketing_campaigns")
    .update({ ...params, updated_at: new Date().toISOString() })
    .eq("id", campaignId)
    .select("*, organizations(name)")
    .single();
  if (error) throw new Error(error.message);
  return {
    ...data,
    organization_name: (data as Record<string, unknown>).organizations
      ? ((
          (data as Record<string, unknown>).organizations as Record<
            string,
            unknown
          >
        ).name as string)
      : undefined,
  } as MarketingCampaign;
}

export async function deleteCampaign(
  db: SupabaseClient,
  campaignId: string,
): Promise<void> {
  const supabase = db;
  const { error } = await supabase
    .from("marketing_campaigns")
    .delete()
    .eq("id", campaignId);
  if (error) throw new Error(error.message);
}

// ── Platform Analytics ─────────────────────────────────────────

export async function getPlatformStats(db: SupabaseClient) {
  const supabase = db;

  const [orgsResult, subsResult, usersResult] = await Promise.all([
    supabase.from("organizations").select("id", { count: "exact", head: true }),
    supabase.from("subscription_plans").select("plan_type, status"),
    supabase.from("super_admins").select("role"),
  ]);

  const orgs = orgsResult.count ?? 0;
  const subs = subsResult.data ?? [];
  const admins = usersResult.data ?? [];

  const planCounts: Record<string, number> = {};
  const statusCounts: Record<string, number> = {};
  for (const sub of subs) {
    planCounts[sub.plan_type] = (planCounts[sub.plan_type] || 0) + 1;
    statusCounts[sub.status] = (statusCounts[sub.status] || 0) + 1;
  }

  return {
    total_orgs: orgs,
    plans: planCounts,
    statuses: statusCounts,
    sellers: admins.filter((a) => a.role === "seller").length,
    marketing_managers: admins.filter((a) => a.role === "marketing_manager")
      .length,
    super_admins: admins.filter((a) => a.role === "super_admin").length,
  };
}
