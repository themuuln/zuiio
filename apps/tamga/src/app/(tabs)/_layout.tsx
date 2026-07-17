import { Tabs } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Colors } from "@/lib/theme";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.mutedForeground,
        tabBarStyle: {
          backgroundColor: Colors.background,
          borderTopColor: Colors.border,
        },
      }}
    >
      {/* ── Visible tabs ── */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Морь",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="pets" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="market"
        options={{
          title: "Зах",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="storefront" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: "Эвент",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="event" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Профайл",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="person" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: "Бусад",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="apps" size={size} color={color} />
          ),
        }}
      />

      {/* ── Hidden tabs (accessible via Бусад) ── */}
      <Tabs.Screen name="search" options={{ href: undefined, tabBarButton: () => null }} />
      <Tabs.Screen name="lineage" options={{ href: undefined, tabBarButton: () => null }} />
      <Tabs.Screen name="documents" options={{ href: undefined, tabBarButton: () => null }} />
      <Tabs.Screen name="transfers" options={{ href: undefined, tabBarButton: () => null }} />
      <Tabs.Screen name="herd-tracking" options={{ href: undefined, tabBarButton: () => null }} />
      <Tabs.Screen name="pasture-management" options={{ href: undefined, tabBarButton: () => null }} />
      <Tabs.Screen name="subscription" options={{ href: undefined, tabBarButton: () => null }} />
      <Tabs.Screen name="updater" options={{ href: undefined, tabBarButton: () => null }} />
      <Tabs.Screen name="analytics" options={{ href: undefined, tabBarButton: () => null }} />
      <Tabs.Screen name="_notifications" options={{ href: undefined, tabBarButton: () => null }} />
      <Tabs.Screen name="_notifications-settings" options={{ href: undefined, tabBarButton: () => null }} />
    </Tabs>
  );
}
