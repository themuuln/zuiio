import { NextRequest, NextResponse } from "next/server";
import { getSupabaseRestContext } from "@/lib/supabaseAdmin";

export async function GET(request: NextRequest) {
  const context = getSupabaseRestContext();
  if (!context) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  const type = request.nextUrl.searchParams.get("type") ?? "webhook";
  const limit = Math.min(Number(request.nextUrl.searchParams.get("limit") ?? "50"), 200);
  const offset = Math.max(Number(request.nextUrl.searchParams.get("offset") ?? "0"), 0);

  const table = type === "messages" ? "message_logs" : type === "scheduled" ? "scheduled_messages" : "webhook_logs";

  const url = new URL(`${context.baseUrl}/${table}`);
  url.searchParams.set("select", "*");
  url.searchParams.set("order", "created_at.desc");
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("offset", String(offset));

  const resp = await fetch(url.toString(), {
    headers: {
      ...context.headers,
      Prefer: "count=exact",
    },
    cache: "no-store",
  });

  if (!resp.ok) {
    const text = await resp.text();
    return NextResponse.json({ error: `Failed to load logs: ${text}` }, { status: 500 });
  }

  const rows = await resp.json();
  const range = resp.headers.get("content-range");
  const total = range?.split("/")[1] ? Number(range.split("/")[1]) : rows.length;

  return NextResponse.json({
    data: Array.isArray(rows) ? rows : [],
    total: Number.isFinite(total) ? total : 0,
  });
}
