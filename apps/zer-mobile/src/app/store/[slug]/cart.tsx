import { type Href, useLocalSearchParams, useRouter } from "expo-router";
import { FlatList, Image, Text, View } from "react-native";
import { QuantityStepper } from "@/components/quantity-stepper";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatPrice } from "@/lib/format";
import {
  selectItems,
  selectTotalAmount,
  useCartStore,
} from "@/store/cart-store";

export default function CartScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const storeSlug = typeof slug === "string" ? slug : "";
  const router = useRouter();
  const items = useCartStore(selectItems);
  const total = useCartStore(selectTotalAmount);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  if (items.length === 0) {
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-background p-5">
        <Text className="text-3xl">🛒</Text>
        <Text className="text-sm text-foreground">Сагс хоосон байна.</Text>
        <Button
          title="Бүтээгдэхүүн үзэх"
          onPress={() => router.replace(`/store/${storeSlug}` as Href)}
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <FlatList
        data={items}
        keyExtractor={(item) => item.productId}
        contentContainerClassName="gap-3 p-4 pb-6"
        renderItem={({ item }) => (
          <Card>
            <CardContent className="flex-row items-center gap-3">
              {item.imageUrl ? (
                <Image
                  source={{ uri: item.imageUrl }}
                  className="h-16 w-16 rounded-lg bg-muted"
                />
              ) : (
                <View className="h-16 w-16 items-center justify-center rounded-lg bg-muted/50">
                  <Text className="text-xl text-muted-foreground/30">🛍</Text>
                </View>
              )}
              <View className="flex-1 gap-1">
                <Text
                  numberOfLines={2}
                  className="text-sm font-semibold text-foreground"
                >
                  {item.name}
                </Text>
                <Text className="text-xs text-muted-foreground">
                  {formatPrice(item.unitPrice)} × {item.quantity}
                </Text>
                <View className="mt-1 flex-row items-center justify-between">
                  <QuantityStepper
                    quantity={item.quantity}
                    onDecrement={() =>
                      setQuantity(item.productId, item.quantity - 1)
                    }
                    onIncrement={() =>
                      setQuantity(item.productId, item.quantity + 1)
                    }
                  />
                  <Text className="text-sm font-bold tabular-nums text-foreground">
                    {formatPrice(item.unitPrice * item.quantity)}
                  </Text>
                </View>
              </View>
              <Button
                size="sm"
                variant="ghost"
                title="✕"
                accessibilityLabel={`${item.name}-г сагснаас хасах`}
                onPress={() => removeItem(item.productId)}
              />
            </CardContent>
          </Card>
        )}
        ListFooterComponent={
          <View className="mt-2 gap-3">
            <View className="flex-row items-center justify-between rounded-xl border border-border bg-card p-4">
              <Text className="text-sm font-semibold text-foreground">
                Нийт
              </Text>
              <Text className="text-lg font-bold tabular-nums text-foreground">
                {formatPrice(total)}
              </Text>
            </View>
            <Button
              title="Тооцоо руу"
              size="lg"
              onPress={() =>
                router.push(`/store/${storeSlug}/checkout` as Href)
              }
            />
          </View>
        }
      />
    </View>
  );
}
