import { NotFoundError } from "@/lib/errors";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  SubscriptionPlan,
  SubscriptionPlanInfo,
  SubscriptionStatus,
  UpdateSubscriptionParams,
} from "@/lib/types";

export { checkSubscriptionExpired } from "./subscription-enforcement";

function mapSubscription(plan: SubscriptionPlan): SubscriptionPlanInfo {
  const settings =
    typeof plan.settings === "object" && plan.settings !== null
      ? (plan.settings as unknown as Record<string, unknown>)
      : {};

  return {
    id: plan.id,
    organizationId: plan.organization_id,
    planType: plan.plan_type,
    status: plan.status,
    startedAt: plan.started_at,
    expiresAt: plan.expires_at,
    gracePeriodEnd: plan.grace_period_end ?? null,
    trial: settings.trial === true,
  };
}

export async function getOrganizationSubscription(
  db: SupabaseClient,
  orgId: string,
): Promise<SubscriptionPlanInfo | null> {
  const supabase = db;

  const { data, error } = await supabase
    .from("subscription_plans")
    .select(
      "id, organization_id, plan_type, status, started_at, expires_at, grace_period_end, settings, created_at, updated_at",
    )
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message ?? "Failed to fetch subscription");
  }

  return data ? mapSubscription(data as unknown as SubscriptionPlan) : null;
}

export async function checkSubscriptionStatus(
  db: SupabaseClient,
  orgId: string,
): Promise<SubscriptionStatus> {
  const supabase = db;

  const { data, error } = await supabase.rpc("check_org_subscription_status", {
    target_org_id: orgId,
  });

  if (error) {
    throw new Error(error.message ?? "Failed to check subscription status");
  }

  return data as unknown as unknown as unknown as SubscriptionStatus;
}

export async function createSubscription(
  db: SupabaseClient,
  orgId: string,
): Promise<SubscriptionPlanInfo> {
  const supabase = db;

  const { error } = await supabase.rpc("create_default_subscription", {
    target_org_id: orgId,
  });

  if (error) {
    throw new Error(error.message ?? "Failed to create subscription");
  }

  const subscription = await getOrganizationSubscription(db, orgId);
  if (!subscription) {
    throw new Error("Subscription was created but could not be retrieved");
  }

  return subscription;
}

export async function updateSubscription(
  db: SupabaseClient,
  orgId: string,
  params: UpdateSubscriptionParams,
): Promise<SubscriptionPlanInfo> {
  const supabase = db;

  const currentPlan = await getOrganizationSubscription(db, orgId);
  if (!currentPlan) {
    throw new NotFoundError("No subscription found for this organization");
  }

  // Sequential: update depends on currentPlan.id
  const { data, error } = await supabase
    .from("subscription_plans")
    .update({
      plan_type: params.planType,
      status: "active",
      updated_at: new Date().toISOString(),
    })
    .eq("id", currentPlan.id)
    .select(
      "id, organization_id, plan_type, status, started_at, expires_at, grace_period_end, settings, created_at, updated_at",
    )
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to update subscription");
  }

  return mapSubscription(data as unknown as SubscriptionPlan);
}

export async function renewSubscription(
  db: SupabaseClient,
  orgId: string,
): Promise<SubscriptionPlanInfo> {
  const supabase = db;

  const { data, error } = await supabase.rpc(
    "renew_organization_subscription",
    { target_org_id: orgId },
  );

  if (error) {
    throw new Error(error.message ?? "Failed to renew subscription");
  }

  return data as unknown as unknown as unknown as SubscriptionPlanInfo;
}
