import type { SupabaseClient } from "@supabase/supabase-js";
import { runWithTools } from "@zuiio/ai-agent";
import { capture } from "@zuiio/capture";
import { NextResponse } from "next/server";
import { createAllAgentTools } from "@/lib/agent-tools";
import { createServiceClient } from "@/lib/supabase/server-service";
import type { Database } from "@/lib/supabase/types";

type MessengerAgentLinkTable = {
  Row: {
    organization_id: string;
    user_id: string;
    psid: string;
    last_active_at: string | null;
  };
  Insert: {
    organization_id: string;
    user_id: string;
    psid: string;
    last_active_at?: string | null;
  };
  Update: {
    organization_id?: string;
    user_id?: string;
    psid?: string;
    last_active_at?: string | null;
  };
  Relationships: [];
};

type MessengerDatabase = Omit<Database, "public"> & {
  public: Omit<Database["public"], "Tables"> & {
    Tables: Database["public"]["Tables"] & {
      messenger_agent_links: MessengerAgentLinkTable;
    };
  };
};

type ServiceSupabaseClient = SupabaseClient<Database>;

const _WELCOME_MESSAGE = `Сайн байна уу! 👋 Би Zer-ийн Facebook Messenger туслах.

Би дараах зүйлсийг хийж чадна:
• Бүтээгдэхүүн хайх, үнэ мэдээлэл авах
• Захиалга байршуулах
• Хүргэлтийн статус шалгах
• Борлуулалтын мэдээлэл авах

Эхлэхийн тулд Zer апп-д нэвтэрч Тохиргоо → Messenger холбох хэсгээс бүртгэлээ холбоно уу.`;

const NO_LINK_MESSAGE =
  "Таны Facebook бүртгэл холбогдоогүй байна. Zer апп-д нэвтэрч Тохиргоо → Messenger холбох хэсгээс холбоно уу.";

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
 * Handles incoming messages from Facebook Messenger.
 * Looks up the sender's PSID in messenger_agent_links, runs AI agent,
 * and replies via Facebook Send API.
 *
 * Always returns 200 — Facebook retries on non-200.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;

    if (body.object === "page") {
      const entries = (body.entry as Array<Record<string, unknown>>) ?? [];

      for (const entry of entries) {
        const messaging =
          (entry.messaging as Array<Record<string, unknown>>) ?? [];

        for (const event of messaging) {
          const sender = event.sender as Record<string, unknown> | undefined;
          const message = event.message as Record<string, unknown> | undefined;

          if (!sender || !message?.text) continue;

          const senderPsid = String(sender.id);
          const messageText = String(message.text);

          // Handle asynchronously — don't block webhook response
          handleMessage(senderPsid, messageText).catch((e) => {
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

async function handleMessage(senderPsid: string, messageText: string) {
  const supabase = createServiceClient();
  const messengerClient =
    supabase as unknown as SupabaseClient<MessengerDatabase>;

  const pageAccessToken = await getPageAccessToken(supabase);
  if (!pageAccessToken) {
    await sendFacebookMessage(senderPsid, "Системийн алдаа гарлаа.", "");
    return;
  }

  // Look up messenger_agent_links by PSID
  const { data: link } = await messengerClient
    .from("messenger_agent_links")
    .select("organization_id, user_id")
    .eq("psid", senderPsid)
    .maybeSingle();

  if (!link) {
    await sendFacebookMessage(senderPsid, NO_LINK_MESSAGE, pageAccessToken);
    return;
  }

  // Update last_active_at
  await messengerClient
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

  return (
    (data?.value as { token?: string })?.token ??
    process.env.MESSENGER_PAGE_ACCESS_TOKEN ??
    null
  );
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
