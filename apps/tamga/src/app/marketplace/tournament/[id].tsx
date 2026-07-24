import { View, Text, ScrollView } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useHorse } from "@/hooks/useHorses";
import { useTournamentProfiles } from "@/hooks/useTournamentProfiles";
import { useProfile } from "@/hooks/useProfile";
import { LoadingState, ErrorState, EmptyState } from "@/components/states";

const PLACEMENT_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  "1": { bg: "bg-yellow-500", text: "text-white", label: "1-р байр" },
  "2": { bg: "bg-gray-400", text: "text-white", label: "2-р байр" },
  "3": { bg: "bg-amber-600", text: "text-white", label: "3-р байр" },
};

function getPlacementStyle(placement: string | null) {
  if (!placement) return { bg: "bg-gray-200", text: "text-gray-600", label: "Оролцсон" };
  return PLACEMENT_COLORS[placement] ?? { bg: "bg-gray-100", text: "text-gray-600", label: `${placement}-р байр` };
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("mn-MN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function computeStats(profiles: { placement: string | null }[]) {
  const totalCount = profiles.length;
  const wins = profiles.filter((p) => p.placement === "1").length;
  const placements = profiles.filter((p) => p.placement !== null);
  const avgPlacement =
    placements.length > 0
      ? (
          placements.reduce((sum, p) => sum + Number(p.placement), 0) / placements.length
        ).toFixed(1)
      : "—";
  return { totalCount, wins, avgPlacement };
}

export default function TournamentProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: horse, isPending: horsePending, error: horseError, refetch: refetchHorse } = useHorse(id);
  const { data: profiles = [], isPending: profilesPending, error: profilesError, refetch: refetchProfiles } =
    useTournamentProfiles(id);
  const { data: owner } = useProfile(horse?.owner_id);

  if (horsePending || profilesPending) {
    return <LoadingState text="Тэмцээний мэдээллийг ачаалж байна..." />;
  }

  if (horseError || profilesError) {
    return (
      <ErrorState
        message="Тэмцээний мэдээллийг ачаалахад алдаа гарлаа"
        onRetry={() => {
          refetchHorse();
          refetchProfiles();
        }}
      />
    );
  }

  if (!horse) {
    return <ErrorState message="Морь олдсонгүй" />;
  }

  const stats = computeStats(profiles);

  return (
    <ScrollView className="flex-1 bg-background">
      {/* ── Horse Header ─────────────────────────────────────── */}
      <View className="px-4 pt-6 pb-4">
        <Text className="text-3xl font-bold text-foreground">{horse.name}</Text>
        {owner && (
          <View className="flex-row items-center mt-1">
            <Ionicons name="person-outline" size={14} className="text-muted-foreground" />
            <Text className="text-sm text-muted-foreground ml-1">{owner.display_name}</Text>
          </View>
        )}
      </View>

      {/* ── Stats Row ────────────────────────────────────────── */}
      <View className="flex-row px-4 mb-6 gap-3">
        <View className="flex-1 bg-card rounded-xl p-4 items-center border border-border">
          <Text className="text-2xl font-bold text-foreground">{stats.totalCount}</Text>
          <Text className="text-xs text-muted-foreground mt-1">Нийт тэмцээн</Text>
        </View>
        <View className="flex-1 bg-card rounded-xl p-4 items-center border border-border">
          <Text className="text-2xl font-bold text-yellow-600">{stats.wins}</Text>
          <Text className="text-xs text-muted-foreground mt-1">Ялалт</Text>
        </View>
        <View className="flex-1 bg-card rounded-xl p-4 items-center border border-border">
          <Text className="text-2xl font-bold text-foreground">{stats.avgPlacement}</Text>
          <Text className="text-xs text-muted-foreground mt-1">Дундаж байр</Text>
        </View>
      </View>

      {/* ── Tournament History ───────────────────────────────── */}
      <View className="px-4 pb-8">
        <Text className="text-lg font-semibold text-foreground mb-3">Тэмцээний түүх</Text>

        {profiles.length === 0 ? (
          <EmptyState
            icon="trophy-outline"
            title="Тэмцээний түүх байхгүй байна"
            subtitle="Энэ морь одоогоор тэмцээнд оролцоогүй байна"
          />
        ) : (
          profiles.map((profile) => {
            const style = getPlacementStyle(profile.placement);
            return (
              <View key={profile.id} className="bg-card rounded-xl p-4 mb-3 border border-border">
                <View className="flex-row items-center justify-between">
                  <Text className="text-base font-semibold text-foreground flex-1">{profile.tournament_name}</Text>
                  <View className={`px-3 py-1 rounded-full ${style.bg}`}>
                    <Text className={`text-xs font-semibold ${style.text}`}>{style.label}</Text>
                  </View>
                </View>
                {profile.date && (
                  <View className="flex-row items-center mt-2">
                    <Ionicons name="calendar-outline" size={14} className="text-muted-foreground" />
                    <Text className="text-sm text-muted-foreground ml-1">{formatDate(profile.date)}</Text>
                  </View>
                )}
                {profile.notes && (
                  <Text className="text-sm text-muted-foreground mt-2">{profile.notes}</Text>
                )}
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}
