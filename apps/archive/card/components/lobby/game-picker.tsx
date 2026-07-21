"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Clock, Users, Check, X, ThumbsUp, Timer, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { SwipeableCard } from "@/components/lobby/swipeable-card";
import {
  GAME_PICKER_TIMEOUT_SECONDS,
  getGamesForPlayerCount,
  getGameById,
  findMostVotedGame,
  type GameDefinition,
} from "@/lib/games";

interface VoteData {
  player_id: string;
  game_type: string;
  vote: string;
}

interface MatchResult {
  matched: boolean;
  gameType?: string;
  gameSessionId?: string;
  celebration?: string;
}

interface GamePickerProps {
  roomId: string;
  roomCode: string;
  isHost: boolean;
  availableGames: GameDefinition[];
  playerCount: number;
  onGameStarted?: (gameSessionId: string, gameType: string) => void;
}

type PickerPhase =
  | "voting"      // Players are swiping
  | "matched"     // Mutual match found - celebration
  | "timeout"     // Timer expired - show results
  | "host_confirm" // After timeout, host can confirm
  | "confirmed"   // Game confirmed by host or match
  | "no_matches"; // No votes at all

export function GamePicker({
  roomId,
  roomCode,
  isHost,
  availableGames: initialGames,
  playerCount,
  onGameStarted,
}: GamePickerProps) {
  const router = useRouter();

  const [phase, setPhase] = useState<PickerPhase>("voting");
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [votes, setVotes] = useState<VoteData[]>([]);
  const [myVotes, setMyVotes] = useState<Record<string, "yes" | "no">>({});
  const [timerSeconds, setTimerSeconds] = useState(GAME_PICKER_TIMEOUT_SECONDS);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [mostVotedGame, setMostVotedGame] = useState<string | null>(null);
  const [confirmedGame, setConfirmedGame] = useState<string | null>(null);
  const [confirmedGameSessionId, setConfirmedGameSessionId] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);

  // Get filtered games
  const filteredGames = initialGames.length > 0
    ? initialGames
    : getGamesForPlayerCount(playerCount);

  const currentGame = filteredGames[currentCardIndex];

  // ---- Timer ----
  useEffect(() => {
    if (phase !== "voting") return;

    timerRef.current = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          // Timeout!
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase]);

  // Handle timeout
  useEffect(() => {
    if (timerSeconds !== 0 || phase !== "voting") return;

    // Determine most-voted game from current votes
    const mostVoted = findMostVotedGame(votes);
    setMostVotedGame(mostVoted);

    if (mostVoted) {
      setPhase("timeout");
    } else {
      setPhase("no_matches");
    }
  }, [timerSeconds, phase, votes]);

  // ---- Handlers ----
  const handleMatch = useCallback((result: MatchResult) => {
    setMatchResult(result);
    setPhase("matched");
    setConfirmedGame(result.gameType ?? null);
    setConfirmedGameSessionId(result.gameSessionId ?? null);
  }, []);

  // ---- Realtime subscription ----
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel(`room:${roomId}`);

    // Listen for vote updates
    channel.on(
      "broadcast",
      { event: "vote_updated" },
      (payload) => {
        const data = payload as unknown as {
          allVotes: VoteData[];
          matchResult?: MatchResult;
        };
        if (data.allVotes) {
          setVotes(data.allVotes);
        }
        if (data.matchResult?.matched) {
          handleMatch(data.matchResult);
        }
      }
    );

    // Listen for mutual match
    channel.on(
      "broadcast",
      { event: "mutual_match" },
      (payload) => {
        handleMatch(payload as unknown as MatchResult);
      }
    );

    // Listen for host confirmation
    channel.on(
      "broadcast",
      { event: "host_confirmed_game" },
      (payload) => {
        const data = payload as unknown as {
          gameType: string;
          gameSessionId: string;
          celebration: string;
        };
        setConfirmedGame(data.gameType);
        setConfirmedGameSessionId(data.gameSessionId);
        setPhase("confirmed");
      }
    );

    // Listen for picker opened (for non-host players)
    channel.on(
      "broadcast",
      { event: "game_picker_opened" },
      () => {
        // Picker is already shown, reset state
        setPhase("voting");
        setCurrentCardIndex(0);
        setTimerSeconds(GAME_PICKER_TIMEOUT_SECONDS);
        setMyVotes({});
        setMatchResult(null);
        setMostVotedGame(null);
        setConfirmedGame(null);
        setConfirmedGameSessionId(null);
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
  }, [roomId, handleMatch]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleSwipeRight = useCallback(async () => {
    if (!currentGame || myVotes[currentGame.id]) return;

    // Mark locally
    setMyVotes((prev) => ({ ...prev, [currentGame.id]: "yes" }));

    // Send vote to API
    try {
      const res = await fetch("/api/games/picker/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomCode,
          gameType: currentGame.id,
          vote: "yes",
        }),
      });

      const data = await res.json();

      if (data.match) {
        handleMatch({
          matched: true,
          gameType: data.match.gameType,
          gameSessionId: data.match.gameSessionId,
          celebration: data.match.celebration,
        });
      }

      if (data.allVotes) {
        setVotes(data.allVotes);
      }
    } catch (err) {
      console.error("Failed to submit vote:", err);
    }

    // Advance to next card
    if (currentCardIndex < filteredGames.length - 1) {
      setCurrentCardIndex((prev) => prev + 1);
    }
  }, [currentGame, myVotes, roomCode, currentCardIndex, filteredGames.length, handleMatch]);

  const handleSwipeLeft = useCallback(async () => {
    if (!currentGame || myVotes[currentGame.id]) return;

    // Mark locally
    setMyVotes((prev) => ({ ...prev, [currentGame.id]: "no" }));

    // Send vote to API
    try {
      const res = await fetch("/api/games/picker/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomCode,
          gameType: currentGame.id,
          vote: "no",
        }),
      });

      const data = await res.json();

      if (data.allVotes) {
        setVotes(data.allVotes);
      }
    } catch (err) {
      console.error("Failed to submit vote:", err);
    }

    // Advance to next card
    if (currentCardIndex < filteredGames.length - 1) {
      setCurrentCardIndex((prev) => prev + 1);
    }
  }, [currentGame, myVotes, roomCode, currentCardIndex, filteredGames.length]);

  const handleHostConfirm = useCallback(async () => {
    if (!mostVotedGame) return;

    try {
      const res = await fetch("/api/games/picker/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomCode,
          gameType: mostVotedGame,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setConfirmedGame(mostVotedGame);
        setConfirmedGameSessionId(data.gameSessionId);
        setPhase("confirmed");
      }
    } catch (err) {
      console.error("Failed to confirm game:", err);
    }
  }, [mostVotedGame, roomCode]);

  const handleGoToGame = useCallback(() => {
    if (onGameStarted && confirmedGameSessionId) {
      onGameStarted(confirmedGameSessionId, confirmedGame ?? "uno");
    } else if (confirmedGameSessionId) {
      router.push(`/${roomCode}/game`);
    }
  }, [confirmedGameSessionId, confirmedGame, roomCode, onGameStarted, router]);

  // ---- Computed values for vote tallies ----
  const getYesVotes = (gameType: string) =>
    votes.filter((v) => v.game_type === gameType && v.vote === "yes").length;

  // ---- Render helpers ----

  // Celebration screen
  if (phase === "matched" && matchResult) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm p-4 animate-in fade-in duration-300">
        <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-6 text-center">
          <div className="animate-bounce text-6xl">
            {getGameById(matchResult.gameType ?? "")?.emoji ?? "🎉"}
          </div>
          <Sparkles className="h-12 w-12 text-yellow-400" />
          <h2 className="text-2xl font-bold">{matchResult.celebration}</h2>
          <p className="text-muted-foreground">
            Everyone agreed! Get ready to play.
          </p>
          <button
            onClick={handleGoToGame}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
          >
            <ThumbsUp className="h-5 w-5" />
            Let&apos;s Go!
          </button>
        </div>
      </div>
    );
  }

  // Confirmed screen (after host confirmation or match)
  if (phase === "confirmed") {
    const game = getGameById(confirmedGame ?? "");
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm p-4 animate-in fade-in duration-300">
        <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-6 text-center">
          <div className="text-6xl">{game?.emoji ?? "🎮"}</div>
          <Sparkles className="h-12 w-12 text-yellow-400" />
          <h2 className="text-2xl font-bold">
            Let&apos;s play {game?.name ?? confirmedGame}!
          </h2>
          <p className="text-muted-foreground">
            Game starting...
          </p>
          <button
            onClick={handleGoToGame}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
          >
            <ThumbsUp className="h-5 w-5" />
            Enter Game
          </button>
        </div>
      </div>
    );
  }

  // No matches screen
  if (phase === "no_matches") {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm p-4 animate-in fade-in duration-300">
        <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-6 text-center">
          <div className="text-6xl">😕</div>
          <h2 className="text-2xl font-bold">No matches yet</h2>
          <p className="text-muted-foreground">
            No one voted on any game. Let the host try again!
          </p>
          <button
            onClick={() => {
              setPhase("voting");
              setCurrentCardIndex(0);
              setTimerSeconds(GAME_PICKER_TIMEOUT_SECONDS);
              setMyVotes({});
              setMostVotedGame(null);
            }}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Timeout screen (most-voted game highlighted, host can confirm)
  if (phase === "timeout" || phase === "host_confirm") {
    const topGame = mostVotedGame ? getGameById(mostVotedGame) : null;
    const hasVotes = mostVotedGame !== null;

    if (!hasVotes) {
      // Shouldn't happen as we transition to no_matches, but handle gracefully
      return null;
    }

    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm p-4 animate-in fade-in duration-300">
        <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-6 text-center">
          <Timer className="h-8 w-8 text-muted-foreground" />
          <h2 className="text-xl font-bold">Time&apos;s up!</h2>

          {/* Most-voted game highlighted */}
          <div className="w-full rounded-xl border-2 border-primary bg-primary/5 p-6">
            <div className="text-5xl mb-3">{topGame?.emoji}</div>
            <h3 className="text-lg font-bold">{topGame?.name}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Most voted game
            </p>
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              <ThumbsUp className="h-3.5 w-3.5" />
              {getYesVotes(mostVotedGame!)} / {playerCount} players
            </div>
          </div>

          {isHost ? (
            <button
              onClick={handleHostConfirm}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
            >
              <Check className="h-5 w-5" />
              Start {topGame?.name ?? "Game"}
            </button>
          ) : (
            <p className="text-sm text-muted-foreground">
              Waiting for host to start the game...
            </p>
          )}
        </div>
      </div>
    );
  }

  // Voting phase
  if (!currentGame && filteredGames.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm p-4">
        <p className="text-muted-foreground">No games available for {playerCount} players.</p>
      </div>
    );
  }

  if (!currentGame) {
    // All games voted on, waiting for others
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm p-4">
        <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-4 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Waiting for other players...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur-sm animate-in fade-in duration-300">
      {/* Header: Timer + Progress */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Timer className="h-4 w-4 text-muted-foreground" />
          <span
            className={`text-sm font-bold tabular-nums ${
              timerSeconds <= 10 ? "text-red-500" : "text-foreground"
            }`}
          >
            {timerSeconds}s
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>
            {currentCardIndex + 1} / {filteredGames.length}
          </span>
        </div>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>{playerCount}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 w-full bg-muted">
        <div
          className="h-full bg-primary transition-all duration-1000"
          style={{ width: `${(timerSeconds / GAME_PICKER_TIMEOUT_SECONDS) * 100}%` }}
        />
      </div>

      {/* Game cards area */}
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <SwipeableCard
            key={currentGame.id}
            onSwipeRight={handleSwipeRight}
            onSwipeLeft={handleSwipeLeft}
            disabled={!!myVotes[currentGame.id]}
          >
            <div
              className={`rounded-xl border-2 p-6 text-center transition-colors ${
                myVotes[currentGame.id] === "yes"
                  ? "border-green-500 bg-green-50 dark:bg-green-950/20"
                  : myVotes[currentGame.id] === "no"
                  ? "border-red-300 bg-red-50 dark:bg-red-950/20 opacity-60"
                  : "border-border bg-card shadow-lg"
              }`}
            >
              {/* Emoji */}
              <div className="text-6xl mb-4">{currentGame.emoji}</div>

              {/* Game name */}
              <h2 className="text-xl font-bold mb-3">{currentGame.name}</h2>

              {/* Details */}
              <div className="flex flex-col gap-2 text-sm text-muted-foreground mb-4">
                <div className="flex items-center justify-center gap-1.5">
                  <Users className="h-4 w-4" />
                  <span>
                    {currentGame.minPlayers}–{currentGame.maxPlayers} players
                  </span>
                </div>
                <div className="flex items-center justify-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  <span>{currentGame.estimatedTime}</span>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-muted-foreground mb-4">
                {currentGame.description}
              </p>

              {/* Vote status */}
              {myVotes[currentGame.id] && (
                <div
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${
                    myVotes[currentGame.id] === "yes"
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  }`}
                >
                  {myVotes[currentGame.id] === "yes" ? (
                    <>
                      <ThumbsUp className="h-3.5 w-3.5" />
                      Want to play
                    </>
                  ) : (
                    <>
                      <X className="h-3.5 w-3.5" />
                      Skipped
                    </>
                  )}
                </div>
              )}

              {/* Vote tally */}
              {votes.length > 0 && (
                <div className="mt-3 flex items-center justify-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <ThumbsUp className="h-3 w-3 text-green-500" />
                    {getYesVotes(currentGame.id)} want to play
                  </span>
                  <span className="flex items-center gap-1">
                    <X className="h-3 w-3 text-red-400" />
                    {votes.filter((v) => v.game_type === currentGame.id && v.vote === "no").length} skipped
                  </span>
                </div>
              )}
            </div>
          </SwipeableCard>

          {/* Swipe hints */}
          {!myVotes[currentGame.id] && (
            <div className="mt-4 flex items-center justify-between px-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                ← Skip
              </span>
              <span>Swipe to vote</span>
              <span className="flex items-center gap-1">
                Want to play →
              </span>
            </div>
          )}

          {/* Action buttons for non-touch */}
          {!myVotes[currentGame.id] && (
            <div className="mt-3 flex gap-3">
              <button
                onClick={handleSwipeLeft}
                className="flex h-12 flex-1 items-center justify-center gap-2 rounded-lg border border-red-300 bg-red-50 text-sm font-medium text-red-700 transition-colors hover:bg-red-100 dark:border-red-800 dark:bg-red-950/20 dark:text-red-400"
              >
                <X className="h-5 w-5" />
                Skip
              </button>
              <button
                onClick={handleSwipeRight}
                className="flex h-12 flex-1 items-center justify-center gap-2 rounded-lg border border-green-500 bg-green-50 text-sm font-medium text-green-700 transition-colors hover:bg-green-100 dark:border-green-800 dark:bg-green-950/20 dark:text-green-400"
              >
                <ThumbsUp className="h-5 w-5" />
                Play
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
