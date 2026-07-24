import { View, Text, FlatList } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { format, isToday } from "date-fns";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Loading } from "@/components/ui/Loading";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/states";

/* ── Types ─────────────────────────────────────────────────────── */

interface ProviderBooking {
  id: string;
  horse_id: string;
  provider_id: string;
  client_id: string;
  service_type: string;
  date: string;
  time: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  notes: string | null;
  cost: number | null;
  created_at: string;
  horses: { name: string } | null;
  profiles: { display_name: string } | null;
}

interface ServiceReview {
  id: string;
  provider_id: string;
  client_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

/* ── Constants ─────────────────────────────────────────────────── */

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

/* ── Stats Card ────────────────────────────────────────────────── */

function StatsCard({
  icon,
  label,
  value,
  color,
}: {
  icon: string;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <Card className="flex-1 items-center py-4">
      <Ionicons name={icon as any} size={24} className={color} />
      <Text className="text-2xl font-bold text-foreground mt-2">{value}</Text>
      <Text className="text-muted-foreground text-xs text-center mt-1">{label}</Text>
    </Card>
  );
}

/* ── Schedule Item ─────────────────────────────────────────────── */

function ScheduleItem({ booking }: { booking: ProviderBooking }) {
  return (
    <Card className="mb-3">
      <View className="flex-row justify-between items-start">
        <View className="flex-1">
          <Text className="text-foreground font-semibold">{booking.time}</Text>
          <Text className="text-muted-foreground text-sm mt-1">
            👤 {booking.profiles?.display_name ?? "Тодорхойгүй"}
          </Text>
          <Text className="text-muted-foreground text-sm">
            🐴 {booking.horses?.name ?? "—"}
          </Text>
          <Text className="text-muted-foreground text-sm">{booking.service_type}</Text>
        </View>
        <Badge variant={STATUS_VARIANTS[booking.status] ?? "secondary"}>
          {STATUS_LABELS[booking.status] ?? booking.status}
        </Badge>
      </View>
    </Card>
  );
}

/* ── Review Card ───────────────────────────────────────────────── */

function ReviewCard({ review }: { review: ServiceReview }) {
  return (
    <Card className="mb-3">
      <View className="flex-row items-center gap-1 mb-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Ionicons
            key={i}
            name={i < review.rating ? "star" : "star-outline"}
            size={14}
            className="text-amber-500"
          />
        ))}
        <Text className="text-muted-foreground text-xs ml-1">
          {format(new Date(review.created_at), "yyyy-MM-dd")}
        </Text>
      </View>
      {review.comment && (
        <Text className="text-foreground text-sm mt-1">{review.comment}</Text>
      )}
    </Card>
  );
}

/* ── Main Screen ───────────────────────────────────────────────── */

export default function ProviderDashboardScreen() {
  const { user } = useAuth();

  /* Fetch provider's bookings */
  const {
    data: bookings = [],
    isPending: loadingBookings,
    error: bookingsError,
    refetch: refetchBookings,
  } = useQuery({
    queryKey: ["provider-bookings", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_bookings")
        .select("*, horses(name), profiles!service_bookings_client_id_fkey(display_name)")
        .eq("provider_id", user!.id)
        .order("date");

      if (error) throw error;
      return (data ?? []) as ProviderBooking[];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  });

  /* Fetch recent reviews */
  const {
    data: reviews = [],
    isPending: loadingReviews,
    error: reviewsError,
    refetch: refetchReviews,
  } = useQuery({
    queryKey: ["provider-reviews", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_reviews")
        .select("*")
        .eq("provider_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      return (data ?? []) as ServiceReview[];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 10,
  });

  /* Derived data */
  const pendingCount = bookings.filter((b) => b.status === "pending").length;
  const confirmedCount = bookings.filter((b) => b.status === "confirmed").length;
  const completedCount = bookings.filter((b) => b.status === "completed").length;
  const totalRevenue = bookings
    .filter((b) => b.status === "completed" && b.cost != null)
    .reduce((sum, b) => sum + (b.cost ?? 0), 0);

  const todayBookings = bookings.filter(
    (b) => isToday(new Date(b.date)) && b.status !== "cancelled"
  );

  if (loadingBookings && loadingReviews) {
    return (
      <View className="flex-1 bg-background">
        <PageHeader title="Үйлчилгээний нүүр хуудас" showBack />
        <Loading />
      </View>
    );
  }

  if (bookingsError || reviewsError) {
    return (
      <View className="flex-1 bg-background">
        <PageHeader title="Үйлчилгээний нүүр хуудас" showBack />
        <ErrorState onRetry={() => { refetchBookings(); refetchReviews(); }} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <PageHeader title="Үйлчилгээний нүүр хуудас" showBack />

      <FlatList
        data={[]}
        renderItem={null}
        ListHeaderComponent={
          <View className="px-4 pb-20">
            {/* ── Stats ──────────────────────────────── */}
            <View className="flex-row gap-2 mb-4">
              <StatsCard icon="hourglass-outline" label="Хүлээгдэж буй" value={pendingCount} color="text-amber-500" />
              <StatsCard icon="checkmark-circle-outline" label="Баталсан" value={confirmedCount} color="text-primary" />
            </View>
            <View className="flex-row gap-2 mb-6">
              <StatsCard icon="ribbon-outline" label="Дууссан" value={completedCount} color="text-emerald-500" />
              <StatsCard icon="wallet-outline" label="Нийт орлого" value={`${totalRevenue.toLocaleString()}₮`} color="text-emerald-600" />
            </View>

            {/* ── Today's Schedule ────────────────────── */}
            <Text className="text-foreground font-bold text-lg mb-3">Өнөөдрийн хуваарь</Text>
            {todayBookings.length === 0 ? (
              <EmptyState icon="calendar-outline" title="Өнөөдөр захиалга байхгүй" />
            ) : (
              todayBookings.map((booking) => (
                <ScheduleItem key={booking.id} booking={booking} />
              ))
            )}

            {/* ── Recent Reviews ──────────────────────── */}
            <Text className="text-foreground font-bold text-lg mt-6 mb-3">Сэтгэгдлүүд</Text>
            {loadingReviews ? (
              <Loading message="Сэтгэгдэл ачаалж байна..." />
            ) : reviews.length === 0 ? (
              <EmptyState icon="chatbubble-outline" title="Сэтгэгдэл байхгүй" />
            ) : (
              reviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))
            )}

            {/* ── Revenue Summary ─────────────────────── */}
            <Text className="text-foreground font-bold text-lg mt-6 mb-3">Орлого</Text>
            <Card>
              <View className="flex-row justify-between items-center">
                <Text className="text-muted-foreground">Нийт дууссан захиалга</Text>
                <Text className="text-foreground font-semibold">{completedCount}</Text>
              </View>
              <View className="flex-row justify-between items-center mt-2">
                <Text className="text-muted-foreground">Нийт орлого</Text>
                <Text className="text-emerald-600 font-bold text-lg">{totalRevenue.toLocaleString()}₮</Text>
              </View>
            </Card>
          </View>
        }
      />
    </View>
  );
}
