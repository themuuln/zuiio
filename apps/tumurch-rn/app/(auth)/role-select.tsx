import { View, Text, Pressable } from "react-native";
import { router } from "expo-router";
import { useAuthStore } from "@/src/config/stores";
import { PreviewGymRepository } from "@/src/data/preview-repository";
import type { AppRole } from "@/src/data/models";

const ROLES: { role: AppRole; label: string; description: string }[] = [
  { role: "member", label: "Гишүүн", description: "Workout tracking, progress, shop" },
  { role: "reception", label: "Урин дүр", description: "Member lookup, check-in, guest passes" },
  { role: "coach", label: "Дасгалжуулагч", description: "Client roster, programs, review" },
  { role: "manager", label: "Менежер", description: "Dashboard, plans, audit, approvals" },
];

const repo = new PreviewGymRepository();

export default function RoleSelectScreen() {
  const setUser = useAuthStore((s) => s.setUser);

  const handleSelect = async (role: AppRole) => {
    const users = await repo.fetchUsers();
    const user = users.find((u) => u.role === role);
    if (user) {
      setUser(user);
      router.replace("/(tabs)");
    }
  };

  return (
    <View className="flex-1 items-center justify-center bg-background px-6">
      <Text className="text-3xl font-bold text-foreground mb-2">Tumurch</Text>
      <Text className="text-muted-foreground mb-10 text-center">
        Select a role to preview the app
      </Text>

      <View className="w-full gap-3">
        {ROLES.map((r) => (
          <Pressable
            key={r.role}
            onPress={() => handleSelect(r.role)}
            className="w-full rounded-xl border border-border bg-card p-5 active:opacity-70"
          >
            <Text className="text-lg font-semibold text-card-foreground">
              {r.label}
            </Text>
            <Text className="text-sm text-muted-foreground mt-1">
              {r.description}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text className="text-xs text-muted-foreground mt-8">
        Preview mode — seeded in-memory data
      </Text>
    </View>
  );
}
