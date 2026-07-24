"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QuestionDisplay } from "@/components/party-game/question-display";
import { GameHeader } from "@/components/party-game/game-header";
import { DrinkingPrompt } from "@/components/party-game/drinking-prompt";
import { VotingArea } from "@/components/party-game/voting-area";
import { GameOverScreen } from "@/components/party-game/game-over-screen";
import { ReconnectingBanner } from "@/components/reconnecting-banner";
import type { PartyGameState, PlayerResponse } from "@/lib/party-engine";
import type { GameContentEntry, ContentTier } from "@/lib/content";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

type PagePhase =
  | { status: "loading" }
  | { status: "initializing" }
  | { status: "playing"; state: PartyGameState }
  | { status: "error"; message: string };

// ──────────────────────────────────────────────
// Utility: get game session ID from URL or state
// ──────────────────────────────────────────────

async function getGameSessionId(code: string): Promise<string | null> {
  try {
    // Fetch the room to get current_game_id
    const res = await fetch(`/api/rooms/${code}`);
    if (!res.ok) return null;
    const room = await res.json();
    return room.current_game_id ?? null;
  } catch {
    return null;
  }
}

// ──────────────────────────────────────────────
// Helper: get player info
// ──────────────────────────────────────────────

interface PlayerInfo {
  id: string;
  displayName: string;
  avatarEmoji: string;
  isHost: boolean;
  isSpectator: boolean;
}

async function getPlayerInfo(code: string): Promise<PlayerInfo | null> {
  try {
    const res = await fetch(`/api/rooms/${code}/me`);
    if (!res.ok) return null;
    const data = await res.json();
    const p = data.player;
    if (!p) return null;
    return {
      id: p.id,
      displayName: p.display_name ?? p.displayName ?? "Unknown",
      avatarEmoji: p.avatar_emoji ?? p.avatarEmoji ?? "👤",
      isHost: p.is_host ?? p.isHost ?? false,
      isSpectator: p.is_spectator ?? p.isSpectator ?? false,
    };
  } catch {
    return null;
  }
}

// ──────────────────────────────────────────────
// Active Player Indicator
// ──────────────────────────────────────────────

function ActivePlayerBanner({
  activePlayerName,
  isCurrentPlayer,
}: {
  activePlayerName: string;
  isCurrentPlayer: boolean;
}) {
  if (isCurrentPlayer) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-lg bg-primary/10 p-3 text-sm font-semibold text-primary">
        <span className="animate-pulse" aria-hidden="true">🎯</span>
        Your turn! Pick Truth or Dare
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-2 rounded-lg bg-muted p-3 text-sm text-muted-foreground">
      <span className="animate-pulse" aria-hidden="true">⏳</span>
      Waiting for <strong>{activePlayerName}</strong>...
    </div>
  );
}

// ──────────────────────────────────────────────
// Player list with active indicator
// ──────────────────────────────────────────────

function PlayerList({
  players,
  activePlayerId,
  currentPlayerId,
}: {
  players: PlayerInfo[];
  activePlayerId?: string;
  currentPlayerId: string;
}) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {players.map((player) => {
        const isActive = player.id === activePlayerId;
        const isMe = player.id === currentPlayerId;
        return (
          <div
            key={player.id}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-all",
              isActive
                ? "bg-primary text-primary-foreground font-semibold ring-2 ring-primary ring-offset-2 scale-110"
                : "bg-secondary text-secondary-foreground",
              isMe && !isActive && "ring-1 ring-muted-foreground/30"
            )}
          >
            <span aria-hidden="true">{player.avatarEmoji ?? "👤"}</span>
            <span>
              {player.displayName}
              {isMe && " (You)"}
            </span>
            {isActive && <span className="ml-1 animate-pulse" aria-hidden="true">👈</span>}
          </div>
        );
      })}
    </div>
  );
}

// ──────────────────────────────────────────────
// Main Page
// ──────────────────────────────────────────────

export default function TruthOrDarePage() {
  const params = useParams();
  const router = useRouter();
  const code = (params.code as string).toUpperCase();
  const [pagePhase, setPagePhase] = useState<PagePhase>({ status: "loading" });
  const [player, setPlayer] = useState<PlayerInfo | null>(null);
  const [players, setPlayers] = useState<PlayerInfo[]>([]);
  const [choiceSelected, setChoiceSelected] = useState<string | null>(null);
  const [showDrinkPrompt, setShowDrinkPrompt] = useState(false);
  const [drinkAction, setDrinkAction] = useState<"sip" | "shot">("sip");
  const [drinkCompleted, setDrinkCompleted] = useState(false);
  const [endReason, setEndReason] = useState<"host_ended" | "content_exhausted" | "room_expired" | "player_left" | undefined>(undefined);
  const [roomExpired, setRoomExpired] = useState(false);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [roundsPlayed, setRoundsPlayed] = useState(0);
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const expiryCheckRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── Initialize: fetch player info ───
  useEffect(() => {
    getPlayerInfo(code).then((p) => {
      if (p) {
        setPlayer(p);
      }
    });
  }, [code]);

  // ─── Initialize: fetch game session and create party game if needed ───
  const initializeGame = useCallback(async () => {
    try {
      setPagePhase({ status: "loading" });

      // Get game session ID
      const gameSessionId = await getGameSessionId(code);

      if (!gameSessionId) {
        setPagePhase({ status: "error", message: "No active game session found. Please start a game from the lobby." });
        return;
      }

      // Check if the game session already has party state
      const stateRes = await fetch(`/api/games/${gameSessionId}`);
      if (!stateRes.ok) {
        setPagePhase({ status: "error", message: "Failed to load game state." });
        return;
      }

      const stateData = await stateRes.json();

      // If party state doesn't exist yet, create it
      if (!stateData.isPartyGame || !stateData.state) {
        // Create the party game state
        const createRes = await fetch(`/api/games/${gameSessionId}/party/create`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            gameType: "truth-or-dare",
          }),
        });

        if (!createRes.ok) {
          const err = await createRes.json();
          setPagePhase({ status: "error", message: err.error ?? "Failed to start game." });
          return;
        }

        const createData = await createRes.json();
        setPagePhase({ status: "playing", state: createData.state });

        // Set players from the create response
        if (createData.players) {
          setPlayers(
            createData.players.map((p: Record<string, unknown>) => ({
              id: p.id as string,
              displayName: (p.displayName ?? p.display_name ?? "Unknown") as string,
              avatarEmoji: (p.avatarEmoji ?? p.avatar_emoji ?? "👤") as string,
              isHost: (p.isHost ?? p.is_host ?? false) as boolean,
              isSpectator: (p.isSpectator ?? p.is_spectator ?? false) as boolean,
            }))
          );
        }
      } else {
        // Use existing state
        setPagePhase({ status: "playing", state: stateData.state });
        if (stateData.players) {
          setPlayers(
            stateData.players.map((p: Record<string, unknown>) => ({
              id: p.id as string,
              displayName: (p.displayName ?? p.display_name ?? "Unknown") as string,
              avatarEmoji: (p.avatarEmoji ?? p.avatar_emoji ?? "👤") as string,
              isHost: (p.isHost ?? p.is_host ?? false) as boolean,
              isSpectator: (p.isSpectator ?? p.is_spectator ?? false) as boolean,
            }))
          );
        }
      }
    } catch (err) {
      console.error("Failed to initialize game:", err);
      setPagePhase({ status: "error", message: "Failed to initialize game." });
    }
  }, [code]);

  // ─── Fetch players ───
  const fetchPlayers = useCallback(async () => {
    try {
      const res = await fetch(`/api/rooms/${code}/players`);
      if (res.ok) {
        const data = await res.json();
        setPlayers(
          (data.players ?? []).map((p: Record<string, unknown>) => ({
            id: p.id as string,
            displayName: (p.displayName ?? p.display_name ?? "Unknown") as string,
            avatarEmoji: (p.avatarEmoji ?? p.avatar_emoji ?? "👤") as string,
            isHost: (p.isHost ?? p.is_host ?? false) as boolean,
            isSpectator: (p.isSpectator ?? p.is_spectator ?? false) as boolean,
          }))
        );
      }
    } catch {
      // Silently fail — will retry
    }
  }, [code]);

  // ─── Subscribe to Realtime and initialize ───
  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    async function init() {
      // First try to get room ID for channel subscription
      const roomRes = await fetch(`/api/rooms/${code}`);
      if (!roomRes.ok) return;
      const room = await roomRes.json();

      if (cancelled) return;

      // Store room ID for expiry checking
      setRoomId(room.id);

      // Check if room has expired
      if (room.expires_at) {
        const expiresAt = new Date(room.expires_at).getTime();
        if (Date.now() > expiresAt) {
          setRoomExpired(true);
          setEndReason("room_expired");
          return;
        }
      }

      // Subscribe to room Realtime channel
      const channel = supabase.channel(`room:${room.id}`);

      // Listen for game events
      channel.on("broadcast", { event: "card:show" }, (payload) => {
        const data = payload as unknown as { state: PartyGameState; players?: Array<Record<string, unknown>> };
        if (data.state) {
          setPagePhase({ status: "playing", state: data.state });
          setChoiceSelected(null);
          setShowDrinkPrompt(false);
          setDrinkCompleted(false);
        }
        if (data.players) {
          setPlayers(
            data.players.map((p) => ({
              id: p.id as string,
              displayName: ((p.displayName ?? p.display_name) as string) || "Unknown",
              avatarEmoji: ((p.avatarEmoji ?? p.avatar_emoji) as string) || "👤",
              isHost: (p.isHost ?? p.is_host) as boolean,
              isSpectator: (p.isSpectator ?? p.is_spectator ?? false) as boolean,
            }))
          );
        }
      });

      channel.on("broadcast", { event: "reveal:results" }, (payload) => {
        // For truth-or-dare, this is a no-op (reveal is handled by the pick flow)
        // but we keep the handler for future use
      });

      channel.on("broadcast", { event: "game:end" }, (payload) => {
        const data = payload as unknown as { reason?: string };
        setEndReason(data.reason as "host_ended" | "content_exhausted" | "room_expired" | "player_left" ?? "host_ended");
        setPagePhase((prev) => {
          if (prev.status === "playing") {
            return {
              status: "playing",
              state: { ...prev.state, status: "game-end" as const, phase: "game-end" as const },
            };
          }
          return prev;
        });
      });

      channel.on("broadcast", { event: "play:again" }, (payload) => {
        const data = payload as unknown as { state: PartyGameState };
        if (data.state) {
          setEndReason(undefined);
          setRoomExpired(false);
          setChoiceSelected(null);
          setShowDrinkPrompt(false);
          setDrinkCompleted(false);
          setRoundsPlayed(0);
          setPagePhase({ status: "playing", state: data.state });
        }
      });

      channel.on("broadcast", { event: "player_left" }, async (payload) => {
        const data = payload as unknown as { playerId: string; playerName: string };
        if (data.playerId) {
          // Remove the player from the local player list
          setPlayers((prev) => prev.filter((p) => p.id !== data.playerId));
        }
      });

      channel.on("broadcast", { event: "player_removed" }, async (payload) => {
        const data = payload as unknown as { playerId: string; playerName: string };
        if (data.playerId) {
          setPlayers((prev) => prev.filter((p) => p.id !== data.playerId));
        }
      });

      channel.on("broadcast", { event: "room_expired" }, () => {
        setRoomExpired(true);
        setEndReason("room_expired");
        setPagePhase((prev) => {
          if (prev.status === "playing") {
            return {
              status: "playing",
              state: { ...prev.state, status: "game-end" as const, phase: "game-end" as const },
            };
          }
          return prev;
        });
      });

      channel.subscribe((status) => {
        if (status !== "SUBSCRIBED") {
          console.info("Realtime subscription status:", status);
        }
      });

      channelRef.current = channel;

      // Initialize the game
      await initializeGame();

      // Fetch players
      await fetchPlayers();

      // Track rounds played
      pollRef.current = setInterval(async () => {
        const gameSessionId = await getGameSessionId(code);
        if (gameSessionId) {
          const res = await fetch(`/api/games/${gameSessionId}`);
          if (res.ok) {
            const data = await res.json();
            if (data.isPartyGame && data.state) {
              setPagePhase((prev) => {
                if (prev.status === "playing") {
                  // Track rounds played
                  if (data.state.roundNumber > (prev.state.roundNumber || 0)) {
                    setRoundsPlayed((r) => Math.max(r, data.state.roundNumber));
                  }
                  // Only update if phase or card changed
                  if (
                    prev.state.phase !== data.state.phase ||
                    prev.state.currentCard?.id !== data.state.currentCard?.id ||
                    prev.state.roundNumber !== data.state.roundNumber
                  ) {
                    return { status: "playing", state: data.state };
                  }
                }
                return prev;
              });
            }
          }
        }
      }, 3000);

      // Periodically check if room has expired
      expiryCheckRef.current = setInterval(async () => {
        if (!room.id) return;
        try {
          const checkRes = await fetch(`/api/rooms/${code}`);
          if (checkRes.ok) {
            const checkRoom = await checkRes.json();
            if (checkRoom.expires_at) {
              const expiresAt = new Date(checkRoom.expires_at).getTime();
              if (Date.now() > expiresAt) {
                setRoomExpired(true);
                setEndReason("room_expired");
                setPagePhase((prev) => {
                  if (prev.status === "playing") {
                    return {
                      status: "playing",
                      state: { ...prev.state, status: "game-end" as const, phase: "game-end" as const },
                    };
                  }
                  return prev;
                });
              }
            }
          }
        } catch {
          // Silently fail
        }
      }, 30000); // Check every 30 seconds
    }

    init();

    return () => {
      cancelled = true;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      if (expiryCheckRef.current) {
        clearInterval(expiryCheckRef.current);
        expiryCheckRef.current = null;
      }
    };
  }, [code, initializeGame, fetchPlayers, router]);

  // ─── Handle active player picking Truth or Dare ───
  const handlePick = useCallback(
    async (choice: "truth" | "dare") => {
      if (pagePhase.status !== "playing") return;
      const state = pagePhase.state;
      const gameSessionId = state.gameSessionId;

      setChoiceSelected(choice);

      try {
        const res = await fetch(
          `/api/games/${gameSessionId}/party/truth-or-dare/pick`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              playerId: player?.id,
              choice,
            }),
          }
        );

        if (!res.ok) {
          const err = await res.json();
          console.error("Failed to pick:", err.error);
          setChoiceSelected(null);
        }
        // State update comes via Realtime broadcast or poll
      } catch (err) {
        console.error("Failed to pick:", err);
        setChoiceSelected(null);
      }
    },
    [pagePhase, player]
  );

  // ─── Handle active player completing the dare/truth ───
  const handleComplete = useCallback(async () => {
    if (pagePhase.status !== "playing") return;
    const state = pagePhase.state;
    const gameSessionId = state.gameSessionId;

    try {
      // Record the response (complete = done the dare/answered truth)
      const res = await fetch(
        `/api/games/${gameSessionId}/party/respond`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            playerId: player?.id,
            playerName: player?.displayName,
            value: "complete",
          }),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        console.error("Failed to record completion:", err.error);
        return;
      }

      // If drinking is enabled, show drinking prompt
      if (state.config.drinkingEnabled) {
        setDrinkAction(state.config.passPenalty >= 2 ? "shot" : "sip");
        setShowDrinkPrompt(true);
      } else {
        // Dry mode: advance to next round via respond with "pass"
        await handleAdvanceToNext();
      }
    } catch (err) {
      console.error("Failed to complete:", err);
    }
  }, [pagePhase, player]);

  // ─── Handle active player passing ───
  const handlePass = useCallback(async () => {
    if (pagePhase.status !== "playing") return;
    const state = pagePhase.state;
    const gameSessionId = state.gameSessionId;

    try {
      // Record the pass
      const res = await fetch(
        `/api/games/${gameSessionId}/party/respond`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            playerId: player?.id,
            playerName: player?.displayName,
            value: "pass",
          }),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        console.error("Failed to record pass:", err.error);
        return;
      }

      // Show drinking prompt for passing (penalty)
      if (state.config.drinkingEnabled) {
        setDrinkAction(state.config.passPenalty >= 2 ? "shot" : "sip");
        setShowDrinkPrompt(true);
      } else {
        // Dry mode: penalty point
        setShowDrinkPrompt(true);
      }
    } catch (err) {
      console.error("Failed to pass:", err);
    }
  }, [pagePhase, player]);

  // ─── Handle drinking complete ───
  const handleDrinkComplete = useCallback(async () => {
    if (pagePhase.status !== "playing") return;
    const state = pagePhase.state;
    const gameSessionId = state.gameSessionId;

    try {
      // Record the drink action
      await fetch(`/api/games/${gameSessionId}/party/drink`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId: player?.id,
          action: drinkAction,
        }),
      });
    } catch (err) {
      console.error("Failed to record drink:", err);
    }

    setDrinkCompleted(true);
    setShowDrinkPrompt(false);

    // Advance to next round
    await handleAdvanceToNext();
  }, [pagePhase, player, drinkAction]);

  // ─── Handle drink pass ───
  const handleDrinkPass = useCallback(async () => {
    setDrinkCompleted(true);
    setShowDrinkPrompt(false);

    // Advance to next round
    await handleAdvanceToNext();
  }, [pagePhase, player]);

  // ─── Advance to next round (host action) ───
  const handleAdvanceToNext = useCallback(async () => {
    if (pagePhase.status !== "playing") return;
    const state = pagePhase.state;
    const gameSessionId = state.gameSessionId;

    // First advance phase to next-round, then get next card
    try {
      // Advance to next round (this moves to next player)
      await fetch(`/api/games/${gameSessionId}/party/next-card`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      // State update comes via Realtime broadcast or poll
    } catch (err) {
      console.error("Failed to advance to next round:", err);
    }
  }, [pagePhase]);

  // ─── Render ───
  if (pagePhase.status === "loading" || pagePhase.status === "initializing") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">
            {pagePhase.status === "initializing"
              ? "Starting game..."
              : "Loading game..."}
          </p>
        </div>
      </div>
    );
  }

  if (pagePhase.status === "error") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-6 text-center">
          <div className="text-6xl">⚠️</div>
          <h1 className="text-2xl font-bold">Something went wrong</h1>
          <p className="text-muted-foreground">{pagePhase.message}</p>
          <Button onClick={() => router.push(`/${code}/`)}>
            Back to Lobby
          </Button>
        </div>
      </div>
    );
  }

  const state = pagePhase.state;
  const isActivePlayer = player?.id === state.config.activePlayerId;
  const activePlayerName =
    players.find((p) => p.id === state.config.activePlayerId)?.displayName ?? "Unknown";
  const isHost = player?.isHost ?? false;
  const isSpectator = player?.isSpectator ?? false;
  const canVote = isActivePlayer && state.phase === "show-card";
  const hasCard = state.currentCard !== null;
  const isResponding = state.phase === "responding" && hasCard && isActivePlayer;
  const isWaitingForCard = state.phase === "responding" && !isActivePlayer;

  const effectiveEndReason = roomExpired ? "room_expired" : endReason;

  return (
    <div className="flex min-h-screen flex-col">
      <ReconnectingBanner
        connectionId={code}
        onReconnected={() => {
          // Re-fetch game state on reconnection
          initializeGame();
        }}
      />
      {/* Game Header */}
      <GameHeader
        roundNumber={state.roundNumber}
        timerSeconds={state.timerSeconds}
        timerDuration={state.config.timerSeconds}
        gameType="Truth or Dare"
        drinkCounts={{}}
        currentPlayerId={player?.id}
        playerNames={Object.fromEntries(
          players.map((p) => [p.id, p.displayName])
        )}
      />

      {/* Player List with active indicator */}
      <div className="px-4 py-3">
        <PlayerList
          players={players}
          activePlayerId={state.config.activePlayerId}
          currentPlayerId={player?.id ?? ""}
        />
      </div>

      {/* Main game area */}
      <div className="flex flex-1 flex-col items-center gap-6 px-4 pb-8 pt-4">
        {/* Phase: show-card — Active player picks Truth or Dare */}
        {state.phase === "show-card" && !hasCard && (
          <div className="flex w-full max-w-md flex-col items-center gap-6">
            <div className="text-center">
              <h2 className="text-xl font-bold">Round {state.roundNumber}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {isActivePlayer
                  ? "Your turn! Pick Truth or Dare"
                  : `${activePlayerName}'s turn to pick`}
              </p>
            </div>

            {/* Active player indicator for non-active */}
            {!isActivePlayer && (
              <div className="flex items-center justify-center gap-2 rounded-lg bg-muted p-4 text-sm text-muted-foreground w-full">
                <span className="animate-pulse text-lg" aria-hidden="true">⏳</span>
                <span>
                  Waiting for <strong>{activePlayerName}</strong> to pick...
                </span>
              </div>
            )}

            {/* Truth/Dare picker for active player */}
            {isActivePlayer && (
              <ActivePlayerBanner
                activePlayerName={activePlayerName}
                isCurrentPlayer={true}
              />
            )}

            {/* Voting area for active player */}
            <VotingArea
              gameType="truth-or-dare"
              canVote={canVote}
              disabled={!canVote || choiceSelected !== null}
              currentSelection={choiceSelected}
              onSelect={(value) =>
                handlePick(value as "truth" | "dare")
              }
            />

            {/* Host controls */}
            {isHost && !isActivePlayer && (
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    fetch(`/api/games/${state.gameSessionId}/party/skip`, {
                      method: "POST",
                    })
                  }
                >
                  Skip Card
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    fetch(`/api/games/${state.gameSessionId}/party/end`, {
                      method: "POST",
                    })
                  }
                >
                  End Game
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Phase: responding — Card is shown to ALL */}
        {state.phase === "responding" && hasCard && (
          <div className="flex w-full max-w-md flex-col items-center gap-6">
            <QuestionDisplay
              card={state.currentCard}
              suspense={true}
            />

            {/* Active player: Complete or Pass */}
            {isResponding && (
              <div className="flex flex-col gap-3 w-full">
                <Button
                  onClick={handleComplete}
                  size="lg"
                  className="min-h-[48px] w-full text-base font-semibold"
                >
                  ✅ Done — I did it!
                </Button>
                <Button
                  variant="outline"
                  onClick={handlePass}
                  size="lg"
                  className="min-h-[48px] w-full text-base"
                >
                  Pass
                </Button>
              </div>
            )}

            {/* Non-active player: Waiting */}
            {isWaitingForCard && (
              <div className="flex items-center justify-center gap-2 rounded-lg bg-muted p-4 text-sm text-muted-foreground w-full">
                <span className="animate-pulse text-lg" aria-hidden="true">⏳</span>
                <span>
                  Waiting for <strong>{activePlayerName}</strong> to complete...
                </span>
              </div>
            )}

            {/* Spectator */}
            {isSpectator && (
              <p className="text-center text-sm text-muted-foreground">
                Watching {activePlayerName} play...
              </p>
            )}
          </div>
        )}

        {/* Phase: next-round / drinking — Show drinking prompt */}
        {state.phase === "drinking" && showDrinkPrompt && (
          <DrinkingPrompt
            open={showDrinkPrompt}
            playerId={player?.id ?? ""}
            playerName={player?.displayName ?? "You"}
            action={drinkAction}
            completed={drinkCompleted}
            drinkingDisabled={!state.config.drinkingEnabled}
            onComplete={handleDrinkComplete}
            onPass={handleDrinkPass}
          />
        )}

        {/* Phase: game-end or room expired */}
        {(state.phase === "game-end" || effectiveEndReason === "room_expired") && (
          <div className="flex w-full max-w-md flex-col items-center pt-8">
            <GameOverScreen
              gameState={state}
              code={code}
              gameName="Truth or Dare"
              isHost={isHost}
              roundsPlayed={Math.max(roundsPlayed, state.roundNumber)}
              endReason={effectiveEndReason}
              expiredMessage={
                effectiveEndReason === "room_expired"
                  ? "This room has expired. The game has been automatically terminated."
                  : undefined
              }
            />
          </div>
        )}

        {/* Empty state for other phases */}
        {state.phase === "revealing" && (
          <div className="flex items-center justify-center p-8">
            <p className="text-muted-foreground">Processing...</p>
          </div>
        )}

        {state.phase === "next-round" && (
          <div className="flex items-center justify-center p-8">
            <p className="text-muted-foreground">Advancing to next round...</p>
          </div>
        )}
      </div>
    </div>
  );
}
