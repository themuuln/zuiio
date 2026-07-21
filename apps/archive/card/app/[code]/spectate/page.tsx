"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Eye, Layers } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { GameState } from "@/lib/game-engine/types";
import { DiscardPileCard } from "@/components/games/uno/card";
import { CardHand } from "@/components/games/uno/card-hand";

interface PlayerInfo {
  id: string;
  displayName: string;
  avatarEmoji: string;
  isHost: boolean;
}

type PageState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | {
      status: "spectating";
      gameSessionId: string;
      players: PlayerInfo[];
      gameState: GameState;
      roomId: string;
    };

export default function SpectatePage() {
  const params = useParams();
  const router = useRouter();
  const code = (params.code as string).toUpperCase();
  const [state, setState] = useState<PageState>({ status: "loading" });
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);

  // Subscribe to Realtime for live updates
  useEffect(() => {
    if (state.status !== "spectating") return;
    if (!state.roomId) return;

    const supabase = createClient();
    const channel = supabase.channel(`room:${state.roomId}`);

    channel.on(
      "broadcast",
      { event: "game_action" },
      (payload) => {
        const data = payload as unknown as {
          gameState: GameState;
        };
        if (data.gameState) {
          setState((prev) => {
            if (prev.status !== "spectating") return prev;
            return { ...prev, gameState: data.gameState };
          });
        }
      }
    );

    channel.subscribe();
    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [state]);

  // Load initial game state from API on mount
  useEffect(() => {
    let cancelled = false;

    async function loadGame() {
      try {
        // First, get the room info to find the active game session
        const roomRes = await fetch(`/api/rooms/${code}`);
        if (!roomRes.ok) {
          if (cancelled) return;
          setState({
            status: "error",
            message: "Room not found",
          });
          return;
        }

        const room = await roomRes.json();

        if (!room.current_game_id) {
          if (cancelled) return;
          setState({
            status: "error",
            message: "No active game in this room",
          });
          return;
        }

        // Fetch game state from the API — returns full game state
        // including all players' cards via service_role client
        const gameRes = await fetch(`/api/games/${room.current_game_id}`);
        if (!gameRes.ok) {
          if (cancelled) return;
          const errorBody = await gameRes.json().catch(() => ({}));
          setState({
            status: "error",
            message: errorBody.error || "Failed to load game state",
          });
          return;
        }

        const gameData = await gameRes.json();

        if (!cancelled) {
          setState({
            status: "spectating",
            gameSessionId: gameData.gameSessionId,
            players: gameData.players || [],
            gameState: gameData.config as GameState,
            roomId: gameData.roomId,
          });
        }
      } catch {
        if (!cancelled) {
          setState({
            status: "error",
            message: "Failed to load game state",
          });
        }
      }
    }

    loadGame();
    return () => {
      cancelled = true;
    };
  }, [code]);

  if (state.status === "loading") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <Eye className="h-8 w-8 animate-pulse text-primary" />
          <p className="text-muted-foreground">Loading spectator view...</p>
        </div>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-6 text-center">
          <div className="text-6xl">👀</div>
          <h1 className="text-2xl font-bold">Cannot spectate</h1>
          <p className="text-muted-foreground">{state.message}</p>
          <button
            onClick={() => router.push(`/${code}`)}
            className="inline-flex h-12 items-center justify-center rounded-lg bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
          >
            Back to Room
          </button>
        </div>
      </div>
    );
  }

  if (state.status === "spectating") {
    const { gameState, players } = state;

    return (
      <div className="flex min-h-screen flex-col">
        {/* Spectator header */}
        <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-2">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">
              Spectator
            </span>
          </div>
          {gameState && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Layers className="h-3 w-3" />
              <span>{gameState.deck.length} cards left</span>
            </div>
          )}
        </div>

        {/* Turn indicator */}
        {gameState && (
          <div className="border-b border-border px-4 py-2">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-xs text-muted-foreground">
                {gameState.direction === 1 ? "→" : "←"}
              </span>
              <span className="font-medium">
                {gameState.players[gameState.currentPlayerIndex]?.playerId
                  ? players.find(
                      (p) =>
                        p.id ===
                        gameState.players[gameState.currentPlayerIndex]
                          ?.playerId
                    )?.displayName ?? "Unknown"
                  : "Unknown"}
                &apos;s turn
              </span>
            </div>
          </div>
        )}

        {/* All players' hands (face-up) */}
        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
          {gameState ? (
            <>
              {/* All players' hands shown face-up */}
              {gameState.players.map((ps) => {
                const player = players.find((p) => p.id === ps.playerId);
                return (
                  <div key={ps.playerId} className="rounded-lg border border-border bg-card p-3">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="text-lg">
                        {player?.avatarEmoji ?? "👤"}
                      </span>
                      <span className="text-sm font-semibold">
                        {player?.displayName ?? "Unknown"}
                      </span>
                      {player?.isHost && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                          Host
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        ({ps.hand.length} cards)
                      </span>
                    </div>
                    <CardHand
                      cards={ps.hand}
                      faceUp={true}
                      disabled
                    />
                  </div>
                );
              })}

              {/* Center: Discard pile + deck */}
              <div className="flex items-center justify-center gap-6 py-6">
                {/* Deck */}
                <div className="flex flex-col items-center gap-1">
                  <div className="flex h-24 w-18 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-100 dark:border-gray-700 dark:bg-gray-800/50">
                    <Layers className="h-6 w-6 text-gray-400" />
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {gameState.deck.length} remaining
                  </span>
                </div>

                {/* Discard pile */}
                <div className="flex flex-col items-center gap-1">
                  {gameState.discardPile.length > 0 ? (
                    <>
                      <DiscardPileCard
                        card={
                          gameState.discardPile[
                            gameState.discardPile.length - 1
                          ]
                        }
                      />
                      <span className="text-[10px] text-muted-foreground">
                        {gameState.discardPile.length} cards
                      </span>
                    </>
                  ) : (
                    <div className="flex h-32 w-22 items-center justify-center rounded-xl border-2 border-dashed border-gray-300">
                      <span className="text-xs text-muted-foreground">
                        Empty
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3 text-center">
                <Eye className="h-12 w-12 text-muted-foreground/50" />
                <p className="text-muted-foreground">
                  Waiting for game state...
                </p>
                <p className="text-xs text-muted-foreground">
                  The game state will appear once players start playing.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}
