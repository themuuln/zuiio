import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ROOM_CODE_LENGTH, MAX_PLAYERS } from "@/lib/constants";

function generateRoomCode(): string {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // no I or O to avoid confusion
  let code = "";
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    code += letters[Math.floor(Math.random() * letters.length)];
  }
  return code;
}

function generateSessionId(): string {
  return crypto.randomUUID();
}

// GET /api/rooms — placeholder
export async function GET() {
  return NextResponse.json({ message: "Not implemented" }, { status: 501 });
}

// POST /api/rooms — Create a new room
export async function POST() {
  const supabase = await createClient();

  // Generate a unique room code with retries
  let code: string;
  let attempts = 0;
  const maxAttempts = 10;

  do {
    code = generateRoomCode();
    const { data: existing } = await supabase
      .from("rooms")
      .select("id")
      .eq("code", code)
      .maybeSingle();

    if (!existing) break;
    attempts++;
  } while (attempts < maxAttempts);

  if (attempts >= maxAttempts) {
    return NextResponse.json(
      { error: "Could not generate a unique room code. Please try again." },
      { status: 500 }
    );
  }

  const hostSessionId = generateSessionId();

  const { data: room, error } = await supabase
    .from("rooms")
    .insert({
      code,
      host_session_id: hostSessionId,
      max_players: MAX_PLAYERS,
    })
    .select("code")
    .single();

  if (error) {
    console.error("Failed to create room:", error);
    return NextResponse.json(
      { error: "Failed to create room" },
      { status: 500 }
    );
  }

  const response = NextResponse.json({ code: room.code });

  // Set host session cookie
  response.cookies.set("session_id", hostSessionId, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return response;
}
