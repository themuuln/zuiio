/**
 * Liquid Glass tab bar adapter for Expo Router.
 *
 * Wraps expo-liquid-glass-tabs' LiquidGlassTabBar to work as the `tabBar`
 * prop of Expo Router's <Tabs> component. On iOS 26+ this renders the
 * native UIVisualEffectView glass material; on older iOS/Android it falls
 * back to a blur-based glass surface.
 *
 * Hidden tabs (href: undefined / tabBarButton: () => null) are filtered
 * out so they don't appear in the bar but remain routable.
 */
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LiquidGlassTabBar } from "expo-liquid-glass-tabs";
import type { BottomTabBarProps } from "expo-router/build/react-navigation/bottom-tabs/types";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Colors } from "@/lib/theme";

// ── Tab configuration ──────────────────────────────────────────────
// Maps route names to their icons and labels. Only visible tabs here.
const TAB_CONFIG = [
  { key: "index", icon: "pets" as const, label: "Морь" },
  { key: "market", icon: "storefront" as const, label: "Зах" },
  { key: "events", icon: "event" as const, label: "Эвент" },
  { key: "profile", icon: "person" as const, label: "Профайл" },
  { key: "more", icon: "apps" as const, label: "Бусад" },
] as const;

// ── Component ──────────────────────────────────────────────────────
export function GlassTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const activeKey = state.routes[state.index].name;

  const tabs = TAB_CONFIG.map((tab) => ({
    key: tab.key,
    icon: (active: boolean, color: string) => (
      <MaterialIcons
        name={tab.icon}
        size={24}
        color={color}
        style={{ opacity: active ? 1 : 0.7 }}
      />
    ),
  }));

  return (
    <LiquidGlassTabBar
      tabs={tabs}
      activeKey={activeKey}
      onChange={(name) => {
        const route = state.routes.find((r) => r.name === name);
        if (route) {
          navigation.navigate(route.name, route.params);
        }
      }}
      bottomInset={insets.bottom}
      accentColor={Colors.primary}
    />
  );
}
