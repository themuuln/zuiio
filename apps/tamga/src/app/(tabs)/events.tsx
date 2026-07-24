import { View, Text, FlatList, ActivityIndicator } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useEventsPaginated } from "@/hooks/useEventsPaginated";
import type { Event } from "@/hooks/useEvents";

function EventCard({ event }: { event: Event }) {
  const date = new Date(event.date).toLocaleDateString("mn-MN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <View className="bg-card rounded-xl p-4 mb-3 border border-border">
      <Text className="text-lg font-bold text-foreground">{event.title}</Text>
      <Text className="text-muted-foreground">
        {event.horse_name} · {event.event_type}
      </Text>
      <Text className="text-muted-foreground text-sm mt-1">{date}</Text>
      {event.location && (
        <Text className="text-muted-foreground text-sm">
          📍 {event.location}
        </Text>
      )}
      {event.result && (
        <Text className="text-primary font-semibold mt-1">{event.result}</Text>
      )}
    </View>
  );
}

export default function EventsScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const {
    data,
    isPending,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useEventsPaginated(user?.id);

  const events = data?.pages.flatMap((page) => page) ?? [];

  return (
    <View className="flex-1 bg-background">
      <View className="px-4 pt-12 pb-4">
        <Text className="text-2xl font-bold text-foreground">Эвентүүд</Text>
        <Text className="text-muted-foreground">Уралдаан, үзэсгэлэн, сургалт</Text>
      </View>

      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <EventCard event={item} />}
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
                Эвент байхгүй байна
              </Text>
            </View>
          ) : null
        }
        onRefresh={() => queryClient.resetQueries({ queryKey: ["events-paginated", user?.id] })}
        refreshing={isPending}
      />
    </View>
  );
}
