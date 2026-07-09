import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { formatClock, describeEvent } from "@onoo/core/format";
import { sortEvents } from "@onoo/core/events";
import { deriveBoxScore } from "@onoo/core/stats";
import type { StatEvent, GameRoster, SportConfig } from "@onoo/core/types";

export default function GameDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const supabase = createClient();
  const [events, setEvents] = useState<StatEvent[]>([]);

  const { data: game, isPending: gamePending } = useQuery({
    queryKey: ["game", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("games")
        .select(`
          *,
          home_team_season:team_seasons!games_home_team_season_id_fkey (teams (name, short_code, primary_color)),
          away_team_season:team_seasons!games_away_team_season_id_fkey (teams (name, short_code, primary_color)),
          competitions (name),
          venues (name, city)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Fetch initial events
  useEffect(() => {
    if (!id) return;

    const fetchEvents = async () => {
      const { data } = await supabase
        .from("stat_events")
        .select("*")
        .eq("game_id", id)
        .is("deleted_at", null);

      if (data) setEvents(data);
    };

    fetchEvents();
  }, [id, supabase]);

  // Subscribe to Realtime updates
  useEffect(() => {
    if (!id) return;

    const channel = supabase
      .channel(`game-${id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "stat_events",
          filter: `game_id=eq.${id}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setEvents((prev) => [...prev, payload.new as StatEvent]);
          } else if (payload.eventType === "UPDATE") {
            setEvents((prev) =>
              prev.map((e) =>
                e.id === (payload.new as StatEvent).id
                  ? (payload.new as StatEvent)
                  : e
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, supabase]);

  if (gamePending) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!game) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-lg">Тоглолт олдсонгүй</Text>
      </View>
    );
  }

  const isLive = game.status === "live";
  const isFinal = ["final", "verified", "official"].includes(game.status);

  // Derive box score from events
  const derived = deriveBoxScore({
    events,
    rosters: [],
    sportConfig: {
      periods: 4,
      period_minutes: 10,
      overtime_minutes: 5,
      fouls_to_bonus: 5,
      personal_foul_limit: 5,
      players_on_court: 5,
    },
  });

  const sortedEvents = sortEvents(events.filter((e) => !e.deleted_at));

  return (
    <ScrollView className="flex-1 bg-background">
      {/* Game Header */}
      <View className="p-4 border-b border-border">
        <View className="flex-row items-center justify-between">
          <View className="items-center flex-1">
            <Text className="text-lg font-bold">
              {game.home_team_season?.teams?.name || "Тодорхойгүй"}
            </Text>
            <Text className="text-3xl font-bold mt-2">
              {game.home_score ?? 0}
            </Text>
          </View>

          <View className="items-center mx-4">
            <Text className="text-muted-foreground">VS</Text>
            <Text className="text-xs text-muted-foreground mt-1">
              {isLive ? "Шууд" : isFinal ? "Дууссан" : "Эхлээгүй"}
            </Text>
          </View>

          <View className="items-center flex-1">
            <Text className="text-lg font-bold">
              {game.away_team_season?.teams?.name || "Тодорхойгүй"}
            </Text>
            <Text className="text-3xl font-bold mt-2">
              {game.away_score ?? 0}
            </Text>
          </View>
        </View>

        <View className="mt-4 items-center">
          <Text className="text-sm text-muted-foreground">
            {game.competitions?.name}
          </Text>
          <Text className="text-xs text-muted-foreground">
            {game.venues?.name}
            {game.venues?.city ? `, ${game.venues.city}` : ""}
          </Text>
        </View>
      </View>

      {/* Play-by-Play */}
      {sortedEvents.length > 0 && (
        <View className="p-4">
          <Text className="text-lg font-bold mb-3">Тоглолтын явц</Text>
          <View className="space-y-2">
            {sortedEvents.slice(0, 20).map((event) => (
              <View
                key={event.id}
                className="flex-row items-center p-2 bg-muted rounded"
              >
                <Text className="w-12 text-xs text-muted-foreground">
                  {event.period}р {formatClock(event.clock_seconds)}
                </Text>
                <Text className="flex-1 text-sm">
                  {describeEvent(event, "mn")}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}
