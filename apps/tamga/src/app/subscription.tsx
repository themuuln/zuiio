import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/lib/auth";
import { useTierGate } from "@/hooks/useTierGate";
import {
  useUpgradeSubscription,
  useCancelSubscription,
  TIER_META,
  TIER_ORDER,
  TIER_FEATURES,
  type SubscriptionTier,
} from "@/hooks/useSubscriptionMutations";

export default function SubscriptionScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { data: tierData, isPending: tierPending } = useTierGate(user?.id);
  const upgradeMutation = useUpgradeSubscription();
  const cancelMutation = useCancelSubscription();

  const currentTier: SubscriptionTier =
    tierData?.tier === "pro" ||
    tierData?.tier === "breeder" ||
    tierData?.tier === "stable"
      ? tierData.tier
      : "free";

  function handleUpgrade(tier: SubscriptionTier) {
    const meta = TIER_META[tier];
    Alert.alert(
      "Захиалга",
      `${meta.label} захиалгаар ${meta.formattedPrice} төлж захиалах уу?`,
      [
        { text: "Цуцлах", style: "cancel" },
        {
          text: "Захиалах",
          onPress: () => {
            upgradeMutation.mutate(
              { targetTier: tier },
              {
                onSuccess: (data) => {
                  Alert.alert(
                    "Хүсэлт илгээгдлээ",
                    `Төлбөрийн код: ${data.payment_code}\nДүн: ${meta.formattedPrice}\n24 цагийн дотор төлнө үү.`,
                  );
                },
                onError: (error) => {
                  Alert.alert(
                    "Алдаа",
                    error.message || "Захиалга үүсгэхэд алдаа гарлаа",
                  );
                },
              },
            );
          },
        },
      ],
    );
  }

  function handleCancel() {
    Alert.alert(
      "Захиалга цуцлах",
      "Та үнэгүй түвшинд буцахдаа итгэлтэй байна уу?",
      [
        { text: "Буцах", style: "cancel" },
        {
          text: "Цуцлах",
          style: "destructive",
          onPress: () => {
            cancelMutation.mutate(undefined, {
              onSuccess: () => {
                Alert.alert("Амжилттай", "Захиалга цуцлагдлаа");
              },
              onError: (error) => {
                Alert.alert(
                  "Алдаа",
                  error.message || "Захиалга цуцлахад алдаа гарлаа",
                );
              },
            });
          },
        },
      ],
    );
  }

  function tierIcon(tier: SubscriptionTier): keyof typeof Ionicons.glyphMap {
    return TIER_META[tier].icon as keyof typeof Ionicons.glyphMap;
  }

  function getTierAction(tier: SubscriptionTier) {
    const currentIndex = TIER_ORDER.indexOf(currentTier);
    const targetIndex = TIER_ORDER.indexOf(tier);

    if (tier === currentTier) return "current";
    if (targetIndex > currentIndex) return "upgrade";
    return "downgrade";
  }

  if (tierPending) {
    return (
      <ScrollView className="flex-1 bg-background">
        <View className="flex-row items-center px-4 pt-12 pb-4">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={24} className="text-foreground" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-foreground">Захиалга</Text>
        </View>
        <View className="flex-1 items-center justify-center py-20">
          <Ionicons name="hourglass-outline" size={40} className="text-muted-foreground" />
          <Text className="text-muted-foreground mt-3">Ачаалж байна...</Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center px-4 pt-12 pb-4">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="arrow-back" size={24} className="text-foreground" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-foreground">Захиалга</Text>
      </View>

      {/* Current Status */}
      <View className="mx-4 mb-6 bg-card rounded-xl p-5">
        <View className="flex-row items-center mb-3">
          <View
            className="w-10 h-10 rounded-full items-center justify-center mr-3"
            style={{ backgroundColor: `${TIER_META[currentTier].color}20` }}
          >
            <Ionicons
              name={tierIcon(currentTier)}
              size={20}
              color={TIER_META[currentTier].color}
            />
          </View>
          <View className="flex-1">
            <Text className="text-sm text-muted-foreground">
              Одоогийн түвшин
            </Text>
            <Text className="text-lg font-bold text-foreground">
              {TIER_META[currentTier].label}
            </Text>
          </View>
          {currentTier !== "free" && (
            <View className="bg-primary/10 px-3 py-1 rounded-full">
              <Text className="text-xs font-semibold text-primary">
                Идэвхтэй
              </Text>
            </View>
          )}
        </View>

        {currentTier !== "free" && (
          <TouchableOpacity
            onPress={handleCancel}
            className="mt-2 py-2 items-center rounded-lg border border-destructive/30"
          >
            <Text className="text-sm text-destructive">
              Захиалга цуцлах
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tier Cards */}
      <Text className="text-base font-semibold text-foreground px-4 mb-3">
        Түвшин сонгох
      </Text>

      {TIER_ORDER.map((tier) => {
        const meta = TIER_META[tier];
        const action = getTierAction(tier);
        const isCurrent = action === "current";

        return (
          <View key={tier} className="mx-4 mb-4 bg-card rounded-xl p-5">
            <View className="flex-row items-center mb-4">
              <View
                className="w-10 h-10 rounded-full items-center justify-center mr-3"
                style={{ backgroundColor: `${meta.color}20` }}
              >
                <Ionicons
                  name={tierIcon(tier)}
                  size={20}
                  color={meta.color}
                />
              </View>
              <View className="flex-1">
                <Text className="text-base font-bold text-foreground">
                  {meta.label}
                </Text>
                <Text className="text-xs text-muted-foreground">
                  {getTierSubtitle(tier)}
                </Text>
              </View>
              {isCurrent ? (
                <View className="bg-primary/10 px-3 py-1 rounded-full">
                  <Text className="text-xs font-semibold text-primary">
                    Одоогийн
                  </Text>
                </View>
              ) : (
                <Text
                  className="text-base font-bold"
                  style={{ color: meta.color }}
                >
                  {meta.formattedPrice}
                  {tier !== "free" ? "/сар" : ""}
                </Text>
              )}
            </View>

            {/* Feature chips */}
            <View className="flex-row flex-wrap gap-2 mb-4">
              {getTierFeatures(tier).map((feature) => (
                <View
                  key={feature}
                  className="bg-muted px-3 py-1 rounded-full"
                >
                  <Text className="text-xs text-foreground">{feature}</Text>
                </View>
              ))}
            </View>

            {action === "upgrade" && (
              <TouchableOpacity
                onPress={() => handleUpgrade(tier)}
                disabled={upgradeMutation.isPending}
                className="py-3 rounded-xl items-center"
                style={{ backgroundColor: meta.color }}
              >
                <Text className="text-white font-semibold">
                  {upgradeMutation.isPending
                    ? "Хүсэлт илгээж байна..."
                    : `${meta.formattedPrice}-аар захиалах`}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        );
      })}

      {/* Feature Comparison */}
      <Text className="text-base font-semibold text-foreground px-4 mt-2 mb-3">
        Боломжуудын харьцуулалт
      </Text>

      <View className="mx-4 mb-8 bg-card rounded-xl overflow-hidden">
        {/* Header row */}
        <View className="flex-row bg-muted/50 px-3 py-3">
          <Text className="flex-[1.5] text-xs font-semibold text-muted-foreground">
            Боломж
          </Text>
          {TIER_ORDER.map((tier) => (
            <Text
              key={tier}
              className={`flex-1 text-xs font-semibold text-center ${
                tier === currentTier ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {TIER_META[tier].label}
            </Text>
          ))}
        </View>

        {/* Feature rows */}
        {TIER_FEATURES.map((row, i) => (
          <View
            key={row.label}
            className={`flex-row px-3 py-3 ${
              i < TIER_FEATURES.length - 1 ? "border-b border-border" : ""
            }`}
          >
            <Text className="flex-[1.5] text-xs text-foreground">
              {row.label}
            </Text>
            {TIER_ORDER.map((tier) => (
              <Text
                key={tier}
                className={`flex-1 text-xs text-center ${
                  row[tier] === "✓"
                    ? "text-green-500 font-semibold"
                    : row[tier] === "—"
                      ? "text-muted-foreground/50"
                      : tier === currentTier
                        ? "text-foreground font-medium"
                        : "text-foreground"
                }`}
              >
                {row[tier]}
              </Text>
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function getTierFeatures(tier: SubscriptionTier): string[] {
  const features: string[] = [];
  if (tier === "pro" || tier === "breeder" || tier === "stable") {
    features.push("Хязгааргүй морь");
    features.push("Сурталчилгаа");
  }
  if (tier === "pro") {
    features.push("Цус ойртолт");
    features.push("AI үржүүлэлт");
  }
  if (tier === "breeder" || tier === "stable") {
    features.push("Цус ойртолт");
    features.push("Үржүүлэлтийн хэрэгсэл");
    features.push("AI үржүүлэлт");
  }
  if (tier === "stable") {
    features.push("10 хэрэглэгч");
    features.push("Захын portal");
  }
  return features;
}

function getTierSubtitle(tier: SubscriptionTier): string {
  const subtitles: Record<SubscriptionTier, string> = {
    free: "Энгийн хэрэглэгчдэд зориулав",
    pro: "Мэргэжлийн үржүүлэгчдэд",
    breeder: "Их хэмжээний үржүүлэлтэд",
    stable: "Багийн хамтын ажиллагаанд",
  };
  return subtitles[tier];
}
