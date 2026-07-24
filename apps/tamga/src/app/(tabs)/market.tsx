import { View, Text, FlatList, ActivityIndicator } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { useListingsPaginated } from "@/hooks/useListingsPaginated";
import type { Listing } from "@/hooks/useListings";

function ListingCard({ listing }: { listing: Listing }) {
  const typeLabel =
    listing.listing_type === "sale"
      ? "Зарна"
      : listing.listing_type === "lease"
        ? "Түрээслүүлнэ"
        : "Үржүүлгэнд";

  return (
    <View className="bg-card rounded-xl p-4 mb-3 border border-border">
      <Text className="text-lg font-bold text-foreground">
        {listing.horse_name ?? "Морь"}
      </Text>
      <Text className="text-muted-foreground">
        {typeLabel}
        {listing.horse_gender ? ` · ${listing.horse_gender === "stallion" ? "Эр" : listing.horse_gender === "mare" ? "Эм" : "Тайвсан"}` : ""}
      </Text>
      {listing.price_mnt != null && (
        <Text className="text-primary font-semibold mt-1">
          {listing.price_mnt.toLocaleString()} ₮
        </Text>
      )}
      {listing.location && (
        <Text className="text-muted-foreground text-sm mt-1">
          📍 {listing.location}
        </Text>
      )}
    </View>
  );
}

export default function MarketScreen() {
  const queryClient = useQueryClient();
  const {
    data,
    isPending,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useListingsPaginated();

  const listings = data?.pages.flatMap((page) => page) ?? [];

  return (
    <View className="flex-1 bg-background">
      <View className="px-4 pt-12 pb-4">
        <Text className="text-2xl font-bold text-foreground">Морины зах</Text>
        <Text className="text-muted-foreground">Морин худалдах, худалдан авах</Text>
      </View>

      <FlatList
        data={listings}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ListingCard listing={item} />}
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
            <View className="flex-1 items-center justify-center px-6 mt-20">
              <Text className="text-muted-foreground text-center">
                Зар байхгүй байна
              </Text>
            </View>
          ) : null
        }
        onRefresh={() => queryClient.resetQueries({ queryKey: ["listings-paginated"] })}
        refreshing={isPending}
      />
    </View>
  );
}
