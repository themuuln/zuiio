import { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import * as Location from "expo-location";
import { supabase } from "@/lib/supabase";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LoadingState, ErrorState, EmptyState } from "@/components/states";

const PERMISSION_DENIED = "Байршлын зөвшөөрөл хэрэгтэй. Тохиргоогоо шалгана уу.";
const TIMEOUT = "Байршлыг олох хугацаа дууслаа. Дахин оролдоно уу.";

// ── Хафферын зай тооцох ────────────────────────────────────────────
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Моринын мэдээллийн төрөл ──────────────────────────────────────
interface NearbyHorse {
  id: string;
  name: string;
  gender: string;
  coat: string | null;
  owner_id: string;
  location_lat: number | null;
  location_lng: number | null;
  profiles: { display_name: string } | null;
  distance_km: number;
}

// ── Нэмэлт хүснэгтээс морь авах хүсэлт ───────────────────────────
async function fetchNearbyHorsesFallback(
  lat: number,
  lng: number,
): Promise<NearbyHorse[]> {
  const { data, error } = await supabase
    .from("horses")
    .select("*, profiles(display_name)")
    .not("location_lat", "is", null)
    .not("location_lng", "is", null)
    .limit(100);

  if (error) throw error;

  const horses = (data ?? []) as NearbyHorse[];
  return horses
    .map((h) => ({
      ...h,
      distance_km: haversineDistance(lat, lng, h.location_lat!, h.location_lng!),
    }))
    .filter((h) => h.distance_km <= 50)
    .sort((a, b) => a.distance_km - b.distance_km);
}

// ── RPC-аар ойрын морь авах ────────────────────────────────────────
async function fetchNearbyHorsesRpc(
  lat: number,
  lng: number,
): Promise<NearbyHorse[]> {
  const { data, error } = await supabase.rpc("nearby_horses", {
    lat,
    lng,
    radius_km: 50,
  });

  if (error) throw error;

  return ((data ?? []) as NearbyHorse[]).sort(
    (a, b) => a.distance_km - b.distance_km,
  );
}

// ── Моринын жагсаалтын нэгж ────────────────────────────────────────
function HorseListItem({
  horse,
  onPress,
}: {
  horse: NearbyHorse;
  onPress: () => void;
}) {
  const ownerName = horse.profiles?.display_name ?? "Тодорхойгүй";

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card className="mb-3">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-foreground font-semibold text-base">
              {horse.name}
            </Text>
            <Text className="text-muted-foreground text-sm mt-1">
              Эзэн: {ownerName}
            </Text>
            <View className="flex-row items-center gap-2 mt-2">
              {horse.coat ? (
                <Badge variant="secondary">{horse.coat}</Badge>
              ) : null}
              <Badge variant="outline">
                Зай: {horse.distance_km.toFixed(1)} км
              </Badge>
            </View>
          </View>
          <Ionicons
            name="chevron-forward"
            size={20}
            className="text-muted-foreground"
          />
        </View>
      </Card>
    </TouchableOpacity>
  );
}

// ── Гол дэлгэц ─────────────────────────────────────────────────────
export default function NearbyHorsesScreen() {
  const router = useRouter();
  const [locationLoading, setLocationLoading] = useState(true);
  const [userLocation, setUserLocation] =
    useState<Location.LocationObject | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Байршал авах
  useEffect(() => {
    let cancelled = false;

    async function requestLocation() {
      try {
        const { status } =
          await Location.requestForegroundPermissionsAsync();
        if (cancelled) return;

        if (status !== "granted") {
          setLocationError(PERMISSION_DENIED);
          setLocationLoading(false);
          return;
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (cancelled) return;

        setUserLocation(location);
      } catch (err: unknown) {
        if (cancelled) return;
        setLocationError(TIMEOUT);
      } finally {
        if (!cancelled) setLocationLoading(false);
      }
    }

    requestLocation();
    return () => {
      cancelled = true;
    };
  }, []);

  // Ойрын морьнуудыг татах
  const {
    data: horses = [],
    isPending,
    error,
    refetch,
  } = useQuery({
    queryKey: ["nearbyHorses", userLocation?.coords.latitude, userLocation?.coords.longitude],
    enabled: !!userLocation,
    queryFn: async () => {
      const lat = userLocation!.coords.latitude;
      const lng = userLocation!.coords.longitude;

      try {
        return await fetchNearbyHorsesRpc(lat, lng);
      } catch {
        // RPC байхгүй бол нэмэлт хүснэгтээс авах
        return await fetchNearbyHorsesFallback(lat, lng);
      }
    },
  });

  // ── Ачаалж байна ────────────────────────────────────────────────
  if (locationLoading) {
    return (
      <View className="flex-1 bg-background">
        <PageHeader title="Ойрын морьнууд" showBack />
        <LoadingState text="Байршлыг тодорхойлж байна..." />
      </View>
    );
  }

  // ── Байршлын алдаа ──────────────────────────────────────────────
  if (locationError) {
    return (
      <View className="flex-1 bg-background">
        <PageHeader title="Ойрын морьнууд" showBack />
        <EmptyState
          icon="location-outline"
          title={locationError}
          subtitle="Байршлын зөвшөөрөл хэрэгтэй"
        />
        <TouchableOpacity
          onPress={() => {
            setLocationError(null);
            setLocationLoading(true);
          }}
          className="mx-auto mb-8 bg-primary px-6 py-3 rounded-lg"
        >
          <Text className="text-primary-foreground font-semibold">
            Дахин оролдох
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Мэдээлэл ачаалж байна ──────────────────────────────────────
  if (isPending) {
    return (
      <View className="flex-1 bg-background">
        <PageHeader title="Ойрын морьнууд" showBack />
        <LoadingState text="Морьнуудыг хайж байна..." />
      </View>
    );
  }

  // ── Алдаа ───────────────────────────────────────────────────────
  if (error) {
    return (
      <View className="flex-1 bg-background">
        <PageHeader title="Ойрын морьнууд" showBack />
        <ErrorState onRetry={() => refetch()} />
      </View>
    );
  }

  // ── Хоосон ──────────────────────────────────────────────────────
  if (horses.length === 0) {
    return (
      <View className="flex-1 bg-background">
        <PageHeader title="Ойрын морьнууд" showBack />
        <EmptyState
          icon="paw-outline"
          title="Ойролцоо морь олдсонгүй"
          subtitle="50 км радиусд бүртгэлтэй морь байхгүй байна"
        />
      </View>
    );
  }

  // ── Жагсаалт ────────────────────────────────────────────────────
  return (
    <View className="flex-1 bg-background">
      <PageHeader
        title="Ойрын морьнууд"
        subtitle={`${horses.length} морь олдлоо`}
        showBack
      />
      <FlatList
        data={horses}
        keyExtractor={(item) => item.id}
        contentContainerClassName="px-4 pb-6"
        renderItem={({ item }) => (
          <HorseListItem
            horse={item}
            onPress={() => router.push(`/horse/${item.id}`)}
          />
        )}
      />
    </View>
  );
}
