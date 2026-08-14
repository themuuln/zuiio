import { View, Text, ScrollView } from "react-native";
import { useAuthStore } from "@/src/config/stores";
import { PreviewGymRepository } from "@/src/data/preview-repository";
import { useQuery } from "@tanstack/react-query";

const repo = new PreviewGymRepository();

export default function ProgressScreen() {
  const user = useAuthStore((s) => s.currentUser);

  const { data: measurements, isPending: measurementsLoading } = useQuery({
    queryKey: ["measurements", user?.id],
    queryFn: () => repo.fetchMeasurements(user!.id),
    enabled: !!user,
  });

  const { data: prs, isPending: prsLoading } = useQuery({
    queryKey: ["personal-records", user?.id],
    queryFn: () => repo.fetchPersonalRecords(user!.id),
    enabled: !!user,
  });

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="px-6 pt-6 pb-4">
        <Text className="text-2xl font-bold text-foreground">Ахиц</Text>
        <Text className="text-muted-foreground mt-1">
          Биеийн хэмжилт ба хувийн рекордууд
        </Text>
      </View>

      {/* Personal Records */}
      <View className="px-6 mb-6">
        <Text className="text-sm font-medium text-muted-foreground mb-3">
          Хувийн рекордууд
        </Text>
        {prsLoading ? (
          <Text className="text-muted-foreground">Ачаалж байна...</Text>
        ) : (
          <View className="gap-2">
            {prs?.map((pr) => (
              <View
                key={pr.id}
                className="flex-row justify-between items-center rounded-xl border border-border bg-card p-4"
              >
                <View>
                  <Text className="font-semibold text-card-foreground">
                    {pr.exerciseName}
                  </Text>
                  <Text className="text-sm text-muted-foreground">
                    {pr.date}
                  </Text>
                </View>
                <View className="items-end">
                  <Text className="text-lg font-bold text-accent">
                    {pr.weight}kg
                  </Text>
                  <Text className="text-xs text-muted-foreground">
                    × {pr.reps}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Body Measurements */}
      <View className="px-6 mb-6">
        <Text className="text-sm font-medium text-muted-foreground mb-3">
          Биеийн хэмжилт
        </Text>
        {measurementsLoading ? (
          <Text className="text-muted-foreground">Ачаалж байна...</Text>
        ) : measurements && measurements.length > 0 ? (
          <View className="rounded-xl border border-border bg-card p-4">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="font-semibold text-card-foreground">
                {measurements[0].date}
              </Text>
              <View className="rounded-full bg-accent/10 px-3 py-1">
                <Text className="text-xs font-medium text-accent">
                  Сүүлийн
                </Text>
              </View>
            </View>

            <View className="flex-row flex-wrap gap-3">
              <MeasurementBadge label="Жин" value={`${measurements[0].weight}kg`} />
              <MeasurementBadge label="Бэлхийн" value={`${measurements[0].waist}cm`} />
              <MeasurementBadge label="Цээжний" value={`${measurements[0].chest}cm`} />
              <MeasurementBadge label="Гуяны" value={`${measurements[0].hips}cm`} />
              {measurements[0].arms && (
                <MeasurementBadge label="Гарын" value={`${measurements[0].arms}cm`} />
              )}
              {measurements[0].thighs && (
                <MeasurementBadge label="Бөөрний" value={`${measurements[0].thighs}cm`} />
              )}
            </View>

            {/* Trend comparison */}
            {measurements.length >= 2 && (
              <View className="mt-4 pt-3 border-t border-border">
                <Text className="text-xs text-muted-foreground mb-2">
                  Өөрчлөлт (сүүлийн 2 сар)
                </Text>
                <View className="flex-row gap-3">
                  <TrendBadge
                    label="Жин"
                    current={measurements[0].weight}
                    previous={measurements[1].weight}
                    unit="kg"
                  />
                  <TrendBadge
                    label="Бэлхийн"
                    current={measurements[0].waist}
                    previous={measurements[1].waist}
                    unit="cm"
                  />
                </View>
              </View>
            )}
          </View>
        ) : (
          <Text className="text-muted-foreground">
            Хэмжилт бүртгээгүй байна
          </Text>
        )}
      </View>
    </ScrollView>
  );
}

function MeasurementBadge({ label, value }: { label: string; value: string }) {
  return (
    <View className="rounded-lg bg-muted px-3 py-2">
      <Text className="text-xs text-muted-foreground">{label}</Text>
      <Text className="text-sm font-semibold text-foreground">{value}</Text>
    </View>
  );
}

function TrendBadge({
  label,
  current,
  previous,
  unit,
}: {
  label: string;
  current: number | null;
  previous: number | null;
  unit: string;
}) {
  if (current == null || previous == null) return null;
  const diff = current - previous;
  const isUp = diff > 0;
  const isDown = diff < 0;

  return (
    <View className="rounded-lg bg-muted px-3 py-2">
      <Text className="text-xs text-muted-foreground">{label}</Text>
      <Text
        className={`text-sm font-semibold ${
          isDown ? "text-green-600" : isUp ? "text-red-500" : "text-foreground"
        }`}
      >
        {isDown ? "▼" : isUp ? "▲" : "—"} {Math.abs(diff).toFixed(1)}
        {unit}
      </Text>
    </View>
  );
}
