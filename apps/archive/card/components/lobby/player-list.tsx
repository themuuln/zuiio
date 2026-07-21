"use client";

import { useState } from "react";
import { Crown, Users, Crown as TransferCrown, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlayerData {
  id: string;
  display_name: string;
  avatar_emoji: string;
  is_host: boolean;
  is_spectator: boolean;
  joined_at: string;
}

interface PlayerListProps {
  players: PlayerData[];
  currentPlayerId?: string;
  onTransferHost?: (targetPlayerId: string) => void;
  transferInProgress?: boolean;
  onRemovePlayer?: (targetPlayerId: string) => void;
  removePlayerInProgress?: boolean;
}

/**
 * Player list component for the lobby.
 * Shows each player with emoji avatar, display name, and host badge.
 * Shows "Share the code above to invite friends" when only the host is present.
 * Host can transfer host role by tapping the transfer button on another player.
 * Host can remove non-host players by tapping the remove button.
 */
export function PlayerList({
  players,
  currentPlayerId,
  onTransferHost,
  transferInProgress = false,
  onRemovePlayer,
  removePlayerInProgress = false,
}: PlayerListProps) {
  const [confirmingTransfer, setConfirmingTransfer] = useState<string | null>(
    null
  );
  const [confirmingRemove, setConfirmingRemove] = useState<string | null>(
    null
  );

  const nonSpectators = players.filter((p) => !p.is_spectator);
  const hostPlayer = nonSpectators.find((p) => p.is_host);
  const isCurrentUserHost = hostPlayer?.id === currentPlayerId;
  const onlyHostPresent =
    nonSpectators.length === 1 && hostPlayer !== undefined;

  if (nonSpectators.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border p-8 text-center">
        <Users className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Waiting for players...
        </p>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted-foreground">
          Players ({nonSpectators.length})
        </h2>
      </div>

      <div className="flex flex-col gap-2">
        {nonSpectators.map((player) => {
          const isCurrentPlayer = player.id === currentPlayerId;
          const isHost = player.is_host;
          const showTransferButton =
            isCurrentUserHost && !isHost && currentPlayerId !== player.id;

          return (
            <div
              key={player.id}
              className={cn(
                "flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors",
                isCurrentPlayer
                  ? "border-primary/30 bg-primary/5"
                  : "border-input bg-background"
              )}
            >
              {/* Emoji Avatar */}
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-xl">
                {player.avatar_emoji}
              </span>

              {/* Name + Host Badge */}
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium">
                    {player.display_name}
                  </span>
                  {isCurrentPlayer && (
                    <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                      You
                    </span>
                  )}
                </div>
              </div>

              {/* Host Badge */}
              {isHost && (
                <div className="flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  <Crown className="h-3.5 w-3.5" />
                  Host
                </div>
              )}

              {/* Transfer Host Button (only for current host, on non-host players) */}
              {showTransferButton && (
                <div className="shrink-0">
                  {confirmingTransfer === player.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          onTransferHost?.(player.id);
                          setConfirmingTransfer(null);
                        }}
                        disabled={transferInProgress}
                        className="inline-flex items-center gap-1 rounded-md bg-amber-500 px-2 py-1 text-[10px] font-medium text-white transition-colors hover:bg-amber-600 disabled:opacity-50"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setConfirmingTransfer(null)}
                        className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-accent"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmingTransfer(player.id)}
                      title="Transfer host role"
                      className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1 text-[10px] font-medium text-amber-600 transition-colors hover:bg-amber-100 dark:bg-amber-950/20 dark:text-amber-400"
                    >
                      <TransferCrown className="h-3 w-3" />
                      Make Host
                    </button>
                  )}
                </div>
              )}

              {/* Remove Player Button (only for current host, on non-host players) */}
              {showTransferButton && onRemovePlayer && (
                <div className="shrink-0">
                  {confirmingRemove === player.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          onRemovePlayer(player.id);
                          setConfirmingRemove(null);
                        }}
                        disabled={removePlayerInProgress}
                        className="inline-flex items-center gap-1 rounded-md bg-red-500 px-2 py-1 text-[10px] font-medium text-white transition-colors hover:bg-red-600 disabled:opacity-50"
                      >
                        {removePlayerInProgress ? "..." : "Confirm"}
                      </button>
                      <button
                        onClick={() => setConfirmingRemove(null)}
                        className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-accent"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmingRemove(player.id)}
                      title="Remove player"
                      className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-1 text-[10px] font-medium text-red-600 transition-colors hover:bg-red-100 dark:bg-red-950/20 dark:text-red-400"
                    >
                      <XCircle className="h-3 w-3" />
                      Remove
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* "Share the code" empty state */}
      {onlyHostPresent && (
        <p className="mt-1 text-center text-sm text-muted-foreground">
          Share the code above to invite friends
        </p>
      )}
    </div>
  );
}
