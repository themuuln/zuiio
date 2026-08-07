"use client";

import { sortEvents } from "@onoo/core/events";
import { describeEvent, formatClock } from "@onoo/core/format";
import { deriveBoxScore } from "@onoo/core/stats";
import type { GameRoster, SportConfig, StatEvent } from "@onoo/core/types";
import { Flag, Radio } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface RealtimePayload {
  eventType: string;
  new: Record<string, unknown>;
}

interface LiveGameCenterProps {
  gameId: string;
  homeTeamSeasonId: string;
  awayTeamSeasonId: string;
  initialEvents: StatEvent[];
  rosters: GameRoster[];
  sportConfig: SportConfig;
  /** player_id → canonical_name lookup, built server-side from the players table. */
  playerNameMap: Record<string, string>;
}

export function LiveGameCenter({
  gameId,
  homeTeamSeasonId,
  awayTeamSeasonId,
  initialEvents,
  rosters,
  sportConfig,
  playerNameMap,
}: LiveGameCenterProps) {
  const [events, setEvents] = useState<StatEvent[]>(initialEvents);
  const [activeTab, setActiveTab] = useState<"home" | "away" | "playbyplay">(
    "playbyplay",
  );

  const supabase = createClient();

  // Subscribe to Realtime updates
  useEffect(() => {
    const channel = supabase
      .channel(`game-${gameId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "stat_events",
          filter: `game_id=eq.${gameId}`,
        },
        (payload: RealtimePayload) => {
          if (payload.eventType === "INSERT") {
            const newEvent = payload.new as StatEvent;
            if (newEvent.voided_at == null) {
              setEvents((prev) => [...prev, newEvent]);
            }
          } else if (payload.eventType === "UPDATE") {
            const updatedEvent = payload.new as StatEvent;
            if (updatedEvent.voided_at != null) {
              setEvents((prev) => prev.filter((e) => e.id !== updatedEvent.id));
            } else {
              setEvents((prev) =>
                prev.map((e) => (e.id === updatedEvent.id ? updatedEvent : e)),
              );
            }
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameId, supabase]);

  // Derive box score
  const derived = deriveBoxScore({
    events: events.filter((e) => e.voided_at == null),
    rosters,
    sportConfig,
  });

  // Get sorted events for play-by-play
  const sortedEvents = sortEvents(events.filter((e) => e.voided_at == null));

  // Get team stats
  const homeTeamStats = derived.teams.find(
    (t) => t.teamSeasonId === homeTeamSeasonId,
  );
  const awayTeamStats = derived.teams.find(
    (t) => t.teamSeasonId === awayTeamSeasonId,
  );

  // Get player stats by team
  const homePlayerStats = derived.players.filter(
    (p) => p.teamSeasonId === homeTeamSeasonId,
  );
  const awayPlayerStats = derived.players.filter(
    (p) => p.teamSeasonId === awayTeamSeasonId,
  );

  const resolvePlayerName = (playerId: string): string =>
    playerNameMap[playerId] ?? playerId.slice(0, 8);

  const tabs = [
    { id: "home" as const, label: "Эхний" },
    { id: "away" as const, label: "Зочин" },
    { id: "playbyplay" as const, label: "Тоглолтын тэмдэглэл" },
  ];

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div
        className="flex border-b"
        role="tablist"
        aria-label="Тоглолтын мэдээлэл"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={activeTab === tab.id}
            aria-controls={`tabpanel-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex-1 py-2 text-sm font-medium",
              activeTab === tab.id
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[300px]">
        {activeTab === "playbyplay" ? (
          <div
            role="tabpanel"
            id="tabpanel-playbyplay"
            aria-labelledby="tab-playbyplay"
            className="space-y-2"
          >
            {sortedEvents.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-12 text-center">
                <Radio
                  className="size-8 text-muted-foreground/40"
                  aria-hidden="true"
                />
                <p className="text-sm font-medium text-muted-foreground">
                  Шууд тэмдэглэл эхлээгүй байна
                </p>
                <p className="text-xs text-muted-foreground/60 max-w-64">
                  Тэмдэглэгч тоглолтыг бүртгэж эхэлмэгц үйлдлүүд шууд гарч ирнэ.
                  Хуудсыг автоматаар шинэчилнэ.
                </p>
              </div>
            ) : (
              [...sortedEvents].reverse().map((event) => (
                <div
                  key={event.id}
                  className="flex items-center gap-3 rounded bg-muted p-2"
                >
                  <span className="w-12 text-sm text-muted-foreground">
                    {formatClock(event.clock_seconds)}
                  </span>
                  <span className="flex-1 text-sm">
                    {describeEvent(event, "mn")}
                  </span>
                </div>
              ))
            )}
          </div>
        ) : (
          <div
            role="tabpanel"
            id={`tabpanel-${activeTab}`}
            aria-labelledby={`tab-${activeTab}`}
            className="overflow-x-auto"
          >
            {(activeTab === "home" ? homePlayerStats : awayPlayerStats)
              .length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-12 text-center">
                <Flag
                  className="size-8 text-muted-foreground/40"
                  aria-hidden="true"
                />
                <p className="text-sm font-medium text-muted-foreground">
                  Тоглогчдын мэдээлэл хараахан бүртгэгдээгүй
                </p>
                <p className="text-xs text-muted-foreground/60">
                  Үйлдэл бүртгэгдсэний дараа автоматаар гарч ирнэ.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Тоглогч</TableHead>
                    <TableHead className="text-right">Оноо</TableHead>
                    <TableHead className="text-right">Оролт</TableHead>
                    <TableHead className="text-right">Давсан</TableHead>
                    <TableHead className="text-right">Олгосон</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(activeTab === "home"
                    ? homePlayerStats
                    : awayPlayerStats
                  ).map((player) => (
                    <TableRow key={player.playerId}>
                      <TableCell className="font-medium">
                        {resolvePlayerName(player.playerId)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {player.pts}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {player.fgm}/{player.fga}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {player.oreb + player.dreb}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {player.ast}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
