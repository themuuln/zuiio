import { useCallback, useState } from "react";
import { View, Text, FlatList, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { PageHeader } from "@/components/ui/PageHeader";
import { LoadingState, EmptyState, ErrorState } from "@/components/states";

// ── Төрөл ───────────────────────────────────────────────────────────

interface GeofenceAlert {
  id: string;
  user_id: string;
  geofence_id: string;
  horse_id: string;
  alert_type: "entered" | "left";
  read: boolean;
  created_at: string;
  geofences: { name: string } | null;
  horses: { name: string } | null;
}

// ── Цаг хугацаа форматлох ────────────────────────────────────────────

function timeAgo(dateString: string): string {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const diffSec = Math.floor((now - then) / 1000);

  if (diffSec < 60) return "Одоо";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} мкн`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} цаг`;
  return `${Math.floor(diffSec / 86400)} өдөр`;
}

function alertTypeIcon(type: string): keyof typeof Ionicons.glyphMap {
  return type === "entered"
    ? "log-in-outline"
    : "log-out-outline";
}

function alertTypeColor(type: string): string {
  return type === "entered" ? "#4A9D5B" : "#D97706";
}

// ── Нэг мэдэгдлийн карт ─────────────────────────────────────────────

function AlertItem({
  alert,
  onPress,
}: {
  alert: GeofenceAlert;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className={`mx-4 mb-2 rounded-xl p-4 border ${
        alert.read
          ? "bg-card border-border"
          : "bg-primary/5 border-primary/20"
      }`}
    >
      <View className="flex-row items-start gap-3">
        {/* Тэмдэг */}
        <View
          className={`mt-0.5 w-10 h-10 rounded-full items-center justify-center ${
            alert.read ? "bg-muted" : "bg-primary/10"
          }`}
        >
          <Ionicons
            name={alertTypeIcon(alert.alert_type)}
            size={18}
            color={
              alert.read
                ? "rgb(var(--muted-foreground))"
                : alertTypeColor(alert.alert_type)
            }
          />
        </View>

        {/* Мэдээлэл */}
        <View className="flex-1">
          <View className="flex-row items-center justify-between mb-1">
            <Text
              className={`text-sm ${
                alert.read
                  ? "text-foreground font-normal"
                  : "text-foreground font-semibold"
              }`}
              numberOfLines={1}
            >
              {alert.geofences?.name ?? "Тодорхойгүй бүс"}
            </Text>
            {!alert.read && (
              <View className="w-2 h-2 rounded-full bg-primary ml-2" />
            )}
          </View>

          <View className="flex-row items-center gap-2 mb-1">
            <Text className="text-sm text-muted-foreground">
              {alert.horses?.name ?? "Тодорхойгүй морь"}
            </Text>
            <View className="flex-row items-center gap-1">
              <Ionicons
                name={alertTypeIcon(alert.alert_type)}
                size={12}
                color={alertTypeColor(alert.alert_type)}
              />
              <Text
                className="text-xs font-medium"
                style={{ color: alertTypeColor(alert.alert_type) }}
              >
                {alert.alert_type === "entered" ? "Нэвтэрсэн" : "Гарсан"}
              </Text>
            </View>
          </View>

          <Text className="text-xs text-muted-foreground">
            {timeAgo(alert.created_at)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ── Газрын зургийн сэрүүлгийн түүх ───────────────────────────────────

export default function GeofenceAlertsScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [markingIds, setMarkingIds] = useState<Set<string>>(new Set());

  // ── Сэрүүлгүүд татах ─────────────────────────────────────────────
  const {
    data: alerts = [],
    isPending,
    error,
    refetch,
  } = useQuery({
    queryKey: ["geofence-alerts", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("geofence_alerts")
        .select("*, geofences(name), horses(name)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as GeofenceAlert[];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60,
  });

  // ── Уншсан болгох ────────────────────────────────────────────────
  const markReadMutation = useMutation({
    mutationFn: async (alertId: string) => {
      setMarkingIds((prev) => new Set(prev).add(alertId));
      const { error } = await supabase
        .from("geofence_alerts")
        .update({ read: true })
        .eq("id", alertId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["geofence-alerts", user?.id],
      });
    },
    onSettled: (_data, _error, alertId) => {
      setMarkingIds((prev) => {
        const next = new Set(prev);
        next.delete(alertId);
        return next;
      });
    },
  });

  // ── Бүгдийг уншсан болгох ────────────────────────────────────────
  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) return;
      const { error } = await supabase
        .from("geofence_alerts")
        .update({ read: true })
        .eq("user_id", user.id)
        .eq("read", false);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["geofence-alerts", user?.id],
      });
    },
  });

  // ── Дархад ───────────────────────────────────────────────────────
  const handlePress = useCallback(
    (alert: GeofenceAlert) => {
      if (!alert.read && !markingIds.has(alert.id)) {
        markReadMutation.mutate(alert.id);
      }
    },
    [markReadMutation, markingIds],
  );

  // ── Ачаалж байна ────────────────────────────────────────────────
  if (isPending) {
    return (
      <View className="flex-1 bg-background">
        <PageHeader title="Газрын зургийн сэрүүлэг" showBack />
        <LoadingState text="Сэрүүлэг ачаалж байна..." />
      </View>
    );
  }

  // ── Алдаа ────────────────────────────────────────────────────────
  if (error) {
    return (
      <View className="flex-1 bg-background">
        <PageHeader title="Газрын зургийн сэрүүлэг" showBack />
        <ErrorState
          message="Сэрүүлэг ачаалахад алдаа гарлаа"
          onRetry={() => refetch()}
        />
      </View>
    );
  }

  // ── Агуулга ──────────────────────────────────────────────────────
  const hasAlerts = alerts.length > 0;
  const hasUnread = alerts.some((a) => !a.read);

  return (
    <View className="flex-1 bg-background">
      <PageHeader title="Газрын зургийн сэрүүлэг" showBack />

      {hasAlerts && hasUnread && (
        <View className="px-4 pt-3 pb-1 items-end">
          <TouchableOpacity
            onPress={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
            className="py-1 px-3"
          >
            <Text className="text-primary text-sm font-medium">
              {markAllReadMutation.isPending
                ? "Тэмдэглэж байна..."
                : "Бүгдийг уншсан болгох"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={alerts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <AlertItem
            alert={item}
            onPress={() => handlePress(item)}
          />
        )}
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 20 }}
        ListEmptyComponent={
          <EmptyState
            icon="shield-checkmark-outline"
            title="Сэрүүлэг байхгүй"
            subtitle="Газрын зургийн сэрүүлэг энд харагдах болно"
          />
        }
      />
    </View>
  );
}
