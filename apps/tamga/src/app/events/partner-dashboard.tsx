import { useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LoadingState, EmptyState } from "@/components/states";
import type { Event } from "@/hooks/useEvents";

// ── Types ─────────────────────────────────────────────────────

interface EventPartner {
  id: string;
  user_id: string;
  event_id: string;
  role: string;
  status: string;
  created_at: string;
  events: Event;
}

// ── Role & status labels ──────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  partner: "Хамтрагч",
  vet: "Эмч",
  judge: "Шүүгч",
  sponsor: "Ивээн тэтгэгч",
  organizer: "Зохион байгуулагч",
};

const STATUS_VARIANT: Record<string, "default" | "success" | "warning" | "secondary"> = {
  confirmed: "success",
  pending: "warning",
  cancelled: "secondary",
};

const STATUS_LABELS: Record<string, string> = {
  confirmed: "Баталсан",
  pending: "Хүлээгдэж байна",
  cancelled: "Цуцалсан",
};


// ── Stats Row ─────────────────────────────────────────────────

function StatsRow({
  total,
  upcoming,
  completed,
}: {
  total: number;
  upcoming: number;
  completed: number;
}) {
  const stats = [
    { label: "Нийт", value: total, icon: "calendar" as const },
    { label: "Удахгүй", value: upcoming, icon: "time" as const },
    { label: "Дууссан", value: completed, icon: "checkmark-circle" as const },
  ];

  return (
    <View className="flex-row gap-3 px-4 mb-4">
      {stats.map((s) => (
        <Card key={s.label} className="flex-1 items-center py-3">
          <Ionicons name={s.icon} size={20} className="text-primary mb-1" />
          <Text className="text-xl font-bold text-foreground">{s.value}</Text>
          <Text className="text-xs text-muted-foreground">{s.label}</Text>
        </Card>
      ))}
    </View>
  );
}

// ── Partner Event Card ────────────────────────────────────────

function PartnerEventCard({ partner }: { partner: EventPartner }) {
  const router = useRouter();
  const event = partner.events;
  const upcoming = new Date(event.date) >= new Date();
  const roleLabel = ROLE_LABELS[partner.role] ?? partner.role;
  const statusLabel = STATUS_LABELS[partner.status] ?? partner.status;
  const statusVariant = STATUS_VARIANT[partner.status] ?? "secondary";

  return (
    <TouchableOpacity
      onPress={() => router.push(`/horse/${event.horse_id}`)}
      activeOpacity={0.7}
      accessibilityLabel={`${event.title} эвент, ${roleLabel}`}
      accessibilityRole="button"
    >
      <Card className="mb-3">
        <View className="flex-row items-start justify-between mb-2">
          <View className="flex-1 mr-3">
            <Text className="text-base font-bold text-foreground" numberOfLines={1}>
              {event.title}
            </Text>
            <Text className="text-sm text-muted-foreground mt-1">
              {event.horse_name} · {event.event_type}
            </Text>
          </View>
          <Badge variant={statusVariant}>{statusLabel}</Badge>
        </View>

        <View className="flex-row items-center gap-3 mt-2">
          <View className="flex-row items-center gap-1">
            <Ionicons
              name={upcoming ? "time-outline" : "checkmark-circle-outline"}
              size={14}
              className={upcoming ? "text-primary" : "text-muted-foreground"}
            />
            <Text className="text-sm text-muted-foreground">
              {new Date(event.date).toLocaleDateString("mn-MN", { year: "numeric", month: "short", day: "numeric" })}
            </Text>
          </View>

          <Badge variant="outline">{roleLabel}</Badge>
        </View>

        {event.location && (
          <Text className="text-sm text-muted-foreground mt-2">
            📍 {event.location}
          </Text>
        )}

        {event.result && (
          <Text className="text-sm font-semibold text-primary mt-2">
            {event.result}
          </Text>
        )}
      </Card>
    </TouchableOpacity>
  );
}

// ── Main Screen ───────────────────────────────────────────────

export default function PartnerDashboardScreen() {
  const { user } = useAuth();
  const userId = user?.id;

  const {
    data: partners,
    isPending,
    isRefetching,
    refetch,
  } = useQuery<EventPartner[]>({
    queryKey: ["event-partners", userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from("event_partners")
        .select("*, events(*)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching partner events:", error);
        throw error;
      }

      return (data as EventPartner[]) ?? [];
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });

  const partnerList = partners ?? [];

  const stats = useMemo(() => {
    const total = partnerList.length;
    const upcoming = partnerList.filter((p) => new Date(p.events.date) >= new Date()).length;
    const completed = total - upcoming;
    return { total, upcoming, completed };
  }, [partnerList]);

  return (
    <View className="flex-1 bg-background">
      <PageHeader
        title="Хамтрагчийн үйл явдал"
        subtitle="Таны оролцож буй эвентүүд"
        showBack
      />

      {isPending ? (
        <LoadingState text="Үйл явдал ачаалж байна..." />
      ) : partnerList.length === 0 ? (
        <EmptyState
          icon="people-outline"
          title="Танд хамтрагчийн үйл явдал байхгүй"
          subtitle="Бусад хэрэглэгчдийн эвентэд уригдсан эсэхээ шалгана уу"
        />
      ) : (
        <FlatList
          data={partnerList}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            <StatsRow
              total={stats.total}
              upcoming={stats.upcoming}
              completed={stats.completed}
            />
          }
          renderItem={({ item }) => <PartnerEventCard partner={item} />}
          contentContainerClassName="px-4 pb-24"
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
        />
      )}
    </View>
  );
}
