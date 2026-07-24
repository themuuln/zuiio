import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import {
  useFeedLogs,
  useFeedSchedules,
  useDeleteFeedLog,
  useToggleFeedSchedule,
  useDeleteFeedSchedule,
  type FeedLog,
  type FeedSchedule,
} from "@/hooks/useNutrition";
import { useHorse } from "@/hooks/useHorses";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Loading } from "@/components/ui/Loading";
import { ErrorState } from "@/components/states";

type Tab = "log" | "schedule";

const FEED_TYPE_LABELS: Record<string, string> = {
  hay: "Өвс",
  grain: "Үр тариа",
  supplement: "Нэмэлт",
  other: "Бусад",
};

const FREQUENCY_LABELS: Record<string, string> = {
  daily: "Өдөр бүр",
  twice_daily: "Өдөрт 2 удаа",
  weekly: "Долоо хоногт",
  as_needed: "Шаардлагатай үед",
};

function FeedLogCard({
  log,
  onDelete,
}: {
  log: FeedLog;
  onDelete: () => void;
}) {
  return (
    <TouchableOpacity
      className="bg-card rounded-xl p-4 mb-3 border border-border"
      onLongPress={() => {
        Alert.alert(
          "Устгах уу?",
          "Энэ хоолны тэмдэглэлийг устгах уу?",
          [
            { text: "Цуцлах", style: "cancel" },
            { text: "Устгах", style: "destructive", onPress: onDelete },
          ],
        );
      }}
    >
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center gap-2">
          <Ionicons name="nutrition-outline" size={20} className="text-primary" />
          <Text className="text-foreground font-semibold">
            {FEED_TYPE_LABELS[log.feed_type] ?? log.feed_type}
          </Text>
        </View>
        <Badge variant="secondary">{log.amount_kg} кг</Badge>
      </View>
      <Text className="text-muted-foreground text-sm">
        {format(new Date(log.date), "yyyy-MM-dd")}
      </Text>
      {log.notes && (
        <Text className="text-muted-foreground text-sm mt-1">{log.notes}</Text>
      )}
    </TouchableOpacity>
  );
}

function ScheduleCard({
  schedule,
  onToggle,
  onDelete,
}: {
  schedule: FeedSchedule;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <TouchableOpacity
      className="bg-card rounded-xl p-4 mb-3 border border-border"
      onLongPress={() => {
        Alert.alert(
          "Устгах уу?",
          "Энэ хоолны хуваарийг устгах уу?",
          [
            { text: "Цуцлах", style: "cancel" },
            { text: "Устгах", style: "destructive", onPress: onDelete },
          ],
        );
      }}
    >
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center gap-2">
          <Ionicons name="time-outline" size={20} className="text-primary" />
          <Text className="text-foreground font-semibold">
            {FEED_TYPE_LABELS[schedule.feed_type] ?? schedule.feed_type}
          </Text>
        </View>
        <Badge variant={schedule.active ? "success" : "secondary"}>
          {schedule.active ? "Идэвхитэй" : "Идэвхигүй"}
        </Badge>
      </View>
      <View className="flex-row items-center gap-4 mt-1">
        <Text className="text-muted-foreground text-sm">
          {schedule.amount_kg} кг
        </Text>
        <Text className="text-muted-foreground text-sm">
          {FREQUENCY_LABELS[schedule.frequency] ?? schedule.frequency}
        </Text>
        {schedule.time_of_day && (
          <Text className="text-muted-foreground text-sm">
            {schedule.time_of_day}
          </Text>
        )}
      </View>
      <TouchableOpacity
        className="mt-3 bg-secondary rounded-lg py-2 items-center"
        onPress={onToggle}
      >
        <Text className="text-secondary-foreground text-sm font-medium">
          {schedule.active ? "Идэвхигүй болгох" : "Идэвхитэй болгох"}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

export default function NutritionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("log");

  const { data: horse, isPending: horsePending, error: horseError } = useHorse(id);
  const {
    data: feedLogs = [],
    isPending: logsPending,
    refetch: refetchLogs,
    isRefetching: logsRefetching,
  } = useFeedLogs(id);
  const {
    data: schedules = [],
    isPending: schedulesPending,
    refetch: refetchSchedules,
    isRefetching: schedulesRefetching,
  } = useFeedSchedules(id);

  const deleteFeedLog = useDeleteFeedLog();
  const toggleSchedule = useToggleFeedSchedule();
  const deleteSchedule = useDeleteFeedSchedule();

  if (horsePending) return <Loading />;
  if (horseError || !horse)
    return <ErrorState message="Морь олдсонгүй" onRetry={() => router.back()} />;

  const isRefreshing = logsRefetching || schedulesRefetching;

  function handleRefresh() {
    if (activeTab === "log") {
      refetchLogs();
    } else {
      refetchSchedules();
    }
  }

  return (
    <View className="flex-1 bg-background">
      <PageHeader
        title="Хооллолт"
        subtitle={horse.name}
        showBack
        rightAction={
          <TouchableOpacity
            onPress={() =>
              router.push(
                activeTab === "log"
                  ? `/horse/${id}/nutrition-new`
                  : `/horse/${id}/nutrition-new`,
              )
            }
          >
            <Ionicons name="add-circle-outline" size={28} className="text-primary" />
          </TouchableOpacity>
        }
      />

      {/* Tabs */}
      <View className="flex-row bg-card mx-4 rounded-xl p-1 mb-4">
        {([
          ["log", "Хоолны тэмдэглэл"],
          ["schedule", "Хуваарь"],
        ] as const).map(([key, label]) => (
          <TouchableOpacity
            key={key}
            className={`flex-1 py-2 rounded-lg ${activeTab === key ? "bg-primary" : ""}`}
            onPress={() => setActiveTab(key)}
          >
            <Text
              className={`text-center font-medium ${
                activeTab === key
                  ? "text-primary-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      <ScrollView
        className="flex-1 px-4"
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {activeTab === "log" && (
          <>
            {logsPending ? (
              <Loading />
            ) : feedLogs.length === 0 ? (
              <EmptyState
                icon="nutrition-outline"
                title="Хоолны тэмдэглэл байхгүй"
                subtitle="Хооллолтын мэдээлэл нэмнэ үү"
              />
            ) : (
              feedLogs.map((log) => (
                <FeedLogCard
                  key={log.id}
                  log={log}
                  onDelete={() =>
                    deleteFeedLog.mutate({ id: log.id, horse_id: id })
                  }
                />
              ))
            )}
            <TouchableOpacity
              className="bg-primary/10 rounded-xl py-3 items-center mt-2 mb-8"
              onPress={() => router.push(`/horse/${id}/nutrition-new`)}
            >
              <Text className="text-primary font-medium">
                + Хоолны тэмдэглэл нэмэх
              </Text>
            </TouchableOpacity>
          </>
        )}

        {activeTab === "schedule" && (
          <>
            {schedulesPending ? (
              <Loading />
            ) : schedules.length === 0 ? (
              <EmptyState
                icon="calendar-outline"
                title="Хоолны хуваарь байхгүй"
                subtitle="Хооллолтын хуваарь нэмнэ үү"
              />
            ) : (
              schedules.map((schedule) => (
                <ScheduleCard
                  key={schedule.id}
                  schedule={schedule}
                  onToggle={() =>
                    toggleSchedule.mutate({
                      id: schedule.id,
                      horse_id: id,
                      active: !schedule.active,
                    })
                  }
                  onDelete={() =>
                    deleteSchedule.mutate({ id: schedule.id, horse_id: id })
                  }
                />
              ))
            )}
            <TouchableOpacity
              className="bg-primary/10 rounded-xl py-3 items-center mt-2 mb-8"
              onPress={() => router.push(`/horse/${id}/nutrition-new`)}
            >
              <Text className="text-primary font-medium">
                + Хоолны хуваарь нэмэх
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}
