import { createClient } from "@/lib/supabase/server";

export async function checkSubscriptionExpired(
  orgId: string,
): Promise<{ expired: boolean; message?: string; status?: string }> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("check_org_subscription_status", {
    target_org_id: orgId,
  });

  if (error) {
    return { expired: false };
  }

  const result = data as {
    expired: boolean;
    message?: string;
    status?: string;
  };

  return {
    expired: result.expired === true,
    message: result.message,
    status: result.status,
  };
}

export async function requireActiveSubscription(orgId: string): Promise<void> {
  const { expired, message } = await checkSubscriptionExpired(orgId);

  if (expired) {
    const { ForbiddenError } = await import("@/lib/errors");
    throw new ForbiddenError(
      message ?? "Subscription expired. Please renew to continue.",
    );
  }
}
