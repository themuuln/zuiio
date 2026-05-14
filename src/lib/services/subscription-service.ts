import { NotFoundError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import type { SubscriptionPlan } from "@/lib/database.types";
import type {
  SubscriptionPlanInfo,
  UpdateSubscriptionParams,
  SubscriptionStatus,
} from "@/lib/types";

export { checkSubscriptionExpired } from "./subscription-enforcement";

function mapSubscription(plan: SubscriptionPlan): SubscriptionPlanInfo {
  const settings =
    typeof plan.settings === "object" && plan.settings !== null
      ? (plan.settings as Record<string, unknown>)
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
  orgId: string,
): Promise<SubscriptionPlanInfo | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("subscription_plans")
    .select("*")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message ?? "Failed to fetch subscription");
  }

  return data ? mapSubscription(data) : null;
}

export async function checkSubscriptionStatus(
  orgId: string,
): Promise<SubscriptionStatus> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc(
    "check_org_subscription_status",
    { target_org_id: orgId },
  );

  if (error) {
    throw new Error(error.message ?? "Failed to check subscription status");
  }

  return data as unknown as SubscriptionStatus;
}

export async function createSubscription(
  orgId: string,
): Promise<SubscriptionPlanInfo> {
  const supabase = await createClient();

  const { error } = await supabase.rpc("create_default_subscription", {
    target_org_id: orgId,
  });

  if (error) {
    throw new Error(error.message ?? "Failed to create subscription");
  }

  const subscription = await getOrganizationSubscription(orgId);
  if (!subscription) {
    throw new Error("Subscription was created but could not be retrieved");
  }

  return subscription;
}

export async function updateSubscription(
  orgId: string,
  params: UpdateSubscriptionParams,
): Promise<SubscriptionPlanInfo> {
  const supabase = await createClient();

  const currentPlan = await getOrganizationSubscription(orgId);
  if (!currentPlan) {
    throw new NotFoundError("No subscription found for this organization");
  }

  const { data, error } = await supabase
    .from("subscription_plans")
    .update({
      plan_type: params.planType,
      status: "active",
      updated_at: new Date().toISOString(),
    })
    .eq("id", currentPlan.id)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to update subscription");
  }

  return mapSubscription(data);
}

export async function renewSubscription(
  orgId: string,
): Promise<SubscriptionPlanInfo> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc(
    "renew_organization_subscription",
    { target_org_id: orgId },
  );

  if (error) {
    throw new Error(error.message ?? "Failed to renew subscription");
  }

  return data as unknown as SubscriptionPlanInfo;
}
