import { type Href, useLocalSearchParams, useRouter } from "expo-router";
import { Text, View } from "react-native";
import { Button } from "@/components/ui/button";
import { shortId } from "@/lib/format";

export default function OrderSuccessScreen() {
  const { slug, reference, local, saleId } = useLocalSearchParams<{
    slug: string;
    reference: string;
    local?: string;
    saleId?: string;
  }>();
  const storeSlug = typeof slug === "string" ? slug : "";
  const orderRef = typeof reference === "string" ? reference : "";
  const isLocal = local === "1";
  const serverSaleId = typeof saleId === "string" && saleId ? saleId : null;
  const router = useRouter();

  return (
    <View className="flex-1 items-center justify-center gap-4 bg-background p-6">
      <View className="h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
        <Text className="text-4xl">✓</Text>
      </View>
      <Text className="text-2xl font-bold text-foreground">
        Захиалга амжилттай
      </Text>
      <Text className="text-sm text-muted-foreground">
        Захиалгын дугаар:{" "}
        {orderRef || (serverSaleId ? shortId(serverSaleId) : "—")}
      </Text>

      {isLocal && (
        <View className="w-full rounded-lg border border-amber-300 bg-amber-50 p-3">
          <Text className="text-center text-xs text-amber-700">
            Энэ захиалгыг төхөөрөмжид хадгалсан. Дэлгүүрийн серверт илгээх
            холболт нээгдээгүй тул дэлгүүртэй шууд холбогдож баталгаажуулна уу.
          </Text>
        </View>
      )}

      <View className="w-full gap-2">
        <Button
          title="Миний захиалга"
          onPress={() => router.replace(`/store/${storeSlug}/orders` as Href)}
        />
        <Button
          title="Бүтээгдэхүүн үзэх"
          variant="outline"
          onPress={() => router.replace(`/store/${storeSlug}` as Href)}
        />
      </View>
    </View>
  );
}
