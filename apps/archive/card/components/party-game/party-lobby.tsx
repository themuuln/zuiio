"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { VIBE_TIERS, PARTY_GAME_TIMER_SECONDS } from "@/lib/constants";
import { getGamesForPlayerCount, getGamesForVibeTier, type GameDefinition } from "@/lib/games";
import type { ContentTier } from "@/lib/content";
import type { PartyGameConfig } from "@/lib/party-engine";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export interface PartyLobbyProps {
  /** Available party game definitions */
  games: GameDefinition[];
  /** Current player count in the room */
  playerCount: number;
  /** Current room's vibe tier */
  vibeTier: ContentTier;
  /** Whether the current user is the host */
  isHost: boolean;
  /** Current drinking enabled state */
  drinkingEnabled: boolean;
  /** Current max drinks per round */
  maxDrinksPerRound: number;
  /** Callback when a game is selected to start */
  onStartGame: (gameId: string, config: Partial<PartyGameConfig>) => void;
  /** Callback when vibe tier changes (host only) */
  onChangeVibeTier?: (tier: ContentTier) => void;
  /** Callback when drinking enabled changes */
  onToggleDrinking?: (enabled: boolean) => void;
  /** Callback when max drinks per round changes */
  onChangeMaxDrinks?: (max: number) => void;
  /** Additional class names */
  className?: string;
}

// ──────────────────────────────────────────────
// Vibe Tier Display
// ──────────────────────────────────────────────

interface VibeTierDisplayProps {
  currentTier: ContentTier;
  isHost: boolean;
  onChangeTier?: (tier: ContentTier) => void;
}

function VibeTierDisplay({
  currentTier,
  isHost,
  onChangeTier,
}: VibeTierDisplayProps) {
  const [showAfterDarkWarning, setShowAfterDarkWarning] = useState(false);
  const [pendingTier, setPendingTier] = useState<ContentTier | null>(null);

  const tierInfo = VIBE_TIERS[currentTier];
  const tierOrder: ContentTier[] = ["spicy", "wild", "after-dark"];

  const handleTierChange = (tier: ContentTier) => {
    if (tier === "after-dark") {
      setPendingTier(tier);
      setShowAfterDarkWarning(true);
    } else {
      onChangeTier?.(tier);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl" aria-hidden="true">{tierInfo.emoji}</span>
          <div>
            <p className="text-sm font-semibold">{tierInfo.label}</p>
            <p className="text-xs text-muted-foreground">{tierInfo.description}</p>
          </div>
        </div>

        {isHost && onChangeTier && (
          <div className="flex gap-1">
            {tierOrder.map((tier) => (
              <button
                key={tier}
                onClick={() => handleTierChange(tier)}
                disabled={tier === currentTier}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full text-lg transition-all",
                  tier === currentTier
                    ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                )}
                aria-label={`Set tier to ${tier}`}
                aria-pressed={tier === currentTier}
              >
                {VIBE_TIERS[tier].emoji}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* After Dark Content Warning Dialog */}
      <Dialog open={showAfterDarkWarning} onOpenChange={setShowAfterDarkWarning}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span aria-hidden="true">🔞</span>
              After Dark Content Warning
            </DialogTitle>
            <DialogDescription>
              After Dark mode includes sexually explicit content, heavy drinking,
              and adult themes intended only for close friend groups.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              By enabling After Dark, you confirm that everyone in the room is
              18+ and comfortable with explicit content.
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAfterDarkWarning(false);
                  setPendingTier(null);
                }}
                className="flex-1 min-h-[48px] min-w-[48px]"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (pendingTier) {
                    onChangeTier?.(pendingTier);
                  }
                  setShowAfterDarkWarning(false);
                  setPendingTier(null);
                }}
                className="flex-1 min-h-[48px] min-w-[48px]"
              >
                Enable After Dark
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ──────────────────────────────────────────────
// Drinking Config Toggles
// ──────────────────────────────────────────────

interface DrinkingConfigProps {
  drinkingEnabled: boolean;
  maxDrinksPerRound: number;
  isHost: boolean;
  onToggleDrinking?: (enabled: boolean) => void;
  onChangeMaxDrinks?: (max: number) => void;
}

function DrinkingConfig({
  drinkingEnabled,
  maxDrinksPerRound,
  isHost,
  onToggleDrinking,
  onChangeMaxDrinks,
}: DrinkingConfigProps) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold">Drinking Config</h3>

      {/* Drinking enabled toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg" aria-hidden="true">🍺</span>
          <div>
            <p className="text-sm font-medium">Drinking enabled</p>
            <p className="text-xs text-muted-foreground">
              {drinkingEnabled
                ? "Players can drink or skip"
                : "Dry mode — penalty points instead"}
            </p>
          </div>
        </div>
        {isHost && onToggleDrinking && (
          <button
            onClick={() => onToggleDrinking(!drinkingEnabled)}
            className={cn(
              "relative inline-flex h-7 w-12 items-center rounded-full transition-colors",
              drinkingEnabled
                ? "bg-green-500"
                : "bg-gray-300 dark:bg-gray-600"
            )}
            role="switch"
            aria-checked={drinkingEnabled}
            aria-label="Toggle drinking enabled"
          >
            <span
              className={cn(
                "inline-block h-5 w-5 transform rounded-full bg-white transition-transform",
                drinkingEnabled ? "translate-x-6" : "translate-x-1"
              )}
            />
          </button>
        )}
        {!isHost && (
          <Badge variant={drinkingEnabled ? "default" : "secondary"}>
            {drinkingEnabled ? "On" : "Dry mode"}
          </Badge>
        )}
      </div>

      {/* Max drinks per round */}
      {drinkingEnabled && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg" aria-hidden="true">🔢</span>
            <div>
              <p className="text-sm font-medium">Max drinks per round</p>
              <p className="text-xs text-muted-foreground">
                Current: {maxDrinksPerRound}
                {maxDrinksPerRound === 0 && " (unlimited)"}
              </p>
            </div>
          </div>
          {isHost && onChangeMaxDrinks && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => onChangeMaxDrinks(Math.max(0, maxDrinksPerRound - 1))}
                className="flex h-9 w-9 items-center justify-center rounded-md border bg-background text-sm hover:bg-accent"
                aria-label="Decrease max drinks"
              >
                −
              </button>
              <span className="flex h-9 min-w-[32px] items-center justify-center text-sm font-medium tabular-nums">
                {maxDrinksPerRound}
              </span>
              <button
                onClick={() => onChangeMaxDrinks(maxDrinksPerRound + 1)}
                className="flex h-9 w-9 items-center justify-center rounded-md border bg-background text-sm hover:bg-accent"
                aria-label="Increase max drinks"
              >
                +
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// Game Card
// ──────────────────────────────────────────────

interface GameCardProps {
  game: GameDefinition;
  disabled?: boolean;
  onSelect: () => void;
}

function GameCard({ game, disabled, onSelect }: GameCardProps) {
  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-md active:scale-[0.98]",
        disabled && "pointer-events-none opacity-50"
      )}
      onClick={!disabled ? onSelect : undefined}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={`Select ${game.name}`}
      onKeyDown={(e) => {
        if (!disabled && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onSelect();
        }
      }}
    >
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center justify-between">
          <span className="text-2xl" aria-hidden="true">{game.emoji}</span>
          <span className="text-xs text-muted-foreground">
            {game.minPlayers}–{game.maxPlayers} players
          </span>
        </div>
        <CardTitle className="mt-2 text-base">{game.name}</CardTitle>
        <CardDescription className="text-xs">
          {game.estimatedTime}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <p className="text-xs text-muted-foreground line-clamp-2">
          {game.description}
        </p>
        {/* Tags */}
        <div className="mt-2 flex flex-wrap gap-1">
          {game.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-[10px]">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ──────────────────────────────────────────────
// PartyLobby — Main component
// ──────────────────────────────────────────────

/**
 * PartyLobby — Pre-game screen showing game selection, vibe tier display,
 * and drinking config toggles.
 *
 * Games are filtered by player count (getGamesForPlayerCount) and
 * vibe tier (getGamesForVibeTier).
 *
 * Host can change vibe tier, drinking enabled/disabled, and max drinks per round.
 * After Dark tier requires a content warning confirmation before applying.
 *
 * Responsive for 375px viewport.
 */
export function PartyLobby({
  games: allGames,
  playerCount,
  vibeTier,
  isHost,
  drinkingEnabled,
  maxDrinksPerRound,
  onStartGame,
  onChangeVibeTier,
  onToggleDrinking,
  onChangeMaxDrinks,
  className,
}: PartyLobbyProps) {
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);

  // Filter games by player count and vibe tier
  const availableGames = getGamesForVibeTier(
    getGamesForPlayerCount(playerCount),
    vibeTier
  );

  // Separate party games vs others
  const partyGames = availableGames.filter(
    (g) =>
      g.id === "truth-or-dare" ||
      g.id === "never-have-i-ever" ||
      g.id === "hot-takes" ||
      g.id === "most-likely-to"
  );

  const handleStartGame = (gameId: string) => {
    setSelectedGameId(gameId);
    onStartGame(gameId, {
      vibeTier,
      drinkingEnabled,
      maxDrinksPerRound,
      timerSeconds: PARTY_GAME_TIMER_SECONDS,
    });
  };

  return (
    <div className={cn("w-full max-w-lg mx-auto px-4 py-6", className)}>
      {/* Header */}
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold">Party Games</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick a game to play — everyone will see the same cards on their own phone
        </p>
      </div>

      {/* Vibe Tier */}
      <section className="mb-6">
        <VibeTierDisplay
          currentTier={vibeTier}
          isHost={isHost}
          onChangeTier={onChangeVibeTier}
        />
      </section>

      {/* Drinking Config */}
      <section className="mb-6 rounded-lg border p-4">
        <DrinkingConfig
          drinkingEnabled={drinkingEnabled}
          maxDrinksPerRound={maxDrinksPerRound}
          isHost={isHost}
          onToggleDrinking={onToggleDrinking}
          onChangeMaxDrinks={onChangeMaxDrinks}
        />
      </section>

      {/* Game Selection */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">Available Games</h2>

        {partyGames.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed p-8 text-center">
            <p className="text-sm text-muted-foreground">
              No party games available for {playerCount} player(s) at{" "}
              {VIBE_TIERS[vibeTier].label} tier.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Try adjusting your vibe tier or inviting more players.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {partyGames.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                disabled={selectedGameId === game.id}
                onSelect={() => handleStartGame(game.id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Player count info */}
      <p className="mt-6 text-center text-xs text-muted-foreground">
        {playerCount} player(s) in room
        {vibeTier === "after-dark" && " • 🔞 After Dark"}
      </p>
    </div>
  );
}
