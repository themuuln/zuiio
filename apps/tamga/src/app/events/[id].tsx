import { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { PageHeader } from "@/components/ui/PageHeader";
import { useDeleteEvent } from "@/hooks/useEventMutations";
import { Badge } from "@/components/ui/Badge";
import { InfoRow } from "@/components/ui/InfoRow";
import { Separator } from "@/components/ui/Separator";
import { Avatar } from "@/components/ui/Avatar";
import { LoadingState, ErrorState, EmptyState } from "@/components/states";

const EVENT_TYPE_LABELS: Record<string, string> = {
  race: "Уралдаан",
  competition: "Тэмцээн",
  exhibition: "Үзэсгэлэн",
  training: "Сургалт",
};

const EVENT_TYPE_BADGE_VARIANT: Record<string, "default" | "secondary" | "success" | "warning"> = {
  race: "default",
  competition: "secondary",
  exhibition: "success",
  training: "warning",
};

interface Participant {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}

// ── Participant Row ───────────────────────────────────────────────

function ParticipantRow({ participant }: { participant: Participant }) {
  return (
    <View className="flex-row items-center gap-3 py-2.5 border-b border-border">
      <Avatar uri={participant.avatar_url} name={participant.full_name ?? "?"} size="sm" />
      <Text className="text-foreground font-medium flex-1" numberOfLines={1}>
        {participant.full_name || "Нэр байхгүй"}
      </Text>
    </View>
  );
}

// ── Main Screen ──────────────────────────────────────────────────

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  // Fetch event
  const {
    data: event,
    isPending,
    error,
    refetch,
  } = useQuery({
    queryKey: ["events", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data as {
        id: string;
        horse_id: string;
        owner_id: string;
        event_type: string;
        title: string;
        location: string | null;
        date: string;
        result: string | null;
        prize_amount: number | null;
        notes: string | null;
        horse_name: string;
        created_at: string;
      };
    },
    enabled: !!id,
  });

  // Fetch event owner profile
  const { data: ownerProfile } = useQuery({
    queryKey: ["profiles", event?.owner_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .eq("id", event!.owner_id)
        .single();
      if (error) throw error;
      return data as Participant;
    },
    enabled: !!event?.owner_id,
  });

  // Fetch co-owners of the horse as participants
  const { data: participants = [], isPending: participantsLoading } = useQuery({
    queryKey: ["event-participants", event?.horse_id, event?.owner_id],
    queryFn: async () => {
      if (!event) return [];

      const result: Participant[] = [];

      // Add owner
      if (ownerProfile) {
        result.push(ownerProfile);
      }

      // Fetch co-owners of the horse
      const { data: coOwners } = await supabase
        .from("co_owners")
        .select("user_id")
        .eq("horse_id", event.horse_id);

      if (coOwners && coOwners.length > 0) {
        const userIds = coOwners.map((co) => co.user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url")
          .in("id", userIds);

        if (profiles) {
          for (const p of profiles) {
            if (!result.some((r) => r.id === p.id)) {
              result.push(p as Participant);
            }
          }
        }
      }

      return result;
    },
    enabled: !!event?.horse_id,
  });

  // Delete event
  const deleteEvent = useDeleteEvent();

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  function handleDelete() {
    Alert.alert("Устгах", "Энэ үйл явдлыг устгах уу?", [
      { text: "Цуцлах", style: "cancel" },
      {
        text: "Устгах",
        style: "destructive",
        onPress: () => {
          deleteEvent.mutate(id!);
          router.back();
        },
      },
    ]);
  }

  // Loading / error
  if (isPending) return <LoadingState />;
  if (error || !event) return <ErrorState onRetry={() => refetch()} />;

  const isOwner = true; // HARDCODED_USER_ID matches event owner
  const formattedDate = new Date(event.date).toLocaleDateString("mn-MN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const eventTypeLabel = EVENT_TYPE_LABELS[event.event_type] || event.event_type;
  const badgeVariant = EVENT_TYPE_BADGE_VARIANT[event.event_type] || "secondary";

  return (
    <View className="flex-1 bg-background">
      <PageHeader
        title="Үйл явдлын дэлгэрэнгүй"
        showBack
        rightAction={
          isOwner ? (
            <TouchableOpacity
              onPress={() => Alert.alert("Засах", "Засах функц удахгүй нэмэгдэнэ")}
            >
              <Ionicons name="create-outline" size={24} className="text-primary" />
            </TouchableOpacity>
          ) : undefined
        }
      />

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 pb-12"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Title & Badge */}
        <View className="mb-4">
          <Text className="text-2xl font-bold text-foreground mb-2">
            {event.title}
          </Text>
          <Badge variant={badgeVariant}>{eventTypeLabel}</Badge>
        </View>

        {/* Horse name */}
        {event.horse_name ? (
          <View className="bg-card rounded-xl p-4 mb-4 border border-border">
            <Text className="text-muted-foreground text-sm mb-1">Морь</Text>
            <Text className="text-foreground font-semibold">
              {event.horse_name}
            </Text>
          </View>
        ) : null}

        {/* Details card */}
        <View className="bg-card rounded-xl p-4 mb-4 border border-border">
          <InfoRow label="Огноо" value={formattedDate} />
          {event.location && <InfoRow label="Байршил" value={event.location} />}
          {event.prize_amount != null && event.prize_amount > 0 && (
            <InfoRow
              label="Шагналт"
              value={`${event.prize_amount.toLocaleString("mn-MN")} ₮`}
            />
          )}
          {event.result && <InfoRow label="Үр дүн" value={event.result} />}
        </View>

        {/* Notes */}
        {event.notes ? (
          <View className="bg-card rounded-xl p-4 mb-4 border border-border">
            <Text className="text-muted-foreground text-sm mb-2">Тэмдэглэл</Text>
            <Text className="text-foreground leading-5">{event.notes}</Text>
          </View>
        ) : null}

        <Separator className="my-4" />

        {/* Participants */}
        <View className="mb-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-bold text-foreground">Оролцогчид</Text>
            <Text className="text-muted-foreground text-sm">
              {participantsLoading ? "..." : participants.length}
            </Text>
          </View>

          {!participantsLoading && participants.length === 0 ? (
            <EmptyState
              icon="people-outline"
              title="Оролцогч байхгүй"
              subtitle="Энэ үйл явдад оролцогч нэмээгүй байна"
            />
          ) : (
            <View className="bg-card rounded-xl p-4 border border-border">
              {participants.map((p) => (
                <ParticipantRow key={p.id} participant={p} />
              ))}
            </View>
          )}
        </View>

        {/* Owner actions */}
        {isOwner && (
          <View className="mt-4 gap-3">
            <TouchableOpacity
              onPress={() => Alert.alert("Засах", "Засах функц удахгүй нэмэгдэнэ")}
              className="bg-primary rounded-xl py-3.5 items-center"
            >
              <Text className="text-primary-foreground font-semibold text-base">
                Засах
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleDelete}
              className="bg-destructive/10 rounded-xl py-3.5 items-center"
            >
              <Text className="text-destructive font-semibold text-base">
                Устгах
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
