import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, FlatList } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useHorse } from "@/hooks/useHorses";
import { useHealthLogs, type HealthLog } from "@/hooks/useHealthLogs";
import { useTrainingLogs, type TrainingLog } from "@/hooks/useTraining";
import { Loading } from "@/components/ui/Loading";
import { ErrorState } from "@/components/states";
import { Badge } from "@/components/ui/Badge";
import { format } from "date-fns";

type Tab = "info" | "health" | "training";

const LOG_TYPE_LABELS: Record<string, string> = {
  vaccination: "Вакцин",
  treatment: "Эмчилгээ",
  farrier: "Мөр",
  deworming: "Бөөлжүүр",
  dental: "Шүд",
  checkup: "Шалгалт",
  other: "Бусад",
};

const TRAINING_TYPE_LABELS: Record<string, string> = {
  endurance: "Тэсвэр",
  sprint: "Хурд",
  agility: "Мөр",
  strength: "Хүч",
  rest: "Амралт",
  other: "Бусад",
};

function HealthLogCard({ log }: { log: HealthLog }) {
  return (
    <View className="bg-card rounded-xl p-4 mb-3 border border-border">
      <View className="flex-row justify-between items-start mb-2">
        <Badge variant="secondary">{LOG_TYPE_LABELS[log.log_type] ?? log.log_type}</Badge>
        <Text className="text-muted-foreground text-xs">
          {format(new Date(log.date), "yyyy-MM-dd")}
        </Text>
      </View>
      {log.notes && (
        <Text className="text-foreground text-sm mb-1">{log.notes}</Text>
      )}
      <View className="flex-row gap-4 mt-1">
        {log.medicament && (
          <Text className="text-muted-foreground text-xs">
            💊 {log.medicament}
          </Text>
        )}
        {log.farrier_name && (
          <Text className="text-muted-foreground text-xs">
            🔨 {log.farrier_name}
          </Text>
        )}
        {log.cost != null && log.cost > 0 && (
          <Text className="text-muted-foreground text-xs">
            💰 {log.cost.toLocaleString()}₮
          </Text>
        )}
      </View>
    </View>
  );
}

function TrainingLogCard({ log }: { log: TrainingLog }) {
  return (
    <View className="bg-card rounded-xl p-4 mb-3 border border-border">
      <View className="flex-row justify-between items-start mb-2">
        <Badge>{TRAINING_TYPE_LABELS[log.type] ?? log.type}</Badge>
        <Text className="text-muted-foreground text-xs">
          {format(new Date(log.date), "yyyy-MM-dd")}
        </Text>
      </View>
      <View className="flex-row gap-4 mt-1">
        <Text className="text-foreground text-sm">⏱ {log.duration_minutes} мин</Text>
        {log.distance_km != null && (
          <Text className="text-foreground text-sm">📏 {log.distance_km} км</Text>
        )}
      </View>
      {log.handler_name && (
        <Text className="text-muted-foreground text-xs mt-1">
          Зууч: {log.handler_name}
        </Text>
      )}
      {log.notes && (
        <Text className="text-foreground text-sm mt-2">{log.notes}</Text>
      )}
    </View>
  );
}

export default function HorseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("info");

  const { data: horse, isPending, error } = useHorse(id);
  const { data: healthLogs = [] } = useHealthLogs(id);
  const { data: trainingLogs = [] } = useTrainingLogs(id);

  if (isPending) return <Loading />;
  if (error || !horse) return <ErrorState message="Морь олдсонгүй" onRetry={() => router.back()} />;

  const age = new Date().getFullYear() - horse.birth_year;

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pt-12 pb-4">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} className="text-foreground" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-foreground">Морийн мэдээлэл</Text>
        <TouchableOpacity onPress={() => router.push(`/horse/${id}/edit` as any)}>
          <Ionicons name="create-outline" size={24} className="text-primary" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-4">
        {/* Hero */}
        <View className="bg-card rounded-2xl p-6 mb-4">
          <Text className="text-2xl font-bold text-foreground mb-1">{horse.name}</Text>
          <Text className="text-muted-foreground mb-4">
            {horse.registration_no ?? "Бүртгэлгүй"}
          </Text>
          <View className="flex-row flex-wrap gap-3">
            <View className="bg-secondary rounded-lg px-3 py-1">
              <Text className="text-secondary-foreground text-sm">{horse.coat}</Text>
            </View>
            <View className="bg-secondary rounded-lg px-3 py-1">
              <Text className="text-secondary-foreground text-sm">{age} нас</Text>
            </View>
            <View className="bg-secondary rounded-lg px-3 py-1">
              <Text className="text-secondary-foreground text-sm">
                {horse.gender === "stallion" ? "Эр" : horse.gender === "mare" ? "Эм" : "Тайвсан"}
              </Text>
            </View>
            {horse.microchip_id && (
              <View className="bg-primary/10 rounded-lg px-3 py-1">
                <Text className="text-primary text-sm">📍 {horse.microchip_id}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Tabs */}
        <View className="flex-row bg-card rounded-xl p-1 mb-4">
          {([
            ["info", "Мэдээлэл"],
            ["health", "Эрүүл мэнд"],
            ["training", "Сургалт"],
          ] as const).map(([key, label]) => (
            <TouchableOpacity
              key={key}
              className={`flex-1 py-2 rounded-lg ${
                activeTab === key ? "bg-primary" : ""
              }`}
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
        {activeTab === "info" && (
          <View className="bg-card rounded-xl p-4 mb-4">
            {[
              ["Нэр", horse.name],
              ["Угсаа", horse.coat],
              ["Төрсөн он", `${horse.birth_year} он`],
              ["Нас", `${age} нас`],
              ["Хүйс", horse.gender === "stallion" ? "Эр" : horse.gender === "mare" ? "Эм" : "Тайвсан"],
              ["Бүртгэл", horse.registration_no ?? "—"],
              ["Микрочип", horse.microchip_id ?? "—"],
            ].map(([label, value]) => (
              <View
                key={label}
                className="flex-row justify-between py-2 border-b border-border"
              >
                <Text className="text-muted-foreground">{label}</Text>
                <Text className="text-foreground font-medium">{value}</Text>
              </View>
            ))}
          </View>
        )}

        {activeTab === "health" && (
          <View className="mb-4">
            {healthLogs.length === 0 ? (
              <View className="bg-card rounded-xl p-6 items-center">
                <Ionicons name="medkit-outline" size={48} className="text-muted-foreground" />
                <Text className="text-muted-foreground mt-3">Эрүүл мэндийн мэдээлэл байхгүй</Text>
              </View>
            ) : (
              healthLogs.map((log) => <HealthLogCard key={log.id} log={log} />)
            )}
            <TouchableOpacity
              className="bg-primary/10 rounded-xl py-3 items-center mt-2"
              onPress={() => router.push(`/horse/${id}/health-new`)}
            >
              <Text className="text-primary font-medium">+ Эрүүл мэнд нэмэх</Text>
            </TouchableOpacity>
          </View>
        )}

        {activeTab === "training" && (
          <View className="mb-4">
            {trainingLogs.length === 0 ? (
              <View className="bg-card rounded-xl p-6 items-center">
                <Ionicons name="fitness-outline" size={48} className="text-muted-foreground" />
                <Text className="text-muted-foreground mt-3">Сургалтын мэдээлэл байхгүй</Text>
              </View>
            ) : (
              trainingLogs.map((log) => <TrainingLogCard key={log.id} log={log} />)
            )}
            <TouchableOpacity
              className="bg-primary/10 rounded-xl py-3 items-center mt-2"
              onPress={() => router.push(`/horse/${id}/training-new`)}
            >
              <Text className="text-primary font-medium">+ Сургалт нэмэх</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Quick Actions */}
        <View className="flex-row flex-wrap gap-2 mb-8">
          {[
            { label: "Гэрчилгээ", icon: "document-text-outline", route: `/horse/${id}/certificates` },
            { label: "Хамтран эзэн", icon: "people-outline", route: `/horse/${id}/co-owners` },
            { label: "Шилжүүлэг", icon: "swap-horizontal-outline", route: `/horse/${id}/transfer` },
          ].map((action) => (
            <TouchableOpacity
              key={action.route}
              className="bg-card border border-border rounded-xl px-4 py-3 flex-1 items-center min-w-[100px]"
              onPress={() => router.push(action.route as any)}
            >
              <Ionicons name={action.icon as any} size={20} className="text-primary mb-1" />
              <Text className="text-foreground text-xs font-medium">{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
