import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Alert,
  ActivityIndicator,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { formatDistanceToNow } from "date-fns";
import { mn } from "date-fns/locale";
import {
  useActiveBoosts,
  useBoostListing,
  BOOST_META,
  BOOST_ORDER,
  type BoostTier,
  type ActiveBoostWithListing,
} from "@/hooks/useBoostMutations";
import { useMyListings } from "@/hooks/useListings";
import { EmptyState } from "@/components/states";

const HARDCODED_USER_ID = "11111111-1111-1111-1111-111111111111";

const TIER_COLORS: Record<BoostTier, string> = {
  featured: "border-amber-500",
  vip: "border-purple-500",
  premium: "border-red-500",
};

const TIER_ICONS: Record<BoostTier, string> = {
  featured: "star",
  vip: "diamond",
  premium: "trophy",
};

const TIER_BENEFITS: Record<BoostTier, string[]> = {
  featured: [
    "Дэлгэцийн эхэнд гарч ирнэ",
    "Онцлох тэмдэг",
    "7 хоногийн идэвхтэй",
  ],
  vip: [
    "Дэлгэцийн эхэнд гарч ирнэ",
    "VIP тэмдэг",
    "14 хоногийн идэвхтэй",
    "Зургийн хүрээ өөрчлөх",
  ],
  premium: [
    "Дэлгэцийн эхэнд гарч ирнэ",
    "Премиум тэмдэг",
    "30 хоногийн идэвхтэй",
    "Зургийн хүрээ өөрчлөх",
    "Давуу эрэмбэлэлт",
  ],
};

function BoostCountdown({ expiresAt }: { expiresAt: string }) {
  const remaining = formatDistanceToNow(new Date(expiresAt), {
    locale: mn,
    addSuffix: false,
  });
  return (
    <Text className="text-xs text-muted-foreground">{remaining} үлдсэн</Text>
  );
}

function ActiveBoostCard({ boost }: { boost: ActiveBoostWithListing }) {
  const meta = BOOST_META[boost.tier];
  const listingName =
    boost.listings?.horses?.name ?? "Мэдээлэл байхгүй";

  return (
    <View className="bg-card rounded-xl p-3 mb-2 border border-border flex-row items-center">
      <View
        className="w-10 h-10 rounded-full items-center justify-center mr-3"
        style={{ backgroundColor: `${meta.color}20` }}
      >
        <Ionicons
          name={TIER_ICONS[boost.tier] as keyof typeof Ionicons.glyphMap}
          size={20}
          color={meta.color}
        />
      </View>
      <View className="flex-1">
        <View className="flex-row items-center gap-2">
          <Text className="font-semibold text-foreground">{meta.label}</Text>
          <Text className="text-sm text-muted-foreground">• {listingName}</Text>
        </View>
        <BoostCountdown expiresAt={boost.expires_at} />
      </View>
    </View>
  );
}

function TierCard({
  tier,
  onSelect,
}: {
  tier: BoostTier;
  onSelect: (tier: BoostTier) => void;
}) {
  const meta = BOOST_META[tier];
  const benefits = TIER_BENEFITS[tier];

  return (
    <View
      className={`bg-card rounded-xl p-5 mb-4 border-2 ${TIER_COLORS[tier]}`}
    >
      <View className="flex-row items-center gap-3 mb-3">
        <View
          className="w-12 h-12 rounded-full items-center justify-center"
          style={{ backgroundColor: `${meta.color}20` }}
        >
          <Ionicons
            name={TIER_ICONS[tier] as keyof typeof Ionicons.glyphMap}
            size={24}
            color={meta.color}
          />
        </View>
        <View className="flex-1">
          <Text className="text-lg font-bold text-foreground">{meta.label}</Text>
          <Text className="text-sm text-muted-foreground">{meta.duration}</Text>
        </View>
        <View>
          <Text className="text-2xl font-bold text-foreground">
            {meta.formattedPrice}
          </Text>
        </View>
      </View>

      <View className="mt-3">
        {benefits.map((benefit, idx) => (
          <View key={idx} className="flex-row items-center gap-2 mb-1">
            <Ionicons name="checkmark-circle" size={16} color={meta.color} />
            <Text className="text-sm text-muted-foreground">{benefit}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        className="bg-primary rounded-lg py-3 items-center mt-3"
        onPress={() => onSelect(tier)}
      >
        <Text className="text-primary-foreground font-bold">Сонгох</Text>
      </TouchableOpacity>
    </View>
  );
}

function ListingPicker({
  visible,
  tier,
  onClose,
  onSelect,
  isPending,
}: {
  visible: boolean;
  tier: BoostTier | null;
  onClose: () => void;
  onSelect: (listingId: string) => void;
  isPending: boolean;
}) {
  const { data: listings = [], isPending: listingsLoading } = useMyListings(
    HARDCODED_USER_ID,
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-background">
        <View className="flex-row items-center justify-between px-4 pt-12 pb-4">
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} className="text-foreground" />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-foreground">
            Зар сонгох
          </Text>
          <View className="w-6" />
        </View>

        {tier && (
          <View className="px-4 mb-4">
            <Text className="text-sm text-muted-foreground">
              {BOOST_META[tier].label} бустер сонгосон байна
            </Text>
          </View>
        )}

        {listingsLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" className="text-primary" />
          </View>
        ) : listings.length === 0 ? (
          <EmptyState
            icon="receipt-outline"
            title="Зар байхгүй байна"
            subtitle="Эхлээд зар үүсгэнэ үү"
          />
        ) : (
          <FlatList
            data={listings}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 16 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                className="bg-card rounded-xl p-4 mb-3 border border-border"
                onPress={() => onSelect(item.id)}
                disabled={isPending}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="font-semibold text-foreground">
                      {item.horse_name}
                    </Text>
                    <Text className="text-sm text-muted-foreground">
                      {item.listing_type === "sale"
                        ? "Зарах"
                        : item.listing_type === "lease"
                          ? "Хөлслөх"
                          : "Үржүүлэх"}
                      {item.price_mnt
                        ? ` • ₮${item.price_mnt.toLocaleString()}`
                        : ""}
                    </Text>
                  </View>
                  {isPending ? (
                    <ActivityIndicator size="small" className="text-primary" />
                  ) : (
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      className="text-muted-foreground"
                    />
                  )}
                </View>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </Modal>
  );
}

export default function BoostScreen() {
  const router = useRouter();
  const { data: activeBoosts = [], isPending: boostsLoading } =
    useActiveBoosts(HARDCODED_USER_ID);
  const boostMutation = useBoostListing();

  const [pickerVisible, setPickerVisible] = useState(false);
  const [selectedTier, setSelectedTier] = useState<BoostTier | null>(null);

  function handleSelectTier(tier: BoostTier) {
    setSelectedTier(tier);
    setPickerVisible(true);
  }

  function handleSelectListing(listingId: string) {
    if (!selectedTier) return;

    boostMutation.mutate(
      { listingId, tier: selectedTier },
      {
        onSuccess: () => {
          setPickerVisible(false);
          setSelectedTier(null);
          Alert.alert(
            "Амжилттай",
            `${BOOST_META[selectedTier!].label} бустер нэмэгдлээ`,
          );
        },
        onError: () => {
          Alert.alert("Алдаа", "Бустер нэмэхэд алдаа гарлаа");
        },
      },
    );
  }

  function handleClosePicker() {
    setPickerVisible(false);
    setSelectedTier(null);
  }

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pt-12 pb-4">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} className="text-foreground" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-foreground">
          Сурталчилгаа
        </Text>
        <View className="w-6" />
      </View>

      <ScrollView className="flex-1 px-4">
        {/* Active boosts */}
        <View className="mb-6">
          <Text className="text-sm font-semibold text-muted-foreground mb-3">
            Идэвхтэй сурталчилгаа
          </Text>
          {boostsLoading ? (
            <ActivityIndicator size="small" className="text-primary" />
          ) : activeBoosts.length === 0 ? (
            <View className="bg-card rounded-xl p-6 border border-border items-center">
              <Ionicons
                name="megaphone-outline"
                size={32}
                className="text-muted-foreground mb-2"
              />
              <Text className="text-sm text-muted-foreground">
                Идэвхтэй сурталчилгаа байхгүй байна
              </Text>
            </View>
          ) : (
            activeBoosts.map((boost) => (
              <ActiveBoostCard key={boost.id} boost={boost} />
            ))
          )}
        </View>

        {/* Boost tiers */}
        <View className="mb-8">
          <Text className="text-sm font-semibold text-muted-foreground mb-3">
            Сурталчилгааны түвшин
          </Text>
          {BOOST_ORDER.map((tier) => (
            <TierCard key={tier} tier={tier} onSelect={handleSelectTier} />
          ))}
        </View>
      </ScrollView>

      {/* Listing picker modal */}
      <ListingPicker
        visible={pickerVisible}
        tier={selectedTier}
        onClose={handleClosePicker}
        onSelect={handleSelectListing}
        isPending={boostMutation.isPending}
      />
    </View>
  );
}
