import { View, Text, FlatList, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/lib/auth";
import { useStables, type Stable } from "@/hooks/useStable";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Loading } from "@/components/ui/Loading";
import { EmptyState } from "@/components/ui/EmptyState";
import { FAB } from "@/components/ui/FAB";
import { ErrorState } from "@/components/states";
import { Progress } from "@/components/ui/Progress";

function StableCard({ stable }: { stable: Stable }) {
  const router = useRouter();
  const usage = stable.capacity && stable.current_count != null
    ? (stable.current_count / stable.capacity) * 100
    : null;

  return (
    <TouchableOpacity onPress={() => router.push(`/stable/${stable.id}` as any)}>
      <Card className="mb-3">
        <View className="flex-row justify-between items-start mb-2">
          <Text className="text-foreground font-semibold text-base">{stable.name}</Text>
          {stable.current_count != null && stable.capacity && (
            <Badge variant={stable.current_count >= stable.capacity ? "destructive" : "secondary"}>
              {stable.current_count}/{stable.capacity}
            </Badge>
          )}
        </View>
        {stable.location && (
          <Text className="text-muted-foreground text-sm">📍 {stable.location}</Text>
        )}
        {usage != null && (
          <View className="mt-2">
            <Progress value={usage} />
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );
}

export default function StableScreen() {
  const { user } = useAuth();
  const { data: stables = [], isPending, error, refetch } = useStables(user?.id);

  return (
    <View className="flex-1 bg-background">
      <PageHeader title="Хашаа" subtitle="Морины хашаа удирдалгаа" showBack />

      {isPending ? (
        <Loading />
      ) : error ? (
        <ErrorState onRetry={refetch} />
      ) : (
        <FlatList
          data={stables}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <StableCard stable={item} />}
          contentContainerClassName="px-4 pb-20"
          ListEmptyComponent={
            <EmptyState
              icon="home-outline"
              title="Хашаа байхгүй"
              subtitle="Шинэ хашаа нэмнэ үү"
            />
          }
        />
      )}
    </View>
  );
}
