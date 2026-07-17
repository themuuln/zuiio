import { View, Text, ScrollView } from "react-native";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Switch } from "@/components/ui/Switch";
import { PageHeader } from "@/components/ui/PageHeader";
import { LoadingState, ErrorState } from "@/components/states";
import { useState, useEffect } from "react";

interface NotificationPreferences {
  user_id: string;
  health_reminders: boolean;
  race_updates: boolean;
  market_alerts: boolean;
  team_updates: boolean;
  geofence_alerts: boolean;
  marketing: boolean;
  all_notifications: boolean;
}

const DEFAULT_PREFS: Omit<NotificationPreferences, "user_id"> = {
  health_reminders: true,
  race_updates: true,
  market_alerts: true,
  team_updates: true,
  geofence_alerts: true,
  marketing: false,
  all_notifications: true,
};

const TOGGLE_ITEMS: {
  key: keyof Omit<NotificationPreferences, "user_id" | "all_notifications">;
  label: string;
  icon: string;
}[] = [
  {
    key: "health_reminders",
    label: "Морины эрүүл мэндийн сануулга",
    icon: "heart-outline",
  },
  { key: "race_updates", label: "Уралдааны мэдээлэл", icon: "trophy-outline" },
  { key: "market_alerts", label: "Зах зээлийн мэдэгдэл", icon: "cart-outline" },
  { key: "team_updates", label: "Багийн мэдээлэл", icon: "people-outline" },
  {
    key: "geofence_alerts",
    label: "Геофенс сэрүүлэг",
    icon: "location-outline",
  },
  { key: "marketing", label: "Маркетинг мэдээлэл", icon: "megaphone-outline" },
];

function PreferenceToggle({
  label,
  icon,
  value,
  onValueChange,
  disabled,
}: {
  label: string;
  icon: string;
  value: boolean;
  onValueChange: (val: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <View className="flex-row items-center justify-between py-3 px-4 bg-card border-b border-border">
      <View className="flex-row items-center flex-1 mr-3">
        <View className="w-8 h-8 rounded-full bg-muted items-center justify-center mr-3">
          <Text className="text-muted-foreground text-sm">
            {icon === "heart-outline" && "❤️"}
            {icon === "trophy-outline" && "🏆"}
            {icon === "cart-outline" && "🛒"}
            {icon === "people-outline" && "👥"}
            {icon === "location-outline" && "📍"}
            {icon === "megaphone-outline" && "📢"}
          </Text>
        </View>
        <Text className="text-foreground text-sm flex-1">{label}</Text>
      </View>
      <Switch value={value} onValueChange={onValueChange} disabled={disabled} />
    </View>
  );
}

export default function NotificationsSettingsScreen() {
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const { data: prefs, isPending, error, refetch } = useQuery({
    queryKey: ["notification_preferences", user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error("Хэрэглэгч нэвтрээгүй байна");
      const { data, error } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user.id)
        .single();
      if (error) throw error;
      return data as NotificationPreferences;
    },
    enabled: !!user?.id,
  });

  const updatePrefs = useMutation({
    mutationFn: async (updates: Partial<NotificationPreferences>) => {
      if (!user?.id) throw new Error("Хэрэглэгч нэвтрээгүй байна");
      const { error } = await supabase
        .from("notification_preferences")
        .upsert({ user_id: user.id, ...updates }, { onConflict: "user_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["notification_preferences", user?.id],
      });
    },
  });

  const [localPrefs, setLocalPrefs] = useState<
    Omit<NotificationPreferences, "user_id">
  >(DEFAULT_PREFS);

  useEffect(() => {
    if (prefs) {
      setLocalPrefs({
        health_reminders: prefs.health_reminders,
        race_updates: prefs.race_updates,
        market_alerts: prefs.market_alerts,
        team_updates: prefs.team_updates,
        geofence_alerts: prefs.geofence_alerts,
        marketing: prefs.marketing,
        all_notifications: prefs.all_notifications,
      });
    }
  }, [prefs]);

  function handleToggle(
    key: keyof Omit<NotificationPreferences, "user_id">
  ) {
    return (value: boolean) => {
      setLocalPrefs((prev) => ({ ...prev, [key]: value }));
      updatePrefs.mutate({ [key]: value });
    };
  }

  if (authLoading || isPending) {
    return <LoadingState text="Мэдэгдлийн тохиргоо ачаалж байна..." />;
  }

  if (error) {
    return (
      <ErrorState
        message="Мэдэгдлийн тохиргоог ачаалж чадсангүй"
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <ScrollView className="flex-1 bg-background">
      <PageHeader title="Мэдэгдлийн тохиргоо" showBack />

      {/* Global toggle */}
      <View className="mx-4 mt-4 mb-2 bg-card rounded-xl overflow-hidden">
        <PreferenceToggle
          label="Бүх мэдэгдэл"
          icon="notifications-outline"
          value={localPrefs.all_notifications}
          onValueChange={(value) => {
            setLocalPrefs((prev) => {
              const updated = {
                all_notifications: value,
                health_reminders: value,
                race_updates: value,
                market_alerts: value,
                team_updates: value,
                geofence_alerts: value,
                marketing: prev.marketing,
              };
              updatePrefs.mutate(updated);
              return updated;
            });
          }}
        />
      </View>

      {/* Individual toggles */}
      <View className="mx-4 mb-4 bg-card rounded-xl overflow-hidden">
        <Text className="text-muted-foreground text-xs uppercase tracking-wider px-4 pt-3 pb-1">
          Мэдэгдлийн төрөл
        </Text>
        {TOGGLE_ITEMS.map((item) => (
          <PreferenceToggle
            key={item.key}
            label={item.label}
            icon={item.icon}
            value={localPrefs[item.key]}
            onValueChange={handleToggle(item.key)}
            disabled={!localPrefs.all_notifications}
          />
        ))}
      </View>
    </ScrollView>
  );
}
