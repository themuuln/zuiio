import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useLeaderboard, type LeaderboardEntry } from "@/hooks/useSocial";
import { PageHeader } from "@/components/ui/PageHeader";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Loading } from "@/components/ui/Loading";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/states";

// ---------------------------------------------------------------------------
// Medal helpers
// ---------------------------------------------------------------------------

const MEDAL_ICON: Record<number, keyof typeof Ionicons.glyphMap> = {
  1: "trophy",
  2: "medal",
  3: "ribbon",
};

const MEDAL_COLOR: Record<number, string> = {
  1: "#FFD700",
  2: "#C0C0C0",
  3: "#CD7F32",
};

function RankBadge({ rank }: { rank: number }) {
  if (rank <= 3) {
    return (
      <View className="items-center justify-center w-10">
        <Ionicons
          name={MEDAL_ICON[rank] ?? "ellipse"}
          size={22}
          color={MEDAL_COLOR[rank]}
        />
        <Text className="text-xs font-bold mt-0.5" style={{ color: MEDAL_COLOR[rank] }}>
          #{rank}
        </Text>
      </View>
    );
  }

  return (
    <View className="items-center justify-center w-10">
      <Text className="text-lg font-bold text-muted-foreground">#{rank}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Breeder row
// ---------------------------------------------------------------------------

function BreederRow({ entry }: { entry: LeaderboardEntry }) {
  const router = useRouter();

  return (
    <TouchableOpacity
      onPress={() => router.push(`/social/profile/${entry.id}`)}
      activeOpacity={0.7}
    >
      <Card className="flex-row items-center gap-3 mb-3">
        <RankBadge rank={entry.rank} />

        <Avatar uri={entry.avatar_url} name={entry.display_name} size="md" />

        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <Text className="text-foreground font-semibold" numberOfLines={1}>
              {entry.display_name}
            </Text>
            {entry.verified && (
              <Ionicons name="checkmark-circle" size={14} color="#3b82f6" />
            )}
          </View>
          {entry.region && (
            <Text className="text-muted-foreground text-xs" numberOfLines={1}>
              {entry.region}
            </Text>
          )}
          {entry.speciality && (
            <Badge variant="secondary" className="mt-1 self-start">
              {entry.speciality}
            </Badge>
          )}
        </View>

        <View className="items-end">
          <View className="flex-row items-center gap-1">
            <Ionicons name="star" size={14} color="#eab308" />
            <Text className="text-foreground font-semibold text-sm">
              {entry.rating?.toFixed(1) ?? "—"}
            </Text>
          </View>
          <Text className="text-muted-foreground text-xs mt-1">
            {entry.total_wins} ялалт
          </Text>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function LeaderboardScreen() {
  const { data: entries, isPending, error } = useLeaderboard();

  return (
    <View className="flex-1 bg-background">
      <PageHeader title="Элбэрэгчдийн жагсаалт" subtitle="Шилдэг үржүүлэгчид" />

      {isPending && <Loading />}
      {error && <ErrorState message="Мэдээлэл ачаалахад алдаа гарлаа" />}
      {!isPending && !error && (!entries || entries.length === 0) && (
        <EmptyState
          icon="people-outline"
          title="Жагсаалт хоосон байна"
          subtitle="Үржүүлэгчид профиль үүсгэснээр жагсаалтад нэмэгдэнэ"
        />
      )}

      {entries && entries.length > 0 && (
        <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
          <View className="py-2">
            {entries.map((entry) => (
              <BreederRow key={entry.id} entry={entry} />
            ))}
          </View>
          <View className="h-8" />
        </ScrollView>
      )}
    </View>
  );
}
