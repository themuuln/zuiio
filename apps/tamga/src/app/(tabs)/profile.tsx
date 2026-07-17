import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { useProfile } from "@/hooks/useProfile";
import { TIER_META, type SubscriptionTier } from "@/hooks/useSubscriptionMutations";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { data: profile } = useProfile(user?.id);

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
      {/* Subscription Status Card */}
      {(() => {
        const tier: SubscriptionTier =
          profile?.subscription_tier === "pro" ||
          profile?.subscription_tier === "breeder" ||
          profile?.subscription_tier === "stable"
            ? (profile.subscription_tier as SubscriptionTier)
            : "free";
        const meta = TIER_META[tier];
        return (
          <TouchableOpacity
            onPress={() => router.push("/subscription")}
            className="mx-4 mb-4 bg-card rounded-xl p-4 flex-row items-center"
          >
            <View
              className="w-10 h-10 rounded-full items-center justify-center mr-3"
              style={{ backgroundColor: `${meta.color}20` }}
            >
              <Ionicons name={meta.icon as keyof typeof Ionicons.glyphMap} size={20} color={meta.color} />
            </View>
            <View className="flex-1">
              <Text className="text-sm text-muted-foreground">Захиалга</Text>
              <Text className="text-base font-semibold text-foreground">{meta.label}</Text>
            </View>
            {tier === "free" ? (
              <View className="bg-primary/10 px-3 py-1 rounded-full">
                <Text className="text-xs font-semibold text-primary">Шинэчлэх</Text>
              </View>
            ) : (
              <View className="bg-green-500/10 px-3 py-1 rounded-full">
                <Text className="text-xs font-semibold text-green-600">Идэвхтэй</Text>
              </View>
            )}
            <Ionicons name="chevron-forward" size={18} className="text-muted-foreground ml-2" />
          </TouchableOpacity>
        );
      })()}


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
