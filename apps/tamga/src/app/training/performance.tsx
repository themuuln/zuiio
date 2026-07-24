import { useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { format, subDays, startOfMonth } from "date-fns";
import { mn } from "date-fns/locale";
import { useAuth } from "@/lib/auth";
import { useHorses, type Horse } from "@/hooks/useHorses";
import { useTrainingLogs, type TrainingLog } from "@/hooks/useTraining";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Loading } from "@/components/ui/Loading";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState, ErrorState } from "@/components/states";

// ── Training type labels ───────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  gallop: "Галоп",
  sprint: "Спринт",
  endurance: "Тэсвэр чадвар",
  rest: "Амралт",
  agility: "Мөр",
  strength: "Хүч",
  other: "Бусад",
};

const BAR_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
];

// ── Stat card ──────────────────────────────────────────────────

function StatCard({
  label,
  value,
  subtitle,
  icon,
}: {
  label: string;
  value: string | number;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View className="bg-card rounded-xl p-4 border border-border flex-1 min-w-[45%] mb-3">
      <View className="flex-row items-center mb-1">
        <Ionicons name={icon} size={16} className="text-primary mr-2" />
        <Text className="text-sm text-muted-foreground">{label}</Text>
      </View>
      <Text className="text-2xl font-bold text-foreground">{value}</Text>
      {subtitle && (
        <Text className="text-xs text-muted-foreground mt-1">{subtitle}</Text>
      )}
    </View>
  );
}

// ── Horizontal bar chart ───────────────────────────────────────

function TrainingTypeBarChart({
  data,
}: {
  data: { label: string; value: number; color: string }[];
}) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <View className="bg-card rounded-xl p-4 border border-border mb-4">
      <Text className="text-sm font-medium text-muted-foreground mb-3">
        Төрөл бүрийн сургалт
      </Text>
      {data.map((item) => (
        <View key={item.label} className="flex-row items-center mb-2">
          <Text className="w-28 text-xs text-foreground">{item.label}</Text>
          <View className="flex-1 h-5 bg-muted rounded-full overflow-hidden">
            <View
              className="h-full rounded-full"
              style={{
                width: `${(item.value / maxValue) * 100}%`,
                backgroundColor: item.color,
                minWidth: item.value > 0 ? 4 : 0,
              }}
            />
          </View>
          <Text className="w-10 text-right text-xs font-medium text-foreground">
            {item.value}
          </Text>
        </View>
      ))}
    </View>
  );
}

// ── Timeline log card ──────────────────────────────────────────

function LogTimelineCard({ log }: { log: TrainingLog }) {
  return (
    <View className="flex-row mb-3">
      {/* Timeline dot + line */}
      <View className="items-center mr-3">
        <View className="w-3 h-3 rounded-full bg-primary" />
        <View className="w-0.5 flex-1 bg-border" />
      </View>
      {/* Card content */}
      <Card className="flex-1 mb-0">
        <View className="flex-row justify-between items-start mb-2">
          <Text className="text-foreground font-medium text-sm">
            {format(new Date(log.date), "MMM d", { locale: mn })}
          </Text>
          <Badge>{TYPE_LABELS[log.type] ?? log.type}</Badge>
        </View>
        <View className="flex-row gap-4">
          <Text className="text-foreground text-sm">⏱ {log.duration_minutes} мин</Text>
          {log.distance_km != null && log.distance_km > 0 && (
            <Text className="text-foreground text-sm">📏 {log.distance_km} км</Text>
          )}
        </View>
        {log.handler_name && (
          <Text className="text-muted-foreground text-xs mt-1">
            Зууч: {log.handler_name}
          </Text>
        )}
        {log.notes ? (
          <Text className="text-muted-foreground text-xs mt-2" numberOfLines={2}>
            {log.notes}
          </Text>
        ) : null}
      </Card>
    </View>
  );
}

// ── Horse selector ─────────────────────────────────────────────

function HorseSelector({
  horses,
  selectedId,
  onSelect,
}: {
  horses: Horse[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="px-4 mb-4"
    >
      {horses.map((horse) => (
        <TouchableOpacity
          key={horse.id}
          onPress={() => onSelect(horse.id)}
          className={`mr-2 px-4 py-2 rounded-full border ${
            selectedId === horse.id
              ? "bg-primary border-primary"
              : "bg-card border-border"
          }`}
        >
          <Text
            className={`text-sm font-medium ${
              selectedId === horse.id
                ? "text-primary-foreground"
                : "text-foreground"
            }`}
          >
            {horse.name}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

// ── Compute stats ──────────────────────────────────────────────

function computeStats(logs: TrainingLog[]) {
  const now = new Date();
  const monthStart = startOfMonth(now);

  // Total sessions this month
  const monthLogs = logs.filter(
    (l) => new Date(l.date) >= monthStart,
  );
  const totalThisMonth = monthLogs.length;

  // Average duration (all logs)
  const avgDuration =
    logs.length > 0
      ? Math.round(
          logs.reduce((sum, l) => sum + l.duration_minutes, 0) / logs.length,
        )
      : 0;

  // Most common training type
  const typeCounts: Record<string, number> = {};
  for (const log of logs) {
    typeCounts[log.type] = (typeCounts[log.type] || 0) + 1;
  }
  const sortedTypes = Object.entries(typeCounts).sort(
    ([, a], [, b]) => b - a,
  );
  const mostCommon = sortedTypes.length > 0 ? sortedTypes[0][0] : "";

  // Streak: consecutive days ending today (or yesterday) with at least one log
  const datesWithLogs = new Set(
    logs.map((l) => format(new Date(l.date), "yyyy-MM-dd")),
  );
  let streak = 0;
  let checkDate = now;
  // If today has no logs yet, start from yesterday
  if (!datesWithLogs.has(format(now, "yyyy-MM-dd"))) {
    checkDate = subDays(now, 1);
  }
  while (datesWithLogs.has(format(checkDate, "yyyy-MM-dd"))) {
    streak++;
    checkDate = subDays(checkDate, 1);
  }

  // Type breakdown for chart
  const typeBreakdown = sortedTypes.map(([type, count], i) => ({
    label: TYPE_LABELS[type] ?? type,
    value: count,
    color: BAR_COLORS[i % BAR_COLORS.length],
  }));

  return {
    totalThisMonth,
    avgDuration,
    mostCommon,
    streak,
    typeBreakdown,
  };
}

// ── Main screen ────────────────────────────────────────────────

export default function TrainingPerformanceScreen() {
  const { horseId: paramHorseId } = useLocalSearchParams<{
    horseId?: string;
  }>();
  const { user } = useAuth();

  const { data: horses = [], isPending: horsesLoading } = useHorses(user?.id);
  const [selectedHorseId, setSelectedHorseId] = useState<string | null>(
    paramHorseId ?? null,
  );

  const horseId = selectedHorseId ?? paramHorseId ?? undefined;
  const {
    data: logs = [],
    isPending: logsLoading,
    error: logsError,
    refetch,
  } = useTrainingLogs(horseId);

  const stats = useMemo(() => computeStats(logs), [logs]);

  // Auto-select first horse if none chosen and list loaded
  if (!selectedHorseId && !paramHorseId && horses.length > 0) {
    setSelectedHorseId(horses[0].id);
  }

  // Loading state
  if (horsesLoading || logsLoading) {
    return (
      <View className="flex-1 bg-background">
        <PageHeader title="Сургалтын анализ" showBack />
        <LoadingState text="Ачаалж байна..." />
      </View>
    );
  }

  // Error state
  if (logsError) {
    return (
      <View className="flex-1 bg-background">
        <PageHeader title="Сургалтын анализ" showBack />
        <ErrorState message="Өгөгдөл ачаалахад алдаа гарлаа" onRetry={refetch} />
      </View>
    );
  }

  // No horses
  if (horses.length === 0) {
    return (
      <View className="flex-1 bg-background">
        <PageHeader title="Сургалтын анализ" showBack />
        <EmptyState
          icon="bar-chart-outline"
          title="Морь байхгүй байна"
          subtitle="Эхлэхийн тулд морь нэмнэ үү"
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <PageHeader title="Сургалтын анализ" showBack />

      <HorseSelector
        horses={horses}
        selectedId={selectedHorseId}
        onSelect={setSelectedHorseId}
      />

      <ScrollView className="flex-1 px-4">
        {/* No logs for selected horse */}
        {logs.length === 0 ? (
          <EmptyState
            icon="bar-chart-outline"
            title="Сургалтын тэмдэглэл байхгүй байна"
            subtitle="Энэ морид сургалтын тэмдэглэл нэмнэ үү"
          />
        ) : (
          <>
            {/* ── Stats grid ────────────────────────────── */}
            <View className="flex-row flex-wrap justify-between mb-4">
              <StatCard
                label="Нийт сургалт"
                value={stats.totalThisMonth}
                subtitle="Энэ сар"
                icon="calendar-outline"
              />
              <StatCard
                label="Дундаж хугацаа"
                value={`${stats.avgDuration} мин`}
                icon="time-outline"
              />
              <StatCard
                label="Хамгийн их төрөл"
                value={TYPE_LABELS[stats.mostCommon] ?? "—"}
                icon="trophy-outline"
              />
              <StatCard
                label="Цуваа"
                value={`${stats.streak} өдөр`}
                icon="flame-outline"
              />
            </View>

            {/* ── Type breakdown chart ─────────────────── */}
            {stats.typeBreakdown.length > 0 && (
              <TrainingTypeBarChart data={stats.typeBreakdown} />
            )}

            {/* ── Recent logs timeline ─────────────────── */}
            <Text className="text-sm font-medium text-muted-foreground mb-3">
              Сүүлийн сургалтууд
            </Text>
            {logs.slice(0, 20).map((log) => (
              <LogTimelineCard key={log.id} log={log} />
            ))}
          </>
        )}

        {/* Bottom padding */}
        <View className="h-8" />
      </ScrollView>
    </View>
  );
}
