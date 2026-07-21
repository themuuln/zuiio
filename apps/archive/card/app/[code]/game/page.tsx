"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { type Card as CardType } from "@/lib/game-engine/types";
import type { GameState } from "@/lib/game-engine/types";
import { GameBoard } from "@/components/games/uno/game-board";
import { createClient } from "@/lib/supabase/client";

interface StartGameResponse {
  roomId: string;
  gameSessionId: string;
  gameType: string;
  players: Array<{
    id: string;
    displayName: string;
    avatarEmoji: string;
    isHost: boolean;
  }>;
  currentPlayerId: string;
  currentPlayerName: string;
  currentColor: string;
  topDiscard: CardType;
  direction: number;
  roundNumber: number;
  hand: CardType[];
  deckCount: number;
  status: string;
  config: GameState & { roomId: string };
}

type PageState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "playing"; data: StartGameResponse }
  | { status: "not_started" };

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const code = (params.code as string).toUpperCase();
  const [state, setState] = useState<PageState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    let channel: ReturnType<ReturnType<typeof createClient>["channel"]> | null = null;

    async function initializeGame() {
      try {
        // Step 1: Check if a game session already exists by fetching room info
        const roomRes = await fetch(`/api/rooms/${code}`);
        if (cancelled) return;

        if (!roomRes.ok) {
          setState({
            status: "error",
            message: "Room not found",
          });
          return;
        }

        const roomData = await roomRes.json();

        // Step 2: If there's an existing game session, resume it
        if (roomData.current_game_id) {
          const gameRes = await fetch(
            `/api/games/${roomData.current_game_id}`
          );
          if (cancelled) return;

          if (gameRes.ok) {
            const gameData = await gameRes.json();

            // Convert the fetched game state format to StartGameResponse format
            const response: StartGameResponse = {
              roomId: gameData.roomId,
              gameSessionId: gameData.gameSessionId,
              gameType: gameData.gameType,
              players: gameData.players,
              currentPlayerId: gameData.currentPlayerId,
              currentPlayerName: gameData.currentPlayerName,
              currentColor: gameData.currentColor,
              topDiscard: gameData.topDiscard,
              direction: gameData.direction,
              roundNumber: gameData.roundNumber,
              hand: gameData.hand,
              deckCount: gameData.deckCount,
              status: gameData.status,
              config: gameData.config,
            };

            setState({ status: "playing", data: response });
            return;
          }
        }

        // Step 2b: If game exists but resume failed (RLS), try subscribing to Realtime
        // for non-host players to receive the game state via broadcast
        if (roomData.current_game_id && roomData.id) {
          const supabase = createClient();
          channel = supabase.channel(`room:${roomData.id}`, {
            config: { broadcast: { self: false } },
          });

          // Listen for game_started broadcast
          channel.on(
            "broadcast",
            { event: "game_started" },
            (payload: unknown) => {
              const data = payload as {
                gameSessionId: string;
                gameType: string;
                players: StartGameResponse["players"];
                currentPlayerId: string;
                currentPlayerName: string;
                currentColor: string;
                topDiscard: CardType;
                direction: number;
                roundNumber: number;
                cardCount: number;
              };

              // When game_started is received, fetch the game to get our hand
              if (!cancelled && data.gameSessionId) {
                fetch(`/api/games/${data.gameSessionId}`)
                  .then((r) => r.json())
                  .then((gameData) => {
                    if (!cancelled && gameData && !gameData.error) {
                      const response: StartGameResponse = {
                        roomId: gameData.roomId || roomData.id,
                        gameSessionId: gameData.gameSessionId || data.gameSessionId,
                        gameType: gameData.gameType || data.gameType || "uno",
                        players: gameData.players || data.players || [],
                        currentPlayerId: gameData.currentPlayerId || data.currentPlayerId,
                        currentPlayerName: gameData.currentPlayerName || data.currentPlayerName,
                        currentColor: gameData.currentColor || data.currentColor || "red",
                        topDiscard: gameData.topDiscard || data.topDiscard,
                        direction: gameData.direction ?? data.direction ?? 1,
                        roundNumber: gameData.roundNumber ?? data.roundNumber ?? 1,
                        hand: gameData.hand || [],
                        deckCount: gameData.deckCount || 0,
                        status: gameData.status || "playing",
                        config: gameData.config || {
                          deck: [],
                          discardPile: data.topDiscard ? [data.topDiscard] : [],
                          currentColor: data.currentColor || "red",
                          currentPlayerIndex: data.players?.findIndex((p: { id: string }) => p.id === data.currentPlayerId) ?? 0,
                          direction: data.direction ?? 1,
                          pendingDrawCount: 0,
                          status: "playing",
                          roundNumber: data.roundNumber ?? 1,
                          turnStartTime: Date.now(),
                          config: { drawStacking: false, drawUntilYouPlay: false, turnTimeoutSeconds: 60, winningScore: 500 },
                          players: data.players?.map((p: { id: string; displayName: string; avatarEmoji: string; isHost: boolean }) => ({
                            playerId: p.id,
                            hand: [],
                            calledUno: false,
                          })) || [],
                        },
                      };
                      setState({ status: "playing", data: response });
                    }
                  })
                  .catch(() => {
                    // Fallback: if GET fails, try to initialize from broadcast data
                    if (!cancelled) {
                      // We received game_started broadcast, try POST as fallback
                      fetch("/api/games", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ roomCode: code }),
                      })
                        .then((r) => r.json())
                        .then((d) => {
                          if (!cancelled && d && !d.error) {
                            setState({ status: "playing", data: d });
                          }
                        })
                        .catch(() => {});
                    }
                  });
              }
            }
          );

          channel.subscribe();
        }

        // Step 3: No existing game — start a new one
        // Only the host can start a new game, so try POST
        const res = await fetch("/api/games", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomCode: code }),
        });

        if (cancelled) return;

        if (!res.ok) {
          const err = await res.json();
          if (res.status === 403) {
            // Non-host player - we've already subscribed to Realtime above,
            // so if a game hasn't started yet, show waiting state
            // Don't set error - wait for Realtime broadcast
            setState({
              status: "error",
              message: "Waiting for the host to start the game...",
            });
            return;
          } else if (res.status === 400) {
            setState({ status: "error", message: err.error ?? "Cannot start game" });
          } else {
            setState({ status: "error", message: err.error ?? "Failed to start game" });
          }
          return;
        }

        const data: StartGameResponse = await res.json();
        if (!cancelled) {
          setState({ status: "playing", data });
        }
      } catch {
        if (!cancelled) {
          setState({
            status: "error",
            message: "Failed to connect. Please try again.",
          });
        }
      }
    }

    initializeGame();
    return () => {
      cancelled = true;
      if (channel) {
        const supabase = createClient();
        supabase.removeChannel(channel);
      }
    };
  }, [code]);

  // Loading state
  if (state.status === "loading") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Starting game...</p>
          <p className="text-xs text-muted-foreground">Dealing cards...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (state.status === "error") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-6 text-center">
          <div className="text-6xl">😕</div>
          <h1 className="text-2xl font-bold">Something went wrong</h1>
          <p className="text-muted-foreground">{state.message}</p>
          <button
            onClick={() => router.push(`/${code}`)}
            className="inline-flex h-12 items-center justify-center rounded-lg bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
          >
            Back to Lobby
          </button>
        </div>
      </div>
    );
  }

  // Playing state
  if (state.status === "playing") {
    const { data } = state;

    return (
      <GameBoard
        gameSessionId={data.gameSessionId}
        currentPlayerId={data.config?.players?.[data.config?.currentPlayerIndex ?? 0]?.playerId ?? ""}
        players={data.players}
        initialHand={data.hand}
        initialGameState={data.config}
        roomCode={code}
        roomId={data.roomId}
        isSpectator={false}
      />
    );
  }

  return null;
}
