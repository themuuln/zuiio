import { Tabs, Redirect } from "expo-router";
import { useAuthStore } from "@/src/config/stores";

export default function TabsLayout() {
  const user = useAuthStore((s) => s.currentUser);

  if (!user) {
    return <Redirect href="/(auth)/role-select" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#1a1a2e",
        tabBarInactiveTintColor: "#94a3b8",
        tabBarStyle: { borderTopColor: "#e2e8f0" },
        headerStyle: { backgroundColor: "#ffffff" },
        headerTintColor: "#0f172a",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Нүүр хуудас",
          tabBarLabel: "Home",
        }}
      />
      <Tabs.Screen
        name="workouts"
        options={{
          title: "Дасгал",
          tabBarLabel: "Workouts",
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: "Ахиц",
          tabBarLabel: "Progress",
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          title: "Дэлгүүр",
          tabBarLabel: "Shop",
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Профайл",
          tabBarLabel: "Profile",
        }}
      />
    </Tabs>
  );
}
