import { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Switch,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Map, Camera, Marker, isMapAvailable } from "@/lib/maplibre-safe";
import { useAuth } from "@/lib/auth";
import { useHorses } from "@/hooks/useHorses";
import { usePastureZones, useZoneAssignments } from "@/hooks/useHerdTracking";
import {
  useCreatePastureZone,
  useUpdatePastureZone,
  useDeletePastureZone,
  useAssignHorseToZone,
  useRemoveHorseFromZone,
} from "@/hooks/useHerdTrackingMutations";
import { LoadingState, EmptyState } from "@/components/states";
import type { PastureZone } from "@/hooks/useHerdTracking";

// ── Улаанбаатарын үндсэн цэг ────────────────────────────────────────
const DEFAULT_CENTER: [number, number] = [106.9057, 47.9077];

type ScreenMode = "list" | "create" | "edit" | "assign";

export default function PastureManagementScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const userId = user?.id;

  // ── Төлөв ──────────────────────────────────────────────────────
  const [mode, setMode] = useState<ScreenMode>("list");
  const [selectedZone, setSelectedZone] = useState<PastureZone | null>(null);
  const [zoneName, setZoneName] = useState("");
  const [radiusKm, setRadiusKm] = useState("5");
  const [maxDays, setMaxDays] = useState("14");
  const [mapCenter, setMapCenter] = useState<[number, number]>(DEFAULT_CENTER);
  const [isZoneActive, setIsZoneActive] = useState(true);

  // ── Мэдээлэл татах ──────────────────────────────────────────────
  const { data: zones = [], isPending: zonesPending } = usePastureZones(userId);
  const { data: horses = [] } = useHorses(userId);
  const { data: assignments = [] } = useZoneAssignments(selectedZone?.id);

  const createZone = useCreatePastureZone();
  const updateZone = useUpdatePastureZone();
  const deleteZone = useDeletePastureZone();
  const assignHorse = useAssignHorseToZone();
  const removeHorse = useRemoveHorseFromZone();

  // ── Үйлдлүүд ──────────────────────────────────────────────────
  const resetForm = useCallback(() => {
    setZoneName("");
    setRadiusKm("5");
    setMaxDays("14");
    setMapCenter(DEFAULT_CENTER);
    setIsZoneActive(true);
    setSelectedZone(null);
    setMode("list");
  }, []);


  const handleSaveZone = useCallback(() => {
    if (!zoneName.trim()) {
      Alert.alert("Алдаа", "Бүсийн нэр оруулна уу");
      return;
    }
    if (!userId) return;

    const parsedRadius = Number.parseFloat(radiusKm);
    if (Number.isNaN(parsedRadius) || parsedRadius <= 0) {
      Alert.alert("Алдаа", "Радиус зөв оруулна уу");
      return;
    }

    if (mode === "edit" && selectedZone) {
      updateZone.mutate(
        {
          id: selectedZone.id,
          name: zoneName.trim(),
          centerLat: mapCenter[1],
          centerLng: mapCenter[0],
          radiusKm: parsedRadius,
          maxOccupancyDays: Number.parseInt(maxDays, 10) || 14,
          isActive: isZoneActive,
        },
        { onSuccess: () => resetForm() },
      );
    } else {
      createZone.mutate(
        {
          name: zoneName.trim(),
          centerLat: mapCenter[1],
          centerLng: mapCenter[0],
          radiusKm: parsedRadius,
          maxOccupancyDays: Number.parseInt(maxDays, 10) || 14,
          ownerId: userId,
        },
        { onSuccess: () => resetForm() },
      );
    }
  }, [
    mode,
    selectedZone,
    zoneName,
    mapCenter,
    radiusKm,
    maxDays,
    isZoneActive,
    userId,
    createZone,
    updateZone,
    resetForm,
  ]);

  const handleDeleteZone = useCallback(
    (zone: PastureZone) => {
      Alert.alert("Устгах", `"${zone.name}" бүсийг устгах уу?`, [
        { text: "Цуцлах", style: "cancel" },
        {
          text: "Устгах",
          style: "destructive",
          onPress: () => deleteZone.mutate(zone.id, { onSuccess: () => resetForm() }),
        },
      ]);
    },
    [deleteZone, resetForm],
  );

  const handleEditZone = useCallback((zone: PastureZone) => {
    setSelectedZone(zone);
    setZoneName(zone.name);
    setRadiusKm(String(zone.radius_km));
    setMaxDays(String(zone.max_occupancy_days));
    setMapCenter([zone.center_lng, zone.center_lat]);
    setIsZoneActive(zone.is_active);
    setMode("edit");
  }, []);

  const handleToggleAssignment = useCallback(
    (horseId: string, isAssigned: boolean) => {
      if (!selectedZone) return;
      if (isAssigned) {
        removeHorse.mutate({ zoneId: selectedZone.id, horseId });
      } else {
        assignHorse.mutate({ zoneId: selectedZone.id, horseId });
      }
    },
    [selectedZone, assignHorse, removeHorse],
  );

  // ── Ачаалж байна ────────────────────────────────────────────────
  if (zonesPending) {
    return <LoadingState text="Бэлчээрийн бүсийг ачаалж байна..." />;
  }

  // ── Expo Go: MapLibre native modules unavailable ────────────────────
  if (!isMapAvailable) {
    return (
      <View className="flex-1 items-center justify-center bg-background p-6">
        <Ionicons name="map-outline" size={64} color="#9CA3AF" />
        <Text className="mt-4 text-lg font-semibold text-foreground">
          Бэлчээрийн менежментийг ашиглахын тулд dev build хийнэ үү
        </Text>
        <Text className="mt-2 text-center text-sm text-muted-foreground">
          Expo Go дээр MapLibre-ийн нэгдмэл модулиуд байхгүй.{"\n"}Development build үүсгэнэ үү.
        </Text>
      </View>
    );
  }

  // ── Бүс сонгох / хуваарилалтын горим ─────────────────────────
  if (mode === "assign" && selectedZone) {
    const assignedHorseIds = new Set(assignments.map((a) => a.horse_id));

    return (
      <View className="flex-1 bg-background">
        {/* ── Толгой хэсэг ───────────────────────────────────── */}
        <View className="flex-row items-center gap-3 px-4 pt-12 pb-4">
          <TouchableOpacity onPress={resetForm}>
            <Ionicons name="arrow-back" size={22} className="text-foreground" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-foreground font-bold text-lg">
              {selectedZone.name}
            </Text>
            <Text className="text-muted-foreground text-sm">Морь хуваарилах</Text>
          </View>
        </View>

        {/* ── Моринын жагсаалт ────────────────────────────────── */}
        <ScrollView className="flex-1 px-4">
          {horses.length === 0 ? (
            <EmptyState
              icon="paw-outline"
              title="Морь байхгүй байна"
              subtitle="Эхлээд морь нэмнэ үү"
            />
          ) : (
            horses.map((horse) => {
              const isAssigned = assignedHorseIds.has(horse.id);
              return (
                <TouchableOpacity
                  key={horse.id}
                  onPress={() => handleToggleAssignment(horse.id, isAssigned)}
                  className={`flex-row items-center justify-between p-4 rounded-xl mb-2 border ${
                    isAssigned
                      ? "bg-primary/10 border-primary"
                      : "bg-card border-border"
                  }`}
                >
                  <View className="flex-row items-center gap-3">
                    <View
                      className={`w-10 h-10 rounded-full items-center justify-center ${
                        isAssigned ? "bg-primary" : "bg-muted"
                      }`}
                    >
                      <Ionicons
                        name="paw"
                        size={18}
                        color={isAssigned ? "#fff" : "#999"}
                      />
                    </View>
                    <View>
                      <Text className="text-foreground font-medium">{horse.name}</Text>
                      <Text className="text-muted-foreground text-xs">
                        {horse.gender === "stallion"
                          ? "Азарга"
                          : horse.gender === "mare"
                            ? "Эмийн морь"
                            : "Морь"}{" "}
                        · {horse.coat}
                      </Text>
                    </View>
                  </View>
                  <Ionicons
                    name={isAssigned ? "checkmark-circle" : "add-circle-outline"}
                    size={26}
                    color={isAssigned ? "#4A9D5B" : "#999"}
                  />
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>

        {/* ── Доод товч ───────────────────────────────────────── */}
        <View className="px-4 pb-8 pt-3 bg-background">
          <TouchableOpacity
            onPress={resetForm}
            className="bg-primary rounded-xl py-3.5 items-center"
          >
            <Text className="text-primary-foreground font-bold">Дуусгах</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Бүс үүсгэх / засах горим ────────────────────────────────
  if (mode === "create" || mode === "edit") {
    return (
      <View className="flex-1 bg-background">
        {/* ── Толгой хэсэг ───────────────────────────────────── */}
        <View className="flex-row items-center gap-3 px-4 pt-12 pb-3">
          <TouchableOpacity onPress={resetForm}>
            <Ionicons name="arrow-back" size={22} className="text-foreground" />
          </TouchableOpacity>
          <Text className="text-foreground font-bold text-lg">
            {mode === "edit" ? "Бүс засах" : "Бүс үүсгэх"}
          </Text>
        </View>

        <ScrollView className="flex-1 px-4">
          {/* ── Газрын зураг (байршил сонгох) ────────────────── */}
          <View className="rounded-2xl overflow-hidden mb-4" style={{ height: 200 }}>
            <Map
              className="flex-1"
              mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
              logo={false}
              attribution={false}
              onPress={(e: { nativeEvent: { lngLat: [number, number] } }) => setMapCenter(e.nativeEvent.lngLat)}
            >
              <Camera center={mapCenter} zoom={12} />
              <Marker id="zone-center" lngLat={mapCenter}>
                <View
                  className="rounded-full items-center justify-center"
                  style={{
                    width: 32,
                    height: 32,
                    backgroundColor: "#DC2626",
                    borderWidth: 3,
                    borderColor: "#fff",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.3,
                    shadowRadius: 4,
                  }}
                >
                  <Ionicons name="location" size={16} color="#fff" />
                </View>
              </Marker>
            </Map>
            <Text className="text-muted-foreground text-xs text-center py-1 bg-card">
              Зурган дээр дарж байршил сонгоно уу
            </Text>
          </View>

          {/* ── Нэр ──────────────────────────────────────────── */}
          <View className="mb-4">
            <Text className="text-foreground font-medium mb-2">Бүсийн нэр</Text>
            <TextInput
              value={zoneName}
              onChangeText={setZoneName}
              placeholder="Жишээ: Зүүн бэлчээр"
              placeholderTextColor="#999"
              className="bg-card border border-border rounded-xl px-4 py-3 text-foreground"
            />
          </View>

          {/* ── Радиус ───────────────────────────────────────── */}
          <View className="mb-4">
            <Text className="text-foreground font-medium mb-2">Радиус (км)</Text>
            <TextInput
              value={radiusKm}
              onChangeText={setRadiusKm}
              placeholder="5"
              placeholderTextColor="#999"
              keyboardType="numeric"
              className="bg-card border border-border rounded-xl px-4 py-3 text-foreground"
            />
          </View>

          {/* ── Хугацаа ──────────────────────────────────────── */}
          <View className="mb-4">
            <Text className="text-foreground font-medium mb-2">
              Дээд хугацаа (хоног)
            </Text>
            <TextInput
              value={maxDays}
              onChangeText={setMaxDays}
              placeholder="14"
              placeholderTextColor="#999"
              keyboardType="numeric"
              className="bg-card border border-border rounded-xl px-4 py-3 text-foreground"
            />
          </View>

          {/* ── Идэвхтэй эсэх ──────────────────────────────── */}
          <View className="flex-row items-center justify-between mb-6 bg-card border border-border rounded-xl px-4 py-3">
            <Text className="text-foreground font-medium">Идэвхтэй</Text>
            <Switch
              value={isZoneActive}
              onValueChange={setIsZoneActive}
              trackColor={{ false: "#E5E7EB", true: "#4A9D5B" }}
              thumbColor="#fff"
            />
          </View>

          {/* ── Товчууд ──────────────────────────────────────── */}
          <View className="gap-3 mb-8">
            <TouchableOpacity
              onPress={handleSaveZone}
              disabled={createZone.isPending || updateZone.isPending}
              className="bg-primary rounded-xl py-3.5 items-center"
            >
              <Text className="text-primary-foreground font-bold">
                {createZone.isPending || updateZone.isPending
                  ? "Хадгалж байна..."
                  : mode === "edit"
                    ? "Шинэчлэх"
                    : "Үүсгэх"}
              </Text>
            </TouchableOpacity>

            {mode === "edit" && selectedZone && (
              <TouchableOpacity
                onPress={() => handleDeleteZone(selectedZone)}
                className="bg-destructive/10 border border-destructive rounded-xl py-3.5 items-center"
              >
                <Text className="text-destructive font-bold">Устгах</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </View>
    );
  }

  // ── Бүсийн жагсаалт ( анхны үзүүлэлт ) ──────────────────────
  return (
    <View className="flex-1 bg-background">
      {/* ── Толгой хэсэг ──────────────────────────────────────── */}
      <View className="flex-row items-center gap-3 px-4 pt-12 pb-4">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} className="text-foreground" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-foreground font-bold text-xl">Бэлчээрийн бүс</Text>
          <Text className="text-muted-foreground text-sm">
            Газрын нэгжийн удирдлага
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => setMode("create")}
          className="bg-primary rounded-full w-10 h-10 items-center justify-center"
        >
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* ── Жагсаалт ──────────────────────────────────────────── */}
      <ScrollView className="flex-1 px-4">
        {zones.length === 0 ? (
          <EmptyState
            icon="map-outline"
            title="Бэлчээрийн бүс байхгүй байна"
            subtitle="Эхний бүсээ үүсгэнэ үү"
          />
        ) : (
          zones.map((zone) => (
            <View key={zone.id} className="bg-card border border-border rounded-2xl p-4 mb-3">
              {/* ── Бүсийн мэдээлэл ─────────────────────────── */}
              <View className="flex-row items-start justify-between mb-3">
                <View className="flex-1">
                  <View className="flex-row items-center gap-2">
                    <View
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: zone.is_active ? "#4A9D5B" : "#999" }}
                    />
                    <Text className="text-foreground font-bold text-base">{zone.name}</Text>
                  </View>
                  <Text className="text-muted-foreground text-sm mt-1">
                    Радиус: {zone.radius_km} км · Дээд хугацаа: {zone.max_occupancy_days} хоног
                  </Text>
                  {zone.last_rotation_date && (
                    <Text className="text-muted-foreground text-xs mt-1">
                      Сүүлд эргүүлсэн:{" "}
                      {new Date(zone.last_rotation_date).toLocaleString("mn-MN", {
                        month: "short",
                        day: "numeric",
                      })}
                    </Text>
                  )}
                </View>

                <TouchableOpacity onPress={() => handleEditZone(zone)} className="p-1">
                  <Ionicons name="create-outline" size={22} className="text-primary" />
                </TouchableOpacity>
              </View>

              {/* ── Зураг багана ──────────────────────────────── */}
              <View className="rounded-xl overflow-hidden mb-3" style={{ height: 120 }}>
                <Map
                  className="flex-1"
                  mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
                  logo={false}
                  attribution={false}
                  dragPan={false}
                  touchZoom={false}
                >
                  <Camera
                    center={[zone.center_lng, zone.center_lat]}
                    zoom={11}
                  />
                  <Marker id={`zone-${zone.id}`} lngLat={[zone.center_lng, zone.center_lat]}>
                    <View
                      className="rounded-full items-center justify-center"
                      style={{
                        width: 24,
                        height: 24,
                        backgroundColor: "#DC2626",
                        borderWidth: 2,
                        borderColor: "#fff",
                      }}
                    >
                      <Ionicons name="location" size={12} color="#fff" />
                    </View>
                  </Marker>
                </Map>
              </View>

              {/* ── Хуваарилалтын товч ───────────────────────── */}
              <TouchableOpacity
                onPress={() => {
                  setSelectedZone(zone);
                  setMode("assign");
                }}
                className="bg-primary/10 rounded-xl py-2.5 items-center flex-row justify-center gap-2"
              >
                <Ionicons name="people" size={18} color="#C07A32" />
                <Text className="text-primary font-medium text-sm">Морь хуваарилах</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}