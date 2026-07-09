import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase";

export default function PlayerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const supabase = createClient();

  const { data: player, isPending } = useQuery({
    queryKey: ["player", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("players")
        .select(`
          *,
          team_seasons (
            id,
            team:teams (name, slug),
            season:seasons (name)
          )
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  if (isPending) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!player) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-lg">Тоглогч олдсонгүй</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-background">
      {/* Player Header */}
      <View className="p-4 border-b border-border items-center">
        <View className="w-20 h-20 rounded-full bg-muted items-center justify-center mb-3">
          <Text className="text-3xl font-bold text-muted-foreground">
            {player.jersey_number || "?"}
          </Text>
        </View>
        <Text className="text-2xl font-bold">
          {player.canonical_name || player.name_latin || "Тодорхойгүй"}
        </Text>
        {player.name_latin && player.canonical_name && (
          <Text className="text-muted-foreground mt-1">
            {player.name_latin}
          </Text>
        )}
      </View>

      {/* Player Info */}
      <View className="p-4 space-y-3">
        {player.position && (
          <View className="flex-row justify-between">
            <Text className="text-muted-foreground">Байрлал</Text>
            <Text className="font-medium">{player.position}</Text>
          </View>
        )}
        {player.height_cm && (
          <View className="flex-row justify-between">
            <Text className="text-muted-foreground">Өндөр</Text>
            <Text className="font-medium">{player.height_cm} см</Text>
          </View>
        )}
        {player.weight_kg && (
          <View className="flex-row justify-between">
            <Text className="text-muted-foreground">Жин</Text>
            <Text className="font-medium">{player.weight_kg} кг</Text>
          </View>
        )}
        {player.date_of_birth && (
          <View className="flex-row justify-between">
            <Text className="text-muted-foreground">Төрсөн огноо</Text>
            <Text className="font-medium">
              {new Date(player.date_of_birth).toLocaleDateString("mn-MN")}
            </Text>
          </View>
        )}
      </View>

      {/* Teams */}
      <View className="p-4 border-t border-border">
        <Text className="text-lg font-bold mb-3">Багууд</Text>
        {player.team_seasons?.length === 0 ? (
          <Text className="text-muted-foreground">Баг байхгүй</Text>
        ) : (
          player.team_seasons?.map((ts) => (
            <View
              key={ts.id}
              className="p-3 bg-muted rounded-lg mb-2"
            >
              <Text className="font-medium">{ts.team?.name}</Text>
              <Text className="text-sm text-muted-foreground">
                {ts.season?.name}
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}
