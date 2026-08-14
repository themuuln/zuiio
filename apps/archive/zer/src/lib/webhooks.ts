import "server-only";

import { createHmac } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { capture } from "@zuiio/capture";
import type { Database } from "@/lib/supabase/types";

export const WEBHOOK_EVENT_TYPES = [
  "sale.created",
  "sale.updated",
  "expense.created",
  "invoice.created",
  "invoice.paid",
  "product.created",
  "product.updated",
  "stock.low",
  "review.submitted",
  "blog.published",
] as const;

export type WebhookEventType = (typeof WEBHOOK_EVENT_TYPES)[number];

const MAX_ATTEMPTS = 3;

/**
 * Deliver an event payload to every active subscription for the org that
 * subscribes to the given event type. Records each delivery attempt.
 *
 * Fires-and-forgets: failures are captured, not thrown. Signed with
 * HMAC-SHA256 over the raw body using the subscription secret, sent as
 * `X-Zer-Signature: sha256=<hex>`.
 */
export async function deliverWebhookEvent(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  eventType: WebhookEventType,
  payload: Record<string, unknown>,
): Promise<void> {
  try {
    const { data: subscriptions, error } = await supabase
      .from("webhook_subscriptions")
      .select("id, url, secret, event_types")
      .eq("organization_id", organizationId)
      .eq("is_active", true)
      .contains("event_types", [eventType]);

    if (error) {
      capture(error, { context: "deliverWebhookEvent: fetch subscriptions" });
      return;
    }

    for (const sub of subscriptions ?? []) {
      const body = JSON.stringify({ event_type: eventType, ...payload });

      const signature = sub.secret
        ? createHmac("sha256", sub.secret).update(body).digest("hex")
        : null;

      let status: "success" | "failed" = "failed";
      let statusCode: number | null = null;
      let responseBody: string | null = null;

      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        try {
          const res = await fetch(sub.url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(signature
                ? { "X-Zer-Signature": `sha256=${signature}` }
                : {}),
            },
            body,
            signal: AbortSignal.timeout(10_000),
          });
          statusCode = res.status;
          responseBody = (await res.text()).slice(0, 2000);
          if (res.ok) {
            status = "success";
            break;
          }
        } catch (err) {
          capture(err, {
            context: `deliverWebhookEvent: attempt ${attempt} for ${sub.id}`,
          });
          if (attempt === MAX_ATTEMPTS) {
            responseBody =
              err instanceof Error
                ? err.message.slice(0, 2000)
                : "Unknown error";
          }
        }
      }

      const { error: insertError } = await supabase
        .from("webhook_deliveries")
        .insert({
          organization_id: organizationId,
          subscription_id: sub.id,
          event_type: eventType,
          payload: payload as never,
          status,
          status_code: statusCode,
          response_body: responseBody,
          attempts: status === "success" ? 1 : MAX_ATTEMPTS,
          delivered_at: new Date().toISOString(),
        });

      if (insertError) {
        capture(insertError, {
          context: "deliverWebhookEvent: record delivery",
        });
      }
    }
  } catch (err) {
    capture(err, { context: "deliverWebhookEvent" });
  }
}
