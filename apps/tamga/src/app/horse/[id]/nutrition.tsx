import { useState } from "react";
import { View, Text, FlatList, TouchableOpacity } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useFeedLogs, useFeedSchedules, useDeleteFeedLog, useToggleFeedSchedule, type FeedLog, type FeedSchedule } from "@/hooks/useNutrition";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Loading } from "@/components/ui/Loading";
import { EmptyState } from "@/components/ui/EmptyState";
import { FAB } from "@/components/ui/FAB";
import { ErrorState } from "@/components/states";
import { format } from "date-fns";

type Tab = "logs" | "schedule";

const FEED_TYPE_LABELS: Record<string, string> = {
  hay: "Өвс", grain: "Үр тариа", supplement: "Нэмэлт тэжээл", other: "Бусад",
};

function FeedLogCard({ log, onDelete }: { log: FeedLog; onDelete: (id: string) => void }) {
  return (
    <Card className="mb-3">
      <View className="flex-row justify-between items-start">
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <Badge variant="secondary">{FEED_TYPE_LABELS[log.feed_type] ?? log.feed_type}</Badge>
            <Text className="text-muted-foreground text-xs">{format(new Date(log.date), "yyyy-MM-dd")}</Text>
          </View>
          <Text className="text-foreground font-medium mt-1">{log.amount_kg} кг</Text>
          {log.notes && <Text className="text-muted-foreground text-sm mt-1">{log.notes}</Text>}
        </View>
        <TouchableOpacity onPress={() => onDelete(log.id)}>
          <Ionicons name="trash-outline" size={18} className="text-destructive" />
        </TouchableOpacity>
      </View>
    </Card>
  );
}

function ScheduleCard({ schedule, onToggle }: { schedule: FeedSchedule; onToggle: (id: string, active: boolean) => void }) {
  return (
    <Card className="mb-3">
      <View className="flex-row justify-between items-center">
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <Badge>{FEED_TYPE_LABELS[schedule.feed_type] ?? schedule.feed_type}</Badge>
            <Text className="text-foreground font-medium">{schedule.amount_kg} кг</Text>
          </View>
          <Text className="text-muted-foreground text-sm mt-1">
            {schedule.frequency} · {schedule.time_of_day}
          </Text>
        </View>
        <TouchableOpacity
          className={`w-12 h-7 rounded-full items-center justify-center ${schedule.active ? "bg-primary" : "bg-secondary"}`}
          onPress={() => onToggle(schedule.id, !schedule.active)}
        >
          <View className={`w-5 h-5 rounded-full bg-white ${schedule.active ? "ml-5" : "mr-5"}`} />
        </TouchableOpacity>
      </View>
    </Card>
  );
}

export default function NutritionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("logs");

  const { data: logs = [], isPending: loadingLogs, error: logsError, refetch: refetchLogs } = useFeedLogs(id);
  const { data: schedules = [], isPending: loadingSchedules, refetch: refetchSchedules } = useFeedSchedules(id);
  const deleteLog = useDeleteFeedLog(id);
  const toggleSchedule = useToggleFeedSchedule(id);

  return (
    <View className="flex-1 bg-background">
      <PageHeader title="Тэжээл" subtitle="Хооллолтын бүртгэл" showBack />

      <View className="flex-row bg-card mx-4 rounded-xl p-1 mb-2">
        {([
          ["logs", "Бүртгэл"],
          ["schedule", "Хуваарь"],
        ] as const).map(([key, label]) => (
          <TouchableOpacity
            key={key}
            className={`flex-1 py-2 rounded-lg ${activeTab === key ? "bg-primary" : ""}`}
            onPress={() => setActiveTab(key)}
          >
            <Text className={`text-center font-medium text-sm ${activeTab === key ? "text-primary-foreground" : "text-muted-foreground"}`}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === "logs" ? (
        loadingLogs ? <Loading /> : logsError ? <ErrorState onRetry={refetchLogs} /> : (
          <FlatList
            data={logs}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <FeedLogCard log={item} onDelete={(id) => deleteLog.mutate(id)} />}
            contentContainerClassName="px-4 pb-20"
            ListEmptyComponent={<EmptyState icon="nutrition-outline" title="Бүртгэл байхгүй" subtitle="Шинэ хооллолт нэмнэ үү" />}
          />
        )
      ) : (
        loadingSchedules ? <Loading /> : (
          <FlatList
            data={schedules}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <ScheduleCard schedule={item} onToggle={(sid, active) => toggleSchedule.mutate({ id: sid, active })} />}
            contentContainerClassName="px-4 pb-20"
            ListEmptyComponent={<EmptyState icon="calendar-outline" title="Хуваарь байхгүй" subtitle="Шинэ хуваарь нэмнэ үү" />}
          />
        )
      )}

      <FAB icon="add" onPress={() => router.push(`/horse/${id}/nutrition-new` as any)} />
    </View>
  );
}
