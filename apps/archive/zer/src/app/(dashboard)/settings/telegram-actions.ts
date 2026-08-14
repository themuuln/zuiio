"use server";

import { capture } from "@zuiio/capture";
import { requireActionContext } from "@/lib/action-utils";

const GATEWAY_URL = process.env.AGENT_GATEWAY_URL ?? "";
const GATEWAY_API_SECRET = process.env.AGENT_GATEWAY_API_SECRET ?? "";

export interface TelegramLinkCode {
  formatted: string;
}

/**
 * Mint a Telegram device-auth link code from the agent gateway.
 *
 * The gateway's /api/link/code requires x-api-key (server-to-server only) —
 * it must never be called from the browser with the shared secret. This action
 * proxies the call with the authenticated org/user from the session.
 */
export async function getTelegramLinkCode(): Promise<TelegramLinkCode | null> {
  const ctx = await requireActionContext("settings.manage");
  if ("error" in ctx) return null;

  if (!GATEWAY_URL || !GATEWAY_API_SECRET) {
    capture(new Error("AGENT_GATEWAY_URL/AGENT_GATEWAY_API_SECRET not set"), {
      context: "telegram: fetch link code",
    });
    return null;
  }

  try {
    const res = await fetch(`${GATEWAY_URL}/api/link/code`, {
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
    if (!res.ok) {
      capture(new Error(`link/code ${res.status}`), {
        context: "telegram: fetch link code",
      });
      return null;
    }
    const data = (await res.json()) as { formatted?: string };
    return data.formatted ? { formatted: data.formatted } : null;
  } catch (err) {
    capture(err, { context: "telegram: fetch link code" });
    return null;
  }
}
