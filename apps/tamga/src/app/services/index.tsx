import { useState } from "react";
import { View, Text, FlatList, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/lib/auth";
import { useServiceProviders, useServiceBookings, type ServiceProvider, type ServiceBooking } from "@/hooks/useServices";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Loading } from "@/components/ui/Loading";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/states";
import { FilterChips } from "@/components/ui/FilterChips";
import { format } from "date-fns";

type Tab = "providers" | "bookings";

const STATUS_LABELS: Record<string, string> = {
  pending: "Хүлээгдэж байна",
  confirmed: "Баталсан",
  completed: "Дууссан",
  cancelled: "Цуцалсан",
};

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "success" | "destructive" | "warning"> = {
  pending: "warning",
  confirmed: "default",
  completed: "success",
  cancelled: "destructive",
};

const SERVICE_TYPES = [
  { label: "Бүгд", value: "all" },
  { label: "Эмч", value: "vet" },
  { label: "Мөрчин", value: "farrier" },
  { label: "Зууч", value: "trainer" },
  { label: "Тээвэр", value: "transport" },
];

function ProviderCard({ provider }: { provider: ServiceProvider }) {
  return (
    <Card className="mb-3">
      <View className="flex-row justify-between items-start">
        <View className="flex-1">
          <Text className="text-foreground font-semibold text-base">{provider.name}</Text>
          <Text className="text-muted-foreground text-sm mt-1">
            {provider.type === "vet" ? "Эмч" : provider.type === "farrier" ? "Мөрчин" : provider.type === "trainer" ? "Зууч" : provider.type}
          </Text>
          {provider.phone && (
            <Text className="text-muted-foreground text-sm">📞 {provider.phone}</Text>
          )}
          {provider.address && (
            <Text className="text-muted-foreground text-sm">📍 {provider.address}</Text>
          )}
        </View>
        {provider.rating != null && (
          <View className="flex-row items-center gap-1">
            <Ionicons name="star" size={14} className="text-amber-500" />
            <Text className="text-foreground font-medium">{provider.rating.toFixed(1)}</Text>
          </View>
        )}
      </View>
      {provider.specialties && provider.specialties.length > 0 && (
        <View className="flex-row flex-wrap gap-1 mt-2">
          {provider.specialties.map((s) => (
            <Badge key={s} variant="secondary">{s}</Badge>
          ))}
        </View>
      )}
    </Card>
  );
}

function BookingCard({ booking }: { booking: ServiceBooking }) {
  return (
    <Card className="mb-3">
      <View className="flex-row justify-between items-start mb-2">
        <Text className="text-foreground font-semibold">{booking.provider_name ?? "Нэр байхгүй"}</Text>
        <Badge variant={STATUS_VARIANTS[booking.status] ?? "secondary"}>
          {STATUS_LABELS[booking.status] ?? booking.status}
        </Badge>
      </View>
      <Text className="text-muted-foreground text-sm">
        🐴 {booking.horse_name ?? "—"} · {booking.service_type}
      </Text>
      <Text className="text-muted-foreground text-sm">
        📅 {format(new Date(booking.date), "yyyy-MM-dd")} {booking.time}
      </Text>
      {booking.cost != null && (
        <Text className="text-foreground text-sm mt-1">💰 {booking.cost.toLocaleString()}₮</Text>
      )}
    </Card>
  );
}

export default function ServicesScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("providers");
  const [typeFilter, setTypeFilter] = useState("all");

  const { data: providers = [], isPending: loadingProviders, error: providersError, refetch: refetchProviders } = useServiceProviders(user?.id);
  const { data: bookings = [], isPending: loadingBookings, error: bookingsError, refetch: refetchBookings } = useServiceBookings(user?.id);

  const filteredProviders = typeFilter === "all"
    ? providers
    : providers.filter((p) => p.type === typeFilter);

  return (
    <View className="flex-1 bg-background">
      <PageHeader title="Үйлчилгээ" subtitle="Эмч, мөрчин, зууч" showBack />

      {/* Tab Toggle */}
      <View className="flex-row bg-card mx-4 rounded-xl p-1 mb-2">
        {([
          ["providers", "Үйлчилгээ үзүүлэгч"],
          ["bookings", "Захиалга"],
        ] as const).map(([key, label]) => (
          <TouchableOpacity
            key={key}
            className={`flex-1 py-2 rounded-lg ${activeTab === key ? "bg-primary" : ""}`}
            onPress={() => setActiveTab(key)}
          >
            <Text className={`text-center font-medium text-sm ${activeTab === key ? "text-primary-foreground" : "text-muted-foreground"}`}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === "providers" && (
        <>
          <FilterChips options={SERVICE_TYPES} selected={typeFilter} onSelect={setTypeFilter} />
          {loadingProviders ? (
            <Loading />
          ) : providersError ? (
            <ErrorState onRetry={refetchProviders} />
          ) : (
            <FlatList
              data={filteredProviders}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <ProviderCard provider={item} />}
              contentContainerClassName="px-4 pb-20"
              ListEmptyComponent={
                <EmptyState icon="medkit-outline" title="Үйлчилгээ үзүүлэгч байхгүй" subtitle="Эмч эсвэл мөрчин нэмнэ үү" />
              }
            />
          )}
        </>
      )}

      {activeTab === "bookings" && (
        loadingBookings ? (
          <Loading />
        ) : bookingsError ? (
          <ErrorState onRetry={refetchBookings} />
        ) : (
          <FlatList
            data={bookings}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <BookingCard booking={item} />}
            contentContainerClassName="px-4 pb-20"
            ListEmptyComponent={
              <EmptyState icon="calendar-outline" title="Захиалга байхгүй" subtitle="Шинэ захиалга үүсгэнэ үү" />
            }
          />
        )
      )}
    </View>
  );
}
