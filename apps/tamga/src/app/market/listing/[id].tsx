import {
  View,
  Text,
  ScrollView,
  FlatList,
  Image,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { useCreateConversation } from "@/hooks/useMarketConversations";
import { useSellerProfile } from "@/hooks/useSellerProfile";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { InfoRow } from "@/components/ui/InfoRow";
import { Loading } from "@/components/ui/Loading";
import { ErrorState } from "@/components/states";

// ── Listing type labels ──
const LISTING_TYPE_LABELS: Record<string, string> = {
  sale: "Зарах",
  lease: "Хөлслөх",
  stud: "Үржүүлэх",
};

const LISTING_TYPE_BADGE: Record<string, "default" | "secondary" | "warning"> = {
  sale: "default",
  lease: "secondary",
  stud: "warning",
};

// ── Gender label helper ──
function genderLabel(gender?: string | null): string {
  switch (gender) {
    case "stallion":
      return "Азарга";
    case "mare":
      return "Эмээхий";
    case "gelding":
      return "Буянт";
    case "foal":
      return "Унага";
    default:
      return "—";
  }
}


// ── Image Gallery ──
function ImageGallery({ images }: { images: string[] }) {
  if (images.length === 0) return null;

  return (
    <FlatList
      data={images}
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      keyExtractor={(_, index) => String(index)}
      renderItem={({ item }) => (
        <Image
          source={{ uri: item }}
          className="w-80 h-60 rounded-xl mr-3"
          resizeMode="cover"
          accessibilityLabel="Морин зураг"
        />
      )}
      contentContainerClassName="px-4 mb-4"
      ListEmptyComponent={null}
    />
  );
}

// ── Main Screen ──
export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const createConversation = useCreateConversation(user?.id);

  // Fetch listing with horse data
  const {
    data: listing,
    isPending,
    error,
    refetch,
  } = useQuery({
    queryKey: ["listing", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("listings")
        .select("*, horses(name, gender, coat, birth_year, photo_urls)")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as Record<string, unknown> & {
        id: string;
        seller_id: string;
        listing_type: string;
        price_mnt: number | null;
        description: string | null;
        status: string;
        location: string | null;
        created_at: string;
        horses?: {
          name: string;
          gender: string;
          coat: string;
          birth_year: number;
          photo_urls: string[];
        } | null;
      };
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });

  // Fetch seller profile
  const { data: sellerProfile } = useSellerProfile(listing?.seller_id);

  // Favorite mutation
  const toggleFavorite = useMutation({
    mutationFn: async () => {
      if (!user?.id || !id) return;
      const { data: existing } = await supabase
        .from("listing_favorites")
        .select("id")
        .eq("user_id", user.id)
        .eq("listing_id", id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("listing_favorites")
          .delete()
          .eq("id", existing.id);
        if (error) throw error;
        return false;
      } else {
        const { error } = await supabase
          .from("listing_favorites")
          .insert({ user_id: user.id, listing_id: id });
        if (error) throw error;
        return true;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listing", id] });
    },
    onError: () => {
      Alert.alert("Алдаа", "Хадгалахад алдаа гарлаа");
    },
  });

  // Check if already favorited
  const { data: isFavorited } = useQuery({
    queryKey: ["listing-favorite", user?.id, id],
    queryFn: async () => {
      if (!user?.id || !id) return false;
      const { data } = await supabase
        .from("listing_favorites")
        .select("id")
        .eq("user_id", user.id)
        .eq("listing_id", id)
        .maybeSingle();
      return !!data;
    },
    enabled: !!user?.id && !!id,
    staleTime: 1000 * 60,
  });

  // Contact handler
  const handleContact = () => {
    if (!user?.id || !listing) return;
    createConversation.mutate(
      { listingId: listing.id, sellerId: listing.seller_id },
      {
        onSuccess: (conversation) => {
          router.push(`/market/conversation/${conversation.id}` as any);
        },
        onError: () => {
          Alert.alert("Алдаа", "Яриа үүсгэхэд алдаа гарлаа");
        },
      }
    );
  };

  // Save/favorite handler
  const handleSave = () => {
    if (!user) {
      Alert.alert("Нэвтрэх шаардлагатай", "Эхлээд нэвтрэнэ үү");
      return;
    }
    toggleFavorite.mutate();
  };

  // ── States ──
  if (isPending) return <Loading />;

  if (error || !listing) {
    return (
      <View className="flex-1 bg-background">
        <PageHeader title="Зарын дэлгэрэнгүй" showBack />
        <ErrorState message="Зар олдсонгүй" onRetry={refetch} />
      </View>
    );
  }

  // Gather images from horse photos
  const images: string[] = listing.horses?.photo_urls ?? [];

  return (
    <View className="flex-1 bg-background">
      <PageHeader title="Зарын дэлгэрэнгүй" showBack />

      <ScrollView contentContainerClassName="pb-20">
        {/* Image Gallery */}
        {images.length > 0 ? (
          <ImageGallery images={images} />
        ) : (
          <View className="h-48 mx-4 mb-4 rounded-xl bg-muted items-center justify-center">
            <Ionicons name="image-outline" size={48} className="text-muted-foreground" />
            <Text className="text-muted-foreground mt-2 text-sm">Зураг байхгүй</Text>
          </View>
        )}

        <View className="px-4">
          {/* Title + Type Badge */}
          <View className="flex-row items-center gap-2 mb-1">
            <Text className="text-foreground font-bold text-xl flex-1">
              {listing.horses?.name ?? "Морь"}
            </Text>
            <Badge variant={LISTING_TYPE_BADGE[listing.listing_type] ?? "default"}>
              {LISTING_TYPE_LABELS[listing.listing_type] ?? listing.listing_type}
            </Badge>
          </View>

          {/* Price */}
          {listing.price_mnt != null ? (
            <Text className="text-primary font-bold text-2xl mb-4">
              {listing.price_mnt.toLocaleString()}₮
            </Text>
          ) : (
            <Text className="text-muted-foreground text-lg mb-4">Үнэ тохиролцоно</Text>
          )}

          {/* Details Card */}
          <Card className="mb-4">
            <InfoRow
              label="Морин нэр"
              value={listing.horses?.name}
            />
            <InfoRow
              label="Хүйс"
              value={genderLabel(listing.horses?.gender)}
            />
            <InfoRow
              label="Өнгө"
              value={listing.horses?.coat}
            />
            {listing.horses?.birth_year && (
              <InfoRow
                label="Нас"
                value={new Date().getFullYear() - listing.horses.birth_year + " нас"}
              />
            )}
            <InfoRow label="Байршил" value={listing.location} />
            <InfoRow
              label="Нийтэлсэн"
              value={new Date(listing.created_at).toLocaleDateString("mn-MN")}
            />
          </Card>

          {/* Description */}
          {listing.description && (
            <Card className="mb-4 p-4">
              <Text className="text-foreground font-semibold mb-2">Тайлбар</Text>
              <Text className="text-muted-foreground leading-5">
                {listing.description}
              </Text>
            </Card>
          )}

          {/* Seller Info */}
          <Card className="mb-4">
            <View className="flex-row items-center gap-3">
              <Avatar
                name={sellerProfile?.display_name ?? "Хэрэглэгч"}
                size="lg"
              />
              <View className="flex-1">
                <Text className="text-foreground font-semibold text-base">
                  {sellerProfile?.display_name ?? "Хэрэглэгч"}
                </Text>
                {sellerProfile?.verified && (
                  <Badge variant="success" className="mt-1">
                    Баталгаажсан
                  </Badge>
                )}
                {sellerProfile?.rating != null && (
                  <View className="flex-row items-center gap-1 mt-1">
                    <Ionicons name="star" size={14} className="text-amber-500" />
                    <Text className="text-muted-foreground text-sm">
                      {sellerProfile.rating.toFixed(1)}
                    </Text>
                  </View>
                )}
              </View>
              <TouchableOpacity
                onPress={() => router.push(`/market/seller/${listing.seller_id}` as any)}
                accessibilityLabel="Борлуулагчийн профайл"
                accessibilityRole="button"
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons name="chevron-forward" size={20} className="text-muted-foreground" />
              </TouchableOpacity>
            </View>
          </Card>

          {/* Action Buttons */}
          <View className="gap-3 mb-6">
            <Button
              title={createConversation.isPending ? "Үүсгэж байна..." : "Холбоо барих"}
              onPress={handleContact}
              disabled={createConversation.isPending || listing.seller_id === user?.id}
              accessibilityLabel="Холбоо барих"
            />

            <Button
              title={isFavorited ? "Хадгалсан" : "Хадгалах"}
              variant="secondary"
              onPress={handleSave}
              disabled={toggleFavorite.isPending}
              accessibilityLabel={isFavorited ? "Хадгалсан цуцлах" : "Хадгалах"}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
