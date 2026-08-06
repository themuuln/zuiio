import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, Image, ScrollView, Text, View } from "react-native";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { fetchPublicCatalog, fetchPublicProduct } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import { supabase } from "@/lib/supabase";
import { useCartStore } from "@/store/cart-store";

export default function ProductDetailScreen() {
  const { slug, id } = useLocalSearchParams<{ slug: string; id: string }>();
  const storeSlug = typeof slug === "string" ? slug : "";
  const productId = typeof id === "string" ? id : "";
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);

  const orgQuery = useQuery({
    queryKey: ["org", storeSlug],
    queryFn: () =>
      fetchPublicCatalog(supabase, storeSlug, { page: 1, pageSize: 1 }),
    enabled: storeSlug.length > 0,
  });

  const productQuery = useQuery({
    queryKey: ["product", storeSlug, productId],
    queryFn: () => fetchPublicProduct(supabase, storeSlug, productId),
    enabled: storeSlug.length > 0 && productId.length > 0,
  });

  if (productQuery.isPending) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const product = productQuery.data;
  if (productQuery.isError || !product) {
    return (
      <View className="flex-1 items-center justify-center gap-3 bg-background p-5">
        <Text className="text-sm text-foreground">Бүтээгдэхүүн олдсонгүй.</Text>
        <Button title="Буцах" onPress={() => router.back()} />
      </View>
    );
  }

  const currency = orgQuery.data?.organization?.currency ?? "MNT";
  const price = Number(product.sale_price ?? 0);
  const stock: number | null =
    typeof product.current_stock === "number" ? product.current_stock : null;

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="p-4 gap-4 pb-8"
    >
      {product.image_url ? (
        <Image
          source={{ uri: product.image_url }}
          className="aspect-[4/3] w-full rounded-xl bg-muted"
          resizeMode="cover"
        />
      ) : (
        <View className="aspect-[4/3] w-full items-center justify-center rounded-xl bg-muted/50">
          <Text className="text-5xl text-muted-foreground/30">🛍</Text>
        </View>
      )}

      <View className="gap-1">
        <View className="flex-row items-center justify-between">
          <Text className="flex-1 text-2xl font-bold text-foreground">
            {product.name}
          </Text>
          {stock !== null && (
            <Text
              className={
                stock > 0
                  ? "text-xs font-medium text-emerald-600"
                  : "text-xs font-medium text-destructive"
              }
            >
              {stock > 0 ? `${stock} ширхэг үлдсэн` : "Дууссан"}
            </Text>
          )}
        </View>
        {product.category_name && (
          <Text className="text-sm text-muted-foreground">
            {product.category_name}
          </Text>
        )}
        <Text className="text-xl font-bold tabular-nums text-primary">
          {formatPrice(price, currency)}
        </Text>
      </View>

      {product.description ? (
        <Card>
          <CardContent className="gap-2">
            <Text className="text-sm font-semibold text-foreground">
              Тодорхойлолт
            </Text>
            <Text className="text-sm leading-relaxed text-foreground">
              {product.description}
            </Text>
          </CardContent>
        </Card>
      ) : null}

      {product.attributes && product.attributes.length > 0 ? (
        <Card>
          <CardContent className="gap-2">
            <Text className="text-sm font-semibold text-foreground">
              Шинж чанар
            </Text>
            {product.attributes.map((attr) => (
              <View
                key={`${attr.name}-${attr.value}`}
                className="flex-row justify-between"
              >
                <Text className="text-sm text-muted-foreground">
                  {attr.name}
                </Text>
                <Text className="text-sm font-medium text-foreground">
                  {attr.value}
                </Text>
              </View>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {product.variants && product.variants.length > 0 ? (
        <Card>
          <CardContent className="gap-2">
            <Text className="text-sm font-semibold text-foreground">
              Сонголтууд
            </Text>
            {product.variants.map((v) => (
              <View key={v.id} className="flex-row justify-between">
                <Text className="text-sm text-muted-foreground">{v.name}</Text>
                <Text className="text-sm font-medium text-foreground">
                  {formatPrice(Number(v.price ?? 0), currency)}
                </Text>
              </View>
            ))}
            <Text className="text-xs text-muted-foreground">
              Сонголттой бүтээгдэхүүнийг үндсэн хувилбараар сагсанд хийнэ.
            </Text>
          </CardContent>
        </Card>
      ) : null}

      <Button
        title="Сагсанд нэмэх"
        size="lg"
        onPress={() => {
          addItem({
            productId: product.id,
            name: product.name,
            unitPrice: price,
            unit: product.unit,
            imageUrl: product.image_url,
            quantity: 1,
          });
          router.back();
        }}
      />
    </ScrollView>
  );
}
