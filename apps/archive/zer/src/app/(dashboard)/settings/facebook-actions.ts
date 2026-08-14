"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { capture, withDbCapture } from "@zuiio/capture";
import { requireActionContext } from "@/lib/action-utils";
import { createServiceClient } from "@/lib/supabase/server-service";

const GATEWAY_URL = process.env.AGENT_GATEWAY_URL ?? "";
const GATEWAY_API_SECRET = process.env.AGENT_GATEWAY_API_SECRET ?? "";

export interface FacebookConnectionInfo {
  channel: "messenger" | "instagram";
  pageId: string;
  pageName: string | null;
  connectedAt: string | null;
  webhookSubscribedAt: string | null;
  tokenExpiresAt: string | null;
}

/**
 * List the org's active Messenger/Instagram page connections.
 *
 * channel_connections is FORCE RLS (service-role only — see agent-gateway
 * migration 20260802000001_harden_rls.sql), so this reads with the service
 * client while scoping strictly to the authenticated user's org.
 */
export async function getFacebookConnections(): Promise<
  FacebookConnectionInfo[]
> {
  const ctx = await requireActionContext("settings.manage");
  if ("error" in ctx) return [];

  const service = createServiceClient();
  // channel_connections is not in the generated Database types — cast like
  // the telegram_links reads in settings-content.tsx.
  const { data, error } = await withDbCapture(
    "settings:facebook:connections",
    (service as unknown as SupabaseClient)
      .from("channel_connections")
      .select(
        "channel, page_id, page_name, created_at, webhook_subscribed_at, token_expires_at",
      )
      .eq("organization_id", ctx.organizationId)
      .in("channel", ["messenger", "instagram"])
      .eq("is_active", true)
      .order("created_at", { ascending: false }),
  );

  if (error) {
    capture(error, { context: "facebook: fetch connections" });
    return [];
  }

  return (data ?? []).map((row) => ({
    channel: row.channel as "messenger" | "instagram",
    pageId: row.page_id ?? "",
    pageName: row.page_name ?? null,
    connectedAt: row.created_at ?? null,
    webhookSubscribedAt: row.webhook_subscribed_at ?? null,
    tokenExpiresAt: row.token_expires_at ?? null,
  }));
}

export type FacebookOAuthResult = { redirectUrl: string } | { error: string };

/**
 * Start the Facebook/Instagram page-connect OAuth flow.
 *
 * 1. Mint a compact link token from the gateway (/api/link/generate,
 *    x-api-key auth — same as the Telegram flow).
 * 2. Ask the gateway to build the verified OAuth dialog URL
 *    (/api/facebook/start — orgId/productType come from the HMAC token,
 *    never from the client).
 *
 * The returned URL must be followed with a full-page navigation (window
 * location), because the dialog cookie is set on the gateway origin.
 */
export async function startFacebookOAuth(): Promise<FacebookOAuthResult> {
  const ctx = await requireActionContext("settings.manage");
  if ("error" in ctx) return { error: ctx.error };

  if (!GATEWAY_URL || !GATEWAY_API_SECRET) {
    capture(new Error("AGENT_GATEWAY_URL/AGENT_GATEWAY_API_SECRET not set"), {
      context: "facebook: start OAuth",
    });
    return {
      error: "Agent gateway тохиргоогүй байна. Админтай холбогдоно уу.",
    };
  }

  try {
    const generateResponse = await fetch(`${GATEWAY_URL}/api/link/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": GATEWAY_API_SECRET,
      },
      body: JSON.stringify({
        orgId: ctx.organizationId,
        userId: ctx.userId,
        productType: "zer",
      }),
    });
    if (!generateResponse.ok) {
      capture(new Error(`link/generate ${generateResponse.status}`), {
        context: "facebook: start OAuth",
      });
      return { error: "Холболтын токен үүсгэхэд алдаа гарлаа." };
    }
    const { token } = (await generateResponse.json()) as { token?: string };
    if (!token) return { error: "Холболтын токен олдсонгүй." };

    const startResponse = await fetch(`${GATEWAY_URL}/api/facebook/start`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": GATEWAY_API_SECRET,
      },
      body: JSON.stringify({ token }),
    });
    const startData = (await startResponse.json()) as {
      redirectUrl?: string;
      error?: string;
    };
    if (!startResponse.ok || !startData.redirectUrl) {
      capture(
        new Error(
          `facebook/start ${startResponse.status}: ${startData.error ?? "no redirectUrl"}`,
        ),
        { context: "facebook: start OAuth" },
      );
      return {
        error:
          startData.error ??
          "Facebook холболт эхлүүлэхэд алдаа гарлаа. Дахин оролдоно уу.",
      };
    }

    return { redirectUrl: startData.redirectUrl };
  } catch (err) {
    capture(err, { context: "facebook: start OAuth" });
    return { error: "Facebook холболт эхлүүлэхэд алдаа гарлаа." };
  }
}
