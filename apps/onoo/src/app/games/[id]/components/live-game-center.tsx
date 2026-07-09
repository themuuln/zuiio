"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { deriveBoxScore } from "@onoo/core/stats";
import { sortEvents } from "@onoo/core/events";
import { formatClock, describeEvent } from "@onoo/core/format";
import type { StatEvent, GameRoster, SportConfig } from "@onoo/core/types";

interface LiveGameCenterProps {
  gameId: string;
  homeTeamSeasonId: string;
  awayTeamSeasonId: string;
  initialEvents: StatEvent[];
  rosters: GameRoster[];
  sportConfig: SportConfig;
}

export function LiveGameCenter({
  gameId,
  homeTeamSeasonId,
  awayTeamSeasonId,
  initialEvents,
  rosters,
  sportConfig,
}: LiveGameCenterProps) {
  const [events, setEvents] = useState<StatEvent[]>(initialEvents);
  const [activeTab, setActiveTab] = useState<"home" | "away" | "playbyplay">("playbyplay");

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
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newEvent = payload.new as StatEvent;
            if (!newEvent.deleted_at) {
              setEvents((prev) => [...prev, newEvent]);
            }
          } else if (payload.eventType === "UPDATE") {
            const updatedEvent = payload.new as StatEvent;
            setEvents((prev) =>
              prev.map((e) => (e.id === updatedEvent.id ? updatedEvent : e))
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameId, supabase]);

  // Derive box score
  const derived = deriveBoxScore({
    events: events.filter((e) => !e.deleted_at),
    rosters,
    sportConfig,
  });

  // Get sorted events for play-by-play
  const sortedEvents = sortEvents(events.filter((e) => !e.deleted_at));

  // Get team stats
  const homeTeamStats = derived.teams.find((t) => t.teamSeasonId === homeTeamSeasonId);
  const awayTeamStats = derived.teams.find((t) => t.teamSeasonId === awayTeamSeasonId);

  // Get player stats by team
  const homePlayerStats = derived.players.filter((p) => p.teamSeasonId === homeTeamSeasonId);
  const awayPlayerStats = derived.players.filter((p) => p.teamSeasonId === awayTeamSeasonId);

  return (
    <div className="space-y-4">
      {/* Score Header */}
      <div className="flex items-center justify-between rounded-lg bg-gray-900 p-4 text-white">
        <div className="text-center">
          <div className="text-2xl font-bold">{homeTeamStats?.pts ?? 0}</div>
          <div className="text-sm text-gray-400">HOME</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold">Амьд</div>
          <div className="text-sm text-gray-400">Шууд</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold">{awayTeamStats?.pts ?? 0}</div>
          <div className="text-sm text-gray-400">AWAY</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab("home")}
          className={`flex-1 py-2 text-sm font-medium ${
            activeTab === "home"
              ? "border-b-2 border-blue-500 text-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Гэр (HOME)
        </button>
        <button
          onClick={() => setActiveTab("away")}
          className={`flex-1 py-2 text-sm font-medium ${
            activeTab === "away"
              ? "border-b-2 border-blue-500 text-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Зочин (AWAY)
        </button>
        <button
          onClick={() => setActiveTab("playbyplay")}
          className={`flex-1 py-2 text-sm font-medium ${
            activeTab === "playbyplay"
              ? "border-b-2 border-blue-500 text-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Тоглолтын тэмдэглэл
        </button>
      </div>

      {/* Tab Content */}
      <div className="min-h-[300px]">
        {activeTab === "playbyplay" ? (
          <div className="space-y-2">
            {sortedEvents.length === 0 ? (
              <p className="py-8 text-center text-gray-500">
                Үйлдэл байхгүй байна
              </p>
            ) : (
              [...sortedEvents].reverse().map((event) => (
                <div
                  key={event.id}
                  className="flex items-center gap-3 rounded bg-gray-50 p-2"
                >
                  <span className="w-12 text-sm text-gray-500">
                    {formatClock(event.clock_seconds)}
                  </span>
                  <span className="flex-1 text-sm">
                    {describeEvent(event as any, "mn")}
                  </span>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2 pr-4">Тоглогч</th>
                  <th className="py-2 px-2 text-right">Оноо</th>
                  <th className="py-2 px-2 text-right">Оролт</th>
                  <th className="py-2 px-2 text-right">Давсан</th>
                  <th className="py-2 px-2 text-right">Олгосон</th>
                </tr>
              </thead>
              <tbody>
                {(activeTab === "home" ? homePlayerStats : awayPlayerStats).map(
                  (player) => (
                    <tr key={player.playerId} className="border-b">
                      <td className="py-2 pr-4 font-medium">
                        {player.playerId.slice(0, 8)}
                      </td>
                      <td className="py-2 px-2 text-right">{player.pts}</td>
                      <td className="py-2 px-2 text-right">
                        {player.fgm}/{player.fga}
                      </td>
                      <td className="py-2 px-2 text-right">
                        {player.oreb + player.dreb}
                      </td>
                      <td className="py-2 px-2 text-right">{player.ast}</td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
