import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/lib/auth";
import { useMyListings, type Listing } from "@/hooks/useListings";
import { useDeleteListing, useUpdateListing } from "@/hooks/useListingMutations";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { FAB } from "@/components/ui/FAB";
import { Loading } from "@/components/ui/Loading";
import { EmptyState } from "@/components/ui/EmptyState";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const LISTING_TYPE_LABELS: Record<string, string> = {
  sale: "Зарах",
  lease: "Хөлслөх",
  stud: "Үржүүлэх",
};

const STATUS_CONFIG: Record<string, { label: string; variant: "success" | "secondary" | "destructive" | "warning" }> = {
  active: { label: "Идэвхтэй", variant: "success" },
  sold: { label: "Зарсан", variant: "secondary" },
  expired: { label: "Хугацаа дууссан", variant: "destructive" },
  pending: { label: "Хүлээгдэж буй", variant: "warning" },
};


// ---------------------------------------------------------------------------
// Listing Card
// ---------------------------------------------------------------------------

function ListingCard({
  listing,
  onPress,
  onLongPress,
}: {
  listing: Listing;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const status = STATUS_CONFIG[listing.status] ?? STATUS_CONFIG.active;
  const typeLabel = LISTING_TYPE_LABELS[listing.listing_type] ?? listing.listing_type;

  return (
    <TouchableOpacity
      className="mx-4 mb-3 rounded-xl border border-border bg-card p-4"
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`${listing.horse_name ?? "Морь"} — ${typeLabel}, ${listing.price_mnt != null ? `${listing.price_mnt.toLocaleString("mn-MN")}₮` : "Үнэ тохиролцоно"}, ${status.label}`}
      accessibilityHint="Дарж үзэх, урт дарж удирдах цэс нээх"
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-1 mr-3">
          <Text className="text-foreground text-base font-semibold" numberOfLines={1}>
            {listing.horse_name ?? "Морь"}
          </Text>
          <View className="flex-row items-center gap-2 mt-1.5">
            <Badge variant="outline">{typeLabel}</Badge>
            <Badge variant={status.variant}>{status.label}</Badge>
          </View>
        </View>
        <Text className="text-foreground text-base font-bold">
          {listing.price_mnt != null ? `${listing.price_mnt.toLocaleString("mn-MN")}₮` : "Үнэ тохиролцоно"}
        </Text>
      </View>

      {listing.location && (
        <View className="flex-row items-center gap-1 mt-2">
          <Ionicons name="location-outline" size={14} className="text-muted-foreground" />
          <Text className="text-muted-foreground text-xs">{listing.location}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function MyListingsScreen() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { data: listings = [], isLoading, error } = useMyListings(user?.id);
  const deleteListing = useDeleteListing();
  const updateListing = useUpdateListing();

  function handleLongPress(listing: Listing) {
    const isSold = listing.status === "sold";
    const options: { label: string; onPress: () => void; style?: "destructive" }[] = [];

    if (!isSold) {
      options.push({
        label: "Зарсан болгох",
        onPress: () => handleMarkSold(listing.id),
      });
    }

    options.push({
      label: "Устгах",
      onPress: () => handleDelete(listing.id, listing.horse_name),
      style: "destructive",
    });

    options.push({ label: "Цуцлах", onPress: () => {} });

    Alert.alert(
      listing.horse_name ?? "Морь",
      "Зарыг удирдах",
      options.map((o) => ({
        text: o.label,
        onPress: o.onPress,
        style: o.style,
      })),
    );
  }

  function handleDelete(id: string, horseName?: string) {
    Alert.alert(
      "Зар устгах",
      `"${horseName ?? "Морь"} зарыг устгахдаа итгэлтэй байна уу?`,
      [
        { text: "Цуцлах", style: "cancel" },
        {
          text: "Устгах",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteListing.mutateAsync(id);
            } catch {
              Alert.alert("Алдаа", "Зарыг устгахад алдаа гарлаа");
            }
          },
        },
      ],
    );
  }

  function handleMarkSold(id: string) {
    Alert.alert(
      "Зарсан болгох",
      "Энэ зарыг 'Зарсан' гэж тэмдэглэх үү?",
      [
        { text: "Цуцлах", style: "cancel" },
        {
          text: "Тийм",
          onPress: async () => {
            try {
              await updateListing.mutateAsync({ id, status: "sold" });
            } catch {
              Alert.alert("Алдаа", "Статус шинэчлэхэд алдаа гарлаа");
            }
          },
        },
      ],
    );
  }

  // Loading states
  if (authLoading) {
    return <Loading message="Нэвтрэхийг шалгаж байна..." />;
  }

  if (!user) {
    return (
      <View className="flex-1 bg-background">
        <PageHeader title="Миний зарууд" showBack />
        <EmptyState
          icon="log-in-outline"
          title="Нэвтэрнэ үү"
          subtitle="Заруудаа харахын тулд нэвтэрнэ үү"
        />
      </View>
    );
  }

  if (isLoading) {
    return <Loading message="Зарууд ачаалж байна..." />;
  }

  if (error) {
    return (
      <View className="flex-1 bg-background">
        <PageHeader title="Миний зарууд" showBack />
        <EmptyState
          icon="alert-circle-outline"
          title="Алдаа гарлаа"
          subtitle="Заруудыг ачаалахад алдаа гарлаа. Дахин оролдоно уу."
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <PageHeader
        title="Миний зарууд"
        subtitle={`${listings.length} зар`}
        showBack
      />

      <FlatList
        data={listings}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ListingCard
            listing={item}
            onPress={() => {}}
            onLongPress={() => handleLongPress(item)}
          />
        )}
        contentContainerStyle={listings.length === 0 ? { flex: 1 } : { paddingBottom: 100 }}
        ListEmptyComponent={
          <EmptyState
            icon="list-outline"
            title="Танд зар байхгүй"
            subtitle="Шинэ зар нэмж эхлэх үү?"
            action={
              <TouchableOpacity
                className="bg-primary rounded-xl px-6 py-3"
                onPress={() => router.push("/market/new")}
                accessibilityRole="button"
                accessibilityLabel="Шинэ зар нэмэх"
              >
                <Text className="text-primary-foreground font-semibold">
                  Шинэ зар нэмэх
                </Text>
              </TouchableOpacity>
            }
          />
        }
      />

      <FAB
        icon="add"
        onPress={() => router.push("/market/new")}
        className="shadow-lg"
      />
    </View>
  );
}
