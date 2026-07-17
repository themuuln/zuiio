import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "@/lib/auth";
import { useLostHorse } from "@/hooks/useLostHorses";
import { useCreateSighting } from "@/hooks/useSightings";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { EmptyState } from "@/components/ui/EmptyState";
import { supabase } from "@/lib/supabase";

const STORAGE_BUCKET = "lost-horse-media";

export default function SightingReportScreen() {
  const router = useRouter();
  const { reportId } = useLocalSearchParams<{ reportId: string }>();
  const { user } = useAuth();
  const createSighting = useCreateSighting();

  const { data: report, isPending: reportPending } = useLostHorse(reportId);

  const [description, setDescription] = useState("");
  const [locationName, setLocationName] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Анхны байршил авах
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      setIsGettingLocation(true);
      try {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setLat(location.coords.latitude);
        setLng(location.coords.longitude);
      } catch {
        // Байршил авч чадсангүй — хэрэглэгч гаргаана
      } finally {
        setIsGettingLocation(false);
      }
    })();
  }, []);

  // Зураг сонгох
  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Зөвшөөрөл шаардлагатай", "Зураг сонгохын тулд зөвшөөрөл өгнө үү.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  // Зураг upload хийх
  const uploadPhoto = async (uri: string): Promise<string | null> => {
    try {
      setIsUploading(true);
      const response = await fetch(uri);
      const blob = await response.blob();
      const ext = uri.split(".").pop() ?? "jpg";
      const filePath = `sightings/${Date.now()}.${ext}`;

      const { error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, blob, { contentType: `image/${ext}` });

      if (error) {
        console.error("Upload error:", error);
        return null;
      }

      const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);
      return data.publicUrl;
    } catch (err) {
      console.error("Upload failed:", err);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  // Илгээх
  const handleSubmit = async () => {
    if (!reportId || !user) {
      Alert.alert("Алдаа", "Мэдээлэл дутуу байна.");
      return;
    }

    if (!lat || !lng) {
      Alert.alert("Байршил шаардлагатай", "Байршлыг идэвхжүүлж эсвэл гараар оруулна уу.");
      return;
    }

    let uploadedPhotoUrl: string | null = null;
    if (photoUri) {
      uploadedPhotoUrl = await uploadPhoto(photoUri);
    }

    try {
      await createSighting.mutateAsync({
        report_id: reportId,
        reporter_id: user.id,
        lat,
        lng,
        location_name: locationName || undefined,
        description: description || undefined,
        photo_url: uploadedPhotoUrl ?? undefined,
        is_anonymous: isAnonymous,
      });

      Alert.alert("Амжилттай", "Эзэн харсан тохиолдол илгээгдлээ.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert("Алдаа", "Илгээхэд алдаа гарлаа. Дахин оролдоно уу.");
    }
  };

  // Ачаалж байна
  if (reportPending) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" className="text-primary" />
        <Text className="text-muted-foreground mt-3">Ачаалж байна...</Text>
      </View>
    );
  }

  // Мэдээлэл олдсонгүй
  if (!report) {
    return (
      <View className="flex-1 bg-background">
        <EmptyState
          icon="alert-circle-outline"
          title="Мэдээлэл олдсонгүй"
          subtitle="Энэ алдагдсан морины мэдээлэл байхгүй байна"
          action={
            <TouchableOpacity onPress={() => router.back()} className="bg-primary px-6 py-3 rounded-lg">
              <Text className="text-primary-foreground font-semibold">Буцах</Text>
            </TouchableOpacity>
          }
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      {/* ── Толгой хэсэг ──────────────────────────────────────── */}
      <View className="flex-row items-center px-4 pt-12 pb-4">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} className="text-foreground" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-foreground ml-4">
          Эзэн харсан тохиолдол мэдээлэх
        </Text>
      </View>

      {/* ── Алдагдсан морины мэдээлэл ────────────────────────── */}
      <Card className="mx-4 mb-4">
        <View className="flex-row items-center gap-3">
          <View className="w-12 h-12 rounded-full bg-muted items-center justify-center">
            <Ionicons name="paw" size={22} className="text-primary" />
          </View>
          <View className="flex-1">
            <Text className="text-foreground font-bold text-sm">
              {report.animal_type === "horse" ? "Морь" : report.animal_type ?? "Морь"}
              {report.breed ? ` — ${report.breed}` : ""}
            </Text>
            <Text className="text-muted-foreground text-xs" numberOfLines={1}>
              {report.coat_color ?? ""}{" "}
              {[report.location_aimag, report.location_sum].filter(Boolean).join(", ")}
            </Text>
          </View>
          <View className="bg-destructive/10 rounded-full px-2 py-1">
            <Text className="text-destructive text-xs font-bold">
              {report.sighting_count ?? 0} харсан
            </Text>
          </View>
        </View>
      </Card>

      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        {/* ── Байршил ──────────────────────────────────────────── */}
        <Text className="text-foreground font-bold text-sm mb-2">Байршил *</Text>
        <Card className="mb-4">
          {isGettingLocation ? (
            <View className="flex-row items-center gap-2 py-2">
              <ActivityIndicator size="small" className="text-primary" />
              <Text className="text-muted-foreground text-sm">Байршил тодорхойлж байна...</Text>
            </View>
          ) : lat && lng ? (
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-foreground text-sm font-medium">
                  {lat.toFixed(4)}, {lng.toFixed(4)}
                </Text>
                <Text className="text-muted-foreground text-xs">Одоогийн байршил</Text>
              </View>
              <TouchableOpacity
                onPress={async () => {
                  setIsGettingLocation(true);
                  try {
                    const location = await Location.getCurrentPositionAsync({
                      accuracy: Location.Accuracy.High,
                    });
                    setLat(location.coords.latitude);
                    setLng(location.coords.longitude);
                  } catch {
                    Alert.alert("Алдаа", "Байршил авч чадсангүй.");
                  } finally {
                    setIsGettingLocation(false);
                  }
                }}
              >
                <Ionicons name="refresh" size={20} className="text-primary" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={async () => {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== "granted") {
                  Alert.alert("Зөвшөөрөл шаардлагатай", "Газрын зургийн зөвшөөрөл өгнө үү.");
                  return;
                }
                setIsGettingLocation(true);
                try {
                  const location = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.High,
                  });
                  setLat(location.coords.latitude);
                  setLng(location.coords.longitude);
                } catch {
                  Alert.alert("Алдаа", "Байршил авч чадсангүй.");
                } finally {
                  setIsGettingLocation(false);
                }
              }}
              className="py-2"
            >
              <Text className="text-primary text-sm font-medium">
                📍 Байршил авах
              </Text>
            </TouchableOpacity>
          )}

          <Input
            placeholder="Байршлын нэр (жишээ: Дорнод аймаг, Халх сум)"
            value={locationName}
            onChangeText={setLocationName}
            className="mt-3"
          />
        </Card>

        {/* ── Тайлбар ──────────────────────────────────────────── */}
        <Text className="text-foreground font-bold text-sm mb-2">Тайлбар</Text>
        <Textarea
          placeholder="Юу харсан бэ? Морийн байдал, чиглэл, цаг хугацаа..."
          value={description}
          onChangeText={setDescription}
          numberOfLines={4}
          className="mb-4"
        />

        {/* ── Зураг ────────────────────────────────────────────── */}
        <Text className="text-foreground font-bold text-sm mb-2">Зураг (сонголттой)</Text>
        <TouchableOpacity
          onPress={handlePickImage}
          className="border-2 border-dashed border-border rounded-xl p-6 items-center mb-4"
        >
          {photoUri ? (
            <View className="items-center">
              <Image
                source={{ uri: photoUri }}
                className="w-32 h-32 rounded-lg"
                resizeMode="cover"
              />
              <Text className="text-muted-foreground text-xs mt-2">Зураг сонгогдсон</Text>
            </View>
          ) : (
            <View className="items-center">
              <Ionicons name="camera-outline" size={40} className="text-muted-foreground" />
              <Text className="text-muted-foreground text-sm mt-2">
                Зураг нэмэхийн тулд дарна уу
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* ── Нууцлал ──────────────────────────────────────────── */}
        <TouchableOpacity
          onPress={() => setIsAnonymous(!isAnonymous)}
          className="flex-row items-center gap-3 mb-6 py-2"
        >
          <View
            className={`w-6 h-6 rounded border-2 items-center justify-center ${
              isAnonymous ? "bg-primary border-primary" : "border-border"
            }`}
          >
            {isAnonymous && <Ionicons name="checkmark" size={14} color="#fff" />}
          </View>
          <View className="flex-1">
            <Text className="text-foreground text-sm font-medium">Нэрээ нуух</Text>
            <Text className="text-muted-foreground text-xs">
              Таны нэр мэдээлэлд харагдахгүй
            </Text>
          </View>
        </TouchableOpacity>

        {/* ── Илгээх товч ────────────────────────────────────── */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={!lat || !lng || createSighting.isPending || isUploading}
          className="bg-primary rounded-xl py-3 items-center mb-8"
        >
          {createSighting.isPending || isUploading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text className="text-primary-foreground font-semibold">Илгээх</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
