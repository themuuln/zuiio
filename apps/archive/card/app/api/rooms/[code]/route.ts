import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/rooms/[code] — Get room details
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  // Validate code format
  if (!/^[A-Z]{4}$/i.test(code)) {
    return NextResponse.json(
      { error: "Invalid room code format" },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  const { data: room, error } = await supabase
    .from("rooms")
    .select("id, code, game_state, max_players, host_session_id, created_at, expires_at, current_game_id, vibe_tier")
    .eq("code", code.toUpperCase())
    .maybeSingle();

  if (error) {
    console.error("Failed to fetch room:", error);
    return NextResponse.json(
      { error: "Failed to fetch room" },
      { status: 500 }
    );
  }

  if (!room) {
    return NextResponse.json(
      { error: "Room not found" },
      { status: 404 }
    );
  }

  // Check if room has expired
  const expiresAt = new Date(room.expires_at);
  if (expiresAt < new Date()) {
    return NextResponse.json(
      {
        error: "This room has expired",
        code: room.code,
        expires_at: room.expires_at,
      },
      { status: 410 }
    );
  }

  return NextResponse.json({
    id: room.id,
    code: room.code,
    game_state: room.game_state,
    max_players: room.max_players,
    host_session_id: room.host_session_id,
    created_at: room.created_at,
    expires_at: room.expires_at,
    current_game_id: room.current_game_id,
    vibe_tier: room.vibe_tier ?? "spicy",
  });
}

// PATCH /api/rooms/[code] — Update room settings (host only)
// Body: { vibe_tier?: "spicy" | "wild" | "after-dark" }
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  // Validate code format
  if (!/^[A-Z]{4}$/i.test(code)) {
    return NextResponse.json(
      { error: "Invalid room code format" },
      { status: 400 }
    );
  }

  // Parse body
  let body: { vibe_tier?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const { vibe_tier } = body;

  if (!vibe_tier) {
    return NextResponse.json(
      { error: "No fields to update" },
      { status: 400 }
    );
  }

  // Validate vibe_tier value
  const validTiers = ["spicy", "wild", "after-dark"];
  if (vibe_tier && !validTiers.includes(vibe_tier)) {
    return NextResponse.json(
      { error: `Invalid vibe_tier. Must be one of: ${validTiers.join(", ")}` },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const sessionId = request.cookies.get("session_id")?.value;

  if (!sessionId) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  const roomCode = code.toUpperCase();

  // Fetch the room
  const { data: room } = await supabase
    .from("rooms")
    .select("id, host_session_id")
    .eq("code", roomCode)
    .maybeSingle();

  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  // Verify requester is host
  if (room.host_session_id !== sessionId) {
    return NextResponse.json(
      { error: "Only the host can update room settings" },
      { status: 403 }
    );
  }

  // Update vibe_tier on the room
  const { error: updateError } = await supabase
    .from("rooms")
    .update({ vibe_tier })
    .eq("id", room.id);

  if (updateError) {
    console.error("Failed to update room:", updateError);
    return NextResponse.json(
      { error: "Failed to update room settings" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    vibe_tier,
  });
}
