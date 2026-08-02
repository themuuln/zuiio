import { Image, Pressable, Text, View } from "react-native";
import { Button } from "@/components/ui/button";
import type { PublicProduct } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";

interface ProductCardProps {
  product: PublicProduct;
  currency: string;
  onPress: () => void;
  onAdd: () => void;
}

export function ProductCard({
  product,
  currency,
  onPress,
  onAdd,
}: ProductCardProps) {
  const price = Number(product.sale_price ?? 0);

  return (
    <Pressable
      onPress={onPress}
      className="overflow-hidden rounded-xl border border-border bg-card active:opacity-80"
    >
      {product.image_url ? (
        <Image
          source={{ uri: product.image_url }}
          className="aspect-[4/3] w-full bg-muted"
          resizeMode="cover"
        />
      ) : (
        <View className="aspect-[4/3] w-full items-center justify-center bg-muted/50">
          <Text className="text-3xl text-muted-foreground/30">🛍</Text>
        </View>
      )}
      <View className="gap-1.5 p-3">
        <Text
          numberOfLines={1}
          className="text-sm font-semibold text-foreground"
        >
          {product.name}
        </Text>
        {product.category_name && (
          <Text className="text-[10px] text-muted-foreground">
            {product.category_name}
          </Text>
        )}
        {product.description ? (
          <Text
            numberOfLines={2}
            className="text-xs leading-relaxed text-muted-foreground"
          >
            {product.description}
          </Text>
        ) : null}
        <View className="mt-1 flex-row items-center justify-between">
          <Text className="text-base font-bold tabular-nums text-foreground">
            {formatPrice(price, currency)}
          </Text>
          <Button size="sm" title="Нэмэх" onPress={onAdd} />
        </View>
      </View>
    </Pressable>
  );
}
