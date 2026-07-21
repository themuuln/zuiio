"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PartyLobby } from "@/components/party-game/party-lobby";
import type { ContentTier } from "@/lib/content";
import type { PartyGameConfig } from "@/lib/party-engine";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

interface RoomData {
  id: string;
  code: string;
  vibe_tier: string;
  host_session_id: string;
}

interface PlayerData {
  id: string;
  display_name: string;
  avatar_emoji: string;
  is_host: boolean;
  is_spectator: boolean;
}

interface MeData {
  player: {
    id: string;
    display_name: string;
    avatar_emoji: string;
    is_host: boolean;
    is_spectator: boolean;
  } | null;
}

type PageState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "not_found" }
  | { status: "expired" }
  | { status: "ready"; room: RoomData; currentPlayer: PlayerData }
  | { status: "needs_join" };

// ──────────────────────────────────────────────
// Page Component
// ──────────────────────────────────────────────

export default function PartyPage() {
  const params = useParams();
  const router = useRouter();
  const code = (params.code as string).toUpperCase();

  const [pageState, setPageState] = useState<PageState>({ status: "loading" });
  const [players, setPlayers] = useState<PlayerData[]>([]);
  const [drinkingEnabled, setDrinkingEnabled] = useState(true);
  const [maxDrinksPerRound, setMaxDrinksPerRound] = useState(3);
  const [vibeTier, setVibeTier] = useState<ContentTier>("spicy");
  const [startingGame, setStartingGame] = useState<string | null>(null);

  // ─── Initialize: fetch room, player, and players ───
  useEffect(() => {
    let cancelled = false;

    async function initialize() {
      try {
        // Fetch room data, current player, and players in parallel
        const [roomRes, meRes, playersRes] = await Promise.all([
          fetch(`/api/rooms/${code}`),
          fetch(`/api/rooms/${code}/me`),
          fetch(`/api/rooms/${code}/players`),
        ]);

        if (cancelled) return;

        // Handle room errors
        if (roomRes.status === 404) {
          setPageState({ status: "not_found" });
          return;
        }
        if (roomRes.status === 410) {
          setPageState({ status: "expired" });
          return;
        }
        if (!roomRes.ok) {
          setPageState({ status: "error", message: "Failed to load room" });
          return;
        }

        const room: RoomData = await roomRes.json();
        const meData: MeData = await meRes.json();
        const playersData = await playersRes.json();

        if (cancelled) return;

        // If the user hasn't joined, show needs_join state
        if (!meData.player) {
          setPageState({ status: "needs_join" });
          return;
        }

        // Initialize state from room data
        setVibeTier((room.vibe_tier as ContentTier) ?? "spicy");
        setDrinkingEnabled(true);
        setMaxDrinksPerRound(3);

        const nonSpectatorPlayers = (playersData.players ?? []).filter(
          (p: PlayerData) => !p.is_spectator
        );
        setPlayers(nonSpectatorPlayers);

        setPageState({
          status: "ready",
          room,
          currentPlayer: meData.player,
        });
      } catch {
        if (!cancelled) {
          setPageState({ status: "error", message: "Failed to connect" });
        }
      }
    }

    initialize();
    return () => { cancelled = true; };
  }, [code]);

  // ─── Handle vibe tier change ───
  const handleChangeVibeTier = useCallback(
    async (tier: ContentTier) => {
      // Optimistic update
      setVibeTier(tier);

      try {
        const res = await fetch(`/api/rooms/${code}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vibe_tier: tier }),
        });

        if (!res.ok) {
          // Revert on failure
          const currentTier = pageState.status === "ready"
            ? (pageState.room.vibe_tier as ContentTier)
            : "spicy";
          setVibeTier(currentTier);
          const err = await res.json();
          console.error("Failed to update vibe tier:", err.error);
        }
      } catch (err) {
        console.error("Failed to update vibe tier:", err);
        // Revert
        const currentTier = pageState.status === "ready"
          ? (pageState.room.vibe_tier as ContentTier)
          : "spicy";
        setVibeTier(currentTier);
      }
    },
    [code, pageState]
  );

  // ─── Handle drinking toggle ───
  const handleToggleDrinking = useCallback((enabled: boolean) => {
    setDrinkingEnabled(enabled);
  }, []);

  // ─── Handle max drinks change ───
  const handleChangeMaxDrinks = useCallback((max: number) => {
    setMaxDrinksPerRound(max);
  }, []);

  // ─── Handle game start ───
  const handleStartGame = useCallback(
    async (gameId: string, config: Partial<PartyGameConfig>) => {
      setStartingGame(gameId);

      try {
        const res = await fetch("/api/games/party/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roomCode: code,
            gameType: gameId,
            config,
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          console.error("Failed to start game:", err.error);
          setStartingGame(null);
          return;
        }

        // Navigate to the game page
        router.push(`/${code}/party/${gameId}`);
      } catch (err) {
        console.error("Failed to start game:", err);
        setStartingGame(null);
      }
    },
    [code, router]
  );

  // ─── Render states ───

  // Loading state
  if (pageState.status === "loading") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Loading party lobby...</p>
        </div>
      </div>
    );
  }

  // Not found
  if (pageState.status === "not_found") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="text-center">
          <div className="text-6xl">🔍</div>
          <h1 className="mt-4 text-2xl font-bold">Room not found</h1>
          <p className="mt-2 text-muted-foreground">
            Room &ldquo;{code}&rdquo; doesn&apos;t exist.
          </p>
          <button
            onClick={() => router.push("/")}
            className="mt-6 inline-flex h-12 items-center justify-center rounded-lg bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
          >
            Create a New Room
          </button>
        </div>
      </div>
    );
  }

  // Expired
  if (pageState.status === "expired") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="text-center">
          <div className="text-6xl">⏰</div>
          <h1 className="mt-4 text-2xl font-bold">Room has expired</h1>
          <p className="mt-2 text-muted-foreground">
            This room has expired.
          </p>
          <button
            onClick={() => router.push("/")}
            className="mt-6 inline-flex h-12 items-center justify-center rounded-lg bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
          >
            Create a New Room
          </button>
        </div>
      </div>
    );
  }

  // Error
  if (pageState.status === "error") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="text-center">
          <div className="text-6xl">⚠️</div>
          <h1 className="mt-4 text-2xl font-bold">Something went wrong</h1>
          <p className="mt-2 text-muted-foreground">{pageState.message}</p>
          <button
            onClick={() => router.push("/")}
            className="mt-6 inline-flex h-12 items-center justify-center rounded-lg bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  // Needs join
  if (pageState.status === "needs_join") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="text-center">
          <div className="text-6xl">👋</div>
          <h1 className="mt-4 text-2xl font-bold">Join the room first</h1>
          <p className="mt-2 text-muted-foreground">
            You need to join the room before accessing the party lobby.
          </p>
          <button
            onClick={() => router.push(`/${code}`)}
            className="mt-6 inline-flex h-12 items-center justify-center rounded-lg bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
          >
            Go to Room
          </button>
        </div>
      </div>
    );
  }

  // Ready state
  const { room, currentPlayer } = pageState;
  const nonSpectatorPlayers = players.filter((p) => !p.is_spectator);

  return (
    <div className="flex min-h-screen flex-col">
      {/* Back button */}
      <div className="px-4 pt-4">
        <button
          onClick={() => router.push(`/${code}`)}
          disabled={!!startingGame}
          className="inline-flex h-10 w-fit items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Lobby
        </button>
      </div>

      {/* Starting overlay */}
      {startingGame && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="flex flex-col items-center gap-4 rounded-lg bg-background p-8 shadow-lg">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-sm font-medium">Starting game...</p>
          </div>
        </div>
      )}

      {/* Party Lobby */}
      <PartyLobby
        games={[]}
        playerCount={nonSpectatorPlayers.length}
        vibeTier={vibeTier}
        isHost={currentPlayer.is_host}
        drinkingEnabled={drinkingEnabled}
        maxDrinksPerRound={maxDrinksPerRound}
        onStartGame={handleStartGame}
        onChangeVibeTier={currentPlayer.is_host ? handleChangeVibeTier : undefined}
        onToggleDrinking={currentPlayer.is_host ? handleToggleDrinking : undefined}
        onChangeMaxDrinks={currentPlayer.is_host ? handleChangeMaxDrinks : undefined}
      />

      {/* Room info footer */}
      <p className="pb-4 text-center text-xs text-muted-foreground">
        Room: {room.code} &middot; {nonSpectatorPlayers.length} player(s)
        {vibeTier === "after-dark" && " 🔞 After Dark"}
      </p>
    </div>
  );
}
