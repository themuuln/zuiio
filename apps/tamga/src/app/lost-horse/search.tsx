import { View, Text, FlatList, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { formatDistanceToNow } from "date-fns";
import { mn } from "date-fns/locale/mn";
import { useLostHorses, type LostHorseReport } from "@/hooks/useLostHorses";
import { LoadingState, EmptyState, ErrorState } from "@/components/states";

const ULAANBAATAR: [number, number] = [106.9057, 47.9077];

function formatTimeAgo(dateString: string): string {
  try {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: mn });
  } catch {
    return dateString;
  }
}

function HorseCard({ horse, onPress }: { horse: LostHorseReport; onPress: () => void }) {
  const location = [horse.location_aimag, horse.location_sum, horse.location_name].filter(Boolean).join(", ");
  return (
    <TouchableOpacity
      className="bg-card rounded-xl p-4 mb-3 border border-border"
      onPress={onPress}
    >
      <Text className="text-lg font-bold text-foreground">
        {horse.animal_type ?? "Морь"} — {horse.breed ?? ""}
      </Text>
      <Text className="text-muted-foreground">
        {location || "Байршлүй"} · {formatTimeAgo(horse.created_at)}
      </Text>
      {horse.sighting_count != null && horse.sighting_count > 0 && (
        <Text className="text-amber-600 text-sm mt-1">
          {horse.sighting_count} мэдээлэл
        </Text>
      )}
    </TouchableOpacity>
  );
}

export default function LostHorseSearchScreen() {
  const router = useRouter();
  const { data: horses, isPending, error, refetch, isRefetching } = useLostHorses();

  if (isPending) {
    return <LoadingState text="Хайж байна..." />;
  }

  if (error) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  if (!horses || horses.length === 0) {
    return (
      <View className="flex-1 bg-background">
        <EmptyState icon="paw" title="Алдагдсан морь байхгүй" subtitle="Маш сайн!" />
      </View>
    );
  }

  const horsesWithCoords = horses.filter(
    (h) => h.last_seen_lat != null && h.last_seen_lng != null,
  );

  return (
    <View className="flex-1 bg-background">
      <View className="px-4 pt-12 pb-4">
        <Text className="text-2xl font-bold text-foreground">Алдагдсан морь</Text>
        <Text className="text-muted-foreground">Хайлтын газар</Text>
      </View>

      <FlatList
        data={horses}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <HorseCard
            horse={item}
            onPress={() => {
              const location = [item.location_aimag, item.location_sum, item.location_name].filter(Boolean).join(", ");
              Alert.alert(
                "Алдагдсан морь",
                `${item.animal_type ?? "Морь"} — ${item.breed ?? ""}\n${location || "Байршлүй"}\nХолбоо: ${item.contact_phone ?? "Байхгүй"}`,
              );
            }}
          />
        )}
        contentContainerClassName="px-4 pb-20"
        ListEmptyComponent={<EmptyState icon="paw" title="Морь байхгүй" />}
        onRefresh={() => refetch()}
        refreshing={isRefetching}
      />

      <TouchableOpacity
        className="absolute bottom-6 right-6 bg-primary w-14 h-14 rounded-full items-center justify-center shadow-lg"
        onPress={() => router.push("/lost-horse/report")}
      >
        <Ionicons name="add" size={28} color="white" />
      </TouchableOpacity>
    </View>
  );
}
