import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <Text className="text-muted-foreground">Ачаалж байна...</Text>
      </View>
    );
  }

  const name = (user?.user_metadata?.name as string) || "Хэрэглэгч";
  const phone = user?.phone || "+976 XXXX XXXX";
  const initials = name.slice(0, 2).toUpperCase();

  async function handleLogout() {
    Alert.alert("Гарах", "Та гарахдаа итгэлтэй байна уу?", [
      { text: "Цуцлах", style: "cancel" },
      {
        text: "Гарах",
        style: "destructive",
        onPress: async () => {
          await supabase.auth.signOut();
          router.replace("/(auth)/login");
        },
      },
    ]);
  }

  const menuItems = [
    { icon: "settings-outline" as const, label: "Тохиргоо" },
    { icon: "help-circle-outline" as const, label: "Тусламж" },
    { icon: "shield-checkmark-outline" as const, label: "Нууцлал" },
  ];

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="items-center pt-12 pb-6">
        <View className="w-20 h-20 rounded-full bg-primary items-center justify-center mb-4">
          <Text className="text-2xl font-bold text-primary-foreground">{initials}</Text>
        </View>
        <Text className="text-xl font-bold text-foreground">{name}</Text>
        <Text className="text-muted-foreground">{phone}</Text>
      </View>

      <View className="bg-card mx-4 rounded-xl overflow-hidden mb-4">
        {menuItems.map((item, i) => (
          <TouchableOpacity
            key={item.label}
            className={`flex-row items-center px-4 py-3 ${
              i < menuItems.length - 1 ? "border-b border-border" : ""
            }`}
          >
            <Ionicons name={item.icon} size={22} className="text-muted-foreground mr-3" />
            <Text className="flex-1 text-foreground">{item.label}</Text>
            <Ionicons name="chevron-forward" size={18} className="text-muted-foreground" />
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        className="mx-4 bg-destructive rounded-xl py-3 items-center mb-8"
        onPress={handleLogout}
      >
        <Text className="text-destructive-foreground font-semibold">Гарах</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
