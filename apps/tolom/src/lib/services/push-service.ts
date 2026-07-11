/**
 * Push notification service.
 * Manages subscriptions and sends notifications through the web-push protocol.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { capture } from "@zuiio/capture";
import {
  sendPush,
  type PushSubscription,
  type SendPushResult,
} from "@/lib/web-push";

// ── Types ──────────────────────────────────────────────────────

interface PushSubscriptionRow {
  id: string;
  user_id: string;
  organization_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  user_agent: string | null;
  created_at: string;
  last_used_at: string | null;
}

interface PushNotificationPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

// ── Subscription Management ────────────────────────────────────

export async function saveSubscription(
  supabase: SupabaseClient,
  params: {
    userId: string;
    organizationId: string;
    subscription: PushSubscription;
    userAgent?: string;
  },
): Promise<{ id: string }> {
  const { userId, organizationId, subscription, userAgent } = params;

  // Upsert: if this endpoint already exists for this user, update the keys
  const { data, error } = await supabase
    .from("push_subscriptions")
    .upsert(
      {
        user_id: userId,
        organization_id: organizationId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        user_agent: userAgent ?? null,
      },
      { onConflict: "endpoint" },
    )
    .select("id")
    .single();

  if (error) {
    capture(error, { context: "push_save_subscription" });
    throw error;
  }

  return { id: data.id };
}

export async function removeSubscription(
  supabase: SupabaseClient,
  endpoint: string,
): Promise<void> {
  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("endpoint", endpoint);

  if (error) {
    capture(error, { context: "push_remove_subscription" });
    throw error;
  }
}

export async function removeExpiredSubscriptions(
  supabase: SupabaseClient,
  endpoints: string[],
): Promise<void> {
  if (endpoints.length === 0) return;

  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .in("endpoint", endpoints);

  if (error) {
    capture(error, { context: "push_remove_expired" });
  }
}

// ── Sending ────────────────────────────────────────────────────

/**
 * Send a push notification to all subscriptions of a specific user.
 * Automatically removes expired subscriptions (404/410 from push service).
 */
export async function sendPushToUser(
  supabase: SupabaseClient,
  userId: string,
  notification: PushNotificationPayload,
): Promise<SendPushResult[]> {
  const { data: rows, error } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", userId);

  if (error || !rows || rows.length === 0) {
    if (error) capture(error, { context: "push_fetch_user_subs" });
    return [];
  }

  return sendToSubscriptions(supabase, rows, notification);
}

/**
 * Send a push notification to all subscriptions of an organization.
 * Useful for org-wide announcements (e.g., new work order assigned).
 */
export async function sendPushToOrganization(
  supabase: SupabaseClient,
  organizationId: string,
  notification: PushNotificationPayload,
): Promise<SendPushResult[]> {
  const { data: rows, error } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("organization_id", organizationId);

  if (error || !rows || rows.length === 0) {
    if (error) capture(error, { context: "push_fetch_org_subs" });
    return [];
  }

  return sendToSubscriptions(supabase, rows, notification);
}

/**
 * Send a push notification to specific users within an organization.
 * Used for targeted notifications (e.g., assignee gets work order update).
 */
export async function sendPushToUsers(
  supabase: SupabaseClient,
  userIds: string[],
  notification: PushNotificationPayload,
): Promise<SendPushResult[]> {
  if (userIds.length === 0) return [];

  const { data: rows, error } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .in("user_id", userIds);

  if (error || !rows || rows.length === 0) {
    if (error) capture(error, { context: "push_fetch_multi_user_subs" });
    return [];
  }

  return sendToSubscriptions(supabase, rows, notification);
}

// ── Internal ───────────────────────────────────────────────────

async function sendToSubscriptions(
  supabase: SupabaseClient,
  rows: Array<Pick<PushSubscriptionRow, "endpoint" | "p256dh" | "auth">>,
  notification: PushNotificationPayload,
): Promise<SendPushResult[]> {
  const expiredEndpoints: string[] = [];
  const results: SendPushResult[] = [];

  const sendPromises = rows.map(async (row) => {
    const subscription: PushSubscription = {
      endpoint: row.endpoint,
      keys: { p256dh: row.p256dh, auth: row.auth },
    };

    const result = await sendPush(subscription, {
      title: notification.title,
      body: notification.body,
      url: notification.url ?? "/dashboard",
      tag: notification.tag ?? "tolom-notification",
      renotify: true,
    });

    // 404 = subscription expired, 410 = subscription revoked
    if (!result.success && (result.status === 404 || result.status === 410)) {
      expiredEndpoints.push(row.endpoint);
    }

    results.push(result);
  });

  await Promise.allSettled(sendPromises);

  // Clean up expired subscriptions in batch
  if (expiredEndpoints.length > 0) {
    await removeExpiredSubscriptions(supabase, expiredEndpoints);
  }

  return results;
}
