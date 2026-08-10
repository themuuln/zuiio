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
import {
  fetchPublicBranches,
  fetchPublicCatalog,
  type PublicBranch,
} from "@/lib/catalog";
import {
  type CheckoutPaymentMethod,
  cartItemsToOrderItems,
  type ShopOrderInput,
  type ShopOrderResult,
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
  const org = orgQuery.data?.organization ?? null;
  const deliveryEnabled = !!org?.delivery_enabled;
  const pickupEnabled = !!org?.pickup_enabled;
  const showDeliverySection = deliveryEnabled || pickupEnabled;
  const bankPaymentAvailable =
    !!org?.payment_bank_account || !!org?.payment_account_name;
  const qpayAvailable = !!org?.qpay_qr_url;

  const sessionUser =
    authState.status === "authenticated" ? authState.session.user : null;
  const metadata = accountMetadata(sessionUser ?? {});

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [giftCardCode, setGiftCardCode] = useState("");
  const [deliveryType, setDeliveryType] = useState<
    "delivery" | "pickup" | null
  >(null);
  const [address, setAddress] = useState("");
  const [addressNote, setAddressNote] = useState("");
  const [pickupBranchSlug, setPickupBranchSlug] = useState<string | null>(null);
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

  // Default the delivery choice once the org config loads.
  useEffect(() => {
    if (deliveryType !== null) return;
    if (deliveryEnabled) setDeliveryType("delivery");
    else if (pickupEnabled) setDeliveryType("pickup");
  }, [deliveryEnabled, pickupEnabled, deliveryType]);

  // Keep the payment method in the set the store actually offers.
  const availablePaymentMethods: CheckoutPaymentMethod[] = ["cash", "card"];
  if (bankPaymentAvailable) availablePaymentMethods.push("bank_transfer");
  if (qpayAvailable) availablePaymentMethods.push("qpay");
  const effectivePaymentMethod: CheckoutPaymentMethod =
    availablePaymentMethods.includes(paymentMethod) ? paymentMethod : "cash";

  const branchesQuery = useQuery({
    queryKey: ["public-branches", storeSlug],
    queryFn: () => fetchPublicBranches(supabase, storeSlug),
    enabled:
      showDeliverySection && deliveryType === "pickup" && storeSlug.length > 0,
  });
  const branches: PublicBranch[] = branchesQuery.data ?? [];
  const selectedBranch = branches.find((b) => b.slug === pickupBranchSlug);

  const goToSuccess = (
    reference: string,
    local: boolean,
    result?: Extract<ShopOrderResult, { ok: true }>,
  ) => {
    router.replace({
      pathname: "/store/[slug]/order-success",
      params: {
        slug: storeSlug,
        reference,
        local: local ? "1" : "0",
        saleId: result?.saleId ?? "",
        currency,
        totalAmount:
          result?.totalAmount != null ? String(result.totalAmount) : "",
        deliveryFee:
          result?.deliveryFee != null && result.deliveryFee > 0
            ? String(result.deliveryFee)
            : "",
        discountAmount:
          result?.discountAmount != null && result.discountAmount > 0
            ? String(result.discountAmount)
            : "",
        giftCardAmount:
          result?.giftCardAmount != null && result.giftCardAmount > 0
            ? String(result.giftCardAmount)
            : "",
        bankName: result?.paymentInstructions?.bank_name ?? "",
        bankAccount: result?.paymentInstructions?.bank_account ?? "",
        accountName: result?.paymentInstructions?.account_name ?? "",
        qpayQrUrl: result?.paymentInstructions?.qpay_qr_url ?? "",
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
      email: email.trim() || null,
      storeAccountId: sessionUser?.id ?? null,
      paymentMethod: effectivePaymentMethod,
      currencyCode: currency,
      couponCode: couponCode.trim() || null,
      giftCardCode: giftCardCode.trim() || null,
      deliveryType,
      address: address.trim() || null,
      addressNote: addressNote.trim() || null,
      pickupBranchSlug: pickupBranchSlug ?? null,
      idempotencyKey: idempotencyKeyRef.current,
    };

    if (
      deliveryType === "pickup" &&
      pickupEnabled &&
      branches.length > 0 &&
      !pickupBranchSlug
    ) {
      setError("Авах салбараа сонгоно уу.");
      return;
    }

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
      goToSuccess(result.reference, false, result);
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
            <Input
              placeholder="Бэлгийн картын код (заавал биш)"
              value={giftCardCode}
              onChangeText={setGiftCardCode}
              autoCapitalize="characters"
              editable={!submitting}
            />
          </CardContent>
        </Card>

        {/* Delivery / pickup */}
        {showDeliverySection && (
          <Card>
            <CardHeader>
              <CardTitle>Хүргэлт</CardTitle>
            </CardHeader>
            <CardContent className="gap-3">
              <View className="flex-row gap-2">
                {deliveryEnabled && (
                  <PaymentOption
                    label="Хүргэлт"
                    active={deliveryType === "delivery"}
                    onPress={() => setDeliveryType("delivery")}
                  />
                )}
                {pickupEnabled && (
                  <PaymentOption
                    label="Дэлгүүрээс авах"
                    active={deliveryType === "pickup"}
                    onPress={() => setDeliveryType("pickup")}
                  />
                )}
              </View>

              {deliveryType === "delivery" && (
                <View className="gap-3">
                  <Input
                    placeholder="Хаяг *"
                    value={address}
                    onChangeText={setAddress}
                    editable={!submitting}
                  />
                  <Input
                    placeholder="Гэрийн дугаар / бусад тэмдэглэл"
                    value={addressNote}
                    onChangeText={setAddressNote}
                    editable={!submitting}
                  />
                  {deliveryEnabled && org?.delivery_fee_amount != null && (
                    <Text className="text-xs text-muted-foreground">
                      Хүргэлтийн төлбөр:{" "}
                      {formatPrice(Number(org.delivery_fee_amount), currency)}
                      {org.free_delivery_threshold != null &&
                        ` · ${formatPrice(Number(org.free_delivery_threshold), currency)}-аас дээш үнэгүй`}
                    </Text>
                  )}
                </View>
              )}

              {deliveryType === "pickup" && (
                <View className="gap-1.5">
                  {branches.length === 0 ? (
                    <Text className="text-xs text-muted-foreground">
                      Авах салбарууд ачаалагдаж байна…
                    </Text>
                  ) : (
                    branches.map((b) => (
                      <Pressable
                        key={b.id}
                        onPress={() => setPickupBranchSlug(b.slug)}
                        className={
                          pickupBranchSlug === b.slug
                            ? "rounded-lg border border-primary bg-primary/10 p-3"
                            : "rounded-lg border border-border bg-background p-3 active:opacity-70"
                        }
                      >
                        <Text className="text-sm font-medium text-foreground">
                          {b.name}
                        </Text>
                        {b.address ? (
                          <Text className="text-xs text-muted-foreground">
                            {b.address}
                          </Text>
                        ) : null}
                        {b.phone ? (
                          <Text className="text-xs text-muted-foreground">
                            {b.phone}
                          </Text>
                        ) : null}
                      </Pressable>
                    ))
                  )}
                  {selectedBranch && (
                    <Text className="text-xs text-emerald-600">
                      Сонгосон: {selectedBranch.name}
                    </Text>
                  )}
                </View>
              )}
            </CardContent>
          </Card>
        )}

        {/* Payment method */}
        <Card>
          <CardHeader>
            <CardTitle>Төлбөрийн хэлбэр</CardTitle>
          </CardHeader>
          <CardContent className="flex-row flex-wrap gap-2">
            {availablePaymentMethods.includes("cash") && (
              <PaymentOption
                label="Бэлэн"
                active={effectivePaymentMethod === "cash"}
                onPress={() => setPaymentMethod("cash")}
              />
            )}
            {availablePaymentMethods.includes("card") && (
              <PaymentOption
                label="Карт"
                active={effectivePaymentMethod === "card"}
                onPress={() => setPaymentMethod("card")}
              />
            )}
            {availablePaymentMethods.includes("bank_transfer") && (
              <PaymentOption
                label="Данс"
                active={effectivePaymentMethod === "bank_transfer"}
                onPress={() => setPaymentMethod("bank_transfer")}
              />
            )}
            {availablePaymentMethods.includes("qpay") && (
              <PaymentOption
                label="QPay"
                active={effectivePaymentMethod === "qpay"}
                onPress={() => setPaymentMethod("qpay")}
              />
            )}
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
