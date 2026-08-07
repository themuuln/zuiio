import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";

function deriveReporterHash(ip: string): string {
  const utcDate = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  return createHash("sha256").update(`${ip}${utcDate}`).digest("hex");
}

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "unknown";
  return request.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Хүсэлт буруу байна" }, { status: 400 });
  }

  const { game_id, player_id, message, contact } = body as {
    game_id?: string;
    player_id?: string;
    message?: string;
    contact?: string;
  };

  if (!message || message.length < 5 || message.length > 500) {
    return NextResponse.json(
      { error: "Мессеж 5-500 тэмдэгтийн хооронд байх ёстой" },
      { status: 400 },
    );
  }

  if (!game_id && !player_id) {
    return NextResponse.json(
      { error: "Тоглолт эсвэл тоглогчийн ID шаардлагатай" },
      { status: 400 },
    );
  }

  const ip = getClientIp(request);
  const reporterHash = deriveReporterHash(ip);

  // Use anon client — SECURITY DEFINER function handles the insert
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const { error } = await supabase.rpc("cmd_report_public_error", {
    p_game_id: game_id ?? null,
    p_player_id: player_id ?? null,
    p_message: message,
    p_contact: contact ?? null,
    p_reporter_hash: reporterHash,
  });

  if (error) {
    if (error.message?.includes("Too many reports")) {
      return NextResponse.json(
        { error: "Өнөөдөр хэт олон мэдээлэл илгээсэн" },
        { status: 429 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
