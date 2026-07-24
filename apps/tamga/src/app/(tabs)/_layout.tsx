import { Tabs } from "expo-router";
import { GlassTabBar } from "@/components/GlassTabBar";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
      tabBar={(props) => <GlassTabBar {...props} />}
    >
      {/* ── Visible tabs ── */}
      <Tabs.Screen name="index" options={{ title: "Морь" }} />
      <Tabs.Screen name="market" options={{ title: "Зах" }} />
      <Tabs.Screen name="events" options={{ title: "Эвент" }} />
      <Tabs.Screen name="profile" options={{ title: "Профайл" }} />
      <Tabs.Screen name="more" options={{ title: "Бусад" }} />

      {/* ── Hidden tabs (accessible via Бусад) ── */}
      <Tabs.Screen name="search" options={{ href: undefined }} />
      <Tabs.Screen name="lineage" options={{ href: undefined }} />
      <Tabs.Screen name="documents" options={{ href: undefined }} />
      <Tabs.Screen name="transfers" options={{ href: undefined }} />
      <Tabs.Screen name="herd-tracking" options={{ href: undefined }} />
      <Tabs.Screen name="pasture-management" options={{ href: undefined }} />
      <Tabs.Screen name="subscription" options={{ href: undefined }} />
      <Tabs.Screen name="updater" options={{ href: undefined }} />
      <Tabs.Screen name="analytics" options={{ href: undefined }} />
      <Tabs.Screen name="_notifications" options={{ href: undefined }} />
      <Tabs.Screen name="_notifications-settings" options={{ href: undefined }} />
    </Tabs>
  );
}
