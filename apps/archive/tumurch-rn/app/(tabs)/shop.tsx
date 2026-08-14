import { View, Text, ScrollView, Pressable } from "react-native";
import { useAuthStore } from "@/src/config/stores";
import { PreviewGymRepository } from "@/src/data/preview-repository";
import { useQuery } from "@tanstack/react-query";

const repo = new PreviewGymRepository();

export default function ShopScreen() {
  const user = useAuthStore((s) => s.currentUser);

  const { data: shopData, isPending } = useQuery({
    queryKey: ["member-shop", user?.id, user?.branchId],
    queryFn: () => repo.fetchMemberShop(user!.id, user!.branchId),
    enabled: !!user,
  });

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="px-6 pt-6 pb-4">
        <Text className="text-2xl font-bold text-foreground">
          Нэмэлт бүтээгдэхүүн
        </Text>
        <Text className="text-muted-foreground mt-1">
          Уураг, креатин, витамин
        </Text>
      </View>

      {isPending ? (
        <View className="px-6 py-10">
          <Text className="text-muted-foreground">Ачаалж байна...</Text>
        </View>
      ) : (
        <View className="px-6 gap-3">
          {shopData?.products.map((product) => (
            <View
              key={product.id}
              className="rounded-xl border border-border bg-card p-4"
            >
              <View className="flex-row justify-between items-start">
                <View className="flex-1">
                  <Text className="text-lg font-semibold text-card-foreground">
                    {product.name}
                  </Text>
                  <Text className="text-sm text-muted-foreground mt-1">
                    {product.description}
                  </Text>
                </View>
                <View className="items-end">
                  <Text className="text-lg font-bold text-accent">
                    {product.price.toLocaleString()}₮
                  </Text>
                  <Text className="text-xs text-muted-foreground">
                    {product.stockQuantity > 0
                      ? `${product.stockQuantity} ширхэг`
                      : "Дууссан"}
                  </Text>
                </View>
              </View>

              <View className="mt-3 flex-row items-center gap-2">
                <View className="rounded-full bg-muted px-2 py-1">
                  <Text className="text-xs text-muted-foreground">
                    {product.category}
                  </Text>
                </View>
                {product.stockQuantity > 0 && (
                  <Pressable className="ml-auto rounded-lg bg-primary px-4 py-2 active:opacity-80">
                    <Text className="text-xs font-medium text-primary-foreground">
                      Захиалах
                    </Text>
                  </Pressable>
                )}
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
