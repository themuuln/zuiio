import { View, Text, FlatList, ActivityIndicator } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase";

interface Leader {
  player_id: string;
  player_name: string;
  team_name: string;
  gp: number;
  value: number;
}

export default function LeadersScreen() {
  const supabase = createClient();

  const { data: leaders, isPending } = useQuery({
    queryKey: ["leaders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("season_player_stats")
        .select(`
          player_id,
          gp,
          pts,
          players!inner (name_latin, canonical_name),
          team_seasons!inner (teams!inner (name))
        `)
        .gte("gp", 1)
        .order("pts", { ascending: false })
        .limit(20);

      if (error) throw error;

      return data.map((row) => ({
        player_id: row.player_id,
        player_name: row.players.canonical_name || row.players.name_latin || "Тодорхойгүй",
        team_name: row.team_seasons.teams.name,
        gp: row.gp,
        value: row.pts / row.gp,
      })) as Leader[];
    },
  });

  if (isPending) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <View className="p-4 border-b border-border">
        <Text className="text-2xl font-bold">Шилдэг тоглогчид</Text>
      </View>
      <FlatList
        data={leaders}
        keyExtractor={(item) => item.player_id}
        renderItem={({ item, index }) => (
          <View className="flex-row items-center p-4 border-b border-border">
            <Text className="w-8 text-lg font-bold text-muted-foreground">
              {index + 1}
            </Text>
            <View className="flex-1">
              <Text className="text-base font-medium">{item.player_name}</Text>
              <Text className="text-sm text-muted-foreground">
                {item.team_name}
              </Text>
            </View>
            <View className="items-end">
              <Text className="text-lg font-bold">{item.value.toFixed(1)}</Text>
              <Text className="text-xs text-muted-foreground">
                Дундаж ({item.gp} тоглолт)
              </Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}
