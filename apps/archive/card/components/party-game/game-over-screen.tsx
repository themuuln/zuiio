"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw, Home, Trophy, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PartyGameState } from "@/lib/party-engine";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export interface GameOverScreenProps {
  /** The final (or current) party game state */
  gameState: PartyGameState;
  /** Room code for navigation */
  code: string;
  /** Human-readable game name (e.g., "Truth or Dare") */
  gameName: string;
  /** Whether the current player is the host (only host can trigger play-again) */
  isHost: boolean;
  /** Total rounds played */
  roundsPlayed: number;
  /** Optional: reason the game ended, for display */
  endReason?: "host_ended" | "content_exhausted" | "room_expired" | "max_rounds" | "player_left";
  /** Optional: room expiry message */
  expiredMessage?: string;
}

// ──────────────────────────────────────────────
// Game Over Screen Component
// ──────────────────────────────────────────────

export function GameOverScreen({
  gameState,
  code,
  gameName,
  isHost,
  roundsPlayed,
  endReason,
  expiredMessage,
}: GameOverScreenProps) {
  const router = useRouter();
  const [playAgainLoading, setPlayAgainLoading] = useState(false);
  const [differentGameLoading, setDifferentGameLoading] = useState(false);

  // ─── Play Again: create new session with same config ───
  const handlePlayAgain = async () => {
    if (!isHost) return;
    setPlayAgainLoading(true);

    try {
      const res = await fetch(
        `/api/games/${gameState.gameSessionId}/party/play-again`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }
      );

      if (res.ok) {
        // The API will broadcast the new game state — the game page
        // will pick it up via the Realtime subscription and re-render.
        // Navigate to the same game page to reinitialize.
        router.push(`/${code}/party/${gameState.gameType}`);
      } else {
        const err = await res.json();
        console.error("Failed to play again:", err.error);
        setPlayAgainLoading(false);
      }
    } catch (err) {
      console.error("Failed to play again:", err);
      setPlayAgainLoading(false);
    }
  };

  // ─── Different Game: navigate to party lobby ───
  const handleDifferentGame = async () => {
    setDifferentGameLoading(true);

    try {
      const res = await fetch(
        `/api/games/${gameState.gameSessionId}/different-game`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomCode: code }),
        }
      );

      if (res.ok) {
        router.push(`/${code}/party`);
      } else {
        // Fallback: navigate anyway
        router.push(`/${code}/party`);
      }
    } catch {
      // Fallback: navigate anyway
      router.push(`/${code}/party`);
    }
  };

  // ─── Room expired display ───
  if (endReason === "room_expired") {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="text-6xl" aria-hidden="true">⏰</span>
        <h2 className="text-2xl font-bold">Room Expired</h2>
        <p className="text-muted-foreground max-w-xs">
          {expiredMessage ?? "This room has expired."}
        </p>
        <Button onClick={() => router.push("/")} size="lg">
          Create a New Room
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      {/* Trophy / Game Over icon */}
      <div className="flex items-center justify-center">
        <div className="relative">
          <span className="text-7xl" aria-hidden="true">
            {roundsPlayed > 0 ? "🎮" : "🏁"}
          </span>
          {roundsPlayed > 3 && (
            <span className="absolute -right-2 -top-2 text-2xl" aria-hidden="true">
              <Trophy className="h-8 w-8 text-yellow-500" />
            </span>
          )}
        </div>
      </div>

      {/* Title */}
      <h2 className="text-3xl font-bold">Game Over!</h2>
      <p className="text-muted-foreground">
        Thanks for playing {gameName}!
      </p>

      {/* Summary */}
      <div className="w-full max-w-xs rounded-xl border bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Rounds played</span>
          <span className="font-semibold">{roundsPlayed}</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Game</span>
          <span className="font-semibold">{gameName}</span>
        </div>
        {endReason && (
          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Status</span>
            <span className="font-semibold text-muted-foreground capitalize">
              {endReason === "content_exhausted" && "All cards played"}
              {endReason === "host_ended" && "Host ended"}
              {endReason === "max_rounds" && "Max rounds reached"}
              {endReason === "player_left" && "Not enough players"}
            </span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex w-full max-w-xs flex-col gap-3">
        {isHost && (
          <Button
            onClick={handlePlayAgain}
            disabled={playAgainLoading}
            size="lg"
            className="w-full min-h-[48px] text-base font-semibold"
          >
            {playAgainLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Starting...
              </>
            ) : (
              <>
                <RotateCcw className="mr-2 h-5 w-5" />
                Play Again
              </>
            )}
          </Button>
        )}

        <Button
          onClick={handleDifferentGame}
          disabled={differentGameLoading}
          variant={isHost ? "outline" : "default"}
          size="lg"
          className="w-full min-h-[48px] text-base"
        >
          {differentGameLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <Home className="mr-2 h-5 w-5" />
              {isHost ? "Pick a Different Game" : "Back to Party Lobby"}
            </>
          )}
        </Button>

        {!isHost && (
          <p className="text-xs text-muted-foreground">
            Ask the host to start a new game
          </p>
        )}
      </div>
    </div>
  );
}
