import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getGameById } from "@/lib/games";
import type { Json } from "@/lib/database.types";
import { broadcastToRoom } from "@/lib/party-engine";

// POST /api/games/picker/confirm — Host confirms a game after timeout
// Body: { roomCode: string, gameType: string, houseRules?: { drawStacking: boolean, drawUntilYouPlay: boolean } }
export async function POST(request: NextRequest) {
  let body: { roomCode?: string; gameType?: string; houseRules?: Record<string, unknown> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const { roomCode, gameType, houseRules } = body;

  if (!roomCode || typeof roomCode !== "string" || !/^[A-Z]{4}$/i.test(roomCode)) {
    return NextResponse.json({ error: "Invalid room code" }, { status: 400 });
  }

  if (!gameType || typeof gameType !== "string") {
    return NextResponse.json({ error: "Invalid game type" }, { status: 400 });
  }

  const supabase = await createClient();
  const sessionId = request.cookies.get("session_id")?.value;

  if (!sessionId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const code = roomCode.toUpperCase();

  // Get the room
  const { data: room } = await supabase
    .from("rooms")
    .select("id, code, host_session_id, game_state")
    .eq("code", code)
    .maybeSingle();

  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  // Verify the requester is the host
  if (room.host_session_id !== sessionId) {
    return NextResponse.json(
      { error: "Only the host can confirm a game" },
      { status: 403 }
    );
  }

  // Validate game type
  const gameDef = getGameById(gameType);
  if (!gameDef) {
    return NextResponse.json(
      { error: `Unknown game type: ${gameType}` },
      { status: 400 }
    );
  }

  // Create a game session using SECURITY DEFINER function
  const { data: sessionResult, error: sessionError } = await supabase.rpc(
    "create_game_session",
    {
      p_room_id: room.id,
      p_game_type: gameType,
      p_status: "picking",
    }
  );

  if (sessionError) {
    console.error("Failed to create game session:", sessionError);
    return NextResponse.json(
      { error: "Failed to create game session" },
      { status: 500 }
    );
  }

  const sessionData =
    typeof sessionResult === "string"
      ? JSON.parse(sessionResult)
      : sessionResult;

  // Store house rules in the game session config if provided
  if (houseRules && sessionData.id) {
    const sanitizedRules: Record<string, unknown> = {};
    if (typeof houseRules.drawStacking === "boolean") {
      sanitizedRules.drawStacking = houseRules.drawStacking;
    }
    if (typeof houseRules.drawUntilYouPlay === "boolean") {
      sanitizedRules.drawUntilYouPlay = houseRules.drawUntilYouPlay;
    }

    if (Object.keys(sanitizedRules).length > 0) {
      await supabase.rpc("update_game_session_state", {
        p_game_session_id: sessionData.id,
        p_config: sanitizedRules as unknown as Json,
      });
    }
  }

  const result = {
    gameType,
    gameSessionId: sessionData.id,
    celebration: `Let's play ${gameDef.name}!`,
  };

  // Broadcast to the room — await so non-host players receive host_confirmed_game
  try {
    await Promise.race([
      broadcastToRoom(supabase, room.id, "host_confirmed_game", result),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Broadcast timed out")), 3000)
      ),
    ]);
  } catch (broadcastError) {
    console.error("Failed to broadcast host confirmation:", broadcastError);
    // Non-fatal — game state is persisted via API response
  }

  return NextResponse.json(result);
}
