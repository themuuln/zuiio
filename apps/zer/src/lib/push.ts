import type { SupabaseClient } from "@supabase/supabase-js";
import { capture, withDbCapture } from "@zuiio/capture";
import webpush from "web-push";
import type { Database } from "@/lib/supabase/types";

/**
 * Web push (browser) notifications.
 *
 * Server-only module: VAPID keys come from environment variables.
 * Generate keys with: npx web-push generate-vapid-keys --json
 */

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY ?? "";
const VAPID_SUBJECT = process.env.VAPID_SUBJECT ?? "";

export interface PushSubscriptionInput {
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent?: string;
}

export interface WebPushPayload {
  title: string;
  body: string;
  url?: string;
  eventType?: string;
}

export interface WebPushResult {
  success: boolean;
  sent: number;
  failed: number;
  error?: string;
}

/** True when all VAPID env vars are present. */
export function isWebPushConfigured(): boolean {
  return Boolean(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY && VAPID_SUBJECT);
}

/**
 * Register (or refresh) a push subscription for a user.
 * Upserts by endpoint so re-subscribing updates the p256dh/auth keys.
 */
export async function savePushSubscription(
  supabase: SupabaseClient<Database>,
  orgId: string,
  userId: string,
  { endpoint, p256dh, auth, userAgent }: PushSubscriptionInput,
): Promise<boolean> {
  const { error } = await withDbCapture(
    "push:saveSubscription",
    supabase.from("push_subscriptions" as never).upsert(
      {
        organization_id: orgId,
        user_id: userId,
        endpoint,
        p256dh,
        auth,
        user_agent: userAgent ?? null,
      } as never,
      { onConflict: "endpoint" },
    ),
    { orgId },
  );

  if (error) {
    capture(error, { context: "push: save subscription" });
    return false;
  }
  return true;
}

/** Remove a push subscription by endpoint (RLS-scoped to the caller's rows). */
export async function deletePushSubscription(
  supabase: SupabaseClient<Database>,
  endpoint: string,
): Promise<boolean> {
  const { error } = await withDbCapture(
    "push:deleteSubscription",
    supabase
      .from("push_subscriptions" as never)
      .delete()
      .eq("endpoint" as never, endpoint),
  );

  if (error) {
    capture(error, { context: "push: delete subscription" });
    return false;
  }
  return true;
}

/**
 * Send a web push notification to every subscription of an organization.
 *
 * Pass an admin/service client for an org-wide fan-out; with a user-scoped
 * client, RLS limits delivery to that user's own subscriptions.
 * Logs the outcome to the `notifications` table (channel "web_push").
 */
export async function sendWebPush(
  supabase: SupabaseClient<Database>,
  orgId: string,
  { title, body, url, eventType = "web_push" }: WebPushPayload,
): Promise<WebPushResult> {
  if (!isWebPushConfigured()) {
    return {
      success: false,
      sent: 0,
      failed: 0,
      error: "VAPID түлхүүрүүд тохируулаагүй байна.",
    };
  }

  const { data, error } = await withDbCapture(
    "push:listSubscriptions",
    supabase
      .from("push_subscriptions" as never)
      .select("endpoint, p256dh, auth")
      .eq("organization_id" as never, orgId),
    { orgId },
  );

  if (error) {
    capture(error, { context: "push: list subscriptions" });
    return { success: false, sent: 0, failed: 0, error: error.message };
  }

  const subscriptions = (data ?? []) as unknown as Array<{
    endpoint: string;
    p256dh: string;
    auth: string;
  }>;

  if (subscriptions.length === 0) {
    return { success: true, sent: 0, failed: 0 };
  }

  let sent = 0;
  let failed = 0;
  let lastError: string | undefined;

  try {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
    const payload = JSON.stringify({ title, body, url: url ?? "/" });

    for (const subscription of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          },
          payload,
        );
        sent += 1;
      } catch (err) {
        failed += 1;
        lastError =
          err instanceof Error
            ? err.message
            : "Web push илгээхэд алдаа гарлаа.";
        capture(err, { context: "push: send notification" });
      }
    }
  } catch (err) {
    failed = subscriptions.length;
    lastError =
      err instanceof Error ? err.message : "Web push илгээхэд алдаа гарлаа.";
    capture(err, { context: "push: send setup" });
  }

  // Log the outcome to the notifications table (mirrors sendTelegramNotification).
  await withDbCapture(
    "push:logOutcome",
    supabase.from("notifications").insert({
      organization_id: orgId,
      channel: "web_push",
      event_type: eventType,
      title,
      message: body,
      status: failed > 0 ? "failed" : "sent",
      sent_at: new Date().toISOString(),
      ...(lastError ? { error_message: lastError } : {}),
    }),
    { orgId },
  );

  return {
    success: failed === 0,
    sent,
    failed,
    ...(failed > 0 ? { error: lastError } : {}),
  };
}
