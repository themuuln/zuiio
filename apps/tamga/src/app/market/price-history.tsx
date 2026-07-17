import { useState, useMemo } from "react";
import { View, Text, ScrollView, FlatList } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { InfoRow } from "@/components/ui/InfoRow";
import { FilterChips } from "@/components/ui/FilterChips";
import { Loading } from "@/components/ui/Loading";
import { EmptyState } from "@/components/ui/EmptyState";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SoldListing {
  listing_type: string;
  price_mnt: number | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TYPE_FILTERS = [
  { label: "Бүгд", value: "all" },
  { label: "Зарах", value: "sale" },
  { label: "Хөлслөх", value: "lease" },
  { label: "Үржүүлэх", value: "stud" },
];

const TYPE_LABELS: Record<string, string> = {
  sale: "Зарах",
  lease: "Хөлслөх",
  stud: "Үржүүлэх",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatPrice(price: number): string {
  return new Intl.NumberFormat("mn-MN").format(price) + " ₮";
}


type TypeStats = {
  type: string;
  count: number;
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
};

function computeStats(items: SoldListing[]): TypeStats[] {
  const grouped: Record<string, number[]> = {};
  for (const item of items) {
    if (item.price_mnt == null) continue;
    if (!grouped[item.listing_type]) grouped[item.listing_type] = [];
    grouped[item.listing_type].push(item.price_mnt);
  }

  return Object.entries(grouped).map(([type, prices]) => ({
    type,
    count: prices.length,
    avgPrice: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
    minPrice: Math.min(...prices),
    maxPrice: Math.max(...prices),
  }));
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function PriceHistoryScreen() {
  const [selectedType, setSelectedType] = useState("all");

  const { data, isPending, error } = useQuery({
    queryKey: ["price-history"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("listing_type, price_mnt, created_at")
        .eq("status", "sold")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as SoldListing[];
    },
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    if (selectedType === "all") return data;
    return data.filter((item) => item.listing_type === selectedType);
  }, [data, selectedType]);

  const stats = useMemo(() => computeStats(filtered), [filtered]);

  if (isPending) return <Loading />;

  if (error) {
    return (
      <View className="flex-1">
        <PageHeader title="Үнийн түүх" showBack />
        <EmptyState
          icon="alert-circle"
          title="Алдаа гарлаа"
          subtitle="Өгөгдөл татахад алдаа гарлаа. Дахин оролдоно уу."
        />
      </View>
    );
  }

  if (!data || data.length === 0) {
    return (
      <View className="flex-1">
        <PageHeader title="Үнийн түүх" showBack />
        <EmptyState
          icon="folder-open-outline"
          title="Мэдээлэл байхгүй"
          subtitle="Зарлагдсан зар байхгүй байна."
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <PageHeader title="Үнийн түүх" subtitle="Зарлагдсан заруудын үнийн статистик" showBack />

      <FilterChips
        options={TYPE_FILTERS}
        selected={selectedType}
        onSelect={setSelectedType}
      />

      {/* Stats Section */}
      <ScrollView className="px-4" showsVerticalScrollIndicator={false}>
        <Text className="text-lg font-bold text-foreground mb-3">
          Дундаж үнэ
        </Text>

        {stats.length === 0 ? (
          <Card className="mb-4">
            <Text className="text-muted-foreground text-center py-4">
              Энэ төрөлд үнэ байхгүй
            </Text>
          </Card>
        ) : (
          stats.map((s) => (
            <Card key={s.type} className="mb-3">
              <Text className="font-bold text-foreground mb-2">
                {TYPE_LABELS[s.type] ?? s.type}
              </Text>
              <InfoRow label="Нийт тоо" value={s.count} />
              <InfoRow label="Дундаж үнэ" value={formatPrice(s.avgPrice)} />
              <InfoRow label="Хамгийн бага" value={formatPrice(s.minPrice)} />
              <InfoRow label="Хамгийн их" value={formatPrice(s.maxPrice)} />
            </Card>
          ))
        )}

        {/* Recent Sold Listings */}
        <Text className="text-lg font-bold text-foreground mt-4 mb-3">
          Сүүлийн зарууд
        </Text>
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={(_, i) => String(i)}
        contentContainerClassName="px-4 pb-8"
        ListEmptyComponent={
          <EmptyState
            icon="search-outline"
            title="Мэдээлэл байхгүй"
            subtitle="Энэ төрөлд зар байхгүй байна."
          />
        }
        renderItem={({ item }) => (
          <Card className="mb-3">
            <InfoRow
              label="Төрөл"
              value={TYPE_LABELS[item.listing_type] ?? item.listing_type}
            />
            <InfoRow
              label="Үнэ"
              value={item.price_mnt != null ? formatPrice(item.price_mnt) : "—"}
            />
            <InfoRow label="Огноо" value={new Date(item.created_at).toLocaleDateString("mn-MN", { year: "numeric", month: "short", day: "numeric" })} />
          </Card>
        )}
      />
    </View>
  );
}
