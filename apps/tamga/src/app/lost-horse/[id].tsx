import { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
  Linking,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { InfoRow } from "@/components/ui/InfoRow";
import { Separator } from "@/components/ui/Separator";
import { LoadingState, ErrorState, EmptyState } from "@/components/states";
import { useLostHorse } from "@/hooks/useLostHorses";
import { useSightings } from "@/hooks/useSightings";
import { useDeleteLostHorse, useMarkFound } from "@/hooks/useLostHorseMutations";
import { useAuth } from "@/lib/auth";

const STATUS_LABELS: Record<string, string> = {
  lost: "Алдагдсан",
  found: "Олсон",
  closed: "Хаагдсан",
};

const STATUS_VARIANT: Record<string, "destructive" | "success" | "secondary"> = {
  lost: "destructive",
  found: "success",
  closed: "secondary",
};

function formatDate(dateStr: string | null) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("mn-MN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("mn-MN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function LostHorseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const {
    data: report,
    isPending,
    error,
    refetch,
  } = useLostHorse(id);

  const { data: sightings = [], isPending: sightingsPending } = useSightings(id);

  const deleteMutation = useDeleteLostHorse();
  const markFoundMutation = useMarkFound();

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  function handleDelete() {
    Alert.alert("Устгах", "Энэ мэдээллийг устгах уу?", [
      { text: "Цуцлах", style: "cancel" },
      {
        text: "Устгах",
        style: "destructive",
        onPress: () => {
          deleteMutation.mutate(id!, {
            onSuccess: () => router.back(),
          });
        },
      },
    ]);
  }

  function handleMarkFound() {
    Alert.alert("Олсон гэж тэмдэглэх", "Энэ морийг олсон гэж тэмдэглэх үү?", [
      { text: "Цуцлах", style: "cancel" },
      {
        text: "Тийм",
        onPress: () => markFoundMutation.mutate(id!),
      },
    ]);
  }

  function handleContactOwner() {
    if (report?.contact_phone) {
      Linking.openURL(`tel:${report.contact_phone}`);
    } else {
      Alert.alert("Мэдээлэл", "Эзний утасны дугаар байхгүй байна");
    }
  }

  if (isPending) return <LoadingState />;

  if (error || !report) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  const isOwner = user?.id === report.owner_id;
  const statusLabel = STATUS_LABELS[report.status] || report.status;
  const badgeVariant = STATUS_VARIANT[report.status] || "secondary";
  const locationParts = [
    report.location_aimag,
    report.location_sum,
    report.location_bag,
  ].filter(Boolean);

  return (
    <View className="flex-1 bg-background">
      <PageHeader
        title="Алдагдсан морийн мэдээлэл"
        showBack
        rightAction={
          isOwner ? (
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/lost-horse/report",
                  params: { editId: report.id },
                })
              }
              accessibilityLabel="Засах"
            >
              <Ionicons name="create-outline" size={24} className="text-primary" />
            </TouchableOpacity>
          ) : undefined
        }
      />

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 pb-12"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* ── Hero ──────────────────────────────────────────── */}
        {report.tamga_image_url ? (
          <Image
            source={{ uri: report.tamga_image_url }}
            className="w-full h-52 rounded-xl mb-4"
            resizeMode="cover"
            accessibilityLabel="Морины зураг"
          />
        ) : (
          <View className="w-full h-40 rounded-xl bg-muted items-center justify-center mb-4">
            <Ionicons name="image-outline" size={48} className="text-muted-foreground" />
            <Text className="text-muted-foreground text-sm mt-2">Зураг байхгүй</Text>
          </View>
        )}

        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-2xl font-bold text-foreground flex-1">
            {report.animal_type === "horse" ? "Морь" : report.animal_type ?? "Морь"}
            {report.breed ? ` — ${report.breed}` : ""}
          </Text>
          <Badge variant={badgeVariant}>{statusLabel}</Badge>
        </View>

        {/* ── Мэдээлэл ────────────────────────────────────── */}
        <Card className="mb-4">
          <InfoRow
            label="Сүүлд харагдсан"
            value={formatDate(report.last_seen_at)}
          />
          {(report.location_name || locationParts.length > 0) && (
            <InfoRow
              label="Байршил"
              value={
                report.location_name || locationParts.join(", ")
              }
            />
          )}
          {report.coat_color && (
            <InfoRow label="Өнгө" value={report.coat_color} />
          )}
          {report.gender && (
            <InfoRow label="Хүйс" value={report.gender} />
          )}
          {report.lost_count != null && report.lost_count > 0 && (
            <InfoRow label="Тоо" value={`${report.lost_count} толгой`} />
          )}
          {report.pricing_tier && (
            <InfoRow label="Шагналт" value={report.pricing_tier} />
          )}
        </Card>

        {/* ── Нэмэлт мэдээлэл ─────────────────────────────── */}
        {(report.description || report.ear_mark_description) && (
          <Card className="mb-4">
            <Text className="text-muted-foreground text-sm mb-2">Тэмдэглэл</Text>
            {report.description && (
              <Text className="text-foreground leading-5 mb-2">
                {report.description}
              </Text>
            )}
            {report.ear_mark_description && (
              <Text className="text-muted-foreground text-sm leading-5">
                Чихний тэмдэг: {report.ear_mark_description}
              </Text>
            )}
          </Card>
        )}

        <Separator className="my-4" />

        {/* ── Эзэн харсан тохиолдлууд ──────────────────────── */}
        <View className="mb-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-bold text-foreground">
              Эзэн харсан тохиолдууд
            </Text>
            <Text className="text-muted-foreground text-sm">
              {sightingsPending ? "..." : sightings.length}
            </Text>
          </View>

          {sightingsPending ? (
            <Card>
              <View className="flex-row items-center gap-2 py-2">
                <Ionicons name="sync" size={16} className="text-primary animate-spin" />
                <Text className="text-muted-foreground text-sm">Ачаалж байна...</Text>
              </View>
            </Card>
          ) : sightings.length === 0 ? (
            <EmptyState
              icon="eye-outline"
              title="Эзэн харсан тохиолдол байхгүй"
              subtitle="Хэн ч энэ морийг хараагүй байна"
            />
          ) : (
            <View className="gap-3">
              {sightings.map((sighting) => (
                <Card key={sighting.id}>
                  <View className="flex-row items-start justify-between mb-2">
                    <View className="flex-row items-center gap-2 flex-1">
                      <Ionicons
                        name={
                          sighting.status === "confirmed"
                            ? "checkmark-circle"
                            : sighting.status === "dismissed"
                              ? "close-circle"
                              : "time-outline"
                        }
                        size={18}
                        className={
                          sighting.status === "confirmed"
                            ? "text-emerald-500"
                            : sighting.status === "dismissed"
                              ? "text-destructive"
                              : "text-muted-foreground"
                        }
                      />
                      <Text className="text-foreground font-medium text-sm">
                        {sighting.location_name || "Байршил мэдэгдээгүй"}
                      </Text>
                    </View>
                    <Badge
                      variant={
                        sighting.status === "confirmed"
                          ? "success"
                          : sighting.status === "dismissed"
                            ? "destructive"
                            : "outline"
                      }
                    >
                      {sighting.status === "confirmed"
                        ? "Баталгаажсан"
                        : sighting.status === "dismissed"
                          ? "Үгүйсгэсэн"
                          : "Хүлээгдэж байна"}
                    </Badge>
                  </View>

                  {sighting.description && (
                    <Text className="text-muted-foreground text-sm leading-4 mb-2">
                      {sighting.description}
                    </Text>
                  )}

                  <View className="flex-row items-center justify-between">
                    <Text className="text-muted-foreground text-xs">
                      {formatDateTime(sighting.created_at)}
                    </Text>
                    {sighting.photo_url && (
                      <Ionicons name="camera-outline" size={14} className="text-muted-foreground" />
                    )}
                  </View>
                </Card>
              ))}
            </View>
          )}
        </View>

        {/* ── Үйлдлүүд ────────────────────────────────────── */}
        {isOwner && report.status === "lost" && (
          <View className="mt-4 gap-3">
            <TouchableOpacity
              onPress={handleMarkFound}
              className="bg-emerald-500 rounded-xl py-3.5 items-center"
              accessibilityLabel="Олсон гэж тэмдэглэх"
            >
              <Text className="text-white font-semibold text-base">
                Олсон гэж тэмдэглэх
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleDelete}
              className="bg-destructive/10 rounded-xl py-3.5 items-center"
              accessibilityLabel="Устгах"
            >
              <Text className="text-destructive font-semibold text-base">
                Устгах
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Эзэнтэй холбогдох ──────────────────────────── */}
        {!isOwner && (
          <TouchableOpacity
            onPress={handleContactOwner}
            className="mt-6 bg-primary rounded-xl py-3.5 items-center"
            accessibilityLabel="Эзэнтэй холбогдох"
          >
            <Text className="text-primary-foreground font-semibold text-base">
              Эзэнтэй холбогдох
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}
