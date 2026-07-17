import { useState, useMemo } from "react";
import { View, Text, ScrollView, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Loading } from "@/components/ui/Loading";
import { EmptyState } from "@/components/ui/EmptyState";
import { InfoRow } from "@/components/ui/InfoRow";
import { format } from "date-fns";

/* ── Types ─────────────────────────────────────────────────────── */

interface StampRecord {
  id: string;
  stamp_type: string;
  applied_date: string;
  region: string | null;
  veterinarian_name: string | null;
  notes: string | null;
  horses: {
    name: string;
    breed: string | null;
    owner: { display_name: string } | null;
  } | null;
}

/* ── Constants ─────────────────────────────────────────────────── */

const STAMP_TYPE_LABELS: Record<string, string> = {
  ear: "Чих",
  neck: "Хүзүү",
  brand: "Бөг",
};

const STAMP_TYPE_VARIANTS: Record<
  string,
  "default" | "secondary" | "success" | "warning" | "outline"
> = {
  ear: "default",
  neck: "success",
  brand: "warning",
};

const STAMP_TYPE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  ear: "ear-outline",
  neck: "body-outline",
  brand: "flame-outline",
};

/* ── Query ─────────────────────────────────────────────────────── */

function useHorseStamps() {
  return useQuery({
    queryKey: ["horse-stamps"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("horse_stamps")
        .select(
          "*, horses(name, breed, owner:profiles!horses_owner_id_fkey(display_name))"
        )
        .order("applied_date", { ascending: false });

      if (error) throw error;
      return data as StampRecord[];
    },
  });
}

/* ── Stamp Card ────────────────────────────────────────────────── */

function StampCard({ stamp }: { stamp: StampRecord }) {
  const typeLabel = STAMP_TYPE_LABELS[stamp.stamp_type] ?? stamp.stamp_type;
  const variant = STAMP_TYPE_VARIANTS[stamp.stamp_type] ?? "secondary";
  const icon = STAMP_TYPE_ICONS[stamp.stamp_type] ?? "finger-print-outline";
  const formattedDate = stamp.applied_date
    ? format(new Date(stamp.applied_date), "yyyy-MM-dd")
    : "—";

  return (
    <View className="flex-row gap-3 mb-4">
      {/* Timeline connector */}
      <View className="items-center pt-2">
        <View className="w-8 h-8 rounded-full bg-primary/10 items-center justify-center">
          <Ionicons name={icon} size={16} className="text-primary" />
        </View>
        <View className="w-px flex-1 bg-border mt-1" />
      </View>

      {/* Card content */}
      <Card className="flex-1 mb-0">
        <View className="flex-row items-center justify-between mb-2">
          <Badge variant={variant}>{typeLabel}</Badge>
          <Text className="text-muted-foreground text-xs">{formattedDate}</Text>
        </View>

        <InfoRow label="Морины нэр" value={stamp.horses?.name ?? "—"} />
        {stamp.horses?.breed && (
          <InfoRow label="Үүлдэр" value={stamp.horses.breed} />
        )}
        <InfoRow label="Байршил" value={stamp.region ?? "—"} />
        <InfoRow
          label="Хэрэглэсэн огноо"
          value={formattedDate}
        />
        {stamp.veterinarian_name && (
          <InfoRow label="Эмч" value={stamp.veterinarian_name} />
        )}
        {stamp.horses?.owner?.display_name && (
          <InfoRow label="Эзэн" value={stamp.horses.owner.display_name} />
        )}
        {stamp.notes && (
          <View className="mt-2 pt-2 border-t border-border">
            <Text className="text-muted-foreground text-xs mb-1">Тэмдэглэл</Text>
            <Text className="text-foreground text-sm">{stamp.notes}</Text>
          </View>
        )}
      </Card>
    </View>
  );
}

/* ── Screen ────────────────────────────────────────────────────── */

export default function StampTracingScreen() {
  const [search, setSearch] = useState("");
  const { data: stamps = [], isPending, error } = useHorseStamps();

  const filtered = useMemo(() => {
    if (!search.trim()) return stamps;
    const q = search.trim().toLowerCase();
    return stamps.filter(
      (s) =>
        s.horses?.name?.toLowerCase().includes(q) ||
        s.veterinarian_name?.toLowerCase().includes(q) ||
        s.region?.toLowerCase().includes(q)
    );
  }, [stamps, search]);

  return (
    <View className="flex-1 bg-background">
      <PageHeader title="Тэмдэглэгээ мөрдөх" showBack />

      {/* Search */}
      <View className="px-4 mb-4">
        <View className="flex-row items-center bg-card border border-border rounded-xl px-4 py-2.5 gap-2">
          <Ionicons
            name="search-outline"
            size={18}
            className="text-muted-foreground"
          />
          <TextInput
            className="flex-1 text-foreground text-base"
            placeholder="Морины нэрээр хайх..."
            placeholderTextColor="rgb(var(--muted-foreground))"
            value={search}
            onChangeText={setSearch}
            accessibilityLabel="Морины нэрээр хайх"
          />
          {search.length > 0 && (
            <Ionicons
              name="close-circle"
              size={18}
              className="text-muted-foreground"
              onPress={() => setSearch("")}
              accessibilityLabel="Хайх утга арилгах"
              accessibilityRole="button"
            />
          )}
        </View>
      </View>

      {/* Content */}
      {isPending ? (
        <Loading />
      ) : error ? (
        <EmptyState
          icon="alert-circle-outline"
          title="Алдаа гарлаа"
          subtitle="Дахин оролдоно уу"
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="finger-print-outline"
          title="Тэмдэглэгээ байхгүй"
          subtitle={
            search
              ? `"${search}" гэсэн хайлтад тохирох тэмдэглэгээ олдсонгүй`
              : undefined
          }
        />
      ) : (
        <ScrollView
          className="flex-1 px-4"
          contentContainerStyle={{ paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        >
          {filtered.map((stamp) => (
            <StampCard key={stamp.id} stamp={stamp} />
          ))}
        </ScrollView>
      )}
    </View>
  );
}
