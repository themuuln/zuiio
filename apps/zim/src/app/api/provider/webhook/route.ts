import { type NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import {
  normalizeWebhook,
  verifyWebhookSignature,
} from "@/lib/provider/webhook";
import type { ProviderWebhookEvent } from "@/lib/provider/types";
import { applyProviderWebhook } from "@/lib/provisioning";

// ─── Per-provider HMAC config ───────────────────────────────────────
// Providers absent from this map either lack HMAC docs (roamic, bappy)
// or are not yet configured (mock).

const PROVIDER_HMAC: Record<
  string,
  { header: string; envKey: string; algorithm?: "sha256" | "sha512" }
> = {
  firsty: { header: "x-firsty-signature", envKey: "FIRSTY_WEBHOOK_SECRET" },
  "citrus-mobile": {
    header: "x-citrus-signature",
    envKey: "CITRUS_WEBHOOK_SECRET",
  },
};

/**
 * Async provisioning webhook. Idempotent via the webhook_events
 * unique (provider, event_id) constraint — duplicates are ACKed
 * without reprocessing.
 */
export async function POST(request: NextRequest) {
  const expected =
    process.env.PROVIDER_WEBHOOK_SECRET || "zim-dev-webhook-secret";
  if (request.headers.get("x-webhook-secret") !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const provider = request.headers.get("x-provider") ?? "mock";

  // Capture raw body for HMAC verification (must precede JSON.parse)
  const rawBody = await request.text();
  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  // HMAC verification for providers with known signature headers
  let verified: boolean | undefined;
  const hmacConfig = PROVIDER_HMAC[provider];
  if (hmacConfig) {
    const signature = request.headers.get(hmacConfig.header);
    const secret = process.env[hmacConfig.envKey];
    if (signature && secret) {
      verified = verifyWebhookSignature(
        secret,
        rawBody,
        signature,
        hmacConfig.algorithm,
      );
      if (!verified) {
        console.warn(
          `[webhook:${provider}] HMAC verification failed`,
          { provider, header: hmacConfig.header },
        );
      }
    } else {
      verified = false;
      console.warn(
        `[webhook:${provider}] expected HMAC header or secret missing`,
        {
          provider,
          header: hmacConfig.header,
          hasSignature: !!signature,
          hasSecret: !!secret,
        },
      );
    }
  } else if (provider !== "mock") {
    console.warn(
      `[webhook:${provider}] no HMAC verification available — format undocumented`,
      { provider },
    );
  }

  let event: ProviderWebhookEvent;
  try {
    event = normalizeWebhook(provider, payload, { verified });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "bad payload" },
      { status: 400 },
    );
  }

  const db = getDb();
  const fresh = await db.insertWebhookEvent(provider, event.eventId, payload);
  if (!fresh) {
    console.log("[webhook] duplicate", { provider, eventId: event.eventId });
    return NextResponse.json({ ok: true, duplicate: true });
  }

  console.log("[webhook] processing", {
    provider,
    eventId: event.eventId,
    type: event.type,
    verified,
  });

  await applyProviderWebhook(event);
  await db.markWebhookProcessed(provider, event.eventId);
  return NextResponse.json({ ok: true });
}
