import { type Href, useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { selectItemCount, useCartStore } from "@/store/cart-store";

interface CartBadgeProps {
  slug: string;
}

/** Header cart button with live item-count badge. */
export function CartBadge({ slug }: CartBadgeProps) {
  const router = useRouter();
  const count = useCartStore(selectItemCount);

  if (count === 0) return null;

  return (
    <Pressable
      onPress={() => router.push(`/store/${slug}/cart` as Href)}
      className="relative h-9 w-9 items-center justify-center rounded-full border border-border bg-card active:opacity-70"
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={`Сагс, ${count} бараа`}
    >
      <Text className="text-base">🛒</Text>
      <View className="absolute -right-1 -top-1 min-w-4 rounded-full bg-destructive px-1">
        <Text className="text-center text-[10px] font-bold text-destructive-foreground">
          {count > 99 ? "99+" : count}
        </Text>
      </View>
    </Pressable>
  );
}
