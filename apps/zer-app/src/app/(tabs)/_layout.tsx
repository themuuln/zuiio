import { Tabs } from "expo-router";
import { Text, useColorScheme } from "react-native";

import { Colors } from "@/constants/theme";

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    dashboard: "📊",
    sales: "🛒",
    inventory: "📦",
    more: "⚙️",
  };
  const icon = icons[name] ?? "•";
  return (
    <Text style={{ fontSize: focused ? 22 : 20, opacity: focused ? 1 : 0.6 }}>
      {icon}
    </Text>
  );
}

export default function TabLayout() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "unspecified" ? "light" : scheme];

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: { backgroundColor: colors.background },
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Хяналт",
          tabBarIcon: ({ focused }) => (
            <TabIcon name="dashboard" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="sales"
        options={{
          title: "Борлуулалт",
          tabBarIcon: ({ focused }) => (
            <TabIcon name="sales" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="inventory"
        options={{
          title: "Бараа",
          tabBarIcon: ({ focused }) => (
            <TabIcon name="inventory" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: "Бусад",
          tabBarIcon: ({ focused }) => (
            <TabIcon name="more" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
