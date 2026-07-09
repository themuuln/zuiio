import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase";

export default function TeamScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const supabase = createClient();

  const { data: team, isPending } = useQuery({
    queryKey: ["team", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teams")
        .select(`
          *,
          team_seasons (
            id,
            season:seasons (name),
            league:leagues (name, slug)
          )
        `)
        .eq("slug", slug)
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

  if (!team) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-lg">Баг олдсонгүй</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-background">
      {/* Team Header */}
      <View className="p-4 border-b border-border items-center">
        <View
          className="w-16 h-16 rounded-full mb-3"
          style={{ backgroundColor: team.primary_color || "#3b82f6" }}
        />
        <Text className="text-2xl font-bold">{team.name}</Text>
        {team.short_code && (
          <Text className="text-muted-foreground mt-1">{team.short_code}</Text>
        )}
      </View>

      {/* Seasons */}
      <View className="p-4">
        <Text className="text-lg font-bold mb-3">Улирлууд</Text>
        {team.team_seasons?.length === 0 ? (
          <Text className="text-muted-foreground">Улирал байхгүй</Text>
        ) : (
          team.team_seasons?.map((ts) => (
            <View
              key={ts.id}
              className="p-3 bg-muted rounded-lg mb-2"
            >
              <Text className="font-medium">{ts.season?.name}</Text>
              <Text className="text-sm text-muted-foreground">
                {ts.league?.name}
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}
