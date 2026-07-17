import { useState } from "react";
import { View, Text, FlatList, TouchableOpacity, Alert } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { mn } from "date-fns/locale";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Loading } from "@/components/ui/Loading";
import { EmptyState } from "@/components/ui/EmptyState";
import { Switch } from "@/components/ui/Switch";

// ── Types ───────────────────────────────────────────────────

interface TrialSlot {
  id: string;
  listing_id: string;
  date: string;
  time: string;
  status: "available" | "booked" | "past";
  booked_by: string | null;
  created_at: string;
}

// ── Status helpers ──────────────────────────────────────────

const STATUS_LABELS: Record<TrialSlot["status"], string> = {
  available: "Боломжтой",
  booked: "Захиалсан",
  past: "Өнгөрсөн",
};

const STATUS_BADGE: Record<TrialSlot["status"], "success" | "warning" | "secondary"> = {
  available: "success",
  booked: "warning",
  past: "secondary",
};

const STATUS_ICONS: Record<TrialSlot["status"], keyof typeof Ionicons.glyphMap> = {
  available: "checkmark-circle-outline",
  booked: "time-outline",
  past: "close-circle-outline",
};

// ── Hooks ───────────────────────────────────────────────────

function useTrialSlots(listingId: string | undefined) {
  return useQuery({
    queryKey: ["trial-slots", listingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trial_slots")
        .select("*")
        .eq("listing_id", listingId!)
        .order("date", { ascending: true });

      if (error) throw error;
      return (data ?? []) as TrialSlot[];
    },
    enabled: !!listingId,
    staleTime: 1000 * 60,
  });
}

function useBookTrialSlot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ slotId, userId }: { slotId: string; userId: string }) => {
      const { data, error } = await supabase
        .from("trial_slots")
        .update({ status: "booked", booked_by: userId })
        .eq("id", slotId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["trial-slots"] });
    },
  });
}

// ── Slot card ───────────────────────────────────────────────

function SlotCard({
  slot,
  isMySlot,
  onBook,
  isPending,
}: {
  slot: TrialSlot;
  isMySlot: boolean;
  onBook: () => void;
  isPending: boolean;
}) {
  const slotDate = new Date(slot.date);

  return (
    <Card className="mb-3">
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <View className="flex-row items-center gap-2 mb-1">
            <Ionicons name="calendar-outline" size={16} className="text-primary" />
            <Text className="text-foreground font-medium">
              {format(slotDate, "yyyy.MM.dd", { locale: mn })}
            </Text>
          </View>

          <View className="flex-row items-center gap-2 mb-2">
            <Ionicons name="time-outline" size={16} className="text-muted-foreground" />
            <Text className="text-muted-foreground text-sm">{slot.time}</Text>
          </View>

          <View className="flex-row items-center gap-2">
            <Ionicons name={STATUS_ICONS[slot.status]} size={14} className="text-muted-foreground" />
            <Badge variant={STATUS_BADGE[slot.status]}>
              {STATUS_LABELS[slot.status]}
            </Badge>
            {isMySlot && (
              <Badge variant="outline">Таны захиалга</Badge>
            )}
          </View>
        </View>

        {slot.status === "available" && (
          <TouchableOpacity
            className="bg-primary rounded-lg px-4 py-2"
            onPress={onBook}
            disabled={isPending}
          >
            <Text className="text-primary-foreground font-medium text-sm">
              {isPending ? "...": "Захиалах"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </Card>
  );
}

// ── Screen ──────────────────────────────────────────────────

export default function TrialSlotsScreen() {
  const { listing_id } = useLocalSearchParams<{ listing_id: string }>();
  const { user } = useAuth();
  const [showMyBookings, setShowMyBookings] = useState(false);

  const { data: slots = [], isPending, error, refetch } = useTrialSlots(listing_id);
  const bookSlot = useBookTrialSlot();

  const filteredSlots = showMyBookings
    ? slots.filter((s) => s.booked_by === user?.id)
    : slots;

  const handleBook = (slotId: string) => {
    if (!user) {
      Alert.alert("Нэвтрэх шаардлагатай", "Захиалга хийхийн тулд нэвтрэнэ үү.");
      return;
    }

    Alert.alert(
      "Захиалах",
      "Энэ цагийг захиалах уу?",
      [
        { text: "Цуцлах", style: "cancel" },
        {
          text: "Тийм",
          onPress: () => bookSlot.mutate({ slotId, userId: user.id }),
        },
      ],
    );
  };

  return (
    <View className="flex-1 bg-background">
      <PageHeader
        title="Туршилтын цаг"
        subtitle={`Нийт ${slots.length} цаг`}
        showBack
      />

      <View className="flex-row items-center justify-between px-4 mb-2">
        <Text className="text-muted-foreground text-sm">
          {showMyBookings ? "Захиалсан цагууд" : "Бүх цагууд"}
        </Text>
        <View className="flex-row items-center gap-2">
          <Text className="text-muted-foreground text-sm">Миний захиалга</Text>
          <Switch
            value={showMyBookings}
            onValueChange={setShowMyBookings}
          />
        </View>
      </View>

      {isPending ? (
        <Loading />
      ) : error ? (
        <EmptyState
          icon="alert-circle-outline"
          title="Алдаа гарлаа"
          subtitle="Цагуудыг ачаалахад алдаа гарлаа"
          action={
            <TouchableOpacity onPress={() => refetch()} className="bg-primary rounded-lg px-4 py-2">
              <Text className="text-primary-foreground font-medium">Дахин оролдох</Text>
            </TouchableOpacity>
          }
        />
      ) : (
        <FlatList
          data={filteredSlots}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <SlotCard
              slot={item}
              isMySlot={item.booked_by === user?.id}
              onBook={() => handleBook(item.id)}
              isPending={bookSlot.isPending}
            />
          )}
          contentContainerClassName="px-4 pb-20"
          ListEmptyComponent={
            <EmptyState
              icon="calendar-outline"
              title={showMyBookings ? "Захиалсан цаг байхгүй" : "Туршилтын цаг байхгүй"}
              subtitle={
                showMyBookings
                  ? "Та одоогоор цаг захиалаагүй байна"
                  : "Энэ зар дээр туршилтын цаг нэмээгүй байна"
              }
            />
          }
        />
      )}
    </View>
  );
}
