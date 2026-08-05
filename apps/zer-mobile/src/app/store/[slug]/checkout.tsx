import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@zuiio/auth";
import { type Href, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { fetchPublicCatalog } from "@/lib/catalog";
import {
  type CheckoutPaymentMethod,
  cartItemsToOrderItems,
  type ShopOrderInput,
  submitShopOrder,
  validateCheckoutInput,
} from "@/lib/checkout";
import { formatPrice } from "@/lib/format";
import { addPendingOrder, makeLocalReference } from "@/lib/queue";
import { appStorage } from "@/lib/storage";
import { accountMetadata } from "@/lib/store-account";
import { supabase } from "@/lib/supabase";
import {
  selectItems,
  selectTotalAmount,
  useCartStore,
} from "@/store/cart-store";

type BackendState = "idle" | "submitting" | "saving_local";

export default function CheckoutScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const storeSlug = typeof slug === "string" ? slug : "";
  const router = useRouter();
  const { state: authState } = useAuth();

  const items = useCartStore(selectItems);
  const total = useCartStore(selectTotalAmount);
  const clearCart = useCartStore((s) => s.clear);

  const orgQuery = useQuery({
    queryKey: ["org", storeSlug],
    queryFn: () =>
      fetchPublicCatalog(supabase, storeSlug, { page: 1, pageSize: 1 }),
    enabled: storeSlug.length > 0,
  });
  const currency = orgQuery.data?.organization?.currency ?? "MNT";
  const storeName = orgQuery.data?.organization?.name ?? storeSlug;

  const sessionUser =
    authState.status === "authenticated" ? authState.session.user : null;
  const metadata = accountMetadata(sessionUser ?? {});

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [paymentMethod, setPaymentMethod] =
    useState<CheckoutPaymentMethod>("cash");
  const [backendState, setBackendState] = useState<BackendState>("idle");
  const [error, setError] = useState<string | null>(null);

  // Stable per-screen idempotency key: a network-error retry tap reuses it,
  // so the RPC returns the first order instead of creating a duplicate.
  const idempotencyKeyRef = useRef<string | null>(null);
  if (!idempotencyKeyRef.current) {
    idempotencyKeyRef.current = `chk-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }

  // Prefill from the signed-in buyer account.
  useEffect(() => {
    if (!sessionUser) return;
    setName((prev) => prev || metadata.displayName || "");
    setPhone((prev) => prev || metadata.phone || "");
    setEmail(sessionUser.email ?? "");
  }, [sessionUser, metadata.displayName, metadata.phone]);

  const goToSuccess = (reference: string, local: boolean, saleId?: string) => {
    router.replace({
      pathname: "/store/[slug]/order-success",
      params: {
        slug: storeSlug,
        reference,
        local: local ? "1" : "0",
        saleId: saleId ?? "",
      },
    } as never);
  };

  const handleSubmit = async () => {
    if (items.length === 0) {
      Alert.alert("Анхаар", "Сагсанд бүтээгдэхүүн байхгүй байна.");
      return;
    }

    const input: ShopOrderInput = {
      slug: storeSlug,
      items: cartItemsToOrderItems(items),
      customerName: name.trim(),
      customerPhone: phone.trim() || null,
      storeAccountId: sessionUser?.id ?? null,
      paymentMethod,
      currencyCode: currency,
      couponCode: couponCode.trim() || null,
      idempotencyKey: idempotencyKeyRef.current,
    };

    const validationError = validateCheckoutInput(input);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setBackendState("submitting");

    const result = await submitShopOrder(supabase, input);

    if (result.ok) {
      clearCart();
      goToSuccess(result.reference, false, result.saleId);
      return;
    }

    if (result.code === "NETWORK_ERROR") {
      // No connection — offer to keep the order on this device so
      // nothing is lost; it syncs/submits when connectivity returns.
      setBackendState("saving_local");
      return;
    }

    setBackendState("idle");
    setError(result.message);
  };

  const handleSaveLocally = async () => {
    const reference = makeLocalReference();
    const pending = {
      id: reference,
      reference,
      slug: storeSlug,
      storeName,
      totalAmount: total,
      itemCount: items.reduce((s, i) => s + i.quantity, 0),
      customerName: name.trim(),
      customerPhone: phone.trim() || null,
      createdAt: new Date().toISOString(),
    };
    try {
      await addPendingOrder(appStorage, pending);
      clearCart();
      goToSuccess(reference, true);
    } catch {
      setError("Захиалгыг хадгалахад алдаа гарлаа.");
      setBackendState("idle");
    }
  };

  const submitting = backendState === "submitting";

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView className="flex-1" contentContainerClassName="gap-4 p-4 pb-8">
        {/* Order summary */}
        <Card>
          <CardHeader>
            <CardTitle>Захиалгын мэдээлэл</CardTitle>
          </CardHeader>
          <CardContent className="gap-1">
            {items.map((item) => (
              <View key={item.productId} className="flex-row justify-between">
                <Text className="flex-1 pr-2 text-sm text-foreground">
                  {item.name} × {item.quantity}
                </Text>
                <Text className="text-sm tabular-nums text-foreground">
                  {formatPrice(item.unitPrice * item.quantity, currency)}
                </Text>
              </View>
            ))}
            <View className="mt-2 flex-row items-center justify-between border-t border-border pt-2">
              <Text className="text-sm font-semibold text-foreground">
                Нийт
              </Text>
              <Text className="text-base font-bold tabular-nums text-foreground">
                {formatPrice(total, currency)}
              </Text>
            </View>
          </CardContent>
        </Card>

        {/* Customer info */}
        <Card>
          <CardHeader>
            <CardTitle>Холбоо барих мэдээлэл</CardTitle>
          </CardHeader>
          <CardContent className="gap-3">
            <Input
              placeholder="Нэр *"
              value={name}
              onChangeText={setName}
              editable={!submitting}
            />
            <Input
              placeholder="Утасны дугаар *"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              editable={!submitting}
            />
            <Input
              placeholder="Имэйл (заавал биш)"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!submitting && !sessionUser}
            />
            {sessionUser && (
              <Text className="text-xs text-muted-foreground">
                Имэйл таны бүртгэлээс автоматаар орлоо.
              </Text>
            )}
            <Input
              placeholder="Купон код (заавал биш)"
              value={couponCode}
              onChangeText={setCouponCode}
              autoCapitalize="characters"
              editable={!submitting}
            />
          </CardContent>
        </Card>

        {/* Payment method */}
        <Card>
          <CardHeader>
            <CardTitle>Төлбөрийн хэлбэр</CardTitle>
          </CardHeader>
          <CardContent className="flex-row gap-2">
            <PaymentOption
              label="Бэлэн"
              active={paymentMethod === "cash"}
              onPress={() => setPaymentMethod("cash")}
            />
            <PaymentOption
              label="Карт"
              active={paymentMethod === "card"}
              onPress={() => setPaymentMethod("card")}
            />
          </CardContent>
        </Card>

        {error && (
          <View className="rounded-lg border border-destructive/30 bg-destructive/10 p-3">
            <Text className="text-sm text-destructive">{error}</Text>
          </View>
        )}

        {backendState === "saving_local" ? (
          <View className="gap-2">
            <Text className="text-sm text-foreground">
              Дэлгүүрийн серверт захиалга илгээх холболт одоогоор нээгдээгүй
              байна. Захиалгаа энэ төхөөрөмжид хадгалах уу?
            </Text>
            <Button
              title="Оффлайн захиалга хадгалах"
              onPress={handleSaveLocally}
            />
            <Button
              title="Буцах"
              variant="ghost"
              onPress={() => setBackendState("idle")}
            />
          </View>
        ) : (
          <Button
            title={submitting ? "Илгээж байна..." : "Захиалах"}
            size="lg"
            disabled={submitting}
            onPress={handleSubmit}
          />
        )}

        {!sessionUser && (
          <Pressable
            onPress={() => router.push(`/store/${storeSlug}/account` as Href)}
          >
            <Text className="text-center text-xs text-primary">
              Бүртгэлтэй бол нэвтэрч захиалгаа хянаарай
            </Text>
          </Pressable>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

interface PaymentOptionProps {
  label: string;
  active: boolean;
  onPress: () => void;
}

function PaymentOption({ label, active, onPress }: PaymentOptionProps) {
  return (
    <Pressable
      onPress={onPress}
      className={
        active
          ? "flex-1 items-center rounded-lg bg-primary py-3 active:opacity-80"
          : "flex-1 items-center rounded-lg border border-border bg-background py-3 active:opacity-70"
      }
    >
      <Text
        className={
          active
            ? "text-sm font-semibold text-primary-foreground"
            : "text-sm text-foreground"
        }
      >
        {label}
      </Text>
    </Pressable>
  );
}
