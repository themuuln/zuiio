import { View, Text, FlatList, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/lib/auth";
import { useRaceVideos, type RaceVideo } from "@/hooks/useRaceVideos";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Loading } from "@/components/ui/Loading";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/states";
import { format } from "date-fns";

function VideoCard({ video }: { video: RaceVideo }) {
  const duration = video.duration_seconds
    ? `${Math.floor(video.duration_seconds / 60)}:${String(video.duration_seconds % 60).padStart(2, "0")}`
    : null;

  return (
    <Card className="mb-3">
      <View className="flex-row items-start gap-3">
        <View className="bg-secondary rounded-xl w-20 h-14 items-center justify-center">
          <Ionicons name="play" size={24} className="text-primary" />
        </View>
        <View className="flex-1">
          <Text className="text-foreground font-semibold" numberOfLines={1}>
            {video.title}
          </Text>
          <Text className="text-muted-foreground text-sm mt-0.5">
            🐴 {video.horse_name ?? "—"}
          </Text>
          {video.race_name && (
            <Badge variant="secondary" className="mt-1">{video.race_name}</Badge>
          )}
          <View className="flex-row gap-3 mt-1">
            <Text className="text-muted-foreground text-xs">
              {format(new Date(video.uploaded_at), "yyyy-MM-dd")}
            </Text>
            {duration && (
              <Text className="text-muted-foreground text-xs">⏱ {duration}</Text>
            )}
          </View>
        </View>
      </View>
    </Card>
  );
}

export default function RaceVideosScreen() {
  const { user } = useAuth();
  const { data: videos = [], isPending, error, refetch } = useRaceVideos(user?.id);

  return (
    <View className="flex-1 bg-background">
      <PageHeader title="Уралдааны бичлэг" subtitle="Морин уралдааны видеонууд" showBack />

      {isPending ? (
        <Loading />
      ) : error ? (
        <ErrorState onRetry={refetch} />
      ) : (
        <FlatList
          data={videos}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <VideoCard video={item} />}
          contentContainerClassName="px-4 pb-20"
          ListEmptyComponent={
            <EmptyState
              icon="videocam-outline"
              title="Бичлэг байхгүй"
              subtitle="Уралдааны бичлэг нэмнэ үү"
            />
          }
        />
      )}
    </View>
  );
}
