import type { SupabaseClient } from "@supabase/supabase-js";
import { runWithTools } from "@zuiio/ai-agent";
import { capture } from "@zuiio/capture";
import { NextResponse } from "next/server";
import { createAllAgentTools } from "@/lib/agent-tools";
import {
  bindBuyerSession,
  getBuyerOrg,
  getBuyerSession,
  runBuyerAgent,
  touchBuyerSession,
} from "@/lib/bot-commerce";
import { createServiceClient } from "@/lib/supabase/server-service";
import type { Database } from "@/lib/supabase/types";

type ServiceSupabaseClient = SupabaseClient<Database>;

const NOT_BOUND_MESSAGE = `Сайн байна уу! 👋

Энэ хуудсаар дэлгүүрээс захиалга хийх боломжтой. Эхлүүлэхийн тулд дэлгүүрийн вэб хуудаснаас "Messenger-ээр захиалах" товчийг дарна уу.`;

const UNKNOWN_SHOP_MESSAGE = "Дэлгүүр олдсонгүй. Холбоосыг шалгана уу.";

const SYSTEM_PROMPT =
  "Та Монголын жижиг дунд бизнесийн AI туслах. Хариултаа Монгол хэлээр, товч, ойлгомжтой өгнө үү. Хэрэглэгчийн асуултанд хариулахдаа боломжтой бол багажуудыг ашиглана уу.";

const ERROR_MESSAGE =
  "Уучлаарай, хүсэлтийг боловсруулахад алдаа гарлаа. Дахин оролдоно уу.";

/**
 * GET /api/messenger/webhook
 *
 * Facebook Messenger webhook verification.
 * Facebook sends a GET request with hub.mode, hub.verify_token, hub.challenge.
 * Must respond with the challenge value to verify the webhook.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const verifyToken = process.env.MESSENGER_VERIFY_TOKEN;

  if (mode === "subscribe" && token === verifyToken && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }

  capture(new Error("Messenger webhook verification failed"), {
    context: "messenger: verify",
    extra: { mode, tokenMatch: token === verifyToken },
  });

  return new NextResponse("Verification failed", { status: 403 });
}

/**
 * POST /api/messenger/webhook
 *
 * Handles incoming events from Facebook Messenger with two modes:
 *
 * 1. Merchant mode — sender is linked via messenger_agent_links: runs the
 *    merchant AI tools (inventory/sales) and replies with the answer.
 * 2. Buyer mode (AI chat commerce) — the buyer deep-links from the
 *    storefront ("Messenger-ээр захиалах" → m.me/<page>?ref=<slug>), which
 *    arrives as a `referral` event and binds the PSID to the shop in
 *    bot_buyer_sessions. Subsequent messages run the buyer agent (public
 *    catalog + place_order) against that shop.
 *
 * Always returns 200 — Facebook retries on non-200.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const origin = new URL(request.url).origin;

    if (body.object === "page") {
      const entries = (body.entry as Array<Record<string, unknown>>) ?? [];

      for (const entry of entries) {
        const messaging =
          (entry.messaging as Array<Record<string, unknown>>) ?? [];

        for (const event of messaging) {
          const sender = event.sender as Record<string, unknown> | undefined;
          if (!sender) continue;
          const senderPsid = String(sender.id);

          // Deep-link referral (m.me/<page>?ref=<slug>) → bind buyer to shop.
          const referral = event.referral as
            | Record<string, unknown>
            | undefined;
          const ref =
            referral && typeof referral.ref === "string"
              ? referral.ref
              : undefined;

          if (ref) {
            // Handle asynchronously — don't block webhook response.
            handleReferral(senderPsid, ref).catch((e) => {
              capture(e, { context: "messenger: referral error" });
            });
            continue;
          }

          const message = event.message as Record<string, unknown> | undefined;
          if (!message || typeof message.text !== "string") continue;

          // Handle asynchronously — don't block webhook response.
          handleMessage(senderPsid, message.text, origin).catch((e) => {
            capture(e, { context: "messenger: handle message error" });
          });
        }
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch (e) {
    capture(e, { context: "messenger webhook" });
    return NextResponse.json({ status: "ok" });
  }
}

// ── Helpers ──────────────────────────────────────────────────────────

/**
 * Bind the sender to the shop referenced by the deep link and welcome them.
 */
async function handleReferral(senderPsid: string, slug: string) {
  const supabase = createServiceClient();

  const pageAccessToken = await getPageAccessToken(supabase);
  if (!pageAccessToken) return;

  const { data: org } = await supabase
    .from("organizations")
    .select("id, name")
    .eq("slug", slug)
    .maybeSingle();

  if (!org) {
    await sendFacebookMessage(
      senderPsid,
      UNKNOWN_SHOP_MESSAGE,
      pageAccessToken,
    );
    return;
  }

  await bindBuyerSession(supabase, "messenger", senderPsid, org.id);

  await sendFacebookMessage(
    senderPsid,
    `Сайн байна уу! 👋 Би "${org.name}" дэлгүүрийн AI туслах.\n\nБи бүтээгдэхүүн хайж, үнэ хэлж, захиалга авч чадна. Юу хайж байна вэ?`,
    pageAccessToken,
  );
}

async function handleMessage(
  senderPsid: string,
  messageText: string,
  origin: string,
) {
  const supabase = createServiceClient();

  const pageAccessToken = await getPageAccessToken(supabase);
  if (!pageAccessToken) {
    await sendFacebookMessage(senderPsid, "Системийн алдаа гарлаа.", "");
    return;
  }

  // ── Merchant mode ────────────────────────────────────────────────
  const { data: link } = await supabase
    .from("messenger_agent_links")
    .select("organization_id, user_id")
    .eq("psid", senderPsid)
    .maybeSingle();

  if (link) {
    await supabase
      .from("messenger_agent_links")
      .update({ last_active_at: new Date().toISOString() })
      .eq("psid", senderPsid);

    try {
      const deepseekKey = process.env.DEEPSEEK_API_KEY;
      if (!deepseekKey) {
        await sendFacebookMessage(
          senderPsid,
          "AI үйлчилгээ түр идэвхгүй байна.",
          pageAccessToken,
        );
        return;
      }

      const tools = createAllAgentTools(supabase, link.organization_id);

      const response = await runWithTools({
        apiKey: deepseekKey,
        systemPrompt: SYSTEM_PROMPT,
        userMessage: messageText,
        tools,
      });

      await sendFacebookMessage(senderPsid, response, pageAccessToken);
    } catch (e) {
      capture(e, { context: "messenger: AI agent error" });
      await sendFacebookMessage(senderPsid, ERROR_MESSAGE, pageAccessToken);
    }
    return;
  }

  // ── Buyer mode ───────────────────────────────────────────────────
  const session = await getBuyerSession(supabase, "messenger", senderPsid);
  if (!session) {
    await sendFacebookMessage(senderPsid, NOT_BOUND_MESSAGE, pageAccessToken);
    return;
  }

  const org = await getBuyerOrg(supabase, session.organization_id);
  if (!org) {
    await sendFacebookMessage(
      senderPsid,
      UNKNOWN_SHOP_MESSAGE,
      pageAccessToken,
    );
    return;
  }

  await touchBuyerSession(supabase, session.id);

  try {
    const reply = await runBuyerAgent({
      supabase,
      org,
      text: messageText,
      baseUrl: origin,
    });
    await sendFacebookMessage(senderPsid, reply, pageAccessToken);
  } catch (e) {
    capture(e, { context: "messenger: buyer agent error" });
    await sendFacebookMessage(senderPsid, ERROR_MESSAGE, pageAccessToken);
  }
}

async function getPageAccessToken(
  supabase: ServiceSupabaseClient,
): Promise<string | null> {
  // Try DB first, fall back to env var
  const { data } = await supabase
    .from("app_config")
    .select("value")
    .eq("key", "messenger_page_access_token")
    .maybeSingle();

  const rawToken = data?.value;
  const token =
    rawToken && typeof rawToken === "object" && "token" in rawToken
      ? String(rawToken.token)
      : undefined;

  return token ?? process.env.MESSENGER_PAGE_ACCESS_TOKEN ?? null;
}

async function sendFacebookMessage(
  psid: string,
  text: string,
  pageAccessToken: string,
) {
  if (!pageAccessToken) return;

  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/me/messages?access_token=${pageAccessToken}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient: { id: psid },
          message: { text },
        }),
      },
    );

    if (!res.ok) {
      capture(
        new Error(
          `Facebook sendMessage failed: ${res.status} ${res.statusText}`,
        ),
        { context: "messenger sendMessage" },
      );
    }
  } catch (err) {
    capture(err, { context: "messenger sendMessage" });
  }
}
