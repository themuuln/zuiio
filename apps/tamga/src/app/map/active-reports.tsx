import { View, Text, FlatList, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { formatDistanceToNow } from "date-fns";
import { mn } from "date-fns/locale/mn";
import { useLostHorses, type LostHorseReport } from "@/hooks/useLostHorses";
import { LoadingState, EmptyState, ErrorState } from "@/components/states";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";

function isUrgent(report: LostHorseReport): boolean {
  const created = new Date(report.created_at);
  const now = new Date();
  return now.getTime() - created.getTime() < 24 * 60 * 60 * 1000;
}

function ReportCard({ report, onPress }: { report: LostHorseReport; onPress: () => void }) {
  const location = [report.location_aimag, report.location_sum, report.location_name]
    .filter(Boolean)
    .join(", ");
  const urgent = isUrgent(report);

  return (
    <TouchableOpacity
      className="bg-card rounded-xl p-4 mb-3 border border-border"
      onPress={onPress}
      accessibilityLabel={`${report.animal_type ?? "Морь"} - ${location || "Байршлүй"}`}
      accessibilityRole="button"
    >
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-lg font-bold text-foreground flex-1" numberOfLines={1}>
          {report.animal_type ?? "Морь"} — {report.breed ?? ""}
        </Text>
        <Badge variant={urgent ? "destructive" : "warning"}>
          {urgent ? "Яаралтай" : "Эрэлд байна"}
        </Badge>
      </View>

      <View className="flex-row items-center gap-1.5 mb-1">
        <Ionicons name="location-outline" size={14} className="text-muted-foreground" />
        <Text className="text-muted-foreground text-sm" numberOfLines={1}>
          {location || "Байршлүй"}
        </Text>
      </View>

      <View className="flex-row items-center gap-1.5 mb-1">
        <Ionicons name="time-outline" size={14} className="text-muted-foreground" />
        <Text className="text-muted-foreground text-sm">
          {report.last_seen_at
            ? formatDistanceToNow(new Date(report.last_seen_at), { addSuffix: true, locale: mn })
            : formatDistanceToNow(new Date(report.created_at), { addSuffix: true, locale: mn })}
        </Text>
      </View>

      {report.pricing_tier && (
        <View className="flex-row items-center gap-1.5 mt-1">
          <Ionicons name="cash-outline" size={14} className="text-emerald-600" />
          <Text className="text-emerald-600 text-sm font-medium">
            {report.pricing_tier}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function ActiveReportsScreen() {
  const router = useRouter();
  const { data: reports, isPending, error, refetch, isRefetching } = useLostHorses();

  const activeReports = reports?.filter((r) => r.status !== "resolved") ?? [];

  if (isPending) {
    return <LoadingState text="Хайж байна..." />;
  }

  if (error) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  return (
    <View className="flex-1 bg-background">
      <PageHeader
        title="Идэвхитэй зарууд"
        subtitle={`${activeReports.length} эрэлд байна`}
        showBack
      />

      <FlatList
        data={activeReports}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ReportCard
            report={item}
            onPress={() =>
              router.push({ pathname: "/lost-horse/report", params: { id: item.id } })
            }
          />
        )}
        contentContainerClassName="px-4 pb-20"
        ListEmptyComponent={
          <EmptyState icon="checkmark-circle" title="Идэвхитэй зар байхгүй" subtitle="Бүх зарууд шийдэгдсэн байна" />
        }
        onRefresh={() => refetch()}
        refreshing={isRefetching}
      />
    </View>
  );
}
