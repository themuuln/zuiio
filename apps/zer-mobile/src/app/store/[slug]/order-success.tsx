import { type Href, useLocalSearchParams, useRouter } from "expo-router";
import { Image, ScrollView, Text, View } from "react-native";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatPrice, shortId } from "@/lib/format";

function numParam(value: string | undefined): number | null {
  if (!value || value.trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export default function OrderSuccessScreen() {
  const {
    slug,
    reference,
    local,
    saleId,
    currency,
    totalAmount,
    deliveryFee,
    discountAmount,
    giftCardAmount,
    bankName,
    bankAccount,
    accountName,
    qpayQrUrl,
  } = useLocalSearchParams<{
    slug: string;
    reference: string;
    local?: string;
    saleId?: string;
    currency?: string;
    totalAmount?: string;
    deliveryFee?: string;
    discountAmount?: string;
    giftCardAmount?: string;
    bankName?: string;
    bankAccount?: string;
    accountName?: string;
    qpayQrUrl?: string;
  }>();
  const storeSlug = typeof slug === "string" ? slug : "";
  const orderRef = typeof reference === "string" ? reference : "";
  const isLocal = local === "1";
  const serverSaleId = typeof saleId === "string" && saleId ? saleId : null;
  const router = useRouter();

  const cur = typeof currency === "string" && currency ? currency : "MNT";
  const total = numParam(totalAmount);
  const fee = numParam(deliveryFee);
  const discount = numParam(discountAmount);
  const gift = numParam(giftCardAmount);
  const bank = typeof bankName === "string" ? bankName : "";
  const acct = typeof bankAccount === "string" ? bankAccount : "";
  const acctName = typeof accountName === "string" ? accountName : "";
  const qrUrl = typeof qpayQrUrl === "string" && qpayQrUrl ? qpayQrUrl : "";

  const hasPaymentInstructions = Boolean(qrUrl || bank || acct);

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="items-center justify-center gap-4 p-6"
    >
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

      {!isLocal &&
        (total != null || discount != null || gift != null || fee != null) && (
          <Card className="w-full">
            <CardContent className="gap-1.5">
              <Text className="text-sm font-semibold text-foreground">
                Төлбөрийн дэлгэрэнгүй
              </Text>
              {discount != null && discount > 0 && (
                <View className="flex-row justify-between">
                  <Text className="text-sm text-muted-foreground">Хямдрал</Text>
                  <Text className="text-sm tabular-nums text-foreground">
                    -{formatPrice(discount, cur)}
                  </Text>
                </View>
              )}
              {gift != null && gift > 0 && (
                <View className="flex-row justify-between">
                  <Text className="text-sm text-muted-foreground">
                    Бэлгийн карт
                  </Text>
                  <Text className="text-sm tabular-nums text-foreground">
                    -{formatPrice(gift, cur)}
                  </Text>
                </View>
              )}
              {fee != null && fee > 0 && (
                <View className="flex-row justify-between">
                  <Text className="text-sm text-muted-foreground">
                    Хүргэлтийн төлбөр
                  </Text>
                  <Text className="text-sm tabular-nums text-foreground">
                    +{formatPrice(fee, cur)}
                  </Text>
                </View>
              )}
              {total != null && (
                <View className="flex-row justify-between border-t border-border pt-1.5">
                  <Text className="text-sm font-semibold text-foreground">
                    Нийт
                  </Text>
                  <Text className="text-base font-bold tabular-nums text-foreground">
                    {formatPrice(total, cur)}
                  </Text>
                </View>
              )}
            </CardContent>
          </Card>
        )}

      {hasPaymentInstructions && (
        <Card className="w-full">
          <CardContent className="gap-2">
            <Text className="text-sm font-semibold text-foreground">
              Төлбөрийн заавар
            </Text>
            {qrUrl ? (
              <View className="items-center gap-2">
                <Image
                  source={{ uri: qrUrl }}
                  className="h-48 w-48 rounded-lg bg-muted"
                  resizeMode="contain"
                />
                <Text className="text-center text-xs text-muted-foreground">
                  QPay-ээр төлбөрөө хийгээрэй. Төлбөр хийсний дараа дэлгүүрийн
                  ажилтан баталгаажуулна.
                </Text>
              </View>
            ) : (
              <>
                {bank ? (
                  <View className="flex-row justify-between">
                    <Text className="text-sm text-muted-foreground">Банк</Text>
                    <Text className="text-sm font-medium text-foreground">
                      {bank}
                    </Text>
                  </View>
                ) : null}
                {acct ? (
                  <View className="flex-row justify-between">
                    <Text className="text-sm text-muted-foreground">
                      Дансны дугаар
                    </Text>
                    <Text className="text-sm font-medium text-foreground">
                      {acct}
                    </Text>
                  </View>
                ) : null}
                {acctName ? (
                  <View className="flex-row justify-between">
                    <Text className="text-sm text-muted-foreground">
                      Данс эзэмшигч
                    </Text>
                    <Text className="text-sm font-medium text-foreground">
                      {acctName}
                    </Text>
                  </View>
                ) : null}
                <Text className="text-xs text-muted-foreground">
                  Заасан данс руу шилжүүлэг хийгээрэй. Шилжүүлэг хийсний дараа
                  дэлгүүрийн ажилтан баталгаажуулна.
                </Text>
              </>
            )}
          </CardContent>
        </Card>
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
    </ScrollView>
  );
}
