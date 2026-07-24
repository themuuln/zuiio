import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useHorsesPaginated } from "@/hooks/useHorsesPaginated";
import type { Horse } from "@/hooks/useHorses";

function HorseCard({ horse }: { horse: Horse }) {
  const router = useRouter();
  const age = new Date().getFullYear() - horse.birth_year;

  return (
    <TouchableOpacity
      className="bg-card rounded-xl p-4 mb-3 border border-border"
      onPress={() => router.push(`/horse/${horse.id}`)}
    >
      <Text className="text-lg font-bold text-foreground">{horse.name}</Text>
      <Text className="text-muted-foreground">
        {horse.coat} · {horse.gender === "stallion" ? "Эр" : horse.gender === "mare" ? "Эм" : "Тайвсан"} · {age} нас
      </Text>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const {
    data,
    isPending,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useHorsesPaginated(user?.id);

  const horses = data?.pages.flatMap((page) => page) ?? [];

  return (
    <View className="flex-1 bg-background">
      {/* ── Header ── */}
      <View className="px-4 pb-4" style={{ paddingTop: insets.top + 12 }}>
        <Text className="text-2xl font-bold text-foreground">Миний морь</Text>
        <Text className="text-muted-foreground text-sm">Тамга — Морины менежмент</Text>
      </View>

      <FlatList
        data={horses}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <HorseCard horse={item} />}
        contentContainerClassName="px-4 pb-20"
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          isFetchingNextPage ? (
            <View className="py-4 items-center">
              <ActivityIndicator size="small" />
            </View>
          ) : null
        }
        ListEmptyComponent={
          !isPending ? (
            <View className="flex-1 items-center justify-center px-8 mt-24">
              {/* Illustration circle */}
              <View className="w-24 h-24 rounded-full bg-muted items-center justify-center mb-6">
                <Ionicons name="paw" size={40} className="text-muted-foreground" />
              </View>
              {/* Text */}
              <Text className="text-xl font-bold text-foreground text-center">
                Морь байхгүй байна
              </Text>
              <Text className="text-muted-foreground mt-2 text-center text-sm leading-5">
                Таны эзэмшилд байгаа морид энд гарч ирэх болно.{"\n"}Доорх товчийг дарж шинэ морь нэмнэ үү.
              </Text>
              {/* CTA button */}
              <TouchableOpacity
                className="mt-8 bg-primary flex-row items-center gap-2 px-6 py-3 rounded-full"
                onPress={() => router.push("/horse/new")}
              >
                <Ionicons name="add" size={20} color="white" />
                <Text className="text-primary-foreground font-semibold">Морь нэмэх</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
        onRefresh={() => queryClient.resetQueries({ queryKey: ["horses-paginated", user?.id] })}
        refreshing={isPending}
      />

      {/* ── FAB ── */}
      <TouchableOpacity className="absolute bottom-6 right-6 bg-primary w-14 h-14 rounded-full items-center justify-center shadow-lg">
        <Ionicons name="add" size={28} color="white" />
      </TouchableOpacity>
    </View>
  );
}
