import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Map, Camera, Marker, UserLocation, isMapAvailable } from "@/lib/maplibre-safe";
import * as Location from "expo-location";
import { useAuth } from "@/lib/auth";
import { useHorseLocations, useHerdTrackingStatus } from "@/hooks/useHerdTracking";
import { useUpdateHorseLocation } from "@/hooks/useHerdTrackingMutations";
import { useHorses } from "@/hooks/useHorses";
import { useExportCsv } from "@/hooks/useExport";
import { LoadingState } from "@/components/states";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

// ── Улаанбаатарын өргөрөг, уртраг ( анхны үзүүлэлт ) ────────────────
const DEFAULT_CENTER: [number, number] = [106.9057, 47.9077];
const DEFAULT_ZOOM = 12;

// ── Моринын дүр тэмдгийн өнгө ────────────────────────────────────────
const HORSE_MARKER_COLOR = "#C07A32";
const HORSE_MARKER_COLOR_VISIBLE = "#4A9D5B";
const SELECTED_MARKER_COLOR = "#2563EB";

type ViewMode = "map" | "list";

export default function HerdTrackingScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const cameraRef = useRef<React.ComponentRef<React.ComponentType<Record<string, unknown>>> | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [showStatusPanel, setShowStatusPanel] = useState(true);
  const [selectedHorseId, setSelectedHorseId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("map");
  const [locationWatcher, setLocationWatcher] = useState<Location.LocationSubscription | null>(
    null,
  );
  const [selectedFilter, setSelectedFilter] = useState<string>("all");

  const { exportCsv } = useExportCsv();

  // ── Мэдээлэл татах ──────────────────────────────────────────────
  const { data: horses = [] } = useHorses(user?.id);
  const horseIds = horses.map((h) => h.id);
  const { data: locations = [], isPending: locationsPending } = useHorseLocations(horseIds);
  const { data: status, isPending: statusPending } = useHerdTrackingStatus();
  const updateLocation = useUpdateHorseLocation();

  // ── Шүүлтүүртэй моринын жагсаалт ────────────────────────────────
  const filteredLocations = locations.filter((loc) => {
    if (selectedFilter === "all") return true;
    return loc.horse_id === selectedFilter;
  });

  // ── Газрын зургийн мэдээлэл (GeoJSON) ──────────────────────────
  const locationFeatures = filteredLocations
    .filter((loc) => loc.lat && loc.lng)
    .map((loc) => ({
      type: "Feature" as const,
      geometry: {
        type: "Point" as const,
        coordinates: [loc.lng, loc.lat] as [number, number],
      },
      properties: {
        horse_id: loc.horse_id,
        horse_name: loc.horse_name ?? "Тодорхойгүй",
        source: loc.source ?? "gps",
      },
    }));

  // ── Сонгосон морийн мэдээлэл ───────────────────────────────────
  const selectedHorse = selectedHorseId
    ? locations.find((l) => l.horse_id === selectedHorseId)
    : null;

  // ── GPS эхлэх / зогсоох ─────────────────────────────────────────
  const startTracking = useCallback(async () => {
    const { status: permStatus } = await Location.requestForegroundPermissionsAsync();
    if (permStatus !== "granted") {
      Alert.alert(
        "Зөвшөөрөл шаардлагатай",
        "Газрын зургийн байршлыг ашиглахын тулд зөвшөөрөл өгнө үү.",
      );
      return;
    }

    const subscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        distanceInterval: 10,
        timeInterval: 30000,
      },
      (location) => {
        if (!user) return;
        updateLocation.mutate({
          horseId: horseIds[0] ?? "",
          lat: location.coords.latitude,
          lng: location.coords.longitude,
          source: "gps",
          ownerId: user.id,
        });
      },
    );

    setLocationWatcher(subscription);
    setIsTracking(true);
  }, [user, horseIds, updateLocation]);

  const stopTracking = useCallback(() => {
    locationWatcher?.remove();
    setLocationWatcher(null);
    setIsTracking(false);
  }, [locationWatcher]);

  // ── Газрын зургийг тухайн байршил руу чиглүүлэх ───────────────
  const flyToHorse = useCallback(
    (lat: number, lng: number) => {
      (cameraRef.current as any)?.setCamera({
        centerCoordinate: [lng, lat],
        zoomLevel: 15,
        animationDuration: 800,
      } as any);
    },
    [],
  );

  // ── Моринын түүхийг экспортлох ───────────────────────────────────
  const handleExport = useCallback(() => {
    if (filteredLocations.length === 0) {
      Alert.alert("Мэдээлэл байхгүй", "Экспортлох байршлын мэдээлэл байхгүй байна.");
      return;
    }

    const headers = ["Морийн нэр", "Өргөрөг", "Уртраг", "Эх сурвалж", "Огноо"];
    const rows = filteredLocations.map((loc) => [
      loc.horse_name ?? "Тодорхойгүй",
      loc.lat,
      loc.lng,
      loc.source ?? "gps",
      loc.recorded_at ?? "",
    ]);

    exportCsv(`herd_tracking_${new Date().toISOString().slice(0, 10)}`, headers, rows);
    Alert.alert("Амжилттай", "Түүхийг CSV файл руу экспортлов.");
  }, [filteredLocations, exportCsv]);

  // Цэвэрлэгээ
  useEffect(() => {
    return () => {
      locationWatcher?.remove();
    };
  }, [locationWatcher]);

  // ── Ачаалж байна ────────────────────────────────────────────────
  if (statusPending || locationsPending) {
    return <LoadingState text="Газрын зургийг ачаалж байна..." />;
  }

  // ── Expo Go: MapLibre native modules unavailable ────────────────────
  if (!isMapAvailable) {
    return (
      <View className="flex-1 items-center justify-center bg-background p-6">
        <Ionicons name="map-outline" size={64} color="#9CA3AF" />
        <Text className="mt-4 text-lg font-semibold text-foreground">
          Газрын зургийн функцийг ашиглахын тулд dev build хийнэ үү
        </Text>
        <Text className="mt-2 text-center text-sm text-muted-foreground">
          Expo Go дээр MapLibre-ийн нэгдмэл модулиуд байхгүй.{"\n"}Development build үүсгэнэ үү.
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      {/* ── Газрын зураг ──────────────────────────────────────── */}
      {viewMode === "map" && (
        <Map
          className="absolute inset-0"
          mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
          logo={false}
          attribution={false}
        >
          <Camera
            ref={cameraRef}
            center={DEFAULT_CENTER}
            zoom={DEFAULT_ZOOM}
          />

          <UserLocation animated={isTracking} />

          {/* ── Моринын тэмдгүүд ──────────────────────────────── */}
          {locationFeatures.map((feature) => (
            <Marker
              key={feature.properties.horse_id}
              id={feature.properties.horse_id}
              lngLat={feature.geometry.coordinates}
              onPress={() => setSelectedHorseId(feature.properties.horse_id)}
            >
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setSelectedHorseId(feature.properties.horse_id)}
                className="items-center"
                style={{ alignItems: "center", width: 40, height: 50 }}
              >
                <View
                  className="rounded-full items-center justify-center"
                  style={{
                    width: selectedHorseId === feature.properties.horse_id ? 42 : 36,
                    height: selectedHorseId === feature.properties.horse_id ? 42 : 36,
                    backgroundColor:
                      selectedHorseId === feature.properties.horse_id
                        ? SELECTED_MARKER_COLOR
                        : HORSE_MARKER_COLOR,
                    borderWidth: 2,
                    borderColor: "#fff",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.25,
                    shadowRadius: 4,
                    elevation: 4,
                  }}
                >
                  <Ionicons
                    name="paw"
                    size={selectedHorseId === feature.properties.horse_id ? 20 : 18}
                    color="#fff"
                  />
                </View>
                <View
                  className="rounded-full px-2 py-0.5 mt-1"
                  style={{
                    backgroundColor:
                      selectedHorseId === feature.properties.horse_id
                        ? SELECTED_MARKER_COLOR
                        : HORSE_MARKER_COLOR,
                    minWidth: 50,
                    alignItems: "center",
                  }}
                >
                  <Text className="text-white text-[10px] font-bold" numberOfLines={1}>
                    {feature.properties.horse_name}
                  </Text>
                </View>
              </TouchableOpacity>
            </Marker>
          ))}
        </Map>
      )}

      {/* ── Дээрх товчууд ────────────────────────────────────── */}
      <View className="absolute top-12 left-4 right-4 flex-row justify-between">
        <TouchableOpacity
          onPress={() => router.back()}
          className="bg-card/90 rounded-full w-11 h-11 items-center justify-center"
          style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 3 }}
        >
          <Ionicons name="arrow-back" size={22} className="text-foreground" />
        </TouchableOpacity>

        <View className="flex-row gap-2">
          {/* Зураг / Жагсаалт хооронд шилжих */}
          <TouchableOpacity
            onPress={() => setViewMode(viewMode === "map" ? "list" : "map")}
            className="bg-card/90 rounded-full w-11 h-11 items-center justify-center"
            style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 3 }}
          >
            <Ionicons
              name={viewMode === "map" ? "list" : "map"}
              size={22}
              className="text-primary"
            />
          </TouchableOpacity>

          {/* Экспорт */}
          <TouchableOpacity
            onPress={handleExport}
            className="bg-card/90 rounded-full w-11 h-11 items-center justify-center"
            style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 3 }}
          >
            <Ionicons name="download-outline" size={22} className="text-primary" />
          </TouchableOpacity>

          {/* Мэдээллийн самбар */}
          <TouchableOpacity
            onPress={() => setShowStatusPanel((prev) => !prev)}
            className="bg-card/90 rounded-full w-11 h-11 items-center justify-center"
            style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 3 }}
          >
            <Ionicons
              name={showStatusPanel ? "information-circle" : "information-circle-outline"}
              size={22}
              className="text-primary"
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Шүүлтүүрийн чипууд ──────────────────────────────────── */}
      <View className="absolute top-28 left-0 right-0">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="px-4 gap-2"
        >
          <TouchableOpacity
            onPress={() => {
              setSelectedFilter("all");
              setSelectedHorseId(null);
            }}
            className={`rounded-full px-4 py-2 ${
              selectedFilter === "all" ? "bg-primary" : "bg-card/90"
            }`}
            style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 }}
          >
            <Text
              className={`text-sm font-medium ${
                selectedFilter === "all" ? "text-white" : "text-foreground"
              }`}
            >
              Бүгд ({locations.length})
            </Text>
          </TouchableOpacity>

          {horses.map((horse) => {
            const count = locations.filter((l) => l.horse_id === horse.id).length;
            return (
              <TouchableOpacity
                key={horse.id}
                onPress={() => {
                  setSelectedFilter(selectedFilter === horse.id ? "all" : horse.id);
                  setSelectedHorseId(horse.id);
                  const loc = locations.find((l) => l.horse_id === horse.id);
                  if (loc?.lat && loc?.lng) flyToHorse(loc.lat, loc.lng);
                }}
                className={`rounded-full px-4 py-2 ${
                  selectedFilter === horse.id ? "bg-primary" : "bg-card/90"
                }`}
                style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 }}
              >
                <Text
                  className={`text-sm font-medium ${
                    selectedFilter === horse.id ? "text-white" : "text-foreground"
                  }`}
                  numberOfLines={1}
                >
                  {horse.name}
                  {count > 0 ? ` (${count})` : ""}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Сонгосон морины мэдээлэл ──────────────────────────── */}
      {selectedHorse && selectedHorse.lat && selectedHorse.lng && (
        <View
          className="absolute bottom-32 left-4 right-4 bg-card/95 rounded-2xl p-4"
          style={{ shadowColor: "#000", shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 5 }}
        >
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center gap-2">
              <Ionicons name="paw" size={18} className="text-primary" />
              <Text className="text-foreground font-bold text-base">
                {selectedHorse.horse_name ?? "Тодорхойгүй"}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setSelectedHorseId(null)}>
              <Ionicons name="close-circle" size={22} className="text-muted-foreground" />
            </TouchableOpacity>
          </View>

          <View className="flex-row gap-4 mb-2">
            <View className="flex-1">
              <Text className="text-muted-foreground text-xs">Байршил</Text>
              <Text className="text-foreground text-sm">
                {selectedHorse.lat.toFixed(4)}, {selectedHorse.lng.toFixed(4)}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-muted-foreground text-xs">Эх сурвалж</Text>
              <Badge variant={selectedHorse.source === "gps" ? "default" : "secondary"}>
                <Text>{selectedHorse.source ?? "gps"}</Text>
              </Badge>
            </View>
          </View>

          {selectedHorse.recorded_at && (
            <Text className="text-muted-foreground text-xs">
              Сүүлд шинэчлэгдсэн:{" "}
              {new Date(selectedHorse.recorded_at).toLocaleString("mn-MN", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          )}

          <TouchableOpacity
            className="bg-secondary rounded-lg px-4 py-2 mt-3 flex-row items-center"
            onPress={() => {
              const horse = horses.find((h) => h.id === selectedHorse.horse_id);
              if (horse) router.push(`/horse/${horse.id}` as any);
            }}
          >
            <Ionicons name="eye-outline" size={16} className="text-foreground" />
            <Text className="text-foreground ml-1">Дэлгэрүүлж харах</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Сүрэгийн төлөвийн самбар ────────────────────────── */}
      {showStatusPanel && !selectedHorseId && (
        <View
          className="absolute bottom-24 left-4 right-4 bg-card/95 rounded-2xl p-4"
          style={{ shadowColor: "#000", shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 5 }}
        >
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-foreground font-bold text-base">Сүрэгийн төлөв</Text>
            <TouchableOpacity onPress={() => setShowStatusPanel(false)}>
              <Ionicons name="close-circle" size={22} className="text-muted-foreground" />
            </TouchableOpacity>
          </View>

          {/* ── Тойм тоо ──────────────────────────────────────── */}
          <View className="flex-row gap-4 mb-3">
            <View className="flex-1 bg-muted rounded-xl p-3 items-center">
              <Text className="text-2xl font-bold text-primary">
                {status?.visibleCount ?? 0}
              </Text>
              <Text className="text-muted-foreground text-xs">Идэвхтэй</Text>
            </View>
            <View className="flex-1 bg-muted rounded-xl p-3 items-center">
              <Text className="text-2xl font-bold text-foreground">
                {status?.totalTracked ?? 0}
              </Text>
              <Text className="text-muted-foreground text-xs">Нийт тэмдэглэгдсэн</Text>
            </View>
          </View>

          {status?.latestUpdate && (
            <Text className="text-muted-foreground text-xs mb-3">
              Сүүлд шинэчлэгдсэн:{" "}
              {new Date(status.latestUpdate).toLocaleString("mn-MN", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          )}

          {/* ── Моринын жагсаалт ──────────────────────────────── */}
          {status?.horses && status.horses.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="max-h-20">
              {status.horses.map((horse) => (
                <TouchableOpacity
                  key={horse.horseId}
                  onPress={() => {
                    router.push(`/horse/${horse.horseId}`);
                  }}
                  className="bg-muted rounded-xl px-3 py-2 mr-2 min-w-[120px]"
                >
                  <View className="flex-row items-center gap-1.5">
                    <View
                      className="w-2.5 h-2.5 rounded-full"
                      style={{
                        backgroundColor: horse.isVisible
                          ? HORSE_MARKER_COLOR_VISIBLE
                          : HORSE_MARKER_COLOR,
                      }}
                    />
                    <Text className="text-foreground text-sm font-medium" numberOfLines={1}>
                      {horse.horseName || "Тодорхойгүй"}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {(!status?.horses || status.horses.length === 0) && (
            <Text className="text-muted-foreground text-sm text-center py-2">
              Газрын зургийн мэдээлэл байхгүй байна
            </Text>
          )}
        </View>
      )}

      {/* ── Жагсаалт хэлбэр ──────────────────────────────────── */}
      {viewMode === "list" && (
        <View className="flex-1 bg-background pt-36 px-4">
          {filteredLocations.length === 0 ? (
            <EmptyState
              icon="map-outline"
              title="Байршлын мэдээлэл байхгүй"
              subtitle="GPS идэвхжүүлж моринын байршил бүртгэнэ үү"
            />
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {filteredLocations.map((loc) => (
                <TouchableOpacity
                  key={loc.id ?? loc.horse_id}
                  className="bg-card rounded-xl p-4 mb-3 border border-border"
                  onPress={() => {
                    setViewMode("map");
                    setSelectedHorseId(loc.horse_id);
                    if (loc.lat && loc.lng) flyToHorse(loc.lat, loc.lng);
                  }}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-3">
                      <View
                        className="w-10 h-10 rounded-full items-center justify-center"
                        style={{ backgroundColor: HORSE_MARKER_COLOR }}
                      >
                        <Ionicons name="paw" size={18} color="#fff" />
                      </View>
                      <View>
                        <Text className="text-foreground font-bold text-sm">
                          {loc.horse_name ?? "Тодорхойгүй"}
                        </Text>
                        <Text className="text-muted-foreground text-xs">
                          {loc.lat?.toFixed(4)}, {loc.lng?.toFixed(4)}
                        </Text>
                      </View>
                    </View>

                    <View className="items-end">
                      <Badge variant={loc.source === "gps" ? "default" : "secondary"}>
                        <Text>{loc.source ?? "gps"}</Text>
                      </Badge>
                      {loc.recorded_at && (
                        <Text className="text-muted-foreground text-xs mt-1">
                          {new Date(loc.recorded_at).toLocaleString("mn-MN", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </Text>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      )}

      {/* ── GPS хяналтын товч ─────────────────────────────────── */}
      <TouchableOpacity
        onPress={isTracking ? stopTracking : startTracking}
        className="absolute bottom-8 right-6 rounded-full items-center justify-center"
        style={{
          width: 56,
          height: 56,
          backgroundColor: isTracking ? "#DC2626" : HORSE_MARKER_COLOR,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 6,
          elevation: 6,
        }}
      >
        <Ionicons
          name={isTracking ? "stop" : "location"}
          size={26}
          color="#fff"
        />
      </TouchableOpacity>

      {/* ── Тэмдэглэгээ ──────────────────────────────────────── */}
      <View className="absolute bottom-10 left-6">
        <Text className="text-muted-foreground text-xs">
          {isTracking ? "📍 GPS идэвхтэй — байршил тэмдэглэж байна" : "Газрын зургийг дарж GPS идэвхжүүлнэ"}
        </Text>
      </View>
    </View>
  );
}
