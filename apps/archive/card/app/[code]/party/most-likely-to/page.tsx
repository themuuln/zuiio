"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QuestionDisplay } from "@/components/party-game/question-display";
import { GameHeader } from "@/components/party-game/game-header";
import { VotingArea } from "@/components/party-game/voting-area";
import { GameOverScreen } from "@/components/party-game/game-over-screen";
import { ReconnectingBanner } from "@/components/reconnecting-banner";
import type { PlayerInfo as VotingPlayerInfo } from "@/components/party-game/voting-area";
import { determineMostLikelyToWinners } from "@/lib/party-engine";
import { PARTY_GAME_REVEAL_DELAY_SECONDS } from "@/lib/constants";
import type { PartyGameState } from "@/lib/party-engine";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

type PagePhase =
  | { status: "loading" }
  | { status: "initializing" }
  | { status: "playing"; state: PartyGameState }
  | { status: "error"; message: string };

interface PlayerInfo {
  id: string;
  displayName: string;
  avatarEmoji: string;
  isHost: boolean;
  isSpectator: boolean;
}

// ──────────────────────────────────────────────
// Utility Functions
// ──────────────────────────────────────────────

async function getGameSessionId(code: string): Promise<string | null> {
  try {
    const res = await fetch(`/api/rooms/${code}`);
    if (!res.ok) return null;
    const room = await res.json();
    return room.current_game_id ?? null;
  } catch {
    return null;
  }
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
// Most Likely To Reveal
// ──────────────────────────────────────────────

interface MLTRevealProps {
  open: boolean;
  winners: string[];
  voteCounts: Record<string, number>;
  isTie: boolean;
  currentPlayerId?: string;
  playerNames: Record<string, string>;
  onComplete: () => void;
}

function MLTReveal({
  open,
  winners,
  voteCounts,
  isTie,
  currentPlayerId,
  playerNames,
  onComplete,
}: MLTRevealProps) {
  const [phase, setPhase] = useState<"countdown" | "results">("countdown");
  const [countdownStep, setCountdownStep] = useState(3);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reset when overlay opens
  useEffect(() => {
    if (!open) {
      if (countdownRef.current) clearInterval(countdownRef.current);
      if (timerRef.current) clearTimeout(timerRef.current);
      setPhase("countdown");
      setCountdownStep(3);
      return;
    }

    setPhase("countdown");
    setCountdownStep(3);

    // Run countdown
    const intervalMs = (PARTY_GAME_REVEAL_DELAY_SECONDS / 3) * 1000;

    countdownRef.current = setInterval(() => {
      setCountdownStep((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          setPhase("results");
          return 0;
        }
        return next;
      });
    }, intervalMs);

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [open]);

  if (!open) return null;

  const countdownEmojis: Record<number, string> = {
    3: "🟢",
    2: "🟠",
    1: "🔴",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 p-4 sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-label="Most Likely To reveal"
    >
      {/* ── Countdown Phase ── */}
      {phase === "countdown" && countdownStep > 0 && (
        <div className="flex flex-col items-center justify-center gap-4 transition-all duration-300 scale-100 opacity-100">
          <span className="text-7xl sm:text-8xl" aria-hidden="true">
            {countdownEmojis[countdownStep] ?? "✨"}
          </span>
          <p className="text-2xl font-bold sm:text-3xl">{countdownStep}</p>
          <p className="text-base text-muted-foreground sm:text-lg">
            {countdownStep === 3 ? "Ready..." : countdownStep === 2 ? "Steady..." : "Reveal!"}
          </p>
        </div>
      )}

      {/* ── Results Phase ── */}
      {phase === "results" && (
        <div className="flex w-full max-w-md flex-col items-center gap-6">
          <h2 className="text-2xl font-bold sm:text-3xl">
            {isTie ? "It's a Tie! 🤝" : "The Results 🎯"}
          </h2>

          {winners.length > 0 ? (
            <div className="flex flex-col gap-4 w-full">
              {/* Winner(s) highlighted */}
              {winners.map((winnerId) => {
                const isCurrentPlayer = winnerId === currentPlayerId;
                const voteCount = voteCounts[winnerId] ?? 0;

                return (
                  <div
                    key={winnerId}
                    className={cn(
                      "w-full rounded-xl border-2 p-6 text-center transition-all duration-500 animate-in zoom-in-50",
                      isCurrentPlayer
                        ? "border-yellow-400 bg-yellow-900/30 shadow-lg shadow-yellow-500/20"
                        : "border-primary/50 bg-card"
                    )}
                  >
                    {/* Winner animation */}
                    <div className="flex flex-col items-center gap-3">
                      <span className="text-5xl animate-bounce" aria-hidden="true">
                        {isTie ? "🏆" : "👑"}
                      </span>

                      {/* Winner name */}
                      <h3 className="text-xl font-bold sm:text-2xl">
                        {playerNames[winnerId] ?? winnerId}
                        {isCurrentPlayer && " (You)"}
                      </h3>

                      {/* Vote count badge */}
                      <Badge
                        variant="secondary"
                        className="text-base px-4 py-1.5"
                      >
                        {voteCount} {voteCount === 1 ? "vote" : "votes"}
                      </Badge>

                      {/* Voters (anonymous count) */}
                      <p className="text-sm text-muted-foreground">
                        {voteCount} of {Object.values(voteCounts).reduce((a, b) => a + b, 0)} players voted for
                        {" "}{isCurrentPlayer ? "you" : "them"}
                      </p>
                    </div>
                  </div>
                );
              })}

              {/* Show all vote counts */}
              {Object.entries(voteCounts)
                .filter(([id]) => !winners.includes(id))
                .length > 0 && (
                <div className="w-full rounded-xl border bg-muted/50 p-4">
                  <p className="mb-2 text-sm font-medium text-muted-foreground">
                    Other votes:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(voteCounts)
                      .filter(([id]) => !winners.includes(id))
                      .sort(([, a], [, b]) => b - a)
                      .map(([id, count]) => (
                        <Badge key={id} variant="outline" className="text-xs">
                          {playerNames[id] ?? id}: {count} {count === 1 ? "vote" : "votes"}
                        </Badge>
                      ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-white/70">No votes were cast this round.</p>
          )}

          {/* Continue button */}
          <Button
            onClick={onComplete}
            size="lg"
            className="mt-2 min-h-[48px] min-w-[48px] text-base font-semibold"
          >
            Continue
          </Button>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// Most Likely To Drinking Phase
// ──────────────────────────────────────────────

interface MLTDrinkingPhaseProps {
  winners: string[];
  player: PlayerInfo | null;
  onAdvanceToNext: () => void;
}

function MLTDrinkingPhase({
  winners,
  player,
  onAdvanceToNext,
}: MLTDrinkingPhaseProps) {
  const isPlayerWinner = player ? winners.includes(player.id) : false;

  // If no winners (no votes), show a neutral message
  if (winners.length === 0) {
    return (
      <div className="flex w-full max-w-md flex-col items-center gap-6">
        <div className="w-full rounded-xl border bg-muted p-6 text-center">
          <span className="text-4xl" aria-hidden="true">📭</span>
          <p className="mt-3 text-lg font-semibold">No votes this round.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Everyone skipped or no responses.
          </p>
          <Button
            onClick={onAdvanceToNext}
            size="lg"
            className="mt-4 min-h-[48px] min-w-[48px] w-full text-base font-semibold"
          >
            Continue
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-6">
      {/* Who was voted */}
      <div className="w-full rounded-xl border bg-card p-4 text-center">
        <p className="text-lg font-semibold">
          Most Likely To:{" "}
          {winners.map((w, i) => (
            <span key={w}>
              {i > 0 && " & "}
              {w === player?.id ? "You" : (winners.length > 1 ? "them" : "them")}
            </span>
          ))}
        </p>
      </div>

      {/* Winner(s) drink prompt */}
      {isPlayerWinner && (
        <div className="w-full rounded-xl border border-red-500/30 bg-red-900/20 p-6 text-center animate-in zoom-in-50 duration-300">
          <span className="text-5xl" aria-hidden="true">
            {winners.length > 1 ? "🍻" : "🍺"}
          </span>
          <p className="mt-3 text-lg font-semibold text-red-300">
            You&apos;re Most Likely To... take a sip!
          </p>
          <p className="mt-1 text-sm text-red-400/70">
            Honor system — we trust you!
          </p>
          <Button
            onClick={onAdvanceToNext}
            size="lg"
            className="mt-4 min-h-[48px] min-w-[48px] w-full text-base font-semibold"
            variant="secondary"
          >
            Done — took a sip
          </Button>
        </div>
      )}

      {/* Non-winner: safe message */}
      {!isPlayerWinner && player && (
        <div className="w-full rounded-xl border border-green-500/30 bg-green-900/20 p-6 text-center">
          <span className="text-4xl" aria-hidden="true">🟢</span>
          <p className="mt-3 text-lg font-semibold text-green-300">
            You&apos;re safe!
          </p>
          <p className="mt-1 text-sm text-green-400/70">
            You weren&apos;t voted Most Likely To
          </p>
          <Button
            onClick={onAdvanceToNext}
            size="lg"
            className="mt-4 min-h-[48px] min-w-[48px] w-full text-base font-semibold"
          >
            Continue
          </Button>
        </div>
      )}

      {/* Spectator */}
      {!player && (
        <div className="w-full rounded-xl border bg-muted p-6 text-center">
          <span className="text-4xl" aria-hidden="true">👀</span>
          <p className="mt-3 text-lg font-semibold">Watching the results...</p>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// Vote tally indicator
// ──────────────────────────────────────────────

function VoteTally({
  responseCount,
  totalPlayers,
  isHost,
  onReveal,
}: {
  responseCount: number;
  totalPlayers: number;
  isHost: boolean;
  onReveal: () => void;
}) {
  const allResponded = responseCount >= totalPlayers;

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="rounded-xl border bg-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Votes: {responseCount} / {totalPlayers}
            </span>
            {allResponded && (
              <span className="text-sm" aria-hidden="true">✅</span>
            )}
          </div>
          {allResponded && isHost && (
            <Button
              onClick={onReveal}
              size="sm"
              className="min-h-[40px] text-sm font-semibold"
            >
              Reveal
            </Button>
          )}
        </div>
        {/* Progress bar */}
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{
              width: `${totalPlayers > 0 ? (responseCount / totalPlayers) * 100 : 0}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Main Page
// ──────────────────────────────────────────────

export default function MostLikelyToPage() {
  const params = useParams();
  const router = useRouter();
  const code = (params.code as string).toUpperCase();
  const [pagePhase, setPagePhase] = useState<PagePhase>({
    status: "loading",
  });
  const [player, setPlayer] = useState<PlayerInfo | null>(null);
  const [players, setPlayers] = useState<PlayerInfo[]>([]);
  const [myResponse, setMyResponse] = useState<string | null>(null);
  const [winners, setWinners] = useState<string[]>([]);
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({});
  const [isTie, setIsTie] = useState(false);
  const [showReveal, setShowReveal] = useState(false);
  const [inDrinkingPhase, setInDrinkingPhase] = useState(false);
  const [endReason, setEndReason] = useState<"host_ended" | "content_exhausted" | "room_expired" | "player_left" | undefined>(undefined);
  const [roomExpired, setRoomExpired] = useState(false);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [roundsPlayed, setRoundsPlayed] = useState(0);
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const expiryCheckRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── Fetch player info on mount ───
  useEffect(() => {
    getPlayerInfo(code).then((p) => {
      if (p) {
        setPlayer(p);
      }
    });
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

  // ─── Build votable players (exclude self) ───
  const votablePlayers: VotingPlayerInfo[] = players
    .filter((p) => !player || p.id !== player.id)
    .map((p) => ({
      id: p.id,
      name: p.displayName,
      emoji: p.avatarEmoji,
    }));

  // ─── Initialize game ───
  const initializeGame = useCallback(async () => {
    try {
      setPagePhase({ status: "loading" });

      const gameSessionId = await getGameSessionId(code);

      if (!gameSessionId) {
        setPagePhase({
          status: "error",
          message:
            "No active game session found. Please start a game from the lobby.",
        });
        return;
      }

      const stateRes = await fetch(`/api/games/${gameSessionId}`);
      if (!stateRes.ok) {
        setPagePhase({
          status: "error",
          message: "Failed to load game state.",
        });
        return;
      }

      const stateData = await stateRes.json();

      if (!stateData.isPartyGame || !stateData.state) {
        const createRes = await fetch(
          `/api/games/${gameSessionId}/party/create`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              gameType: "most-likely-to",
            }),
          }
        );

        if (!createRes.ok) {
          const err = await createRes.json();
          setPagePhase({
            status: "error",
            message: err.error ?? "Failed to start game.",
          });
          return;
        }

        const createData = await createRes.json();
        setPagePhase({ status: "playing", state: createData.state });

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

  // ─── Subscribe to Realtime ───
  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    async function init() {
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

      const channel = supabase.channel(`room:${room.id}`);

      channel.on("broadcast", { event: "card:show" }, (payload) => {
        const data = payload as unknown as {
          state: PartyGameState;
          players?: Array<Record<string, unknown>>;
        };
        if (data.state) {
          setPagePhase({ status: "playing", state: data.state });
          setMyResponse(null);
          setShowReveal(false);
          setInDrinkingPhase(false);
          setWinners([]);
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
        const data = payload as unknown as {
          reveal?: {
            counts: Record<string, number>;
            breakdown: Array<{
              value: string;
              players: Array<{ playerId: string; playerName: string }>;
              count: number;
            }>;
            totalResponses: number;
          };
          counts?: Record<string, number>;
          breakdown?: Array<{
            value: string;
            players: Array<{ playerId: string; playerName: string }>;
            count: number;
          }>;
          totalResponses?: number;
          state: PartyGameState;
        };
        // Support both old (party:reveal) and new (reveal:results) payload shapes
        if ((data.reveal || (data.counts && data.state)) && data.state) {
          setPagePhase({ status: "playing", state: data.state });

          // Compute winners from the reveal data
          const mlResult = determineMostLikelyToWinners(data.state.responses);
          setWinners(mlResult.winners);
          setVoteCounts(mlResult.voteCounts);
          setIsTie(mlResult.isTie);
          setShowReveal(true);
          setInDrinkingPhase(false);
        }
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
          setMyResponse(null);
          setShowReveal(false);
          setInDrinkingPhase(false);
          setWinners([]);
          setRoundsPlayed(0);
          setPagePhase({ status: "playing", state: data.state });
        }
      });

      channel.on("broadcast", { event: "player_left" }, async (payload) => {
        const data = payload as unknown as { playerId: string; playerName: string };
        if (data.playerId) {
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

      await initializeGame();
      await fetchPlayers();

      // Poll for state changes as fallback
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
                  if (
                    prev.state.phase !== data.state.phase ||
                    prev.state.currentCard?.id !==
                      data.state.currentCard?.id ||
                    prev.state.roundNumber !== data.state.roundNumber ||
                    prev.state.responses.length !==
                      data.state.responses.length
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
      }, 30000);
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

  // ─── Handle player response ───
  const handleRespond = useCallback(
    async (value: string) => {
      if (pagePhase.status !== "playing") return;
      const state = pagePhase.state;
      const gameSessionId = state.gameSessionId;

      setMyResponse(value);

      try {
        const res = await fetch(
          `/api/games/${gameSessionId}/party/respond`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              playerId: player?.id,
              playerName: player?.displayName,
              value,
            }),
          }
        );

        if (!res.ok) {
          const err = await res.json();
          console.error("Failed to vote:", err.error);
          setMyResponse(null);
        }
      } catch (err) {
        console.error("Failed to vote:", err);
        setMyResponse(null);
      }
    },
    [pagePhase, player]
  );

  // ─── Host: trigger reveal ───
  const handleReveal = useCallback(async () => {
    if (pagePhase.status !== "playing") return;
    const state = pagePhase.state;
    const gameSessionId = state.gameSessionId;

    try {
      const res = await fetch(
        `/api/games/${gameSessionId}/party/reveal`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!res.ok) {
        const err = await res.json();
        console.error("Failed to reveal:", err.error);
      }
    } catch (err) {
      console.error("Failed to reveal:", err);
    }
  }, [pagePhase]);

  // ─── Handle reveal complete → drinking phase ───
  const handleRevealComplete = useCallback(async () => {
    if (pagePhase.status !== "playing") return;

    setShowReveal(false);
    // subPhase set to "drinking"
    setInDrinkingPhase(true);
  }, [pagePhase]);

  // ─── Advance to next round ───
  const handleAdvanceToNext = useCallback(async () => {
    if (pagePhase.status !== "playing") return;
    const state = pagePhase.state;
    const gameSessionId = state.gameSessionId;

    setInDrinkingPhase(false);
    // subPhase set to "done"
    setWinners([]);

    try {
      await fetch(`/api/games/${gameSessionId}/party/next-card`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      console.error("Failed to advance:", err);
    }
  }, [pagePhase]);

  // ─── Skip card ───
  const handleSkip = useCallback(async () => {
    if (pagePhase.status !== "playing") return;
    const state = pagePhase.state;
    const gameSessionId = state.gameSessionId;

    try {
      await fetch(`/api/games/${gameSessionId}/party/skip`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      console.error("Failed to skip:", err);
    }
  }, [pagePhase]);

  // ─── End game ───
  const handleEndGame = useCallback(async () => {
    if (pagePhase.status !== "playing") return;
    const state = pagePhase.state;
    const gameSessionId = state.gameSessionId;

    try {
      await fetch(`/api/games/${gameSessionId}/party/end`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      console.error("Failed to end game:", err);
    }
  }, [pagePhase]);

  // ─── Render loading state ───
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

  // ─── Render error state ───
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

  // ─── Main game render ───
  const state = pagePhase.state;
  const isHost = player?.isHost ?? false;
  const isSpectator = player?.isSpectator ?? false;
  const hasCard = state.currentCard !== null;
  const responseCount = state.responses.length;
  const totalPlayers = players.length;
  const canVote =
    (state.phase === "show-card" || state.phase === "responding") &&
    !isSpectator &&
    myResponse === null;

  // Player names map
  const playerNamesMap = Object.fromEntries(
    players.map((p) => [p.id, p.displayName])
  );

  const effectiveEndReason = roomExpired ? "room_expired" : endReason;

  return (
    <div className="flex min-h-screen flex-col">
      <ReconnectingBanner
        connectionId={code}
        onReconnected={() => {
          initializeGame();
        }}
      />
      {/* Game Header */}
      <GameHeader
        roundNumber={state.roundNumber}
        timerSeconds={state.timerSeconds}
        timerDuration={state.config.timerSeconds}
        gameType="Most Likely To"
        drinkCounts={{}}
        currentPlayerId={player?.id}
        playerNames={playerNamesMap}
      />

      {/* Main game area */}
      <div className="flex flex-1 flex-col items-center gap-6 px-4 pb-8 pt-4">
        {/* ── SHOW CARD + RESPONDING Phase ── */}
        {(state.phase === "show-card" || state.phase === "responding") &&
          hasCard && (
            <div className="flex w-full max-w-md flex-col items-center gap-6">
              {/* Question/Card Display */}
              <QuestionDisplay
                card={state.currentCard}
                suspense={true}
              />

              {/* Player picker (self excluded) */}
              {!isSpectator && (
                <VotingArea
                  gameType="most-likely-to"
                  canVote={canVote}
                  disabled={!canVote}
                  currentSelection={myResponse}
                  players={votablePlayers}
                  allowSelfVote={false}
                  onSelect={handleRespond}
                />
              )}

              {/* Spectator */}
              {isSpectator && (
                <div className="flex items-center justify-center gap-2 rounded-lg bg-muted p-4 text-sm text-muted-foreground w-full max-w-md">
                  <span className="animate-pulse text-lg" aria-hidden="true">👀</span>
                  <span>Watching the game...</span>
                </div>
              )}

              {/* Vote tally + reveal button */}
              <VoteTally
                responseCount={responseCount}
                totalPlayers={totalPlayers}
                isHost={isHost}
                onReveal={handleReveal}
              />

              {/* Host controls */}
              {isHost && (
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSkip}
                  >
                    Skip Card
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEndGame}
                  >
                    End Game
                  </Button>
                </div>
              )}
            </div>
          )}

        {/* ── REVEAL Phase ── */}
        {(state.phase === "revealing" || showReveal) && (
          <MLTReveal
            open={showReveal}
            winners={winners}
            voteCounts={voteCounts}
            isTie={isTie}
            currentPlayerId={player?.id}
            playerNames={playerNamesMap}
            onComplete={handleRevealComplete}
          />
        )}

        {/* ── DRINKING Phase ── */}
        {(state.phase === "drinking" || inDrinkingPhase) && !showReveal && (
          <MLTDrinkingPhase
            winners={winners}
            player={player}
            onAdvanceToNext={handleAdvanceToNext}
          />
        )}

        {/* ── NEXT ROUND Phase ── */}
        {state.phase === "next-round" && !inDrinkingPhase && !showReveal && (
          <div className="flex flex-col items-center gap-4">
            <span className="text-3xl" aria-hidden="true">🔄</span>
            <p className="text-lg text-muted-foreground">
              Starting next round...
            </p>
            {isHost && (
              <Button
                onClick={handleAdvanceToNext}
                size="lg"
                className="min-h-[48px] min-w-[48px]"
              >
                Next Card
              </Button>
            )}
          </div>
        )}

        {/* ── GAME END / Room Expired Phase ── */}
        {(state.phase === "game-end" || effectiveEndReason === "room_expired") && (
          <div className="flex w-full max-w-md flex-col items-center pt-8">
            <GameOverScreen
              gameState={state}
              code={code}
              gameName="Most Likely To"
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

        {/* ── Empty state ── */}
        {state.phase === "show-card" && !hasCard && (
          <div className="flex flex-col items-center gap-4 text-center">
            <span className="text-6xl" aria-hidden="true">🃏</span>
            <h2 className="text-xl font-bold">
              Round {state.roundNumber}
            </h2>
            <p className="text-muted-foreground">
              Getting the next question...
            </p>
            {isHost && (
              <Button onClick={handleSkip} size="lg">
                Start Round
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
