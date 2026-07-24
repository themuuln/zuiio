import { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  FlatList,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { useHorses } from "@/hooks/useHorses";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { FAB } from "@/components/ui/FAB";
import { Switch } from "@/components/ui/Switch";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { Loading } from "@/components/ui/Loading";

// ── Төрөлүүд ────────────────────────────────────────────────────

interface Geofence {
  id: string;
  name: string;
  center_lat: number;
  center_lng: number;
  radius_km: number;
  color: number;
  is_active: boolean;
  created_by: string;
  created_at: string;
}

interface GeofenceHorse {
  geofence_id: string;
  horse_id: string;
}

// ── Анхны утгууд ───────────────────────────────────────────────

const DEFAULT_RADIUS_M = 1000;
const MIN_RADIUS_M = 100;
const MAX_RADIUS_M = 50000;
const RADIUS_STEP_M = 100;

// ── Геофенсүүдийн жагсаалт ─────────────────────────────────────

function useGeofences(userId: string | undefined) {
  return useQuery({
    queryKey: ["geofences", userId],
    queryFn: async () => {
      if (!userId) return [] as Geofence[];
      const { data, error } = await supabase
        .from("search_areas")
        .select("*")
        .eq("created_by", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Geofence[];
    },
    enabled: !!userId,
  });
}

function useGeofenceHorseCount(geofenceIds: string[]) {
  return useQuery({
    queryKey: ["geofence_horses", geofenceIds],
    queryFn: async () => {
      if (geofenceIds.length === 0) return {} as Record<string, number>;
      const { data, error } = await supabase
        .from("geofence_horses")
        .select("geofence_id, horse_id")
        .in("geofence_id", geofenceIds);
      if (error) throw error;
      const counts: Record<string, number> = {};
      for (const row of data as GeofenceHorse[]) {
        counts[row.geofence_id] = (counts[row.geofence_id] ?? 0) + 1;
      }
      return counts;
    },
    enabled: geofenceIds.length > 0,
  });
}

// ── Моринын сонголт ─────────────────────────────────────────────

function HorseMultiSelect({
  horses,
  selectedIds,
  onToggle,
}: {
  horses: { id: string; name: string }[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}) {
  if (horses.length === 0) {
    return (
      <Text className="text-muted-foreground text-sm py-4 text-center">
        Морь байхгүй байна
      </Text>
    );
  }

  return (
    <FlatList
      data={horses}
      keyExtractor={(item) => item.id}
      scrollEnabled={false}
      renderItem={({ item }) => {
        const isSelected = selectedIds.includes(item.id);
        return (
          <TouchableOpacity
            onPress={() => onToggle(item.id)}
            className="flex-row items-center justify-between py-3 border-b border-border"
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isSelected }}
            accessibilityLabel={item.name}
          >
            <Text className="text-foreground text-base">{item.name}</Text>
            <Ionicons
              name={isSelected ? "checkbox" : "square-outline"}
              size={22}
              className={isSelected ? "text-primary" : "text-muted-foreground"}
            />
          </TouchableOpacity>
        );
      }}
    />
  );
}

// ── Шинэ геофенс нэмэх дэлгэц ───────────────────────────────────

function AddGeofenceForm({
  userId,
  horses,
  onClose,
}: {
  userId: string;
  horses: { id: string; name: string }[];
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [radiusM, setRadiusM] = useState(DEFAULT_RADIUS_M);
  const [selectedHorseIds, setSelectedHorseIds] = useState<string[]>([]);

  const createMutation = useMutation({
    mutationFn: async () => {
      // 1. Геофенс үүсгэх
      const { data: geofence, error: gfError } = await supabase
        .from("search_areas")
        .insert({
          name,
          center_lat: 47.9077,
          center_lng: 106.9057,
          radius_km: radiusM / 1000,
          color: -4144960,
          is_active: true,
          created_by: userId,
        })
        .select()
        .single();
      if (gfError) throw gfError;

      // 2. Моринууд холбох
      if (selectedHorseIds.length > 0) {
        const { error: relError } = await supabase
          .from("geofence_horses")
          .insert(
            selectedHorseIds.map((horseId) => ({
              geofence_id: geofence.id,
              horse_id: horseId,
            })),
          );
        if (relError) throw relError;
      }

      return geofence;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["geofences", userId] });
      queryClient.invalidateQueries({ queryKey: ["geofence_horses"] });
      onClose();
    },
    onError: (err) => {
      Alert.alert("Алдаа", `Геофенс үүсгэхэд алдаа гарлаа: ${err.message}`);
    },
  });

  const toggleHorse = useCallback((id: string) => {
    setSelectedHorseIds((prev) =>
      prev.includes(id) ? prev.filter((h) => h !== id) : [...prev, id],
    );
  }, []);

  const isValid = name.trim().length > 0;

  return (
    <ScrollView className="flex-1 bg-background px-4 pt-2">
      <Text className="text-muted-foreground text-sm mb-4">
        Газрын зургийн байршил нэмэх боломжтой болно
      </Text>

      <Input
        label="Нэр"
        placeholder="Геофенсын нэр"
        value={name}
        onChangeText={setName}
      />

      <View className="mb-4">
        <Text className="text-sm font-medium text-foreground mb-1.5">
          Радиус (метр): {radiusM.toLocaleString()}
        </Text>
        <View className="flex-row items-center gap-3">
          <TouchableOpacity
            onPress={() =>
              setRadiusM((r) => Math.max(MIN_RADIUS_M, r - RADIUS_STEP_M))
            }
            className="w-10 h-10 bg-card border border-border rounded-xl items-center justify-center"
            accessibilityLabel="Радиус багасгах"
          >
            <Ionicons name="remove" size={20} className="text-foreground" />
          </TouchableOpacity>
          <View className="flex-1 h-2 bg-input rounded-full overflow-hidden">
            <View
              className="h-full bg-primary rounded-full"
              style={{
                width: `${((radiusM - MIN_RADIUS_M) / (MAX_RADIUS_M - MIN_RADIUS_M)) * 100}%`,
              }}
            />
          </View>
          <TouchableOpacity
            onPress={() =>
              setRadiusM((r) => Math.min(MAX_RADIUS_M, r + RADIUS_STEP_M))
            }
            className="w-10 h-10 bg-card border border-border rounded-xl items-center justify-center"
            accessibilityLabel="Радиус нэмэх"
          >
            <Ionicons name="add" size={20} className="text-foreground" />
          </TouchableOpacity>
        </View>
      </View>

      <View className="mb-6">
        <Text className="text-sm font-medium text-foreground mb-2">
          Моринууд ({selectedHorseIds.length} сонгосон)
        </Text>
        <Card>
          <HorseMultiSelect
            horses={horses}
            selectedIds={selectedHorseIds}
            onToggle={toggleHorse}
          />
        </Card>
      </View>

      <View className="flex-row gap-3 mb-8">
        <View className="flex-1">
          <Button title="Цуцлах" variant="secondary" onPress={onClose} />
        </View>
        <View className="flex-1">
          <Button
            title="Үүсгэх"
            onPress={() => createMutation.mutate()}
            loading={createMutation.isPending}
            disabled={!isValid}
          />
        </View>
      </View>
    </ScrollView>
  );
}

// ── Геофенсийн карт ──────────────────────────────────────────────

function GeofenceCard({
  geofence,
  horseCount,
  userId,
}: {
  geofence: Geofence;
  horseCount: number;
  userId: string;
}) {
  const queryClient = useQueryClient();

  const toggleMutation = useMutation({
    mutationFn: async (isActive: boolean) => {
      const { error } = await supabase
        .from("search_areas")
        .update({ is_active: isActive })
        .eq("id", geofence.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["geofences", userId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("search_areas")
        .delete()
        .eq("id", geofence.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["geofences", userId] });
      queryClient.invalidateQueries({ queryKey: ["geofence_horses"] });
    },
  });

  const handleDelete = () => {
    Alert.alert(
      "Геофенс устгах",
      `"${geofence.name}" геофенсыг устгах уу?`,
      [
        { text: "Цуцлах", style: "cancel" },
        {
          text: "Устгах",
          style: "destructive",
          onPress: () => deleteMutation.mutate(),
        },
      ],
    );
  };

  const radiusMeters = Math.round(geofence.radius_km * 1000);

  return (
    <Card className="mb-3">
      <View className="flex-row items-start justify-between">
        <View className="flex-1 mr-3">
          <Text className="text-foreground font-semibold text-base">
            {geofence.name}
          </Text>
          <View className="flex-row items-center gap-3 mt-2">
            <View className="flex-row items-center gap-1">
              <Ionicons
                name="resize-outline"
                size={14}
                className="text-muted-foreground"
              />
              <Text className="text-muted-foreground text-sm">
                {radiusMeters.toLocaleString()} м
              </Text>
            </View>
            <View className="flex-row items-center gap-1">
              <Ionicons
                name="paw-outline"
                size={14}
                className="text-muted-foreground"
              />
              <Text className="text-muted-foreground text-sm">
                {horseCount} морь
              </Text>
            </View>
          </View>
        </View>

        <Switch
          value={geofence.is_active}
          onValueChange={(val) => toggleMutation.mutate(val)}
        />
      </View>

      <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-border">
        <Badge variant={geofence.is_active ? "success" : "secondary"}>
          {geofence.is_active ? "Идэвхтэй" : "Идэвхгүй"}
        </Badge>
        <TouchableOpacity
          onPress={handleDelete}
          className="p-2"
          accessibilityLabel="Геофенс устгах"
        >
          <Ionicons name="trash-outline" size={18} className="text-destructive" />
        </TouchableOpacity>
      </View>
    </Card>
  );
}

// ── Гол дэлгэц ────────────────────────────────────────────────

export default function GeofenceSetupScreen() {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const [showAddForm, setShowAddForm] = useState(false);

  const { data: geofences = [], isPending } = useGeofences(userId);
  const { data: horses = [] } = useHorses(userId);

  const geofenceIds = geofences.map((g) => g.id);
  const { data: horseCounts = {} } = useGeofenceHorseCount(geofenceIds);

  if (isPending) {
    return <Loading message="Геофенсүүдийг ачаалж байна..." />;
  }

  return (
    <View className="flex-1 bg-background">
      <PageHeader title="Геофенс тохируулга" showBack />

      {geofences.length === 0 ? (
        <EmptyState
          icon="location-outline"
          title="Геофенс байхгүй байна"
          subtitle="Эхний геофенсаа үүсгэж мориныхоо байршлыг хянах боломжтой"
          action={
            <Button
              title="Шинэ геофенс"
              onPress={() => setShowAddForm(true)}
            />
          }
        />
      ) : (
        <ScrollView className="flex-1 px-4">
          {geofences.map((geofence) => (
            <GeofenceCard
              key={geofence.id}
              geofence={geofence}
              horseCount={horseCounts[geofence.id] ?? 0}
              userId={userId}
            />
          ))}
          <View className="h-24" />
        </ScrollView>
      )}

      <FAB icon="add" onPress={() => setShowAddForm(true)} />

      <Modal
        visible={showAddForm}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddForm(false)}
      >
        <View className="flex-1 bg-background">
          <View className="flex-row items-center px-4 pt-12 pb-4">
            <TouchableOpacity
              onPress={() => setShowAddForm(false)}
              accessibilityLabel="Хаах"
            >
              <Ionicons name="close" size={24} className="text-foreground" />
            </TouchableOpacity>
            <Text className="text-lg font-bold text-foreground ml-4">
              Шинэ геофенс
            </Text>
          </View>
          <AddGeofenceForm
            userId={userId}
            horses={horses}
            onClose={() => setShowAddForm(false)}
          />
        </View>
      </Modal>
    </View>
  );
}
