"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const TIMEOUT_SECONDS = 60;
import {
  Layers,
  AlertTriangle,
  Clock,
  LogOut,
  Pause,
  Play,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { type Card as CardType, type CardColor } from "@/lib/game-engine/types";
import type { GameState } from "@/lib/game-engine/types";
import { DiscardPileCard } from "./card";
import { CardHand } from "./card-hand";
import { ColorPickerModal } from "./color-picker-modal";
import { ReconnectingBanner } from "@/components/reconnecting-banner";
import { cn } from "@/lib/utils";

interface PlayerInfo {
  id: string;
  displayName: string;
  avatarEmoji: string;
  isHost: boolean;
  cardCount?: number;
}

interface GameBoardProps {
  gameSessionId: string;
  currentPlayerId: string;
  players: PlayerInfo[];
  initialHand: CardType[];
  initialGameState: GameState;
  roomCode: string;
  roomId: string;
  isSpectator?: boolean;
  onGameStateChange?: (gameState: GameState) => void;
}

/**
 * Main UNO game board component.
 * Shows the turn indicator, discard pile, opponent hands, player hand, and controls.
 */
export function GameBoard({
  gameSessionId,
  currentPlayerId,
  players,
  initialHand,
  initialGameState,
  roomCode,
  roomId,
  isSpectator = false,
  onGameStateChange,
}: GameBoardProps) {
  const router = useRouter();

  // Game state
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const [myHand, setMyHand] = useState<CardType[]>(initialHand);
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);
  const [shakeCardIndex, setShakeCardIndex] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [drawCardAnimation, setDrawCardAnimation] = useState(false);

  // Turn indicator
  const [yourTurnBanner, setYourTurnBanner] = useState(false);
  const [turnPulse, setTurnPulse] = useState(false);

  // Color picker
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [pendingCardIndex, setPendingCardIndex] = useState<number | null>(null);

  // UNO call / catch (derived from game state)

  // Countdown timer
  const [timeRemaining, setTimeRemaining] = useState<number>(60);

  // End session state
  const [showEndSessionConfirm, setShowEndSessionConfirm] = useState(false);
  const [endSessionLoading, setEndSessionLoading] = useState(false);

  // Pause/resume state
  const [pauseLoading, setPauseLoading] = useState(false);

  // Refs
  const bannerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Current player info
  const currentPlayerIndex = gameState.currentPlayerIndex;
  const currentTurnPlayerId = gameState.players[currentPlayerIndex]?.playerId;
  const currentTurnPlayer = players.find((p) => p.id === currentTurnPlayerId);
  const isMyTurn = currentTurnPlayerId === currentPlayerId;
  const amIHost = players.find((p) => p.id === currentPlayerId)?.isHost ?? false;
  const topDiscard = gameState.discardPile[gameState.discardPile.length - 1];

  // Determine which cards are playable
  const getPlayableCardIndices = useCallback((): number[] => {
    if (!isMyTurn || isSpectator) return [];
    return myHand
      .map((card, index) => {
        const top = gameState.discardPile[gameState.discardPile.length - 1];
        if (!top) return null;
        // Wild cards are always playable
        if (card.value === "wild" || card.value === "wild4") return index;
        // Match color or value
        if (card.color === gameState.currentColor) return index;
        if (card.value === top.value) return index;
        return null;
      })
      .filter((i): i is number => i !== null);
  }, [isMyTurn, myHand, gameState, isSpectator]);

  const playableIndices = getPlayableCardIndices();

  // Your turn banner effect
  useEffect(() => {
    if (isMyTurn && !isSpectator) {
      setYourTurnBanner(true);
      setTurnPulse(true);

      // Auto-hide banner after 3 seconds
      if (bannerTimeoutRef.current) clearTimeout(bannerTimeoutRef.current);
      bannerTimeoutRef.current = setTimeout(() => {
        setYourTurnBanner(false);
      }, 3000);

      // Haptic feedback (vibrate) for mobile
      if (navigator.vibrate) {
        navigator.vibrate(200);
      }
    } else {
      setTurnPulse(false);
    }

    return () => {
      if (bannerTimeoutRef.current) clearTimeout(bannerTimeoutRef.current);
    };
  }, [isMyTurn, isSpectator]);

  // Countdown timer for turn timeout
  useEffect(() => {
    // Clear any existing interval
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (isSpectator) return;

    // Calculate remaining time from turnStartTime
    const updateTimer = () => {
      const now = Date.now();
      const turnStart = gameState.turnStartTime;
      const elapsed = Math.floor((now - turnStart) / 1000);
      const remaining = Math.max(0, 60 - elapsed);
      setTimeRemaining(remaining);

      if (remaining <= 0 && timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };

    // Update immediately
    updateTimer();

    // Update every second
    timerIntervalRef.current = setInterval(updateTimer, 1000);

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [gameState.turnStartTime, gameState.currentPlayerIndex, isSpectator]);

  // Error auto-clear
  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  // Store playCardAction in a ref so it can be used by other callbacks without deps issues
  const playCardActionRef = useRef<((index: number, chosenColor?: CardColor) => Promise<void>) | null>(null);

  const playCardAction = useCallback(
    async (index: number, chosenColor?: CardColor) => {
      setActionInProgress(true);
      setErrorMessage(null);

      try {
        const res = await fetch(`/api/games/${gameSessionId}/actions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "play_card",
            playerId: currentPlayerId,
            cardIndex: index,
            chosenColor,
            gameState,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          setErrorMessage(data.error ?? "Failed to play card");
          setShakeCardIndex(index);
          setTimeout(() => setShakeCardIndex(null), 300);
          return;
        }

        // Update game state
        const newState = data.gameState as GameState;
        setGameState(newState);

        // Update my hand (remove played card)
        const newHand = [...myHand];
        newHand.splice(index, 1);
        setMyHand(newHand);

        setSelectedCardIndex(null);

        // Notify parent
        onGameStateChange?.(newState);

        // Check win condition
        if (newState.status === "round_end" || newState.status === "game_end") {
          // For now, navigate to scores page (placeholder)
          setTimeout(() => {
            router.push(`/${roomCode}/scores`);
          }, 1500);
        }
      } catch (err) {
        console.error("Failed to play card:", err);
        setErrorMessage("Connection error");
      } finally {
        setActionInProgress(false);
      }
    },
    [gameSessionId, currentPlayerId, gameState, myHand, onGameStateChange, router, roomCode]
  );

  // Keep the ref updated with the latest callback
  playCardActionRef.current = playCardAction;

  const handleCardClick = useCallback(
    (index: number) => {
      if (!isMyTurn || isSpectator || actionInProgress) {
        if (!isMyTurn) {
          setErrorMessage("Wait for your turn");
        }
        return;
      }

      const card = myHand[index];
      if (!card) return;

      // Check if card is playable
      const isPlayable =
        card.value === "wild" ||
        card.value === "wild4" ||
        card.color === gameState.currentColor ||
        card.value === gameState.discardPile[gameState.discardPile.length - 1]?.value;

      if (!isPlayable) {
        // Shake animation for invalid card
        setShakeCardIndex(index);
        setTimeout(() => setShakeCardIndex(null), 300);
        setErrorMessage("Invalid play");
        return;
      }

      // If it's a wild card, show color picker
      if (card.value === "wild" || card.value === "wild4") {
        setPendingCardIndex(index);
        setShowColorPicker(true);
        return;
      }

      // Play the card via ref
      playCardActionRef.current?.(index);
    },
    [isMyTurn, isSpectator, actionInProgress, myHand, gameState]
  );

  const handleColorSelected = useCallback(
    (color: CardColor) => {
      if (pendingCardIndex === null) return;
      setShowColorPicker(false);
      playCardActionRef.current?.(pendingCardIndex, color);
      setPendingCardIndex(null);
    },
    [pendingCardIndex]
  );

  const handleDrawCard = useCallback(async () => {
    if (!isMyTurn || isSpectator || actionInProgress) return;

    setActionInProgress(true);
    setDrawCardAnimation(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/games/${gameSessionId}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "draw_card",
          playerId: currentPlayerId,
          gameState,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error ?? "Failed to draw card");
        return;
      }

      // Update game state
      const newState = data.gameState as GameState;
      setGameState(newState);

      // Get the drawn card
      const myPlayer = newState.players.find(
        (p: { playerId: string }) => p.playerId === currentPlayerId
      );
      if (myPlayer) {
        setMyHand([...myPlayer.hand]);
      }

      setSelectedCardIndex(null);

      // Notify parent
      onGameStateChange?.(newState);
    } catch (err) {
      console.error("Failed to draw card:", err);
      setErrorMessage("Connection error");
    } finally {
      setActionInProgress(false);
      setTimeout(() => setDrawCardAnimation(false), 500);
    }
  }, [isMyTurn, isSpectator, actionInProgress, gameSessionId, currentPlayerId, gameState, onGameStateChange]);

  const handleCallUno = useCallback(async () => {
    if (isSpectator || actionInProgress) return;

    setActionInProgress(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/games/${gameSessionId}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "call_uno",
          playerId: currentPlayerId,
          gameState,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error ?? "Failed to call UNO");
        return;
      }

      const newState = data.gameState as GameState;
      setGameState(newState);

      // Update my hand
      const myPlayer = newState.players.find(
        (p: { playerId: string }) => p.playerId === currentPlayerId
      );
      if (myPlayer) {
        setMyHand([...myPlayer.hand]);
      }

      onGameStateChange?.(newState);
    } catch (err) {
      console.error("Failed to call UNO:", err);
      setErrorMessage("Connection error");
    } finally {
      setActionInProgress(false);
    }
  }, [gameSessionId, currentPlayerId, gameState, isSpectator, actionInProgress, onGameStateChange]);

  const handleCatchUno = useCallback(
    async (targetPlayerId: string) => {
      if (isSpectator || actionInProgress) return;

      setActionInProgress(true);
      setErrorMessage(null);

      try {
        const res = await fetch(`/api/games/${gameSessionId}/actions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "catch_uno",
            playerId: currentPlayerId,
            targetPlayerId,
            gameState,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          setErrorMessage(data.error ?? "Failed to catch UNO");
          return;
        }

        const newState = data.gameState as GameState;
        setGameState(newState);

        // Update my hand
        const myPlayer = newState.players.find(
          (p: { playerId: string }) => p.playerId === currentPlayerId
        );
        if (myPlayer) {
          setMyHand([...myPlayer.hand]);
        }

        onGameStateChange?.(newState);
      } catch (err) {
        console.error("Failed to catch UNO:", err);
        setErrorMessage("Connection error");
      } finally {
        setActionInProgress(false);
      }
    },
    [gameSessionId, currentPlayerId, gameState, isSpectator, actionInProgress, onGameStateChange]
  );

  const handleEndSession = useCallback(async () => {
    setEndSessionLoading(true);
    try {
      const res = await fetch(`/api/rooms/${roomCode}/end-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameSessionId }),
      });

      if (res.ok) {
        router.push(`/${roomCode}`);
      } else {
        const err = await res.json();
        setErrorMessage(err.error ?? "Failed to end session");
      }
    } catch {
      setErrorMessage("Failed to end session");
    } finally {
      setEndSessionLoading(false);
      setShowEndSessionConfirm(false);
    }
  }, [roomCode, gameSessionId, router]);

  const handlePauseResume = useCallback(async () => {
    setPauseLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/rooms/${roomCode}/pause`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error ?? "Failed to pause/resume game");
        return;
      }

      // Update game state status to reflect the new pause state
      setGameState((prev) => ({
        ...prev,
        status: data.status,
      }));
    } catch (err) {
      console.error("Failed to pause/resume game:", err);
      setErrorMessage("Connection error");
    } finally {
      setPauseLoading(false);
    }
  }, [roomCode]);

  // Track if the current turn player may be disconnected
  const timeSinceTurnStart = Date.now() - gameState.turnStartTime;
  const isCurrentPlayerPossiblyDisconnected =
    timeSinceTurnStart > TIMEOUT_SECONDS * 1000 * 2;

  // Determine if the current player has 1 card and needs to call UNO
  const myPlayerState = gameState.players.find(
    (p) => p.playerId === currentPlayerId
  );
  const myCardCount = myHand.length;
  const haveCalledUno = myPlayerState?.calledUno ?? false;
  const canCallUno = myCardCount === 1 && !haveCalledUno && !isSpectator;

  // Determine which other players can be caught (have 1 card, haven't called UNO)
  const catchablePlayers = !isMyTurn && !isSpectator
    ? gameState.players.filter(
        (ps) =>
          ps.playerId !== currentPlayerId &&
          ps.hand.length === 1 &&
          !ps.calledUno
      )
    : [];

  // Handle Realtime updates from other players
  useEffect(() => {
    if (!roomId) return;

    const supabase = createClient();

    const channel = supabase.channel(`room:${roomId}`);

    // Listen for game actions (card plays, draws)
    channel.on(
      "broadcast",
      { event: "game_action" },
      (payload) => {
        const data = payload as unknown as {
          action: string;
          playerId: string;
          gameState: GameState;
        };

        // Don't process our own actions
        if (data.playerId === currentPlayerId) return;

        // Update game state from the broadcast
        if (data.gameState) {
          setGameState(data.gameState);
          onGameStateChange?.(data.gameState);

          // Update my hand from the new game state
          const myPlayer = data.gameState.players.find(
            (p: { playerId: string }) => p.playerId === currentPlayerId
          );
          if (myPlayer) {
            setMyHand([...myPlayer.hand]);
          }

          // Check if round ended from another player's action
          if (
            data.gameState.status === "round_end" ||
            data.gameState.status === "game_end"
          ) {
            setTimeout(() => {
              router.push(`/${roomCode}/scores`);
            }, 1500);
          }
        }
      }
    );

    // Listen for new round broadcasts (from "Play Again")
    channel.on(
      "broadcast",
      { event: "new_round" },
      () => {
        // Navigate back to the game page to reload from persisted state
        router.push(`/${roomCode}/game`);
      }
    );

    // Listen for game start (non-host players)
    channel.on(
      "broadcast",
      { event: "game_started" },
      (payload) => {
        const data = payload as unknown as {
          gameSessionId: string;
          gameType: string;
        };
        if (data.gameSessionId) {
          router.push(`/${roomCode}/game`);
        }
      }
    );

    // Listen for game ended (from "Different Game")
    channel.on(
      "broadcast",
      { event: "game_ended" },
      () => {
        router.push(`/${roomCode}`);
      }
    );

    // Listen for pause event
    channel.on(
      "broadcast",
      { event: "game_paused" },
      (payload) => {
        const data = payload as unknown as {
          status: string;
          gameSessionId: string;
        };
        if (data.status === "paused") {
          setGameState((prev) => ({ ...prev, status: "paused" }));
        }
      }
    );

    // Listen for resume event
    channel.on(
      "broadcast",
      { event: "game_resumed" },
      (payload) => {
        const data = payload as unknown as {
          status: string;
          gameSessionId: string;
        };
        if (data.status === "playing") {
          setGameState((prev) => ({ ...prev, status: "playing" }));
        }
      }
    );

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, currentPlayerId, onGameStateChange, router, roomCode]);

  return (
    <div className="flex min-h-screen flex-col">
      {/* Reconnecting Banner */}
      <ReconnectingBanner
        connectionId={roomId || gameSessionId}
        onReconnected={() => {
          // Re-sync game state by fetching latest from API
          fetch(`/api/games/${gameSessionId}`)
            .then((r) => r.json())
            .then((data) => {
              if (data?.config) {
                setGameState(data.config);
                const myPlayer = data.config.players?.find(
                  (p: { playerId: string }) => p.playerId === currentPlayerId
                );
                if (myPlayer) {
                  setMyHand([...myPlayer.hand]);
                }
              }
            })
            .catch(console.error);
        }}
      />

      {/* Your Turn Banner */}
      {yourTurnBanner && !isSpectator && (
        <div className="fixed inset-x-0 top-0 z-40 animate-slide-down">
          <div className="flex items-center justify-center gap-2 bg-primary py-3 shadow-lg">
            <AlertTriangle className="h-5 w-5 text-primary-foreground animate-pulse" />
            <span className="text-lg font-bold text-primary-foreground">
              Your turn!
            </span>
            <AlertTriangle className="h-5 w-5 text-primary-foreground animate-pulse" />
          </div>
        </div>
      )}

      {/* Error message */}
      {errorMessage && (
        <div className="fixed inset-x-0 top-16 z-40 flex justify-center">
          <div className="rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground shadow-lg animate-in slide-in-from-top-2">
            {errorMessage}
          </div>
        </div>
      )}

      {/* Paused overlay */}
      {gameState.status === "paused" && !isSpectator && (
        <div className="fixed inset-0 z-30 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 rounded-2xl bg-card p-8 shadow-2xl">
            <Pause className="h-16 w-16 text-amber-500" />
            <h2 className="text-2xl font-bold">Game Paused</h2>
            <p className="text-center text-sm text-muted-foreground">
              The game has been paused by the host.
            </p>
            {amIHost && (
              <button
                onClick={handlePauseResume}
                disabled={pauseLoading}
                className="mt-2 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                <Play className="h-4 w-4" />
                {pauseLoading ? "..." : "Resume Game"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Turn Indicator with countdown */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {gameState.direction === 1 ? "→" : "←"}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-lg">
              {currentTurnPlayer?.avatarEmoji ?? "🎯"}
            </span>
            <span
              className={cn(
                "text-sm font-semibold",
                turnPulse && isMyTurn && "animate-pulse text-primary"
              )}
            >
              {isMyTurn && !isSpectator
                ? "Your turn"
                : `${currentTurnPlayer?.displayName ?? "Unknown"}'s turn`}
            </span>
            {isSpectator && currentTurnPlayer && (
              <span className="text-xs text-muted-foreground">
                ({currentTurnPlayer.displayName})
              </span>
            )}
          </div>
          {/* Countdown timer */}
          {!isSpectator && (
            <div className="flex items-center gap-1 ml-2">
              <Clock
                className={cn(
                  "h-4 w-4",
                  timeRemaining <= 10
                    ? "text-red-500 animate-pulse"
                    : timeRemaining <= 20
                      ? "text-amber-500"
                      : "text-muted-foreground"
                )}
              />
              <span
                className={cn(
                  "text-xs font-mono tabular-nums",
                  timeRemaining <= 10
                    ? "text-red-500 font-bold"
                    : timeRemaining <= 20
                      ? "text-amber-500"
                      : "text-muted-foreground"
                )}
              >
                {timeRemaining}s
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Host controls — pause/resume and end session */}
          {amIHost && !isSpectator && (
            <>
              {/* Pause/Resume button */}
              <button
                onClick={handlePauseResume}
                disabled={pauseLoading}
                title={
                  gameState.status === "paused" ? "Resume game" : "Pause game"
                }
                className={cn(
                  "inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium transition-colors disabled:opacity-50",
                  gameState.status === "paused"
                    ? "bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-950/20 dark:text-green-400"
                    : "bg-amber-50 text-amber-600 hover:bg-amber-100 dark:bg-amber-950/20 dark:text-amber-400"
                )}
              >
                {gameState.status === "paused" ? (
                  <>
                    <Play className="h-3 w-3" />
                    Resume
                  </>
                ) : (
                  <>
                    <Pause className="h-3 w-3" />
                    Pause
                  </>
                )}
              </button>

              {showEndSessionConfirm ? (
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleEndSession}
                    disabled={endSessionLoading}
                    className="inline-flex items-center gap-1 rounded-md bg-red-500 px-2 py-1 text-[10px] font-medium text-white transition-colors hover:bg-red-600 disabled:opacity-50"
                  >
                    {endSessionLoading ? "..." : "Confirm End"}
                  </button>
                  <button
                    onClick={() => setShowEndSessionConfirm(false)}
                    className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-accent"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowEndSessionConfirm(true)}
                  title="End session"
                  className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-1 text-[10px] font-medium text-red-600 transition-colors hover:bg-red-100 dark:bg-red-950/20 dark:text-red-400"
                >
                  <LogOut className="h-3 w-3" />
                  End
                </button>
              )}
            </>
          )}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Layers className="h-3 w-3" />
            <span>{gameState.deck.length}</span>
          </div>
        </div>
      </div>

      {/* Opponent hands */}
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {/* Other players' hands (face-down) */}
        {players
          .filter((p) => p.id !== currentPlayerId || isSpectator)
          .map((player) => {
            const playerState = gameState.players.find(
              (ps) => ps.playerId === player.id
            );
            const isCatchable = catchablePlayers.some(
              (cp) => cp.playerId === player.id
            );
            const hasOneCard = playerState?.hand.length === 1;
            const hasCalledUno = playerState?.calledUno ?? false;
            const isCurrentTurnPlayer =
              player.id === currentTurnPlayerId;
            const isDisconnected =
              isCurrentTurnPlayer && isCurrentPlayerPossiblyDisconnected;
            return (
              <div key={player.id} className="relative">
                <CardHand
                  cards={playerState?.hand ?? []}
                  faceUp={isSpectator}
                  cardCount={playerState?.hand.length ?? player.cardCount ?? 0}
                  playerLabel={
                    isCurrentTurnPlayer
                      ? `${player.displayName} 👈`
                      : player.displayName
                  }
                />
                {/* Disconnected indicator */}
                {isDisconnected && (
                  <div className="absolute -top-1 right-2">
                    <span className="inline-flex items-center rounded-full bg-gray-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                      Disconnected
                    </span>
                  </div>
                )}
                {/* UNO badge for players with 1 card who called UNO */}
                {hasOneCard && hasCalledUno && !isCatchable && (
                  <div className="absolute -top-1 right-2">
                    <span className="inline-flex items-center rounded-full bg-green-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                      UNO ✓
                    </span>
                  </div>
                )}
                {/* Catch button for players with 1 card who haven't called UNO */}
                {isCatchable && (
                  <button
                    onClick={() => handleCatchUno(player.id)}
                    disabled={actionInProgress}
                    className="absolute -top-1 right-2 inline-flex items-center rounded-full bg-red-500 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-sm transition-colors hover:bg-red-600 active:scale-95 disabled:opacity-50"
                  >
                    Catch!
                  </button>
                )}
              </div>
            );
          })}

        {/* Center area: Discard pile + draw pile */}
        <div className="flex items-center justify-center gap-6 py-8">
          {/* Draw pile */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={handleDrawCard}
              disabled={!isMyTurn || isSpectator || actionInProgress}
              className={cn(
                "flex h-20 w-16 items-center justify-center rounded-lg border-2 border-dashed text-sm font-bold transition-all",
                isMyTurn && !isSpectator && !actionInProgress
                  ? "border-blue-400 bg-blue-50 text-blue-600 hover:bg-blue-100 active:scale-95 dark:bg-blue-950/20 dark:text-blue-400"
                  : "border-gray-300 bg-gray-100 text-gray-400 dark:border-gray-700 dark:bg-gray-800/50",
                drawCardAnimation && "animate-bounce"
              )}
              aria-label="Draw a card"
            >
              <div className="flex flex-col items-center gap-1">
                <Layers className="h-6 w-6" />
                <span className="text-[10px]">{gameState.deck.length}</span>
              </div>
            </button>
            {isMyTurn && !isSpectator && playableIndices.length === 0 && (
              <span className="text-[10px] text-muted-foreground">
                No playable cards
              </span>
            )}
          </div>

          {/* Discard pile */}
          <div className="flex flex-col items-center gap-1">
            {topDiscard ? (
              <DiscardPileCard card={topDiscard} />
            ) : (
              <div className="flex h-32 w-22 items-center justify-center rounded-xl border-2 border-dashed border-gray-300">
                <span className="text-xs text-muted-foreground">
                  Discard pile
                </span>
              </div>
            )}
            <span className="text-[10px] text-muted-foreground">
              {gameState.discardPile.length} cards
            </span>
          </div>
        </div>
      </div>

      {/* Player's own hand */}
      <div className="sticky bottom-0 border-t border-border bg-background/95 backdrop-blur-sm px-2 py-3">
        {/* UNO button - shown when player has 1 card and hasn't called UNO yet */}
        {canCallUno && isMyTurn && (
          <div className="mb-2 flex justify-center">
            <button
              onClick={handleCallUno}
              disabled={actionInProgress}
              className="inline-flex items-center gap-1.5 rounded-full bg-red-500 px-6 py-2 text-sm font-bold text-white shadow-lg transition-all hover:bg-red-600 active:scale-95 disabled:opacity-50 animate-bounce"
            >
              <AlertTriangle className="h-4 w-4" />
              UNO!
            </button>
          </div>
        )}
        {/* UNO call prompt when it's not my turn but I have 1 card */}
        {canCallUno && !isMyTurn && (
          <div className="mb-2 flex justify-center">
            <button
              onClick={handleCallUno}
              disabled={actionInProgress}
              className="inline-flex items-center gap-1.5 rounded-full bg-red-500 px-5 py-1.5 text-xs font-bold text-white shadow-md transition-all hover:bg-red-600 active:scale-95 disabled:opacity-50"
            >
              Call UNO!
            </button>
          </div>
        )}
        <CardHand
          cards={myHand}
          faceUp={true}
          isCurrentPlayer={!isSpectator}
          selectedCardIndex={selectedCardIndex}
          onCardClick={handleCardClick}
          shakeCardIndex={shakeCardIndex}
          playableCardIndices={playableIndices}
          disabled={!isMyTurn || isSpectator || actionInProgress}
        />
      </div>

      {/* Color Picker Modal */}
      <ColorPickerModal
        isOpen={showColorPicker}
        onSelectColor={handleColorSelected}
        onCancel={() => {
          setShowColorPicker(false);
          setPendingCardIndex(null);
        }}
        cardValue={
          pendingCardIndex !== null && myHand[pendingCardIndex]
            ? myHand[pendingCardIndex].value
            : undefined
        }
      />
    </div>
  );
}
