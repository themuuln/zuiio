import { useMemo, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Separator } from "@/components/ui/Separator";
import { Loading } from "@/components/ui/Loading";
import { EmptyState } from "@/components/ui/EmptyState";

// ── Types ─────────────────────────────────────────────────────

interface SyncQueueItem {
  id: string;
  table_name: string;
  record_id: string;
  action: "INSERT" | "UPDATE" | "DELETE";
  data: string;
  created_at: string;
  attempts: number;
  last_error: string | null;
  status: "pending" | "syncing" | "synced" | "failed";
  user_id: string;
}

// ── Helpers ───────────────────────────────────────────────────

const ACTION_LABELS: Record<string, string> = {
  INSERT: "Нэмэх",
  UPDATE: "Шинэчлэх",
  DELETE: "Устгах",
};

const STATUS_VARIANT: Record<
  SyncQueueItem["status"],
  "default" | "secondary" | "destructive" | "success" | "warning"
> = {
  pending: "warning",
  syncing: "default",
  synced: "success",
  failed: "destructive",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Хүлээгдэж буй",
  syncing: "Синхрончилж байна",
  synced: "Амжилттай",
  failed: "Алдаатай",
};

// ── Queue stat card ───────────────────────────────────────────

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}) {
  return (
    <View className="flex-1 items-center rounded-xl border border-border bg-card p-3">
      <Ionicons name={icon} size={20} color={color} />
      <Text className="text-lg font-bold text-foreground mt-1">{value}</Text>
      <Text className="text-xs text-muted-foreground">{label}</Text>
    </View>
  );
}

// ── Queue item card ───────────────────────────────────────────

function QueueItemCard({
  item,
  onRetry,
}: {
  item: SyncQueueItem;
  onRetry: (id: string) => void;
}) {
  const createdDate = useMemo(
    () =>
      new Date(item.created_at).toLocaleDateString("mn-MN", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    [item.created_at],
  );

  return (
    <Card className="mb-3 p-4">
      {/* Header: table name + status */}
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-sm font-semibold text-foreground">
          {item.table_name}
        </Text>
        <Badge variant={STATUS_VARIANT[item.status]}>
          {STATUS_LABELS[item.status]}
        </Badge>
      </View>

      {/* Record ID */}
      <Text className="text-xs text-muted-foreground mb-2">
        Зүйлсийн ID: {item.record_id}
      </Text>

      {/* Action badge + timestamp */}
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center gap-2">
          <Text className="text-xs text-muted-foreground">Үйлдэл</Text>
          <Badge variant="secondary">{ACTION_LABELS[item.action]}</Badge>
        </View>
        <Text className="text-xs text-muted-foreground">{createdDate}</Text>
      </View>

      {/* Error message if failed */}
      {item.status === "failed" && item.last_error && (
        <View className="rounded-md bg-destructive/10 p-2 mb-2">
          <Text className="text-xs text-destructive" numberOfLines={2}>
            {item.last_error}
          </Text>
        </View>
      )}

      {/* Retry button for failed items */}
      {item.status === "failed" && (
        <>
          <Separator className="mb-2" />
          <TouchableOpacity
            onPress={() => onRetry(item.id)}
            className="flex-row items-center justify-center gap-1 rounded-md bg-primary/10 py-2"
            accessibilityRole="button"
            accessibilityLabel={`Дахин оролдох: ${item.table_name}`}
          >
            <Ionicons name="refresh-outline" size={16} color="#22c55e" />
            <Text className="text-sm font-medium text-primary">
              Дахин оролдох
            </Text>
          </TouchableOpacity>
        </>
      )}
    </Card>
  );
}

// ── Main screen ───────────────────────────────────────────────

export default function SyncQueueScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch pending sync items
  const {
    data: items = [],
    isPending,
    error,
    refetch,
  } = useQuery<SyncQueueItem[]>({
    queryKey: ["sync-queue", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error: queryError } = await supabase
        .from("sync_queue")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (queryError) throw queryError;
      return data ?? [];
    },
    enabled: !!user?.id,
  });

  // Compute stats
  const stats = useMemo(() => {
    const pending = items.filter((i) => i.status === "pending").length;
    const synced = items.filter((i) => i.status === "synced").length;
    const failed = items.filter((i) => i.status === "failed").length;
    return { pending, synced, failed, total: items.length };
  }, [items]);

  // Retry failed mutation
  const retryMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const { error: updateError } = await supabase
        .from("sync_queue")
        .update({ status: "pending", attempts: 0, last_error: null })
        .eq("id", itemId);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sync-queue", user?.id] });
    },
  });

  // Clear synced mutation
  const clearSyncedMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) return;
      const { error: deleteError } = await supabase
        .from("sync_queue")
        .delete()
        .eq("user_id", user.id)
        .eq("status", "synced");

      if (deleteError) throw deleteError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sync-queue", user?.id] });
    },
  });

  const handleRetry = useCallback(
    (itemId: string) => retryMutation.mutate(itemId),
    [retryMutation],
  );

  const handleClearSynced = useCallback(() => {
    if (stats.synced === 0) return;
    Alert.alert(
      "Цэвэрлэх",
      `${stats.synced} амжилттай зүйлийг устгах уу?`,
      [
        { text: "Цуцлах", style: "cancel" },
        {
          text: "Тийм",
          style: "destructive",
          onPress: () => clearSyncedMutation.mutate(),
        },
      ],
    );
  }, [stats.synced, clearSyncedMutation]);

  // Filter out synced items from main list
  const activeItems = useMemo(
    () => items.filter((i) => i.status !== "synced"),
    [items],
  );

  // Loading
  if (isPending) {
    return (
      <View className="flex-1 bg-background">
        <PageHeader title="Синхрончлолын ээлж" showBack />
        <View className="flex-1 items-center justify-center">
          <Loading />
        </View>
      </View>
    );
  }

  // Error
  if (error) {
    return (
      <View className="flex-1 bg-background">
        <PageHeader title="Синхрончлолын ээлж" showBack />
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
          <Text className="text-lg font-medium text-foreground mt-3 mb-1">
            Алдаа гарлаа
          </Text>
          <Text className="text-sm text-muted-foreground text-center mb-4">
            {error.message || "Өгөгдөл ачаалахад алдаа гарлаа"}
          </Text>
          <Button title="Дахин оролдох" variant="secondary" onPress={() => refetch()} />
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <PageHeader title="Синхрончлолын ээлж" showBack />

      <ScrollView className="flex-1" contentContainerClassName="px-4 pb-8">
        {/* ── Stats header ─────────────────────────── */}
        <View className="flex-row gap-2 mb-4">
          <StatCard
            label="Хүлээгдэж буй"
            value={stats.pending}
            icon="hourglass-outline"
            color="#f59e0b"
          />
          <StatCard
            label="Амжилттай"
            value={stats.synced}
            icon="checkmark-circle-outline"
            color="#22c55e"
          />
          <StatCard
            label="Алдаатай"
            value={stats.failed}
            icon="close-circle-outline"
            color="#ef4444"
          />
        </View>

        {/* ── Clear synced button ──────────────────── */}
        {stats.synced > 0 && (
          <Button
            title={`Цэвэрлэх (${stats.synced})`}
            variant="secondary"
            onPress={handleClearSynced}
            disabled={clearSyncedMutation.isPending}
            className="mb-4"
          />
        )}

        {/* ── Queue items ──────────────────────────── */}
        {activeItems.length === 0 ? (
          <EmptyState
            icon="cloud-done-outline"
            title="Ээлж хоосон байна"
            subtitle="Шинэ синхрончлолын үйлдэл байхгүй байна"
          />
        ) : (
          activeItems.map((item) => (
            <QueueItemCard key={item.id} item={item} onRetry={handleRetry} />
          ))
        )}
      </ScrollView>
    </View>
  );
}
