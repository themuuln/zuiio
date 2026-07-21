import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateDisplayName, escapeHtml, assignAvatar } from "@/lib/room";

// POST /api/rooms/[code]/join — Join a room as a guest
export async function POST(
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

  // Parse request body
  let body: { displayName?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const displayName = body.displayName;

  // Validate display name input (before escaping)
  if (typeof displayName !== "string") {
    return NextResponse.json(
      { error: "Display name is required" },
      { status: 400 }
    );
  }

  const trimmedName = displayName.trim();

  const validationError = validateDisplayName(trimmedName);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  // Sanitize and trim display name (HTML escape for XSS prevention)
  const sanitizedName = escapeHtml(trimmedName);

  // Ensure the escaped name also fits within the database constraint
  if (sanitizedName.length > 20) {
    return NextResponse.json(
      { error: "Display name contains too many special characters" },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  // Check for existing session
  const existingSessionId = request.cookies.get("session_id")?.value;

  // Generate a session ID (use existing or create new)
  const sessionId = existingSessionId || crypto.randomUUID();

  // First, fetch room to get player count for avatar assignment
  const { data: room } = await supabase
    .from("rooms")
    .select("id, code, game_state, max_players, expires_at, host_session_id")
    .eq("code", normalizedCode)
    .maybeSingle();

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
      { error: "This room has expired" },
      { status: 410 }
    );
  }

  // Check if room is in a joinable state
  // "picking" is allowed — the host is choosing a game, players can still join
  if (room.game_state !== "lobby" && room.game_state !== "picking") {
    return NextResponse.json(
      { error: "Game already in progress" },
      { status: 400 }
    );
  }

  // Count current players for avatar assignment
  // We need to know how many players exist to assign a unique avatar
  // Use the room's max_players as a safety check
  const isHost = existingSessionId
    ? existingSessionId === room.host_session_id
    : false;

  // Assign avatar. We'll use a deterministic approach based on room id
  // to ensure consistent avatar assignment
  // To count players, we need to handle RLS. Let's use a simple approach:
  // First get the count, then join
  const { count: playerCount } = await supabase
    .from("players")
    .select("*", { count: "exact", head: true })
    .eq("room_id", room.id)
    .eq("is_spectator", false)
    .maybeSingle();

  const currentCount = playerCount ?? 0;
  const maxPlayers = room.max_players ?? 8;

  if (currentCount >= maxPlayers) {
    return NextResponse.json(
      { error: "This room is full" },
      { status: 409 }
    );
  }

  // Get avatar based on current player count
  const avatar = assignAvatar(currentCount);

  // Call the join_room RPC function which handles everything atomically
  const { data: joinResult, error: joinError } = await supabase.rpc(
    "join_room",
    {
      p_code: normalizedCode,
      p_session_id: sessionId,
      p_display_name: sanitizedName,
      p_avatar_emoji: avatar,
      p_is_host: isHost,
    }
  );

  if (joinError) {
    console.error("Failed to join room:", joinError);
    return NextResponse.json(
      { error: "Failed to join room" },
      { status: 500 }
    );
  }

  // Parse the result
  const result =
    typeof joinResult === "string" ? JSON.parse(joinResult) : joinResult;

  // Check for errors returned from the function
  if (result.error) {
    const statusMap: Record<string, number> = {
      "Room not found": 404,
      "This room has expired": 410,
      "This room is full": 409,
      "Game already in progress": 400,
    };
    const status = statusMap[result.error] || 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  // Create the response with the session cookie
  const response = NextResponse.json({
    player_id: result.player_id,
    display_name: sanitizedName,
    avatar_emoji: avatar,
  });

  // Set HTTP-only session cookie
  response.cookies.set("session_id", sessionId, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  // Broadcast the new player join event via Realtime (fire and forget)
  // This notifies other lobby clients about the new player
  try {
    const playerData = {
      id: result.player_id,
      display_name: sanitizedName,
      avatar_emoji: avatar,
      is_host: isHost,
      is_spectator: false,
      joined_at: new Date().toISOString(),
    };

    const broadcastChannel = supabase.channel(`room:${room.id}`, {
      // Use broadcast-only mode — we don't need to receive messages
      config: { broadcast: { self: false } },
    });

    // Subscribe and send the broadcast
    broadcastChannel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        broadcastChannel.send({
          type: "broadcast",
          event: "player_joined",
          payload: { player: playerData },
        });
      }
    });
  } catch (broadcastError) {
    // Broadcast is best-effort; don't block the join response
    console.error("Failed to broadcast join event:", broadcastError);
  }

  return response;
}
