"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Share2, Gamepad2, Eye } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { QrCode } from "@/components/lobby/qr-code";
import { RoomCodeDisplay } from "@/components/lobby/room-code-display";
import { JoinForm } from "@/components/join/join-form";
import { PlayerList } from "@/components/lobby/player-list";
import { GamePicker } from "@/components/lobby/game-picker";
import { HouseRules } from "@/components/lobby/house-rules";
import { ReconnectingBanner } from "@/components/reconnecting-banner";
import { type GameDefinition } from "@/lib/games";

interface RoomData {
  id: string;
  code: string;
  game_state: string;
  max_players: number;
  host_session_id: string;
  created_at: string;
  expires_at: string;
  current_game_id: string | null;
}

interface PlayerData {
  id: string;
  display_name: string;
  avatar_emoji: string;
  is_host: boolean;
  is_spectator: boolean;
  joined_at: string;
}

type PageState =
  | { status: "loading" }
  | { status: "not_found" }
  | { status: "expired" }
  | { status: "error"; message: string }
  | { status: "join"; room: RoomData }
  | { status: "ready"; room: RoomData; player: PlayerData };

export default function LobbyPage() {
  const params = useParams();
  const router = useRouter();
  const code = (params.code as string).toUpperCase();
  const [state, setState] = useState<PageState>({ status: "loading" });
  const [shared, setShared] = useState(false);
  const [players, setPlayers] = useState<PlayerData[]>([]);
  const [playersLoading, setPlayersLoading] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerGames, setPickerGames] = useState<GameDefinition[]>([]);
  const [pickerPlayerCount, setPickerPlayerCount] = useState(0);
  const [transferInProgress, setTransferInProgress] = useState(false);
  const [removePlayerInProgress, setRemovePlayerInProgress] = useState(false);
  const [houseRules, setHouseRules] = useState<{
    drawStacking: boolean;
    drawUntilYouPlay: boolean;
  }>({ drawStacking: false, drawUntilYouPlay: false });
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);
  const pickerPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch players from the API
  const fetchPlayers = useCallback(async () => {
    try {
      const res = await fetch(`/api/rooms/${code}/players`);
      if (res.ok) {
        const data = await res.json();
        setPlayers(data.players);
      }
    } catch {
      // Silently fail — polling will retry
    } finally {
      setPlayersLoading(false);
    }
  }, [code]);

  // Initialize room and session
  useEffect(() => {
    let cancelled = false;

    async function initialize() {
      try {
        // Fetch room data and check session in parallel
        const [roomRes, meRes] = await Promise.all([
          fetch(`/api/rooms/${code}`),
          fetch(`/api/rooms/${code}/me`),
        ]);

        if (cancelled) return;

        // Handle room errors first
        if (roomRes.status === 404) {
          setState({ status: "not_found" });
          return;
        }

        if (roomRes.status === 410) {
          setState({ status: "expired" });
          return;
        }

        if (!roomRes.ok) {
          setState({ status: "error", message: "Something went wrong" });
          return;
        }

        const room: RoomData = await roomRes.json();

        // Check if user already has a session
        const meData = await meRes.json();

        if (cancelled) return;

        if (meData.player) {
          setState({ status: "ready", room, player: meData.player });
        } else {
          // No session — show join form
          setState({ status: "join", room });
        }
      } catch {
        if (!cancelled) {
          setState({ status: "error", message: "Failed to connect" });
        }
      }
    }

    initialize();
    return () => { cancelled = true; };
  }, [code]);

  // Fetch players and subscribe to Realtime when room is ready
  useEffect(() => {
    if (state.status !== "ready") return;

    const { room, player } = state;

    // Fetch initial players
    fetchPlayers();

    // --- Subscribe to Supabase Realtime ---
    const supabase = createClient();

    // Subscribe to the room broadcast channel for player join events
    // This is the primary mechanism — the join API route broadcasts on this channel
    const channel = supabase.channel(`room:${room.id}`);

    // Listen for broadcast events (player_joined)
    channel.on(
      "broadcast",
      { event: "player_joined" },
      (payload) => {
        const newPlayer = payload.player as PlayerData;
        if (!newPlayer.is_spectator) {
          setPlayers((prev) => {
            if (prev.some((p) => p.id === newPlayer.id)) return prev;
            return [...prev, newPlayer].sort(
              (a, b) =>
                new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime()
            );
          });
        }
      }
    );

    // Also try postgres_changes as a fallback for any mutations not caught by broadcast
    channel.on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "players",
        filter: `room_id=eq.${room.id}`,
      },
      (payload) => {
        const newPlayer = payload.new as PlayerData;
        if (!newPlayer.is_spectator) {
          setPlayers((prev) => {
            if (prev.some((p) => p.id === newPlayer.id)) return prev;
            return [...prev, newPlayer].sort(
              (a, b) =>
                new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime()
            );
          });
        }
      }
    );

    // Listen for host transfer events
    channel.on(
      "broadcast",
      { event: "host_transferred" },
      (payload) => {
        const data = payload as unknown as {
          newHostPlayerId: string;
          timestamp: number;
        };
        if (data.newHostPlayerId) {
          // Re-fetch player list to update host badge
          fetchPlayers();
        }
      }
    );

    // Listen for game picker opened event (broadcast by host to all players)
    channel.on(
      "broadcast",
      { event: "game_picker_opened" },
      (payload) => {
        const data = payload as unknown as {
          availableGames: GameDefinition[];
          playerCount: number;
        };
        setPickerGames(data.availableGames ?? []);
        setPickerPlayerCount(data.playerCount ?? 0);
        setPickerOpen(true);
      }
    );

    // Listen for mutual match and host confirmed to handle game start navigation
    channel.on(
      "broadcast",
      { event: "mutual_match" },
      () => {
        // The GamePicker component handles the celebration UI
        // We keep the picker open so the component can show the celebration
      }
    );

    channel.on(
      "broadcast",
      { event: "host_confirmed_game" },
      () => {
        // Keep picker open so GamePicker shows confirmation
      }
    );

    channel.subscribe((status) => {
      if (status !== "SUBSCRIBED") {
        console.info("Realtime subscription status:", status);
      }
    });

    channelRef.current = channel;

    // --- Fallback polling ---
    // Poll every 5 seconds as a fallback in case Realtime subscription doesn't work
    pollIntervalRef.current = setInterval(() => {
      fetchPlayers();
    }, 5000);

    // --- Game picker polling for non-host players ---
    // If the broadcast from the host's "Pick a Game" action is missed (e.g., due to
    // serverless cold starts or Realtime timing), this polling detects the picker
    // opening by checking the room's game_state. The host sets game_state to "picking"
    // via POST /api/games/picker; we poll GET /api/games/picker/[code] to detect it.
    const startPickerPoll = () => {
      if (pickerPollRef.current) return;
      pickerPollRef.current = setInterval(async () => {
        try {
          const res = await fetch(`/api/games/picker/${code}`);
          if (!res.ok) return;
          const data = await res.json();
          if (data.isPickerOpen && !pickerOpen) {
            setPickerGames(data.availableGames ?? []);
            setPickerPlayerCount(data.playerCount ?? 0);
            setPickerOpen(true);
            // Stop polling once picker is detected
            if (pickerPollRef.current) {
              clearInterval(pickerPollRef.current);
              pickerPollRef.current = null;
            }
          }
        } catch {
          // Silently retry on next interval
        }
      }, 3000);
    };

    // Only non-host players need to poll (host opens picker via API response).
    // For spectators we also skip polling.
    if (!player.is_host && !player.is_spectator) {
      startPickerPoll();
    }

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      if (pickerPollRef.current) {
        clearInterval(pickerPollRef.current);
        pickerPollRef.current = null;
      }
    };
  }, [state, code, fetchPlayers]);

  const handleShare = useCallback(async () => {
    const url = window.location.href;
    const shareData = {
      title: "Friday — Game Night",
      text: `Join my game room on Friday! Code: ${code}`,
      url,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(url);
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      }
    } catch {
      // User cancelled or share failed
      if (!navigator.share) {
        await navigator.clipboard.writeText(url);
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      }
    }
  }, [code]);

  const handlePickGame = useCallback(async () => {
    try {
      const res = await fetch("/api/games/picker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomCode: code }),
      });

      if (res.ok) {
        const data = await res.json();
        setPickerGames(data.availableGames ?? []);
        setPickerPlayerCount(data.playerCount ?? 0);
        setPickerOpen(true);
      } else {
        const err = await res.json();
        console.error("Failed to open game picker:", err.error);
      }
    } catch (err) {
      console.error("Failed to open game picker:", err);
    }
  }, [code]);

  const handleGameStarted = useCallback((gameSessionId?: string, gameType?: string) => {
    // Navigate to the correct page based on game type
    if (gameType && gameType !== "uno") {
      // Party games have their own route
      router.push(`/${code}/party/${gameType}`);
    } else {
      // UNO game route
      router.push(`/${code}/game`);
    }
  }, [code, router]);

  const handleTransferHost = useCallback(
    async (targetPlayerId: string) => {
      setTransferInProgress(true);
      try {
        const res = await fetch(`/api/rooms/${code}/transfer-host`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetPlayerId }),
        });
        if (res.ok) {
          // Re-fetch player list
          fetchPlayers();
        } else {
          const err = await res.json();
          console.error("Failed to transfer host:", err.error);
        }
      } catch (err) {
        console.error("Failed to transfer host:", err);
      } finally {
        setTransferInProgress(false);
      }
    },
    [code, fetchPlayers]
  );

  const handleRemovePlayer = useCallback(
    async (targetPlayerId: string) => {
      setRemovePlayerInProgress(true);
      try {
        const res = await fetch(
          `/api/rooms/${code}/players/${targetPlayerId}`,
          {
            method: "DELETE",
          }
        );
        if (res.ok) {
          // Re-fetch player list
          fetchPlayers();
        } else {
          const err = await res.json();
          console.error("Failed to remove player:", err.error);
        }
      } catch (err) {
        console.error("Failed to remove player:", err);
      } finally {
        setRemovePlayerInProgress(false);
      }
    },
    [code, fetchPlayers]
  );

  // Error states
  if (state.status === "not_found") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-6 text-center">
          <div className="text-6xl">🔍</div>
          <h1 className="text-2xl font-bold">Room not found</h1>
          <p className="text-muted-foreground">
            This room doesn&apos;t exist. The code may be incorrect or the room
            was never created.
          </p>
          <button
            onClick={() => router.push("/")}
            className="inline-flex h-12 items-center justify-center rounded-lg bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
          >
            Create a New Room
          </button>
        </div>
      </div>
    );
  }

  if (state.status === "expired") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-6 text-center">
          <div className="text-6xl">⏰</div>
          <h1 className="text-2xl font-bold">Room has expired</h1>
          <p className="text-muted-foreground">
            This room has expired. Rooms are automatically removed 24 hours
            after creation.
          </p>
          <button
            onClick={() => router.push("/")}
            className="inline-flex h-12 items-center justify-center rounded-lg bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
          >
            Create a New Room
          </button>
        </div>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-6 text-center">
          <div className="text-6xl">⚠️</div>
          <h1 className="text-2xl font-bold">Something went wrong</h1>
          <p className="text-muted-foreground">{state.message}</p>
          <button
            onClick={() => router.push("/")}
            className="inline-flex h-12 items-center justify-center rounded-lg bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (state.status === "loading") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Loading room...</p>
        </div>
      </div>
    );
  }

  // Join screen — user has no session yet
  if (state.status === "join") {
    return <JoinForm roomCode={state.room.code} />;
  }

  // Ready state — room exists, user has session, show lobby
  const { room, player } = state;
  const nonSpectatorPlayers = players.filter((p) => !p.is_spectator);
  const showPickGame = player.is_host && nonSpectatorPlayers.length >= 2;
  const gameInProgress = room.game_state !== "lobby" && room.current_game_id;

  return (
    <div className="flex min-h-screen flex-col p-4">
      <ReconnectingBanner
        connectionId={room.code}
        onReconnected={() => {
          // Re-fetch player list on reconnection
          fetchPlayers();
        }}
      />
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col gap-6">
        {/* Room Code Display — pinned at top */}
        <div className="flex justify-center pt-2">
          <RoomCodeDisplay code={room.code} />
        </div>

        {/* Game in progress banner — spectator join prompt */}
        {gameInProgress && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-center dark:border-blue-800 dark:bg-blue-950/20">
            <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
              Game in progress
            </p>
            <p className="mt-1 text-xs text-blue-600/70 dark:text-blue-400/70">
              A game is currently being played in this room.
            </p>
            <button
              onClick={() => router.push(`/${room.code}/spectate`)}
              className="mt-3 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
            >
              <Eye className="h-4 w-4" />
              Watch as spectator
            </button>
          </div>
        )}

        {/* Player List */}
        {playersLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          <PlayerList
            players={players}
            currentPlayerId={player.id}
            onTransferHost={player.is_host ? handleTransferHost : undefined}
            transferInProgress={transferInProgress}
            onRemovePlayer={player.is_host ? handleRemovePlayer : undefined}
            removePlayerInProgress={removePlayerInProgress}
          />
        )}

        {/* QR Code */}
        <div className="flex justify-center">
          <QrCode code={room.code} />
        </div>

        {/* Share Button */}
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={handleShare}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-input bg-background px-8 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <Share2 className="h-5 w-5" />
            {shared ? "Link copied!" : "Share invite link"}
          </button>
        </div>

        {/* Host Controls — only visible to host */}
        {showPickGame && (
          <div className="flex flex-col gap-3 pt-2">
            {/* House Rules — configurable before game starts */}
            <HouseRules
              initialRules={houseRules}
              onRulesChange={setHouseRules}
            />

            <button
              onClick={handlePickGame}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
            >
              <Gamepad2 className="h-5 w-5" />
              Pick a Game
            </button>
          </div>
        )}
      </div>

      {/* Game Picker Overlay */}
      {pickerOpen && (
        <GamePicker
          roomId={room.id}
          roomCode={room.code}
          isHost={player.is_host}
          availableGames={pickerGames}
          playerCount={pickerPlayerCount}
          onGameStarted={handleGameStarted}
        />
      )}
    </div>
  );
}
