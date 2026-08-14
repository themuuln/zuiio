import { createClient } from "@/lib/supabase/server";

// In-memory cache for subscription status (60s TTL)
// Subscriptions change rarely — this eliminates ~16K redundant DB calls per session
const CACHE_TTL_MS = 60_000;
const subscriptionCache = new Map<
  string,
  {
    result: { expired: boolean; message?: string; status?: string };
    expiresAt: number;
  }
>();

function getCached(
  orgId: string,
): { expired: boolean; message?: string; status?: string } | null {
  const entry = subscriptionCache.get(orgId);
  if (entry && Date.now() < entry.expiresAt) return entry.result;
  subscriptionCache.delete(orgId);
  return null;
}

function setCached(
  orgId: string,
  result: { expired: boolean; message?: string; status?: string },
): void {
  subscriptionCache.set(orgId, {
    result,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

export async function checkSubscriptionExpired(
  orgId: string,
): Promise<{ expired: boolean; message?: string; status?: string }> {
  const cached = getCached(orgId);
  if (cached) return cached;

  const supabase = await createClient();

  const { data, error } = await supabase.rpc("check_org_subscription_status", {
    target_org_id: orgId,
  });

  if (error) {
    return { expired: false };
  }

  if (data && typeof data === "object" && "expired" in data) {
    const result = {
      expired: data.expired === true,
      message: typeof data.message === "string" ? data.message : undefined,
      status: typeof data.status === "string" ? data.status : undefined,
    };
    setCached(orgId, result);
    return result;
  }

  return { expired: false };
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

/**
 * Invalidate cached subscription status for an org.
 * Call after subscription updates (admin extend, renew, etc.)
 */
export function invalidateSubscriptionCache(orgId: string): void {
  subscriptionCache.delete(orgId);
}
