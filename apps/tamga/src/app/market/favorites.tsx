import { useRef, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, Animated, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Swipeable } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import type { Listing } from "@/hooks/useListings";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";

interface SavedListingRow {
  id: string;
  user_id: string;
  listing_id: string;
  created_at: string;
  listings: Listing | null;
}

function formatPrice(price: number | null): string | null {
  if (price == null) return null;
  return `${price.toLocaleString()} ₮`;
}

function ListingCard({
  listing,
  onDelete,
}: {
  listing: Listing;
  onDelete: () => void;
}) {
  const router = useRouter();
  const swipeableRef = useRef<Swipeable>(null);

  const typeLabel =
    listing.listing_type === "sale"
      ? "Зарна"
      : listing.listing_type === "lease"
        ? "Түрээслүүлнэ"
        : "Үржүүлгэнд";

  const genderLabel =
    listing.horse_gender === "stallion"
      ? "Эр"
      : listing.horse_gender === "mare"
        ? "Эм"
        : listing.horse_gender
          ? "Тайвсан"
          : null;

  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
  ) => {
    const trans = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [80, 0],
    });

    return (
      <Animated.View style={{ transform: [{ translateX: trans }] }}>
        <TouchableOpacity
          onPress={() => {
            swipeableRef.current?.close();
            Alert.alert(
              "Хадгалснаас устгах",
              "Энэ зарыг хадгалснаас устгах уу?",
              [
                { text: "Цуцлах", style: "cancel" },
                { text: "Устгах", style: "destructive", onPress: onDelete },
              ],
            );
          }}
          className="bg-destructive justify-center items-center px-5 h-full"
        >
          <Ionicons name="trash-outline" size={22} color="#fff" />
          <Text className="text-white text-xs mt-1">Устгах</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <Swipeable ref={swipeableRef} renderRightActions={renderRightActions}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => router.push(`/market/listing/${listing.id}` as any)}
        className="bg-card rounded-xl p-4 mb-3 border border-border"
      >
        <View className="flex-row items-start justify-between">
          <View className="flex-1 mr-3">
            <Text className="text-lg font-bold text-foreground">
              {listing.horse_name ?? "Морь"}
            </Text>
            <Text className="text-muted-foreground">
              {typeLabel}
              {genderLabel ? ` · ${genderLabel}` : ""}
            </Text>
          </View>
          <Badge variant="secondary">
            {listing.listing_type === "sale"
              ? "Худалдаа"
              : listing.listing_type === "lease"
                ? "Түрээс"
                : "Үржүүлэг"}
          </Badge>
        </View>

        {listing.price_mnt != null && (
          <Text className="text-primary font-semibold mt-2">
            {formatPrice(listing.price_mnt)}
          </Text>
        )}

        {listing.location && (
          <Text className="text-muted-foreground text-sm mt-1">
            📍 {listing.location}
          </Text>
        )}
      </TouchableOpacity>
    </Swipeable>
  );
}

function CardSkeleton() {
  return (
    <View className="bg-card rounded-xl p-4 mb-3 border border-border">
      <Skeleton width="60%" height={20} className="mb-2" />
      <Skeleton width="40%" height={14} className="mb-2" />
      <Skeleton width="30%" height={16} className="mb-2" />
      <Skeleton width="50%" height={14} />
    </View>
  );
}

export default function FavoritesScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data, isPending, error } = useQuery({
    queryKey: ["favorites", user?.id],
    queryFn: async () => {
      if (!user?.id) return [] as SavedListingRow[];
      const { data: rows, error: queryError } = await supabase
        .from("saved_listings")
        .select("*, listings(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (queryError) throw queryError;
      return (rows ?? []) as SavedListingRow[];
    },
    enabled: !!user?.id,
  });

  const removeMutation = useMutation({
    mutationFn: async (savedListingId: string) => {
      const { error: deleteError } = await supabase
        .from("saved_listings")
        .delete()
        .eq("id", savedListingId);

      if (deleteError) throw deleteError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites", user?.id] });
    },
  });

  const listings = (data ?? [])
    .filter((row) => row.listings != null)
    .map((row) => ({ savedId: row.id, listing: row.listings! }));

  const handleDelete = useCallback(
    (savedId: string) => {
      removeMutation.mutate(savedId);
    },
    [removeMutation],
  );

  if (error) {
    return (
      <View className="flex-1 bg-background">
        <PageHeader
          title="Хадгалсан зарууд"
          subtitle="Таалагдсан моринууд"
          showBack
        />
        <EmptyState
          icon="alert-circle-outline"
          title="Алдаа гарлаа"
          subtitle="Дахин оролдоно уу"
          action={
            <TouchableOpacity
              onPress={() =>
                queryClient.invalidateQueries({
                  queryKey: ["favorites", user?.id],
                })
              }
              className="bg-primary px-6 py-3 rounded-xl"
            >
              <Text className="text-primary-foreground font-semibold">
                Дахин оролдох
              </Text>
            </TouchableOpacity>
          }
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <PageHeader
        title="Хадгалсан зарууд"
        subtitle="Таалагдсан моринууд"
        showBack
      />

      {isPending ? (
        <View className="px-4 pt-2">
          {[1, 2, 3].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </View>
      ) : (
        <FlatList
          data={listings}
          keyExtractor={(item) => item.savedId}
          renderItem={({ item }) => (
            <ListingCard
              listing={item.listing}
              onDelete={() => handleDelete(item.savedId)}
            />
          )}
          contentContainerClassName="px-4 pb-20"
          ListEmptyComponent={
            <EmptyState
              icon="heart-outline"
              title="Хадгалсан зар байхгүй"
              subtitle="Дуртай моринуудаа хадгалж болно"
              action={
                <TouchableOpacity
                  onPress={() => router.push("/(tabs)/market")}
                  className="bg-primary px-6 py-3 rounded-xl"
                >
                  <Text className="text-primary-foreground font-semibold">
                    Зар үзэх
                  </Text>
                </TouchableOpacity>
              }
            />
          }
        />
      )}
    </View>
  );
}
