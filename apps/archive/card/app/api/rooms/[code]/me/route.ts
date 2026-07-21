import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/rooms/[code]/me — Check if the current user has a player session in this room
export async function GET(
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

  const normalizedCode = code.toUpperCase();
  const sessionId = request.cookies.get("session_id")?.value;

  if (!sessionId) {
    return NextResponse.json(
      { player: null },
      { status: 200 }
    );
  }

  const supabase = await createClient();

  // Use the RPC function to check player session (handles RLS in a single transaction)
  const { data: player, error } = await supabase.rpc(
    "get_player_by_session",
    {
      p_code: normalizedCode,
      p_session_id: sessionId,
    }
  );

  if (error) {
    console.error("Failed to check player session:", error);
    return NextResponse.json(
      { player: null },
      { status: 200 }
    );
  }

  return NextResponse.json({ player });
}
