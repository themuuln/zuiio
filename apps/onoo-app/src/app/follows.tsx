import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";

interface Follow {
  id: string;
  entity_type: "team" | "player" | "league";
  entity_id: string;
  entity_name: string;
}

export default function FollowsScreen() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  const { data: follows, isPending } = useQuery({
    queryKey: ["follows"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("follows")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch entity names
      const followsWithNames = await Promise.all(
        data.map(async (follow) => {
          let entityName = "Тодорхойгүй";

          if (follow.entity_type === "team") {
            const { data: team } = await supabase
              .from("teams")
              .select("name")
              .eq("id", follow.entity_id)
              .single();
            entityName = team?.name || entityName;
          } else if (follow.entity_type === "player") {
            const { data: player } = await supabase
              .from("players")
              .select("canonical_name, name_latin")
              .eq("id", follow.entity_id)
              .single();
            entityName = player?.canonical_name || player?.name_latin || entityName;
          } else if (follow.entity_type === "league") {
            const { data: league } = await supabase
              .from("leagues")
              .select("name")
              .eq("id", follow.entity_id)
              .single();
            entityName = league?.name || entityName;
          }

          return {
            ...follow,
            entity_name: entityName,
          };
        })
      );

      return followsWithNames as Follow[];
    },
  });

  const removeFollow = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("follows")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["follows"] });
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
        <Text className="text-2xl font-bold">Дагасан зүйлс</Text>
      </View>

      {follows?.length === 0 ? (
        <View className="flex-1 items-center justify-center p-4">
          <Ionicons name="heart-outline" size={48} color="#9ca3af" />
          <Text className="text-muted-foreground mt-4 text-center">
            Та одоогоор юу ч дагаагүй байна
          </Text>
          <Text className="text-sm text-muted-foreground mt-2 text-center">
            Баг, тоглогч, лигийг дагаж мэдээлэл аваарай
          </Text>
        </View>
      ) : (
        <FlatList
          data={follows}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View className="flex-row items-center p-4 border-b border-border">
              <View className="w-10 h-10 rounded-full bg-muted items-center justify-center mr-3">
                <Ionicons
                  name={
                    item.entity_type === "team"
                      ? "people"
                      : item.entity_type === "player"
                      ? "person"
                      : "trophy"
                  }
                  size={20}
                  color="#6b7280"
                />
              </View>
              <View className="flex-1">
                <Text className="font-medium">{item.entity_name}</Text>
                <Text className="text-sm text-muted-foreground capitalize">
                  {item.entity_type === "team"
                    ? "Баг"
                    : item.entity_type === "player"
                    ? "Тоглогч"
                    : "Лиг"}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => removeFollow.mutate(item.id)}
                className="p-2"
              >
                <Ionicons name="trash-outline" size={20} color="#ef4444" />
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}
