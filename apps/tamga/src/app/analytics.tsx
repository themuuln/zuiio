import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/lib/auth";
import { useProfile } from "@/hooks/useProfile";
import {
  useHerdAnalytics,
  useHealthAnalytics,
  useFinancialAnalytics,
  useBreedingAnalytics,
} from "@/hooks/useAnalytics";
import { useExportCsv, useExportPdf, formatMnt } from "@/hooks/useExport";

// ── Types ───────────────────────────────────────────────────

type AnalyticsTab = "herd" | "health" | "financial" | "breeding";

interface TabDef {
  key: AnalyticsTab;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  requiresBreeder?: boolean;
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

const TABS: TabDef[] = [
  { key: "herd", label: "Сүрэг", icon: "paw" },
  { key: "health", label: "Эрүүл мэнд", icon: "medkit" },
  { key: "financial", label: "Санхүү", icon: "wallet" },
  { key: "breeding", label: "Үржүүлэг", icon: "heart", requiresBreeder: true },
];

// ── Simple chart primitives ─────────────────────────────────

function BarChart({
  data,
  maxValue,
  label,
}: {
  data: { label: string; value: number; color: string }[];
  maxValue: number;
  label: string;
}) {
  return (
    <View className="mb-4">
      <Text className="text-sm font-medium text-muted-foreground mb-2">{label}</Text>
      {data.map((item) => (
        <View key={item.label} className="flex-row items-center mb-2">
          <Text className="w-24 text-xs text-foreground">{item.label}</Text>
          <View className="flex-1 h-5 bg-muted rounded-full overflow-hidden">
            <View
              className="h-full rounded-full"
              style={{
                width: `${maxValue > 0 ? (item.value / maxValue) * 100 : 0}%`,
                backgroundColor: item.color,
                minWidth: item.value > 0 ? 4 : 0,
              }}
            />
          </View>
          <Text className="w-10 text-right text-xs font-medium text-foreground">
            {item.value}
          </Text>
        </View>
      ))}
    </View>
  );
}

function StatCard({
  label,
  value,
  subtitle,
  icon,
}: {
  label: string;
  value: string | number;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View className="bg-card rounded-xl p-4 border border-border mb-3">
      <View className="flex-row items-center mb-1">
        <Ionicons name={icon} size={16} className="text-primary mr-2" />
        <Text className="text-sm text-muted-foreground">{label}</Text>
      </View>
      <Text className="text-2xl font-bold text-foreground">{value}</Text>
      {subtitle ? (
        <Text className="text-xs text-muted-foreground mt-1">{subtitle}</Text>
      ) : null}
    </View>
  );
}

function HorizontalBarChart({
  data,
  label,
}: {
  data: { label: string; value: number; color: string }[];
  label: string;
}) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);
  return (
    <View className="bg-card rounded-xl p-4 border border-border mb-3">
      <Text className="text-sm font-medium text-muted-foreground mb-3">{label}</Text>
      <View className="flex-row items-end justify-between" style={{ height: 100 }}>
        {data.map((item) => (
          <View key={item.label} className="items-center flex-1 mx-0.5">
            <Text className="text-xs text-foreground mb-1">{item.value}</Text>
            <View
              className="w-full rounded-t"
              style={{
                height: `${(item.value / maxValue) * 80}%`,
                backgroundColor: item.color,
                minHeight: item.value > 0 ? 4 : 0,
              }}
            />
            <Text className="text-[10px] text-muted-foreground mt-1" numberOfLines={1}>
              {item.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function ProgressRing({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  return (
    <View className="bg-card rounded-xl p-4 border border-border mb-3 items-center">
      <View className="w-20 h-20 rounded-full border-4 border-muted items-center justify-center mb-2">
        <Text className="text-xl font-bold text-foreground">{value}%</Text>
      </View>
      <Text className="text-sm text-muted-foreground">{label}</Text>
    </View>
  );
}

// ── Tab content ─────────────────────────────────────────────

function HerdTab({ userId }: { userId: string }) {
  const { data, isPending } = useHerdAnalytics(userId);
  const { exportCsv } = useExportCsv();
  const { exportPdf } = useExportPdf();

  if (isPending) {
    return (
      <View className="flex-1 items-center justify-center py-20">
        <Text className="text-muted-foreground">Ачаалж байна...</Text>
      </View>
    );
  }

  if (!data) {
    return (
      <View className="flex-1 items-center justify-center py-20 px-6">
        <Ionicons name="analytics-outline" size={48} className="text-muted-foreground" />
        <Text className="text-muted-foreground mt-4 text-center">
          Сүргийн мэдээлэл байхгүй байна
        </Text>
      </View>
    );
  }

  const genderData = [
    { label: "Азарга", value: data.stallion_count, color: "rgb(var(--destructive))" },
    { label: "Бяруу", value: data.gelding_count, color: "rgb(var(--primary))" },
    { label: "Эм", value: data.mare_count, color: "#a855f7" },
    { label: "Унага", value: data.foal_count, color: "#eab308" },
  ];

  const ageData = [
    { label: "Залуу (≤2 жил)", value: data.young_horses, color: "#22c55e" },
    { label: "Том нас (3-9)", value: data.total_horses - data.young_horses - data.senior_horses, color: "#3b82f6" },
    { label: "Ахмад (≥10)", value: data.senior_horses, color: "#f97316" },
  ];

  const handleExportCsv = () => {
    exportCsv("herd_analytics", ["Ширхэг", "Утга"], [
      ["Нийт морь", data.total_horses],
      ["Азарга", data.stallion_count],
      ["Бяруу", data.gelding_count],
      ["Эм", data.mare_count],
      ["Унага", data.foal_count],
      ["Залуу", data.young_horses],
      ["Ахмад", data.senior_horses],
    ]);
  };

  const handleExportPdf = () => {
    exportPdf("herd_analytics", "Сүргийн анализ", ["Ширхэг", "Утга"], [
      ["Нийт морь", data.total_horses],
      ["Азарга", data.stallion_count],
      ["Бяруу", data.gelding_count],
      ["Эм", data.mare_count],
      ["Унага", data.foal_count],
      ["Залуу", data.young_horses],
      ["Ахмад", data.senior_horses],
    ]);
  };

  return (
    <ScrollView>
      <StatCard
        label="Нийт морь"
        value={data.total_horses}
        subtitle={data.first_horse_date ? `Эхний морь: ${new Date(data.first_horse_date).toLocaleDateString("mn-MN")}` : undefined}
        icon="paw"
      />
      <BarChart data={genderData} maxValue={data.total_horses} label="Хүйсээр" />
      <BarChart data={ageData} maxValue={data.total_horses} label="Насны ангилал" />
      <View className="flex-row gap-2 mt-2">
        <TouchableOpacity
          className="flex-1 bg-card border border-border rounded-lg py-3 items-center"
          onPress={handleExportCsv}
        >
          <Ionicons name="document-text-outline" size={18} className="text-primary" />
          <Text className="text-xs text-foreground mt-1">CSV</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-1 bg-card border border-border rounded-lg py-3 items-center"
          onPress={handleExportPdf}
        >
          <Ionicons name="share-outline" size={18} className="text-primary" />
          <Text className="text-xs text-foreground mt-1">Хуваалцах</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function HealthTab({ userId }: { userId: string }) {
  const { data, isPending } = useHealthAnalytics(userId);

  if (isPending) {
    return (
      <View className="flex-1 items-center justify-center py-20">
        <Text className="text-muted-foreground">Ачаалж байна...</Text>
      </View>
    );
  }

  if (!data) {
    return (
      <View className="flex-1 items-center justify-center py-20 px-6">
        <Ionicons name="medkit-outline" size={48} className="text-muted-foreground" />
        <Text className="text-muted-foreground mt-4 text-center">
          Эрүүл мэдээлэл байхгүй байна
        </Text>
      </View>
    );
  }

  const typeEntries = Object.entries(data.health_events_by_type);
  const eventTypeData = typeEntries.map(([type, count], i) => ({
    label: type,
    value: count,
    color: hslToHex((i * 60) % 360, 70, 55),
  }));

  const maxEventType = Math.max(...eventTypeData.map((d) => d.value), 1);

  return (
    <ScrollView>
      <View className="flex-row gap-2 mb-3">
        <View className="flex-1">
          <StatCard
            label="Нийт эрүүл мэндийн үйлдэл"
            value={data.total_health_events}
            icon="medkit"
          />
        </View>
        <View className="flex-1">
          <StatCard
            label="Вакцин хамралт"
            value={`${data.vaccination_rate}%`}
            subtitle="Сүүлийн жил"
            icon="shield-checkmark"
          />
        </View>
      </View>
      <StatCard
        label="Удахгүй болох вакцинууд"
        value={data.upcoming_vaccinations}
        subtitle="30 хоногийн дотор"
        icon="calendar"
      />
      {eventTypeData.length > 0 ? (
        <BarChart data={eventTypeData} maxValue={maxEventType} label="Төрөл бүрийн үйлдэл" />
      ) : null}
      {data.recent_health_events.length > 0 ? (
        <View className="bg-card rounded-xl p-4 border border-border mb-3">
          <Text className="text-sm font-medium text-muted-foreground mb-3">
            Сүүлийн үйлдлүүд
          </Text>
          {data.recent_health_events.slice(0, 5).map((event, i) => (
            <View
              key={`${event.date}-${i}`}
              className="flex-row justify-between items-center py-2 border-b border-border last:border-0"
            >
              <View className="flex-1">
                <Text className="text-sm font-medium text-foreground">
                  {event.horse_name}
                </Text>
                <Text className="text-xs text-muted-foreground">
                  {event.log_type} · {new Date(event.date).toLocaleDateString("mn-MN")}
                </Text>
              </View>
            </View>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

function FinancialTab({ userId }: { userId: string }) {
  const { data, isPending } = useFinancialAnalytics(userId);

  if (isPending) {
    return (
      <View className="flex-1 items-center justify-center py-20">
        <Text className="text-muted-foreground">Ачаалж байна...</Text>
      </View>
    );
  }

  if (!data) {
    return (
      <View className="flex-1 items-center justify-center py-20 px-6">
        <Ionicons name="wallet-outline" size={48} className="text-muted-foreground" />
        <Text className="text-muted-foreground mt-4 text-center">
          Санхүүгийн мэдээлэл байхгүй байна
        </Text>
      </View>
    );
  }

  const revenueEntries = Object.entries(data.revenue_by_type);
  const revenueData = revenueEntries.map(([type, amount], i) => ({
    label: type,
    value: amount,
    color: hslToHex((i * 80 + 120) % 360, 70, 50),
  }));

  const maxRevenue = Math.max(...revenueData.map((d) => d.value), 1);

  return (
    <ScrollView>
      <View className="flex-row gap-2 mb-3">
        <View className="flex-1">
          <StatCard
            label="Нийт орлого"
            value={formatMnt(data.total_revenue)}
            icon="trending-up"
          />
        </View>
        <View className="flex-1">
          <StatCard
            label="Дундаж үнэ"
            value={formatMnt(data.average_sale_price)}
            icon="pricetag"
          />
        </View>
      </View>
      <View className="flex-row gap-2 mb-3">
        <View className="flex-1">
          <StatCard label="Идэвхтэй" value={data.active_listings} icon="eye" />
        </View>
        <View className="flex-1">
          <StatCard label="Борлуулсан" value={data.sold_listings} icon="checkmark-circle" />
        </View>
      </View>
      <StatCard
        label="Нийт зар"
        value={data.total_listings}
        icon="list"
      />
      {revenueData.length > 0 ? (
        <HorizontalBarChart data={revenueData} label="Борлуулалтын төрөл" />
      ) : null}
    </ScrollView>
  );
}

function BreedingTab({ userId }: { userId: string }) {
  const { data, isPending } = useBreedingAnalytics(userId);

  if (isPending) {
    return (
      <View className="flex-1 items-center justify-center py-20">
        <Text className="text-muted-foreground">Ачаалж байна...</Text>
      </View>
    );
  }

  if (!data) {
    return (
      <View className="flex-1 items-center justify-center py-20 px-6">
        <Ionicons name="heart-outline" size={48} className="text-muted-foreground" />
        <Text className="text-muted-foreground mt-4 text-center">
          Үржлийн мэдээлэл байхгүй байна
        </Text>
      </View>
    );
  }

  return (
    <ScrollView>
      <View className="flex-row gap-2 mb-3">
        <View className="flex-1">
          <StatCard label="Идэвхтэй үржил" value={data.active_breedings} icon="heart" />
        </View>
        <View className="flex-1">
          <StatCard label="Нийт үржил" value={data.total_breedings} icon="git-network" />
        </View>
      </View>
      <ProgressRing value={data.foaling_success_rate} label="Амжилтын хувь (1 жил)" />
      {data.breeding_records.length > 0 ? (
        <View className="bg-card rounded-xl p-4 border border-border mb-3">
          <Text className="text-sm font-medium text-muted-foreground mb-3">
            Үржлийн түүх
          </Text>
          {data.breeding_records.slice(0, 8).map((record, i) => (
            <View
              key={`${record.breeding_date}-${i}`}
              className="py-2 border-b border-border last:border-0"
            >
              <View className="flex-row justify-between items-center">
                <Text className="text-sm font-medium text-foreground">
                  {record.sire_name ?? "?"} × {record.dam_name ?? "?"}
                </Text>
                <View
                  className={`px-2 py-0.5 rounded-full ${
                    record.status === "foaled"
                      ? "bg-green-100 dark:bg-green-900/30"
                      : record.status === "active"
                        ? "bg-blue-100 dark:bg-blue-900/30"
                        : "bg-muted"
                  }`}
                >
                  <Text className="text-[10px] font-medium text-foreground">
                    {record.status === "foaled"
                      ? "Төрсөн"
                      : record.status === "active"
                        ? "Идэвхтэй"
                        : record.status}
                  </Text>
                </View>
              </View>
              <Text className="text-xs text-muted-foreground">
                {new Date(record.breeding_date).toLocaleDateString("mn-MN")}
                {record.expected_foaling_date
                  ? ` · Төлөх: ${new Date(record.expected_foaling_date).toLocaleDateString("mn-MN")}`
                  : ""}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

// ── Main screen ─────────────────────────────────────────────

export default function AnalyticsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const [activeTab, setActiveTab] = useState<AnalyticsTab>("herd");

  const userId = user?.id ?? "";
  const isBreeder = profile?.subscription_tier === "breeder" || profile?.subscription_tier === "pro";

  const visibleTabs = TABS.filter((tab) => !tab.requiresBreeder || isBreeder);

  const renderTab = () => {
    switch (activeTab) {
      case "herd":
        return <HerdTab userId={userId} />;
      case "health":
        return <HealthTab userId={userId} />;
      case "financial":
        return <FinancialTab userId={userId} />;
      case "breeding":
        return isBreeder ? <BreedingTab userId={userId} /> : null;
      default:
        return null;
    }
  };

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pt-12 pb-3">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={24} className="text-foreground" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-foreground">Шинжилгээ</Text>
        </View>
        <Ionicons name="analytics" size={20} className="text-muted-foreground" />
      </View>

      {/* Tab bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="px-4 pb-3"
      >
        {visibleTabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <Pressable
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              className={`flex-row items-center px-4 py-2 rounded-full mr-2 ${
                isActive
                  ? "bg-primary"
                  : "bg-card border border-border"
              }`}
            >
              <Ionicons
                name={tab.icon}
                size={14}
                className={isActive ? "text-primary-foreground" : "text-muted-foreground"}
              />
              <Text
                className={`ml-1.5 text-sm font-medium ${
                  isActive ? "text-primary-foreground" : "text-foreground"
                }`}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Content */}
      <View className="flex-1 px-4 pt-2">
        {renderTab()}
      </View>

      {/* Breeder gate overlay for breeding tab when not eligible */}
      {activeTab === "breeding" && !isBreeder ? (
        <View className="absolute inset-0 items-center justify-center bg-background/80">
          <Ionicons name="lock-closed" size={48} className="text-muted-foreground" />
          <Text className="text-lg font-semibold text-foreground mt-4">
            Үржлийн шинжилгээ
          </Text>
          <Text className="text-sm text-muted-foreground mt-2 text-center px-12">
            Үржлийн шинжилгээ нь Бreed эсвэл Pro төлбөрийн төлөвлөгөө шаардлагатай
          </Text>
          <TouchableOpacity
            className="mt-4 bg-primary px-6 py-3 rounded-xl"
            onPress={() => router.push("/profile")}
          >
            <Text className="text-primary-foreground font-medium">Шинэчлэх</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}