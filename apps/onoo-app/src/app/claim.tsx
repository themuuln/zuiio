import { View, Text, TextInput, TouchableOpacity, Alert, FlatList, ActivityIndicator } from "react-native";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase";

interface Player {
  id: string;
  canonical_name: string;
  name_latin: string | null;
  jersey_number: number | null;
}

export default function AthleteClaimScreen() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  // Search players
  const { data: players, isPending: searching } = useQuery({
    queryKey: ["players", search],
    queryFn: async () => {
      if (!search || search.length < 2) return [];

      const { data, error } = await supabase
        .from("players")
        .select("id, canonical_name, name_latin, jersey_number")
        .or(`canonical_name.ilike.%${search}%,name_latin.ilike.%${search}%`)
        .limit(10);

      if (error) throw error;
      return data as Player[];
    },
    enabled: search.length >= 2,
  });

  // Create claim
  const createClaim = useMutation({
    mutationFn: async (playerId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Нэвтрээгүй байна");

      const { error } = await supabase
        .from("athlete_claims")
        .insert({
          user_id: user.id,
          player_id: playerId,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      Alert.alert("Амжилттай", "Таны хүсэлт илгээлээ. Админ баталгаажуулахыг хүлээнэ үү.");
      setSelectedPlayer(null);
      setSearch("");
      queryClient.invalidateQueries({ queryKey: ["my-claims"] });
    },
    onError: (error) => {
      Alert.alert("Алдаа", error.message);
    },
  });

  // Check existing claims
  const { data: myClaims } = useQuery({
    queryKey: ["my-claims"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("athlete_claims")
        .select(`
          id,
          status,
          created_at,
          players (canonical_name, name_latin)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  return (
    <View className="flex-1 bg-background">
      <View className="p-4 border-b border-border">
        <Text className="text-2xl font-bold">Тоглогчоор баталгаажуулах</Text>
        <Text className="text-sm text-muted-foreground mt-1">
          Өөрийн нэрээр тоглогчийн профайлыг холбох
        </Text>
      </View>

      {/* Search */}
      <View className="p-4 border-b border-border">
        <TextInput
          className="bg-muted border border-border rounded-lg px-4 py-3"
          placeholder="Тоглогчийн нэр хайх..."
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Search Results */}
      {searching && (
        <View className="p-4 items-center">
          <ActivityIndicator />
        </View>
      )}

      {players && players.length > 0 && (
        <View className="border-b border-border">
          <Text className="px-4 pt-4 text-sm font-medium text-muted-foreground">
            Хайлтын үр дүн
          </Text>
          <FlatList
            data={players}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                className="flex-row items-center p-4 border-b border-border"
                onPress={() => setSelectedPlayer(item)}
              >
                <View className="w-10 h-10 rounded-full bg-muted items-center justify-center mr-3">
                  <Text className="font-bold">{item.jersey_number || "?"}</Text>
                </View>
                <View className="flex-1">
                  <Text className="font-medium">
                    {item.canonical_name || item.name_latin}
                  </Text>
                  {item.name_latin && item.canonical_name && (
                    <Text className="text-sm text-muted-foreground">
                      {item.name_latin}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            )}
            scrollEnabled={false}
          />
        </View>
      )}

      {/* Selected Player Confirmation */}
      {selectedPlayer && (
        <View className="p-4 bg-muted m-4 rounded-lg">
          <Text className="font-medium mb-2">Сонгосон тоглогч:</Text>
          <Text className="text-lg font-bold mb-4">
            {selectedPlayer.canonical_name || selectedPlayer.name_latin}
          </Text>
          <View className="flex-row gap-2">
            <TouchableOpacity
              className="flex-1 bg-primary py-3 rounded-lg"
              onPress={() => createClaim.mutate(selectedPlayer.id)}
              disabled={createClaim.isPending}
            >
              {createClaim.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-primary-foreground font-medium text-center">
                  Хүсэлт илгээх
                </Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 bg-muted py-3 rounded-lg border border-border"
              onPress={() => setSelectedPlayer(null)}
            >
              <Text className="font-medium text-center">Цуцлах</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* My Claims */}
      {myClaims && myClaims.length > 0 && (
        <View className="p-4">
          <Text className="text-lg font-bold mb-3">Миний хүсэлтүүд</Text>
          {myClaims.map((claim) => (
            <View
              key={claim.id}
              className="flex-row items-center justify-between p-3 bg-muted rounded-lg mb-2"
            >
              <View>
                <Text className="font-medium">
                  {(claim.players as { canonical_name?: string; name_latin?: string })?.canonical_name ||
                    (claim.players as { canonical_name?: string; name_latin?: string })?.name_latin ||
                    "Тодорхойгүй"}
                </Text>
                <Text className="text-sm text-muted-foreground">
                  {new Date(claim.created_at).toLocaleDateString("mn-MN")}
                </Text>
              </View>
              <View
                className={`px-3 py-1 rounded-full ${
                  claim.status === "approved"
                    ? "bg-green-100"
                    : claim.status === "rejected"
                    ? "bg-red-100"
                    : "bg-yellow-100"
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    claim.status === "approved"
                      ? "text-green-800"
                      : claim.status === "rejected"
                      ? "text-red-800"
                      : "text-yellow-800"
                  }`}
                >
                  {claim.status === "approved"
                    ? "Баталгаажсан"
                    : claim.status === "rejected"
                    ? "Татгалзсан"
                    : "Хүлээгдэж байна"}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
