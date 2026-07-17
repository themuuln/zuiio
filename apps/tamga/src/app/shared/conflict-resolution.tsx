import { View, Text, ScrollView, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Loading } from "@/components/ui/Loading";
import { EmptyState } from "@/components/ui/EmptyState";
import { Separator } from "@/components/ui/Separator";
import { format } from "date-fns";

/* ── Types ─────────────────────────────────────────────────────── */

interface SyncConflict {
  id: string;
  table_name: string;
  record_id: string;
  record_name: string | null;
  conflict_type: "local_modified" | "remote_modified" | "deleted";
  local_version: Record<string, unknown> | null;
  remote_version: Record<string, unknown> | null;
  user_id: string;
  created_at: string;
  resolved: boolean;
}

/* ── Constants ─────────────────────────────────────────────────── */

const TABLE_LABELS: Record<string, string> = {
  horses: "Морь",
  health_logs: "Эрүүл мэндийн тэмдэглэл",
  owners: "Эзэмшигч",
  events: "Үйл явдал",
  training_sessions: "Сургалтын хичээл",
  race_entries: "Уралдааны бүртгэл",
  listings: "Зар",
  lost_horses: "Алдсан морь",
};

const CONFLICT_TYPE_META: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "success" | "warning" | "destructive" | "outline";
    icon: keyof typeof Ionicons.glyphMap;
  }
> = {
  local_modified: {
    label: "Локал өөрчлөлт",
    variant: "warning",
    icon: "phone-portrait-outline",
  },
  remote_modified: {
    label: "Оддын өөрчлөлт",
    variant: "secondary",
    icon: "cloud-outline",
  },
  deleted: {
    label: "Устгасан",
    variant: "destructive",
    icon: "trash-outline",
  },
};

/* ── Query ─────────────────────────────────────────────────────── */

function useSyncConflicts(userId: string | undefined) {
  return useQuery({
    queryKey: ["sync-conflicts", userId],
    queryFn: async () => {
      if (!userId) return [] as SyncConflict[];
      const { data, error } = await supabase
        .from("sync_conflicts")
        .select("*")
        .eq("user_id", userId)
        .eq("resolved", false)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as SyncConflict[];
    },
    enabled: !!userId,
  });
}

/* ── Mutations ─────────────────────────────────────────────────── */

function useResolveConflict(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      conflictId,
      resolution,
    }: {
      conflictId: string;
      resolution: "local" | "remote" | "delete";
    }) => {
      // Mark as resolved in the conflicts table
      const { error: updateError } = await supabase
        .from("sync_conflicts")
        .update({ resolved: true, resolution })
        .eq("id", conflictId);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sync-conflicts", userId] });
    },
  });
}

function useResolveAllConflicts(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (conflictIds: string[]) => {
      const { error } = await supabase
        .from("sync_conflicts")
        .update({ resolved: true, resolution: "remote" })
        .in("id", conflictIds);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sync-conflicts", userId] });
    },
  });
}

/* ── Version Preview ───────────────────────────────────────────── */

function VersionPreview({
  label,
  data,
  icon,
}: {
  label: string;
  data: Record<string, unknown> | null;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  if (!data) return null;
  const entries = Object.entries(data).slice(0, 4);

  return (
    <View className="mt-3 rounded-lg bg-muted/50 p-3">
      <View className="flex-row items-center gap-1.5 mb-2">
        <Ionicons name={icon} size={14} className="text-muted-foreground" />
        <Text className="text-xs font-medium text-muted-foreground">{label}</Text>
      </View>
      {entries.map(([key, value]) => (
        <View key={key} className="flex-row justify-between py-0.5">
          <Text className="text-xs text-muted-foreground">{key}</Text>
          <Text className="text-xs text-foreground font-medium" numberOfLines={1}>
            {typeof value === "object" ? JSON.stringify(value) : String(value ?? "—")}
          </Text>
        </View>
      ))}
    </View>
  );
}

/* ── Conflict Card ─────────────────────────────────────────────── */

function ConflictCard({
  conflict,
  onResolve,
  isResolving,
}: {
  conflict: SyncConflict;
  onResolve: (id: string, resolution: "local" | "remote" | "delete") => void;
  isResolving: boolean;
}) {
  const tableLabel = TABLE_LABELS[conflict.table_name] ?? conflict.table_name;
  const typeMeta = CONFLICT_TYPE_META[conflict.conflict_type] ?? CONFLICT_TYPE_META.local_modified;

  return (
    <Card className="p-4 mb-3">
      {/* Header */}
      <View className="flex-row items-start justify-between mb-2">
        <View className="flex-1">
          <View className="flex-row items-center gap-2 mb-1">
            <Ionicons name={typeMeta.icon} size={16} className="text-foreground" />
            <Text className="text-sm font-semibold text-foreground">
              {conflict.record_name ?? `#${conflict.record_id.slice(0, 8)}`}
            </Text>
          </View>
          <Text className="text-xs text-muted-foreground">
            {tableLabel} · {conflict.record_id.slice(0, 8)}
          </Text>
        </View>
        <Badge variant={typeMeta.variant}>{typeMeta.label}</Badge>
      </View>

      {/* Versions */}
      <VersionPreview
        label="Локал хувилбар"
        data={conflict.local_version}
        icon="phone-portrait-outline"
      />
      <VersionPreview
        label="Оддын хувилбар"
        data={conflict.remote_version}
        icon="cloud-outline"
      />

      {/* Timestamp */}
      <View className="flex-row items-center gap-1 mt-3">
        <Ionicons name="time-outline" size={12} className="text-muted-foreground" />
        <Text className="text-xs text-muted-foreground">
          {format(new Date(conflict.created_at), "yyyy-MM-dd HH:mm")}
        </Text>
      </View>

      <Separator className="my-3" />

      {/* Resolution buttons */}
      <View className="gap-2">
        <Button
          variant="secondary"
          title="Локал өөрчлөлт хадгалах"
          onPress={() => onResolve(conflict.id, "local")}
          disabled={isResolving}
          accessibilityLabel="Локал өөрчлөлт хадгалах"
        />
        <Button
          variant="secondary"
          title="Оддын өөрчлөлт хадгалах"
          onPress={() => onResolve(conflict.id, "remote")}
          disabled={isResolving}
          accessibilityLabel="Оддын өөрчлөлт хадгалах"
        />
        <Button
          variant="destructive"
          title="Устгах"
          onPress={() => onResolve(conflict.id, "delete")}
          disabled={isResolving}
          accessibilityLabel="Хоёр хувилбарыг устгах"
        />
      </View>
    </Card>
  );
}

/* ── Screen ────────────────────────────────────────────────────── */

export default function ConflictResolutionScreen() {
  const { user } = useAuth();
  const { data: conflicts = [], isPending, error } = useSyncConflicts(user?.id);
  const resolveConflict = useResolveConflict(user?.id);
  const resolveAll = useResolveAllConflicts(user?.id);

  const handleResolve = (conflictId: string, resolution: "local" | "remote" | "delete") => {
    if (resolution === "delete") {
      Alert.alert("Баталгаажуулах", "Энэ өөрчлөлтийг устгах уу?", [
        { text: "Цуцлах", style: "cancel" },
        {
          text: "Устгах",
          style: "destructive",
          onPress: () => resolveConflict.mutate({ conflictId, resolution }),
        },
      ]);
      return;
    }
    resolveConflict.mutate({ conflictId, resolution });
  };

  const handleResolveAll = () => {
    if (conflicts.length === 0) return;
    Alert.alert(
      "Бүгдийг шийдвэрлэх",
      `${conflicts.length} зөрчлийг бүгдийг нь оддын хувилбараар шийдвэрлэх үү?`,
      [
        { text: "Цуцлах", style: "cancel" },
        {
          text: "Шийдвэрлэх",
          onPress: () => resolveAll.mutate(conflicts.map((c) => c.id)),
        },
      ]
    );
  };

  return (
    <View className="flex-1 bg-background">
      <PageHeader title="Зөрчил шийдвэрлэх" showBack />

      {isPending ? (
        <Loading />
      ) : error ? (
        <EmptyState
          icon="alert-circle-outline"
          title="Алдаа гарлаа"
          subtitle="Дахин оролдоно уу"
        />
      ) : conflicts.length === 0 ? (
        <EmptyState
          icon="checkmark-circle-outline"
          title="Зөрчил байхгүй — бүх мэдээлэл нийцэж байна"
        />
      ) : (
        <>
          {/* Bulk action bar */}
          <View className="px-4 py-3 flex-row items-center justify-between">
            <Text className="text-sm text-muted-foreground">
              {conflicts.length} зөрчил
            </Text>
            <Button
              variant="secondary"
              title="Бүгдийг шийдвэрлэх"
              onPress={handleResolveAll}
              disabled={resolveAll.isPending}
              accessibilityLabel="Бүгдийг шийдвэрлэх"
            />
          </View>

          <ScrollView
            className="flex-1 px-4"
            contentContainerStyle={{ paddingBottom: 32 }}
            showsVerticalScrollIndicator={false}
          >
            {conflicts.map((conflict) => (
              <ConflictCard
                key={conflict.id}
                conflict={conflict}
                onResolve={handleResolve}
                isResolving={resolveConflict.isPending || resolveAll.isPending}
              />
            ))}
          </ScrollView>
        </>
      )}
    </View>
  );
}
