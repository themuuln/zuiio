import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  useBreederProfile,
  useBreederHorses,
  type BreederHorse,
} from "@/hooks/useSocial";
import { PageHeader } from "@/components/ui/PageHeader";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Loading } from "@/components/ui/Loading";
import { ErrorState } from "@/components/states";

// ---------------------------------------------------------------------------
// Stats grid
// ---------------------------------------------------------------------------

function StatCard({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string | number;
}) {
  return (
    <View className="flex-1 items-center bg-card rounded-xl p-4 border border-border">
      <Ionicons name={icon} size={24} className="text-primary" />
      <Text className="text-foreground font-bold text-xl mt-2">{value}</Text>
      <Text className="text-muted-foreground text-xs mt-1">{label}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Horse card (compact)
// ---------------------------------------------------------------------------

function HorseCard({ horse }: { horse: BreederHorse }) {
  return (
    <Card className="flex-row items-center gap-3 mb-2">
      {horse.image_url ? (
        <Avatar uri={horse.image_url} name={horse.name} size="sm" />
      ) : (
        <View className="w-8 h-8 rounded-full bg-muted items-center justify-center">
          <Ionicons name="paw-outline" size={16} className="text-muted-foreground" />
        </View>
      )}
      <View className="flex-1">
        <Text className="text-foreground font-medium text-sm" numberOfLines={1}>
          {horse.name}
        </Text>
        <Text className="text-muted-foreground text-xs">
          {[horse.coat, horse.gender].filter(Boolean).join(" · ") || "Мэдээлэл байхгүй"}
        </Text>
      </View>
      {horse.birth_year && (
        <Text className="text-muted-foreground text-xs">{horse.birth_year}</Text>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function BreederProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { data: profile, isPending, error } = useBreederProfile(id);
  const { data: horses = [] } = useBreederHorses(profile?.user_id);

  if (isPending) return <Loading />;
  if (error || !profile) {
    return <ErrorState message="Үржүүлэгч олдсонгүй" onRetry={() => router.back()} />;
  }

  return (
    <View className="flex-1 bg-background">
      <PageHeader title={profile.display_name} showBack />

      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        {/* ---- Profile header ---- */}
        <View className="items-center mb-6">
          <Avatar uri={profile.avatar_url} name={profile.display_name} size="lg" />

          <View className="flex-row items-center gap-2 mt-3">
            <Text className="text-foreground font-bold text-xl">
              {profile.display_name}
            </Text>
            {profile.verified && (
              <Ionicons name="checkmark-circle" size={20} color="#3b82f6" />
            )}
          </View>

          {profile.region && (
            <Text className="text-muted-foreground text-sm mt-1">
              {profile.region}
            </Text>
          )}

          {profile.speciality && (
            <Badge variant="secondary" className="mt-2">
              {profile.speciality}
            </Badge>
          )}

          {profile.bio && (
            <Text className="text-muted-foreground text-sm text-center mt-3 px-4 leading-5">
              {profile.bio}
            </Text>
          )}
        </View>

        {/* ---- Stats grid ---- */}
        <View className="flex-row gap-3 mb-6">
          <StatCard
            icon="paw-outline"
            label="Морь"
            value={profile.total_horses}
          />
          <StatCard
            icon="trophy-outline"
            label="Ялалт"
            value={profile.total_wins}
          />
          <StatCard
            icon="star-outline"
            label="Үнэлгээ"
            value={profile.rating?.toFixed(1) ?? "—"}
          />
        </View>

        {/* ---- Recent horses ---- */}
        {horses.length > 0 && (
          <View className="mb-8">
            <Text className="text-foreground font-semibold text-lg mb-3">
              Сүүлийн морь
            </Text>
            {horses.map((horse) => (
              <HorseCard key={horse.id} horse={horse} />
            ))}
          </View>
        )}

        {horses.length === 0 && (
          <View className="items-center py-8">
            <Ionicons name="paw-outline" size={32} className="text-muted-foreground" />
            <Text className="text-muted-foreground text-sm mt-2">
              Морь бүртгэлгүй байна
            </Text>
          </View>
        )}

        <View className="h-8" />
      </ScrollView>
    </View>
  );
}
