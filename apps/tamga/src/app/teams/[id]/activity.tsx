import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useTeamActivity, type TeamActivityLog } from "@/hooks/useTeams";
import { PageHeader } from "@/components/ui/PageHeader";
import { LoadingState, ErrorState, EmptyState } from "@/components/states";

// ── Action labels ────────────────────────────────────────────────

const ACTION_LABELS: Record<string, string> = {
  member_joined: "Гишүүн нэмэгдлээ",
  member_removed: "Гишүүн хасагдлаа",
  member_left: "Гишүүн гарлаа",
  horse_added: "Морь нэмэгдлээ",
  horse_removed: "Морь хасагдлаа",
  role_updated: "Эрх шинэчлэгдлээ",
  team_updated: "Мэдээлэл шинэчлэгдлээ",
};

// ── Format relative time ─────────────────────────────────────────

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Одоо";
  if (minutes < 60) return `${minutes} мин өмнө`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} цаг өмнө`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} өдөр өмнө`;
  return new Date(dateStr).toLocaleDateString("mn-MN");
}

// ── Actor Name Resolver ──────────────────────────────────────────

function useActorNames(userIds: string[]) {
  const [names, setNames] = useState<Record<string, string>>({});

  useEffect(() => {
    const unique = [...new Set(userIds.filter(Boolean))];
    if (unique.length === 0) return;

    supabase
      .from("profiles")
      .select("id, name")
      .in("id", unique)
      .then(({ data }) => {
        if (!data) return;
        const map: Record<string, string> = {};
        for (const p of data) {
          map[p.id] = p.name ?? "Тодорхойгүй";
        }
        setNames(map);
      });
  }, [userIds.join(",")]);

  return names;
}

// ── Activity Row ─────────────────────────────────────────────────

function ActivityRow({
  log,
  actorName,
}: {
  log: TeamActivityLog;
  actorName: string | undefined;
}) {
  const label = ACTION_LABELS[log.action] ?? log.action;

  return (
    <View className="flex-row py-3 border-b border-border">
      <View className="w-2 h-2 rounded-full bg-primary mt-2 mr-3" />
      <View className="flex-1">
        <Text className="text-foreground font-medium">{label}</Text>
        {actorName && (
          <Text className="text-muted-foreground text-sm">{actorName}</Text>
        )}
        <Text className="text-muted-foreground text-xs mt-1">
          {formatRelativeTime(log.created_at)}
        </Text>
      </View>
    </View>
  );
}

// ── Main Screen ──────────────────────────────────────────────────

export default function TeamActivityScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const {
    data: activity,
    isPending,
    error,
    refetch,
    isRefetching,
  } = useTeamActivity(id);

  const activityList = activity ?? [];
  const userIds = activityList.map((l) => l.user_id).filter(Boolean) as string[];
  const actorNames = useActorNames(userIds);

  if (isPending) return <LoadingState text="Үйл ажиллагаа ачаалж байна..." />;
  if (error) return <ErrorState onRetry={() => refetch()} />;

  return (
    <View className="flex-1 bg-background">
      <PageHeader
        title="Багийн үйл ажиллагаа"
        subtitle={activityList.length > 0 ? `Сүүлийн ${activityList.length}` : undefined}
        showBack
      />

      {activityList.length === 0 ? (
        <EmptyState
          icon="time-outline"
          title="Үйл ажиллагаа байхгүй байна"
          subtitle="Багийн үйлдлүүд энд харагдана"
        />
      ) : (
        <ScrollView
          className="flex-1 px-4"
          contentContainerClassName="pb-8"
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
        >
          <View className="bg-card rounded-xl p-4">
            {activityList.map((log) => (
              <ActivityRow
                key={log.id}
                log={log}
                actorName={log.user_id ? actorNames[log.user_id] : undefined}
              />
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}
