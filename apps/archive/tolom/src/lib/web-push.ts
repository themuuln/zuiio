/**
 * Server-side Web Push configuration.
 *
 * VAPID keys are generated once with `webpush.generateVAPIDKeys()` and stored
 * as env vars: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_EMAIL.
 *
 * The public key is safe to expose (it goes to the client for subscription).
 * The private key MUST stay server-side only.
 */

import webPush from "web-push";
import { env } from "./supabase/env";

let configured = false;

export function getVapidPublicKey(): string {
  return env("NEXT_PUBLIC_VAPID_PUBLIC_KEY");
}

function ensureConfigured() {
  if (configured) return;

  const email = env("VAPID_EMAIL");
  const publicKey = env("NEXT_PUBLIC_VAPID_PUBLIC_KEY");
  const privateKey = env("VAPID_PRIVATE_KEY");

  webPush.setVapidDetails(`mailto:${email}`, publicKey, privateKey);
  configured = true;
}

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface SendPushResult {
  success: boolean;
  status?: number;
  reason?: string;
}

/**
 * Send a push notification to a single subscription.
 * Returns a result object so callers can handle expired subscriptions
 * (status 404/410) by removing them from the DB.
 */
export async function sendPush(
  subscription: PushSubscription,
  payload: Record<string, unknown>,
): Promise<SendPushResult> {
  ensureConfigured();

  try {
    await webPush.sendNotification(subscription, JSON.stringify(payload));
    return { success: true };
  } catch (error: unknown) {
    if (error && typeof error === "object" && "statusCode" in error) {
      const statusCode = error.statusCode;
      if (typeof statusCode !== "number") {
        return { success: false, reason: String(error) };
      }
      const reason =
        "body" in error && typeof error.body === "string"
          ? error.body
          : undefined;
      return { success: false, status: statusCode, reason };
    }
    return { success: false, reason: String(error) };
  }
}

export { webPush };
