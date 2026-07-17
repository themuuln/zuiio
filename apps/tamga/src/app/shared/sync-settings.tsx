import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Switch } from "@/components/ui/Switch";
import { PageHeader } from "@/components/ui/PageHeader";
import { LoadingState, ErrorState } from "@/components/states";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Separator } from "@/components/ui/Separator";
import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect, useCallback } from "react";

// ── Types ─────────────────────────────────────────────────────

interface SyncSettings {
  user_id: string;
  auto_sync: boolean;
  wifi_only: boolean;
  sync_files: boolean;
  sync_interval: number;
  storage_limit_mb: number;
  last_sync_at: string | null;
  storage_used_mb: number;
}

// ── Defaults ──────────────────────────────────────────────────

const DEFAULT_SETTINGS: Omit<SyncSettings, "user_id"> = {
  auto_sync: true,
  wifi_only: false,
  sync_files: false,
  sync_interval: 15,
  storage_limit_mb: 500,
  last_sync_at: null,
  storage_used_mb: 0,
};

const INTERVAL_OPTIONS = [
  { value: 5, label: "5 минут" },
  { value: 15, label: "15 минут" },
  { value: 30, label: "30 минут" },
  { value: 60, label: "60 минут" },
] as const;

function formatDateTime(iso: string | null): string {
  if (!iso) return "Тодорхойгүй";
  try {
    return new Date(iso).toLocaleString("mn-MN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "Тодорхойгүй";
  }
}

// ── Toggle Row ────────────────────────────────────────────────

function ToggleRow({
  label,
  icon,
  value,
  onValueChange,
  disabled,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  value: boolean;
  onValueChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <View className="flex-row items-center justify-between py-3">
      <View className="flex-row items-center gap-3 flex-1">
        <Ionicons name={icon} size={22} className="text-muted-foreground" />
        <Text className="text-foreground text-base flex-1">{label}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
      />
    </View>
  );
}

// ── Interval Picker ───────────────────────────────────────────

function IntervalPicker({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <View className="py-3">
      <View className="flex-row items-center gap-3 mb-3">
        <Ionicons
          name="time-outline"
          size={22}
          className="text-muted-foreground"
        />
        <Text className="text-foreground text-base">
          Синхрончлолын давтамж
        </Text>
      </View>
      <View className="flex-row gap-2 ml-8">
        {INTERVAL_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            onPress={() => !disabled && onChange(opt.value)}
            disabled={disabled}
            className={`px-3 py-1.5 rounded-lg ${
              value === opt.value ? "bg-primary" : "bg-secondary"
            } ${disabled ? "opacity-50" : ""}`}
          >
            <Text
              className={`text-sm ${
                value === opt.value
                  ? "text-primary-foreground font-semibold"
                  : "text-secondary-foreground"
              }`}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────

export default function SyncSettingsScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [localSettings, setLocalSettings] =
    useState<Omit<SyncSettings, "user_id">>(DEFAULT_SETTINGS);
  const [storageInput, setStorageInput] = useState(
    String(DEFAULT_SETTINGS.storage_limit_mb)
  );

  // Fetch settings from Supabase
  const { isPending, error, data: settings } = useQuery({
    queryKey: ["sync-settings", user?.id],
    queryFn: async (): Promise<SyncSettings | null> => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("sync_settings")
        .select("*")
        .eq("user_id", user.id)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
    enabled: !!user,
  });

  // Sync local state from fetched settings
  useEffect(() => {
    if (settings) {
      setLocalSettings({
        auto_sync: settings.auto_sync ?? DEFAULT_SETTINGS.auto_sync,
        wifi_only: settings.wifi_only ?? DEFAULT_SETTINGS.wifi_only,
        sync_files: settings.sync_files ?? DEFAULT_SETTINGS.sync_files,
        sync_interval:
          settings.sync_interval ?? DEFAULT_SETTINGS.sync_interval,
        storage_limit_mb:
          settings.storage_limit_mb ?? DEFAULT_SETTINGS.storage_limit_mb,
        last_sync_at: settings.last_sync_at,
        storage_used_mb: settings.storage_used_mb ?? 0,
      });
      setStorageInput(
        String(settings.storage_limit_mb ?? DEFAULT_SETTINGS.storage_limit_mb)
      );
    }
  }, [settings]);

  // Save settings mutation
  const saveMutation = useMutation({
    mutationFn: async (updates: Partial<SyncSettings>) => {
      if (!user) throw new Error("Нэвтрэх шаардлагатай");
      const { error } = await supabase.from("sync_settings").upsert(
        {
          user_id: user.id,
          ...updates,
        },
        { onConflict: "user_id" }
      );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["sync-settings", user?.id],
      });
    },
  });

  // Manual sync trigger
  const manualSyncMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Нэвтрэх шаардлагатай");
      const now = new Date().toISOString();
      const { error } = await supabase.from("sync_settings").upsert(
        {
          user_id: user.id,
          last_sync_at: now,
        },
        { onConflict: "user_id" }
      );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["sync-settings", user?.id],
      });
    },
  });

  const handleToggle = useCallback(
    (
      key: keyof Omit<
        SyncSettings,
        "user_id" | "last_sync_at" | "storage_used_mb"
      >,
      value: boolean,
    ) => {
      setLocalSettings((prev) => ({ ...prev, [key]: value }));
      saveMutation.mutate({ [key]: value });
    },
    [saveMutation],
  );

  const handleIntervalChange = useCallback(
    (value: number) => {
      setLocalSettings((prev) => ({ ...prev, sync_interval: value }));
      saveMutation.mutate({ sync_interval: value });
    },
    [saveMutation],
  );

  const handleStorageLimitChange = useCallback(() => {
    const parsed = parseInt(storageInput, 10);
    if (isNaN(parsed) || parsed < 0) return;
    setLocalSettings((prev) => ({ ...prev, storage_limit_mb: parsed }));
    saveMutation.mutate({ storage_limit_mb: parsed });
  }, [storageInput, saveMutation]);

  if (isPending) return <LoadingState />;
  if (error) return <ErrorState message="Тохиргоог ачаалахад алдаа гарлаа" />;

  const storagePercent =
    localSettings.storage_limit_mb > 0
      ? Math.min(
          100,
          (localSettings.storage_used_mb / localSettings.storage_limit_mb) *
            100,
        )
      : 0;

  return (
    <ScrollView className="flex-1 bg-background">
      <PageHeader title="Синхрончлолын тохиргоо" showBack />

      <View className="px-4 pb-8">
        {/* Toggle Settings */}
        <View className="bg-card rounded-xl p-4 mb-4">
          <ToggleRow
            label="Автомат синхрончлол"
            icon="sync-outline"
            value={localSettings.auto_sync}
            onValueChange={(v) => handleToggle("auto_sync", v)}
            disabled={saveMutation.isPending}
          />

          <Separator className="my-1" />

          <ToggleRow
            label="Wi-Fi зөвхөн"
            icon="wifi-outline"
            value={localSettings.wifi_only}
            onValueChange={(v) => handleToggle("wifi_only", v)}
            disabled={saveMutation.isPending || !localSettings.auto_sync}
          />

          <Separator className="my-1" />

          <ToggleRow
            label="Файлыг синхронлох"
            icon="document-outline"
            value={localSettings.sync_files}
            onValueChange={(v) => handleToggle("sync_files", v)}
            disabled={saveMutation.isPending}
          />
        </View>

        {/* Interval Picker */}
        <View className="bg-card rounded-xl p-4 mb-4">
          <IntervalPicker
            value={localSettings.sync_interval}
            onChange={handleIntervalChange}
            disabled={saveMutation.isPending || !localSettings.auto_sync}
          />
        </View>

        {/* Storage Limit */}
        <View className="bg-card rounded-xl p-4 mb-4">
          <View className="flex-row items-center gap-3 mb-2">
            <Ionicons
              name="folder-outline"
              size={22}
              className="text-muted-foreground"
            />
            <Text className="text-foreground text-base">
              Орон нутгийн хадгалалтын хязгаар
            </Text>
          </View>
          <View className="ml-8">
            <Input
              value={storageInput}
              onChangeText={setStorageInput}
              onBlur={handleStorageLimitChange}
              keyboardType="numeric"
              placeholder="500"
              hint="MB"
              editable={localSettings.auto_sync}
            />
          </View>
        </View>

        {/* Status Section */}
        <View className="bg-card rounded-xl p-4 mb-4">
          <Text className="text-muted-foreground text-sm font-medium mb-3">
            Төлөв
          </Text>

          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center gap-2">
              <Ionicons
                name="time-outline"
                size={18}
                className="text-muted-foreground"
              />
              <Text className="text-muted-foreground text-sm">
                Сүүлд синхронлосон
              </Text>
            </View>
            <Text className="text-foreground text-sm">
              {formatDateTime(localSettings.last_sync_at)}
            </Text>
          </View>

          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center gap-2">
              <Ionicons
                name="server-outline"
                size={18}
                className="text-muted-foreground"
              />
              <Text className="text-muted-foreground text-sm">
                Ашигласан хадгалалт
              </Text>
            </View>
            <Text className="text-foreground text-sm">
              {localSettings.storage_used_mb >= 1024
                ? `${(localSettings.storage_used_mb / 1024).toFixed(1)} GB`
                : `${localSettings.storage_used_mb} MB`}{" "}
              /{" "}
              {localSettings.storage_limit_mb >= 1024
                ? `${(localSettings.storage_limit_mb / 1024).toFixed(1)} GB`
                : `${localSettings.storage_limit_mb} MB`}
            </Text>
          </View>

          {/* Storage progress bar */}
          <View className="bg-secondary rounded-full h-2 mb-4 overflow-hidden">
            <View
              className="bg-primary rounded-full h-2"
              style={{ width: `${storagePercent}%` }}
            />
          </View>
        </View>

        {/* Manual Sync */}
        <Button
          title="Гараар синхронлох"
          variant="primary"
          loading={manualSyncMutation.isPending}
          disabled={!localSettings.auto_sync}
          onPress={() => manualSyncMutation.mutate()}
        />

        {manualSyncMutation.isError && (
          <Text className="text-destructive text-sm mt-2 text-center">
            Синхрончлолд алдаа гарлаа. Дахин оролдоно уу.
          </Text>
        )}
        {manualSyncMutation.isSuccess && (
          <Text className="text-primary text-sm mt-2 text-center">
            Амжилттай синхронлолоо.
          </Text>
        )}
      </View>
    </ScrollView>
  );
}
