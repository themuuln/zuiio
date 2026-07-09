import { View, Text, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase";
import { useEffect } from "react";

export default function ProfileScreen() {
  const router = useRouter();
  const supabase = createClient();
  const queryClient = useQueryClient();

  const { data: user, isPending } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
    });

    return () => subscription.unsubscribe();
  }, [supabase, queryClient]);

  const handleSignOut = async () => {
    Alert.alert(
      "Гарах",
      "Та системээс гарахдаа итгэлтэй байна уу?",
      [
        { text: "Цуцлах", style: "cancel" },
        {
          text: "Гарах",
          style: "destructive",
          onPress: async () => {
            await supabase.auth.signOut();
            router.replace("/(auth)/login");
          },
        },
      ]
    );
  };

  if (isPending) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-muted-foreground">Ачаалж байна...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View className="flex-1 items-center justify-center p-4">
        <Text className="text-lg font-medium mb-4">
          Та нэвтрээгүй байна
        </Text>
        <TouchableOpacity
          className="bg-primary px-6 py-3 rounded-lg"
          onPress={() => router.push("/(auth)/login")}
        >
          <Text className="text-primary-foreground font-medium">
            Нэвтрэх
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <View className="p-4 border-b border-border">
        <Text className="text-2xl font-bold">Профайл</Text>
      </View>

      <View className="p-4 space-y-4">
        <View className="space-y-2">
          <Text className="text-sm text-muted-foreground">Имэйл</Text>
          <Text className="text-base">{user.email}</Text>
        </View>

        <View className="space-y-2">
          <Text className="text-sm text-muted-foreground">ID</Text>
          <Text className="text-base font-mono text-xs">{user.id}</Text>
        </View>

        <View className="space-y-2">
          <Text className="text-sm text-muted-foreground">Бүртгүүлсэн</Text>
          <Text className="text-base">
            {new Date(user.created_at).toLocaleDateString("mn-MN")}
          </Text>
        </View>
      </View>

      <View className="p-4 mt-auto">
        <TouchableOpacity
          className="bg-destructive px-6 py-3 rounded-lg"
          onPress={handleSignOut}
        >
          <Text className="text-destructive-foreground font-medium text-center">
            Гарах
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
