import { useState } from "react";
import { View, Text, FlatList, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/lib/auth";
import { useRaces, useRaceEntries, type Race, type RaceEntry } from "@/hooks/useRaces";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Loading } from "@/components/ui/Loading";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/states";
import { FilterChips } from "@/components/ui/FilterChips";
import { format } from "date-fns";

type Tab = "races" | "entries";

const STATUS_LABELS: Record<string, string> = {
  upcoming: "Удахгүй",
  ongoing: "Болж байна",
  completed: "Дууссан",
  cancelled: "Цуцалсан",
};

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "success" | "destructive" | "warning"> = {
  upcoming: "default",
  ongoing: "warning",
  completed: "success",
  cancelled: "destructive",
};

const ENTRY_STATUS: Record<string, string> = {
  registered: "Бүртгүүлсэн",
  started: "Эхэлсэн",
  finished: "Дууссан",
  disqualified: "Хасагдсан",
};

function RaceCard({ race }: { race: Race }) {
  const router = useRouter();

  return (
    <TouchableOpacity onPress={() => router.push(`/races/${race.id}` as any)}>
      <Card className="mb-3">
        <View className="flex-row justify-between items-start mb-2">
          <Text className="text-foreground font-semibold text-base flex-1">{race.name}</Text>
          <Badge variant={STATUS_VARIANTS[race.status] ?? "secondary"}>
            {STATUS_LABELS[race.status] ?? race.status}
          </Badge>
        </View>
        <Text className="text-muted-foreground text-sm">📍 {race.location}</Text>
        <View className="flex-row gap-4 mt-2">
          <Text className="text-muted-foreground text-sm">
            📅 {format(new Date(race.race_date), "yyyy-MM-dd")}
          </Text>
          <Text className="text-muted-foreground text-sm">
            🏃 {race.distance_km} км
          </Text>
        </View>
        {race.prize_pool != null && (
          <Text className="text-primary text-sm font-medium mt-2">
            🏆 {race.prize_pool.toLocaleString()}₮
          </Text>
        )}
      </Card>
    </TouchableOpacity>
  );
}

function EntryCard({ entry }: { entry: RaceEntry }) {
  return (
    <Card className="mb-3">
      <View className="flex-row justify-between items-start mb-2">
        <Text className="text-foreground font-semibold flex-1">{entry.race_name}</Text>
        <Badge variant={entry.status === "finished" ? "success" : entry.status === "disqualified" ? "destructive" : "secondary"}>
          {ENTRY_STATUS[entry.status] ?? entry.status}
        </Badge>
      </View>
      <Text className="text-muted-foreground text-sm">🐴 {entry.horse_name}</Text>
      {entry.position != null && (
        <Text className="text-foreground text-sm mt-1">
          🥇 {entry.position}-р байр
        </Text>
      )}
      {entry.finish_time && (
        <Text className="text-muted-foreground text-sm">
          ⏱ {entry.finish_time}
        </Text>
      )}
    </Card>
  );
}

export default function RacesScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("races");

  const { data: races = [], isPending: loadingRaces, error: racesError, refetch: refetchRaces } = useRaces(user?.id);
  const { data: entries = [], isPending: loadingEntries, error: entriesError, refetch: refetchEntries } = useRaceEntries(user?.id);

  return (
    <View className="flex-1 bg-background">
      <PageHeader title="Уралдаан" subtitle="Морин уралдаан" showBack />

      <View className="flex-row bg-card mx-4 rounded-xl p-1 mb-2">
        {([
          ["races", "Уралдаан"],
          ["entries", "Миний оролцуулга"],
        ] as const).map(([key, label]) => (
          <TouchableOpacity
            key={key}
            className={`flex-1 py-2 rounded-lg ${activeTab === key ? "bg-primary" : ""}`}
            onPress={() => setActiveTab(key)}
          >
            <Text className={`text-center font-medium text-sm ${activeTab === key ? "text-primary-foreground" : "text-muted-foreground"}`}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === "races" ? (
        loadingRaces ? (
          <Loading />
        ) : racesError ? (
          <ErrorState onRetry={refetchRaces} />
        ) : (
          <FlatList
            data={races}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <RaceCard race={item} />}
            contentContainerClassName="px-4 pb-20"
            ListEmptyComponent={
              <EmptyState icon="flag-outline" title="Уралдаан байхгүй" subtitle="Удахгүй уралдаан нэмэгдэнэ" />
            }
          />
        )
      ) : (
        loadingEntries ? (
          <Loading />
        ) : entriesError ? (
          <ErrorState onRetry={refetchEntries} />
        ) : (
          <FlatList
            data={entries}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <EntryCard entry={item} />}
            contentContainerClassName="px-4 pb-20"
            ListEmptyComponent={
              <EmptyState icon="clipboard-outline" title="Оролцуулга байхгүй" subtitle="Уралдаанд бүртгүүлнэ үү" />
            }
          />
        )
      )}
    </View>
  );
}
