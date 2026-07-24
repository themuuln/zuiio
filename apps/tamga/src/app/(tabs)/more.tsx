import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
const MENU_ITEMS = [
  { icon: "search" as const, label: "Хайх", route: "/search" as const },
  { icon: "git-branch-outline" as const, label: "Удам", route: "/lineage" as const },
  { icon: "document-text-outline" as const, label: "Баримт", route: "/documents" as const },
  { icon: "swap-horizontal-outline" as const, label: "Шилжүүлэг", route: "/transfers" as const },
  { icon: "notifications-outline" as const, label: "Мэдэгдэл", route: "/notifications" as const },
];

export default function MoreScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }}
    >
      <View className="px-4 pb-4">
        <Text className="text-2xl font-bold text-foreground">Бусад</Text>
      </View>

      <View className="mx-4 bg-card rounded-xl border border-border overflow-hidden">
        {MENU_ITEMS.map((item, index) => (
          <TouchableOpacity
            key={item.route}
            className={`flex-row items-center justify-between px-4 py-4 ${
              index < MENU_ITEMS.length - 1 ? "border-b border-border" : ""
            }`}
            onPress={() => router.push(item.route)}
          >
            <View className="flex-row items-center gap-3">
              <Ionicons name={item.icon} size={22} className="text-muted-foreground" />
              <Text className="text-foreground text-base">{item.label}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} className="text-muted-foreground" />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}
