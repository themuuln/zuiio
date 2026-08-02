import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@zuiio/auth";
import { type Href, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  View,
} from "react-native";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateTime, formatPrice, shortId } from "@/lib/format";
import { fetchMyOrders, type MyOrder, orderStatusLabel } from "@/lib/orders";
import { listPendingOrders, type PendingOrder } from "@/lib/queue";
import { appStorage } from "@/lib/storage";
import { supabase } from "@/lib/supabase";

type OrderRow =
  | { kind: "server"; order: MyOrder }
  | { kind: "local"; order: PendingOrder };

export default function OrdersScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const storeSlug = typeof slug === "string" ? slug : "";
  const router = useRouter();
  const { state } = useAuth();
  const authenticated = state.status === "authenticated";

  const [localOrders, setLocalOrders] = useState<PendingOrder[]>([]);

  const ordersQuery = useQuery({
    queryKey: ["my-orders"],
    queryFn: () => fetchMyOrders(supabase),
    enabled: authenticated,
  });

  const reloadLocal = useCallback(() => {
    listPendingOrders(appStorage)
      .then(setLocalOrders)
      .catch(() => setLocalOrders([]));
  }, []);

  useEffect(reloadLocal, [reloadLocal]);

  if (!authenticated) {
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-background p-6">
        <Text className="text-sm text-muted-foreground">
          Захиалгын түүхийг үзэхийн тулд нэвтэрнэ үү.
        </Text>
        <Button
          title="Нэвтрэх"
          onPress={() => router.push(`/store/${storeSlug}/account` as Href)}
        />
      </View>
    );
  }

  const rows: OrderRow[] = [
    ...localOrders.map((o) => ({ kind: "local" as const, order: o })),
    ...(ordersQuery.data ?? []).map((o) => ({
      kind: "server" as const,
      order: o,
    })),
  ];

  const refreshing = ordersQuery.isFetching || ordersQuery.isPending;

  return (
    <FlatList
      className="flex-1 bg-background"
      contentContainerClassName="gap-3 p-4 pb-8"
      data={rows}
      keyExtractor={(row) =>
        row.kind === "local" ? row.order.reference : row.order.id
      }
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            ordersQuery.refetch();
            reloadLocal();
          }}
        />
      }
      ListEmptyComponent={
        ordersQuery.isPending ? (
          <View className="items-center justify-center py-16">
            <ActivityIndicator />
          </View>
        ) : (
          <View className="items-center justify-center gap-2 py-16">
            <Text className="text-3xl">🧾</Text>
            <Text className="text-sm text-muted-foreground">
              Захиалга байхгүй байна.
            </Text>
          </View>
        )
      }
      renderItem={({ item }) =>
        item.kind === "local" ? (
          <LocalOrderCard order={item.order} />
        ) : (
          <ServerOrderCard order={item.order} />
        )
      }
    />
  );
}

function ServerOrderCard({ order }: { order: MyOrder }) {
  return (
    <Card>
      <CardContent className="gap-1.5">
        <View className="flex-row items-center justify-between">
          <Text className="text-sm font-semibold text-foreground">
            {order.invoice_number ?? shortId(order.id)}
          </Text>
          <Text className="text-xs font-medium text-emerald-600">
            {orderStatusLabel(order.status)}
          </Text>
        </View>
        <Text className="text-xs text-muted-foreground">
          {formatDateTime(order.created_at)}
        </Text>
        {(order.items ?? []).slice(0, 3).map((item) => (
          <Text
            key={`${item.product_id}-${item.name}`}
            className="text-xs text-foreground"
          >
            {item.name ?? "Бүтээгдэхүүн"} × {item.quantity}
          </Text>
        ))}
        {order.items && order.items.length > 3 ? (
          <Text className="text-xs text-muted-foreground">
            +{order.items.length - 3} бараа
          </Text>
        ) : null}
        <Text className="mt-1 text-sm font-bold tabular-nums text-foreground">
          {formatPrice(Number(order.total_amount ?? 0))}
        </Text>
      </CardContent>
    </Card>
  );
}

function LocalOrderCard({ order }: { order: PendingOrder }) {
  return (
    <Card className="border-amber-300">
      <CardContent className="gap-1.5">
        <View className="flex-row items-center justify-between">
          <Text className="text-sm font-semibold text-foreground">
            {order.reference}
          </Text>
          <Text className="text-xs font-medium text-amber-600">
            Төхөөрөмжид хадгалсан
          </Text>
        </View>
        <Text className="text-xs text-muted-foreground">
          {formatDateTime(order.createdAt)}
        </Text>
        <Text className="text-xs text-muted-foreground">
          {order.storeName} · {order.itemCount} бараа
        </Text>
        <Text className="mt-1 text-sm font-bold tabular-nums text-foreground">
          {formatPrice(order.totalAmount)}
        </Text>
      </CardContent>
    </Card>
  );
}
