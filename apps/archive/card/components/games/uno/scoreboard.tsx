"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Trophy,
  RotateCcw,
  Home,
  Sparkles,
  Loader2,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

interface ScoreData {
  playerId: string;
  displayName: string;
  avatarEmoji: string;
  pointsScored: number;
  isWinner: boolean;
  runningTotal: number;
}

interface RoundScores {
  roundNumber: number;
  scores: ScoreData[];
}

interface RunningTotal {
  id: string;
  displayName: string;
  avatarEmoji: string;
  isHost: boolean;
  runningTotal: number;
}

interface LastRoundWinner {
  playerId: string;
  displayName: string;
  avatarEmoji: string;
  pointsScored?: number;
}

interface ScoresResponse {
  roomId: string;
  currentGameId: string | null;
  gameSessionId: string;
  gameType: string;
  status: string;
  currentRound: number;
  players: Array<{
    id: string;
    displayName: string;
    avatarEmoji: string;
    isHost: boolean;
  }>;
  perRoundScores: RoundScores[];
  runningTotals: RunningTotal[];
  lastRoundWinner: LastRoundWinner | null;
}

interface ScoreboardProps {
  roomCode: string;
}

/**
 * Scoreboard component showing per-round scores, running totals,
 * winner highlight, Play Again and Different Game buttons.
 */
export function Scoreboard({ roomCode }: ScoreboardProps) {
  const router = useRouter();
  const [data, setData] = useState<ScoresResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [celebrating, setCelebrating] = useState(true);
  const [isHost, setIsHost] = useState(false);
  const [endSessionLoading, setEndSessionLoading] = useState(false);

  const fetchScores = useCallback(async () => {
    try {
      const res = await fetch(`/api/rooms/${roomCode}/scores`);
      if (!res.ok) {
        const err = await res.json();
        setError(err.error ?? "Failed to load scores");
        return;
      }
      const result: ScoresResponse = await res.json();
      setData(result);
    } catch {
      setError("Failed to connect");
    } finally {
      setLoading(false);
    }
  }, [roomCode]);

  useEffect(() => {
    fetchScores();

    // Check if current user is the host
    fetch(`/api/rooms/${roomCode}/me`)
      .then((r) => r.json())
      .then((data) => {
        if (data.player?.is_host) {
          setIsHost(true);
        }
      })
      .catch(() => {});
  }, [fetchScores, roomCode]);

  // Auto-hide celebration after 5 seconds
  useEffect(() => {
    if (data?.lastRoundWinner) {
      const timer = setTimeout(() => setCelebrating(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [data]);

  // Subscribe to round_ended Realtime events to auto-refresh scores
  useEffect(() => {
    if (!data?.roomId) return;

    const supabase = createClient();
    const channel = supabase.channel(`room:${data.roomId}`, {
      config: { broadcast: { self: false } },
    });

    channel.on(
      "broadcast",
      { event: "round_ended" },
      () => {
        fetchScores();
      },
    );

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [data?.roomId, fetchScores]);

  const handlePlayAgain = async () => {
    if (!data?.gameSessionId) return;
    setActionLoading("play_again");

    try {
      const res = await fetch(
        `/api/games/${data.gameSessionId}/play-again`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomCode }),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        setError(err.error ?? "Failed to start new round");
        setActionLoading(null);
        return;
      }

      // Navigate to the game page
      router.push(`/${roomCode}/game`);
    } catch {
      setError("Failed to start new round");
      setActionLoading(null);
    }
  };

  const handleEndSession = async () => {
    setEndSessionLoading(true);
    try {
      const res = await fetch(`/api/rooms/${roomCode}/end-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameSessionId: data?.gameSessionId }),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.error ?? "Failed to end session");
        setEndSessionLoading(false);
        return;
      }

      // Navigate to lobby
      router.push(`/${roomCode}`);
    } catch {
      setError("Failed to end session");
      setEndSessionLoading(false);
    }
  };

  const handleDifferentGame = async () => {
    if (!data?.gameSessionId) return;
    setActionLoading("different_game");

    try {
      const res = await fetch(
        `/api/games/${data.gameSessionId}/different-game`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomCode }),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        setError(err.error ?? "Failed to return to game picker");
        setActionLoading(null);
        return;
      }

      // Navigate to lobby (which will show game picker)
      router.push(`/${roomCode}`);
    } catch {
      setError("Failed to return to game picker");
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading scores...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-6 text-center">
          <div className="text-6xl">😕</div>
          <h1 className="text-2xl font-bold">Something went wrong</h1>
          <p className="text-muted-foreground">{error}</p>
          <button
            onClick={() => router.push(`/${roomCode}`)}
            className="inline-flex h-12 items-center justify-center rounded-lg bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
          >
            Back to Room
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { perRoundScores, runningTotals, lastRoundWinner, currentRound } = data;

  // Guard against missing game session data (e.g., no active game)
  if (!perRoundScores || !data.gameSessionId) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-6 text-center">
          <div className="text-6xl">🎮</div>
          <h1 className="text-2xl font-bold">No Game Session</h1>
          <p className="text-muted-foreground">
            There is no active game session. Start a game from the lobby to see
            scores.
          </p>
          <button
            onClick={() => router.push(`/${roomCode}`)}
            className="inline-flex h-12 items-center justify-center rounded-lg bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
          >
            Back to Lobby
          </button>
        </div>
      </div>
    );
  }

  // Sort running totals by score descending
  const sortedRunningTotals = [...runningTotals].sort(
    (a, b) => b.runningTotal - a.runningTotal
  );

  return (
    <div className="flex min-h-screen flex-col">
      {/* Winner Celebration */}
      {lastRoundWinner && celebrating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="flex flex-col items-center gap-4 text-center animate-in zoom-in-50 duration-500">
            <div className="relative">
              <Trophy className="h-24 w-24 text-yellow-500 animate-bounce" />
              <Sparkles className="absolute -right-2 -top-2 h-8 w-8 text-yellow-400 animate-pulse" />
              <Sparkles className="absolute -left-2 -bottom-2 h-6 w-6 text-yellow-400 animate-pulse delay-150" />
            </div>
            <div className="text-6xl">{lastRoundWinner.avatarEmoji}</div>
            <h1 className="text-3xl font-bold">
              {lastRoundWinner.displayName} wins!
            </h1>
            <p className="text-lg text-muted-foreground">
              Round {currentRound - 1} Champion
            </p>
            <button
              onClick={() => setCelebrating(false)}
              className="mt-4 inline-flex h-10 items-center justify-center rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
            >
              View Scores
            </button>
          </div>
        </div>
      )}

      {/* Scoreboard Header */}
      <div className="border-b border-border bg-gradient-to-b from-primary/5 to-background px-4 py-6 text-center">
        <div className="mb-1 text-4xl">🏆</div>
        <h1 className="text-2xl font-bold">Scoreboard</h1>
        <p className="text-sm text-muted-foreground">
          Round {currentRound - 1} Complete
        </p>
      </div>

      {/* Scoreboard Content */}
      <div className="flex-1 space-y-6 overflow-y-auto px-4 py-6">
        {/* Per-Round Scores */}
        {perRoundScores.map((round) => (
          <div
            key={round.roundNumber}
            className="rounded-xl border border-border bg-card shadow-sm"
          >
            <div className="border-b border-border px-4 py-2">
              <h2 className="text-sm font-semibold text-muted-foreground">
                Round {round.roundNumber}
              </h2>
            </div>
            <div className="divide-y divide-border">
              {round.scores
                .sort((a, b) => b.pointsScored - a.pointsScored)
                .map((score) => (
                  <div
                    key={score.playerId}
                    className={cn(
                      "flex items-center justify-between px-4 py-3 transition-colors",
                      score.isWinner && "bg-yellow-50 dark:bg-yellow-950/20"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{score.avatarEmoji}</span>
                      <div>
                        <span className="text-sm font-medium">
                          {score.displayName}
                        </span>
                        {score.isWinner && (
                          <span className="ml-2 inline-flex items-center gap-1 text-xs font-semibold text-yellow-600">
                            <Trophy className="h-3 w-3" />
                            Winner
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span
                          className={cn(
                            "text-sm font-bold",
                            score.isWinner
                              ? "text-yellow-600"
                              : "text-muted-foreground"
                          )}
                        >
                          +{score.pointsScored}
                        </span>
                        <div className="text-[10px] text-muted-foreground">
                          Total: {score.runningTotal}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}

        {/* Running Totals Summary */}
        <div className="rounded-xl border border-border bg-card shadow-sm">
          <div className="border-b border-border px-4 py-2">
            <h2 className="text-sm font-semibold text-muted-foreground">
              Running Totals
            </h2>
          </div>
          <div className="divide-y divide-border">
            {sortedRunningTotals.map((player, index) => (
              <div
                key={player.id}
                className={cn(
                  "flex items-center justify-between px-4 py-3",
                  index === 0 && "bg-primary/5"
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-muted-foreground">
                    {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`}
                  </span>
                  <span className="text-xl">{player.avatarEmoji}</span>
                  <span className="text-sm font-medium">
                    {player.displayName}
                  </span>
                </div>
                <span
                  className={cn(
                    "text-lg font-bold",
                    index === 0 && "text-primary"
                  )}
                >
                  {player.runningTotal}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="sticky bottom-0 border-t border-border bg-background/95 backdrop-blur-sm px-4 py-4">
        <div className="mx-auto flex max-w-sm flex-col gap-3">
          <button
            onClick={handlePlayAgain}
            disabled={actionLoading !== null}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-all hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
          >
            {actionLoading === "play_again" ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <RotateCcw className="h-5 w-5" />
            )}
            Play Again
          </button>
          <button
            onClick={handleDifferentGame}
            disabled={actionLoading !== null}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-input bg-background px-8 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
          >
            {actionLoading === "different_game" ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Home className="h-5 w-5" />
            )}
            Different Game
          </button>

          {/* End Session — only for host */}
          {isHost && (
            <button
              onClick={handleEndSession}
              disabled={endSessionLoading}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-8 text-sm font-medium text-red-600 shadow-sm transition-colors hover:bg-red-100 disabled:opacity-50 dark:border-red-900 dark:bg-red-950/20 dark:text-red-400"
            >
              {endSessionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4" />
              )}
              End Session
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
