import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server-service";

/**
 * GET  /api/telegram/webhook/setup — check current webhook status
 * POST /api/telegram/webhook/setup — register webhook URL
 * DELETE /api/telegram/webhook/setup — unregister webhook
 *
 * Auth: Bearer TELEGRAM_WEBHOOK_SECRET
 */
async function getBotToken(): Promise<string | null> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("app_config")
    .select("value")
    .eq("key", "telegram_bot_token")
    .maybeSingle();
  return (
    (data?.value as { token?: string })?.token ??
    process.env.TELEGRAM_BOT_TOKEN ??
    null
  );
}

function checkAuth(request: Request): boolean {
  const authHeader = request.headers.get("authorization");
  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  return !!(webhookSecret && authHeader === `Bearer ${webhookSecret}`);
}

// ── GET: show current webhook info ───────────────────────────────────

export async function GET(request: Request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = await getBotToken();
  if (!token) {
    return NextResponse.json(
      { error: "TELEGRAM_BOT_TOKEN тохируулаагүй" },
      { status: 500 },
    );
  }

  const res = await fetch(
    `https://api.telegram.org/bot${token}/getWebhookInfo`,
  );
  const info = await res.json();

  return NextResponse.json(info);
}

// ── POST: register webhook ───────────────────────────────────────────

export async function POST(request: Request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = await getBotToken();
  if (!token) {
    return NextResponse.json(
      { error: "TELEGRAM_BOT_TOKEN тохируулаагүй" },
      { status: 500 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;
  const baseUrl = (body.baseUrl as string) || process.env.NEXT_PUBLIC_APP_URL;

  if (!baseUrl) {
    return NextResponse.json(
      {
        error: "baseUrl шаардлагатай (эсвэл NEXT_PUBLIC_APP_URL тохируулна уу)",
      },
      { status: 400 },
    );
  }

  const webhookUrl = `${baseUrl}/api/telegram/webhook`;
  const secretToken = process.env.TELEGRAM_WEBHOOK_SECRET;

  const res = await fetch(
    `https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(webhookUrl)}${secretToken ? `&secret_token=${encodeURIComponent(secretToken)}` : ""}`,
  );
  const result = await res.json();

  return NextResponse.json({ ...result, webhookUrl });
}

// ── DELETE: unregister webhook ───────────────────────────────────────

export async function DELETE(request: Request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = await getBotToken();
  if (!token) {
    return NextResponse.json(
      { error: "TELEGRAM_BOT_TOKEN тохируулаагүй" },
      { status: 500 },
    );
  }

  const res = await fetch(
    `https://api.telegram.org/bot${token}/deleteWebhook?drop_pending_updates=true`,
  );
  const result = await res.json();

  return NextResponse.json(result);
}
