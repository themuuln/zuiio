"use client";

import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";
import { ArrowLeftRight, Swords } from "lucide-react";
import Link from "next/link";
import { useCallback, useState } from "react";
import { PlayerAvatar } from "@/components/player-avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DraggablePlayer {
  player_id: string;
  player_name: string;
  player_photo_url: string | null;
  team_name: string;
  team_short_code: string;
  team_primary_color: string | null;
  team_logo_url: string | null;
}

interface DragCompareZoneProps {
  /** All available players to drag from. */
  players: DraggablePlayer[];
  className?: string;
}

// ---------------------------------------------------------------------------
// CSS for drag overlay
// ---------------------------------------------------------------------------

const DRAG_STYLES = `
.drag-player-card {
  cursor: grabbing;
  transform: scale(1.05);
  box-shadow: 0 20px 40px rgba(0,0,0,0.15);
  z-index: 50;
  opacity: 0.95;
}

.drop-zone-active {
  border-color: var(--brand-sports) !important;
  background-color: var(--color-accent) !important;
}

@media (prefers-reduced-motion: reduce) {
  .drag-player-card {
    transform: none;
    transition: none;
  }
}
`;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Drag-to-compare zone.
 *
 * Shows a grid of draggable player cards. Drag two players
 * into the comparison drop zone to navigate to the compare page.
 * Falls back to click-to-select for keyboard/accessibility.
 */
export function DragCompareZone({
  players,
  className,
}: DragCompareZoneProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<[string, string]>(["", ""]);

  // Inject styles
  if (typeof document !== "undefined") {
    const existing = document.getElementById("drag-compare-styles");
    if (!existing) {
      const style = document.createElement("style");
      style.id = "drag-compare-styles";
      style.textContent = DRAG_STYLES;
      document.head.appendChild(style);
    }
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 8 },
    }),
  );

  const activePlayer = activeId
    ? players.find((p) => p.player_id === activeId)
    : null;

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveId(null);
      const { active, over } = event;

      if (over?.id === "compare-zone") {
        const playerId = active.id as string;
        setSelectedIds((prev) => {
          if (prev[0] === playerId || prev[1] === playerId) return prev;
          if (!prev[0]) return [playerId, prev[1]];
          if (!prev[1]) return [prev[0], playerId];
          // Both slots full — replace second
          return [prev[0], playerId];
        });
      }
    },
    [],
  );

  function handleSelect(playerId: string) {
    setSelectedIds((prev) => {
      if (prev[0] === playerId || prev[1] === playerId) return prev;
      if (!prev[0]) return [playerId, prev[1]];
      if (!prev[1]) return [prev[0], playerId];
      return [prev[0], playerId];
    });
  }

  function handleRemove(slot: 0 | 1) {
    setSelectedIds((prev) => {
      const next = [...prev] as [string, string];
      next[slot] = "";
      return next;
    });
  }

  const canCompare =
    selectedIds[0].length > 0 &&
    selectedIds[1].length > 0 &&
    selectedIds[0] !== selectedIds[1];

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToWindowEdges]}
    >
      <div className={cn("flex flex-col gap-6", className)}>
        {/* Drop zone */}
        <div
          id="compare-zone"
          className={cn(
            "flex min-h-24 items-center justify-center gap-4 rounded-xl border-2 border-dashed p-4 transition-colors",
            selectedIds.some(Boolean)
              ? "border-muted-foreground/30 bg-muted/30"
              : "border-muted-foreground/15",
          )}
          aria-label="Харьцуулах бүс — тоглогч чирч энд буулгана"
        >
          {selectedIds[0] || selectedIds[1] ? (
            <>
              {([0, 1] as const).map((slot) => {
                const player = selectedIds[slot]
                  ? players.find((p) => p.player_id === selectedIds[slot])
                  : null;
                return (
                  <div
                    key={slot}
                    className="flex flex-col items-center gap-2"
                  >
                    {player ? (
                      <button
                        type="button"
                        onClick={() => handleRemove(slot)}
                        className="group relative"
                        aria-label={`${player.player_name} хасах`}
                      >
                        <PlayerAvatar
                          photoUrl={player.player_photo_url}
                          name={player.player_name}
                          primaryColor={player.team_primary_color}
                          size="xl"
                        />
                        <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-destructive text-xs text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100">
                          ×
                        </span>
                        <p className="mt-1 max-w-20 truncate text-xs font-medium">
                          {player.player_name}
                        </p>
                      </button>
                    ) : (
                      <div className="flex size-16 items-center justify-center rounded-full border-2 border-dashed border-muted-foreground/30 text-muted-foreground">
                        {slot + 1}
                      </div>
                    )}
                  </div>
                );
              })}
              <ArrowLeftRight
                className="size-5 text-muted-foreground"
                aria-hidden="true"
              />
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 text-center">
              <Swords className="size-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Тоглогч чирч энд буулгана
              </p>
            </div>
          )}
        </div>

        {/* Compare button */}
        {canCompare && (
          <Link
            href={`/players/compare?players=${selectedIds.join(",")}`}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Swords className="size-4" aria-hidden="true" />
            Харьцуулах
          </Link>
        )}

        {/* Player grid — draggable */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {players.map((player) => {
            const isSelected = selectedIds.includes(player.player_id);
            return (
              <button
                key={player.player_id}
                type="button"
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("text/plain", player.player_id);
                  e.dataTransfer.effectAllowed = "move";
                }}
                onClick={() => handleSelect(player.player_id)}
                className={cn(
                  "flex items-center gap-3 rounded-lg border p-3 text-left transition-all hover:shadow-md",
                  isSelected
                    ? "border-brand-sports bg-accent"
                    : "border-transparent bg-muted/50 hover:bg-muted",
                )}
                aria-label={`${player.player_name} сонгох`}
                aria-pressed={isSelected}
              >
                <PlayerAvatar
                  photoUrl={player.player_photo_url}
                  name={player.player_name}
                  primaryColor={player.team_primary_color}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {player.player_name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {player.team_short_code}
                  </p>
                </div>
                {isSelected && (
                  <Badge variant="secondary" className="shrink-0">
                    Сонгогдсон
                  </Badge>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <DragOverlay>
        {activePlayer ? (
          <div className="drag-player-card flex items-center gap-3 rounded-lg border bg-card p-3 shadow-xl">
            <PlayerAvatar
              photoUrl={activePlayer.player_photo_url}
              name={activePlayer.player_name}
              primaryColor={activePlayer.team_primary_color}
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">
                {activePlayer.player_name}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {activePlayer.team_name}
              </p>
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
