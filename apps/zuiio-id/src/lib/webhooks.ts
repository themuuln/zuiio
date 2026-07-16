import { createHmac } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/server";

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = [5000, 30000, 300000]; // 5s, 30s, 5min

export interface WebhookPayload {
  event: string;
  timestamp: string;
  data: Record<string, unknown>;
}

/**
 * Sign a webhook payload with HMAC-SHA256.
 */
function signPayload(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

/**
 * Dispatch webhook for an audit event.
 * Called after audit events are recorded.
 */
export async function dispatchWebhook(
  eventType: string,
  eventData: Record<string, unknown>,
): Promise<void> {
  try {
    const admin = await createAdminClient();

    // Find all active subscriptions for this event type
    // (empty events array means "subscribe to all")
    const { data: subscriptions } = await admin
      .from("webhook_subscriptions")
      .select("*")
      .eq("active", true)
      .or(`events.cs.{${eventType}},events.eq.{}`);

    if (!subscriptions || subscriptions.length === 0) return;

    const payload: WebhookPayload = {
      event: eventType,
      timestamp: new Date().toISOString(),
      data: eventData,
    };

    const payloadJson = JSON.stringify(payload);

    // Deliver to each subscriber
    for (const sub of subscriptions) {
      const signature = signPayload(payloadJson, sub.secret);

      // Create delivery record
      const { data: delivery } = await admin
        .from("webhook_deliveries")
        .insert({
          subscription_id: sub.id,
          event_type: eventType,
          payload,
          status: "pending",
          attempts: 1,
        })
        .select()
        .single();

      if (!delivery) continue;

      // Fire the webhook (fire-and-forget)
      void deliverWebhook(sub.url, payloadJson, signature, delivery.id);
    }
  } catch {
    // Webhook dispatch failures must never block auth flows
  }
}

/**
 * Deliver a webhook payload to a URL.
 * Retries on failure with exponential backoff.
 */
async function deliverWebhook(
  url: string,
  payload: string,
  signature: string,
  deliveryId: string,
): Promise<void> {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Zuiio-Signature": signature,
        "X-Zuiio-Event": JSON.parse(payload).event,
        "User-Agent": "Zuiio-Webhook/1.0",
      },
      body: payload,
      signal: AbortSignal.timeout(10000), // 10s timeout
    });

    const admin = await createAdminClient();

    if (response.ok) {
      await admin
        .from("webhook_deliveries")
        .update({
          status: "success",
          response_status: response.status,
        })
        .eq("id", deliveryId);
    } else {
      await handleFailedDelivery(deliveryId, response.status);
    }
  } catch {
    await handleFailedDelivery(deliveryId, 0);
  }
}

/**
 * Handle a failed delivery -- increment attempts and schedule retry.
 */
async function handleFailedDelivery(
  deliveryId: string,
  responseStatus: number,
): Promise<void> {
  try {
    const admin = await createAdminClient();

    // Get current delivery
    const { data: delivery } = await admin
      .from("webhook_deliveries")
      .select("attempts")
      .eq("id", deliveryId)
      .single();

    if (!delivery) return;

    const newAttempts = delivery.attempts + 1;

    if (newAttempts >= MAX_RETRIES) {
      // Max retries reached -- mark as failed permanently
      await admin
        .from("webhook_deliveries")
        .update({
          status: "failed",
          response_status: responseStatus,
          attempts: newAttempts,
        })
        .eq("id", deliveryId);
    } else {
      // Schedule retry
      const delay = RETRY_DELAY_MS[newAttempts - 1] ?? RETRY_DELAY_MS[2] ?? 300000;
      await admin
        .from("webhook_deliveries")
        .update({
          attempts: newAttempts,
          next_retry_at: new Date(Date.now() + delay).toISOString(),
          response_status: responseStatus,
        })
        .eq("id", deliveryId);
    }
  } catch {
    // Best-effort
  }
}

/**
 * Verify a webhook signature (for receivers).
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string,
): boolean {
  const expected = signPayload(payload, secret);
  // Constant-time comparison
  if (expected.length !== signature.length) return false;
  let result = 0;
  for (let i = 0; i < expected.length; i++) {
    result |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return result === 0;
}
