import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/rooms/[code]/players — Get all non-spectator players in a room
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

  const normalizedCode = code.toUpperCase();
  const supabase = await createClient();

  // First get the room
  const { data: room, error: roomError } = await supabase
    .from("rooms")
    .select("id")
    .eq("code", normalizedCode)
    .maybeSingle();

  if (roomError) {
    console.error("Failed to fetch room:", roomError);
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

  // Fetch players in the room, excluding spectators
  const { data: players, error: playersError } = await supabase
    .from("players")
    .select("id, display_name, avatar_emoji, is_host, is_spectator, joined_at")
    .eq("room_id", room.id)
    .eq("is_spectator", false)
    .order("joined_at", { ascending: true });

  if (playersError) {
    console.error("Failed to fetch players:", playersError);
    return NextResponse.json(
      { error: "Failed to fetch players" },
      { status: 500 }
    );
  }

  return NextResponse.json({ players });
}
