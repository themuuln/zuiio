import { Stack, useLocalSearchParams } from "expo-router";
import { CartBadge } from "@/components/cart-badge";

export default function StoreLayout() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const storeSlug = typeof slug === "string" ? slug : "";

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: storeSlug,
          headerRight: () => <CartBadge slug={storeSlug} />,
        }}
      />
      <Stack.Screen
        name="product/[id]"
        options={{
          title: "Бүтээгдэхүүн",
          headerRight: () => <CartBadge slug={storeSlug} />,
        }}
      />
      <Stack.Screen name="cart" options={{ title: "Сагс" }} />
      <Stack.Screen name="checkout" options={{ title: "Тооцоо" }} />
      <Stack.Screen
        name="order-success"
        options={{
          title: "Захиалга",
          headerBackVisible: false,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen name="account" options={{ title: "Бүртгэл" }} />
      <Stack.Screen name="orders" options={{ title: "Миний захиалга" }} />
    </Stack>
  );
}
