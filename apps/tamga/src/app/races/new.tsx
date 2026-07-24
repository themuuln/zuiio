import { useState, useEffect } from "react";
import { ScrollView, View, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuth } from "@/lib/auth";
import { useRace } from "@/hooks/useRaces";
import { useCreateRace, useUpdateRace } from "@/hooks/useRaceMutations";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Loading } from "@/components/ui/Loading";
import { Text } from "react-native";

const CATEGORY_OPTIONS = [
  { value: "national", label: "Зүйлийн" },
  { value: "aimag", label: "Аймгийн" },
  { value: "state", label: "Улсын" },
];

export default function NewRaceScreen() {
  const { edit_id } = useLocalSearchParams<{ edit_id?: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const createRace = useCreateRace(user?.id);
  const updateRace = useUpdateRace();
  const { data: existingRace, isLoading: raceLoading } = useRace(edit_id);

  const isEditing = !!edit_id;

  const [name, setName] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [location, setLocation] = useState("");
  const [distanceKm, setDistanceKm] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [prizePool, setPrizePool] = useState("");
  const [maxParticipants, setMaxParticipants] = useState("");

  useEffect(() => {
    if (existingRace) {
      setName(existingRace.name);
      setDate(existingRace.race_date);
      setLocation(existingRace.location);
      setDistanceKm(existingRace.distance_km?.toString() ?? "");
      setCategory(existingRace.category);
      setDescription(existingRace.description ?? "");
      setPrizePool(existingRace.prize_pool?.toString() ?? "");
      setMaxParticipants(existingRace.max_entries?.toString() ?? "");
    }
  }, [existingRace]);

  if (isEditing && raceLoading) {
    return <Loading />;
  }

  if (isEditing && !existingRace) {
    return (
      <View className="flex-1 bg-background">
        <PageHeader title="Засах" showBack />
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-muted-foreground">Уралдаан олдсонгүй</Text>
        </View>
      </View>
    );
  }

  async function handleSubmit() {
    if (!name.trim()) {
      Alert.alert("Алдаа", "Уралдааны нэр оруулна уу");
      return;
    }
    if (!date.trim()) {
      Alert.alert("Алдаа", "Огноо оруулна уу");
      return;
    }

    const input = {
      name: name.trim(),
      race_date: date.trim(),
      location: location.trim(),
      distance_km: distanceKm ? parseFloat(distanceKm) : 0,
      category,
      description: description.trim() || null,
      prize_pool: prizePool ? parseFloat(prizePool) : null,
      max_entries: maxParticipants ? parseInt(maxParticipants, 10) : null,
    };

    try {
      if (isEditing && edit_id) {
        await updateRace.mutateAsync({ ...input, id: edit_id });
        Alert.alert("Амжилттай", "Уралдаан шинэчлэгдлээ", [
          { text: "OK", onPress: () => router.back() },
        ]);
      } else {
        await createRace.mutateAsync(input);
        Alert.alert("Амжилттай", "Шинэ уралдаан нэмэгдлээ", [
          { text: "OK", onPress: () => router.back() },
        ]);
      }
    } catch {
      Alert.alert("Алдаа", "Уралдаан хадгахад алдаа гарлаа");
    }
  }

  const isSubmitting = createRace.isPending || updateRace.isPending;

  return (
    <View className="flex-1 bg-background">
      <PageHeader
        title={isEditing ? "Уралдаан засах" : "Шинэ уралдаан"}
        showBack
      />

      <ScrollView className="flex-1 px-4 pb-8">
        <Card className="p-4">
          <Input
            label="Уралдааны нэр"
            placeholder="Уралдааны нэр оруулна уу"
            value={name}
            onChangeText={setName}
          />

          <Input
            label="Огноо"
            placeholder="Жишээ: 2026-08-15"
            value={date}
            onChangeText={setDate}
          />

          <Input
            label="Байршил"
            placeholder="Байршил оруулна уу"
            value={location}
            onChangeText={setLocation}
          />

          <Input
            label="Зай (км)"
            placeholder="Жишээ: 25"
            value={distanceKm}
            onChangeText={setDistanceKm}
            keyboardType="numeric"
          />

          <View className="mb-4">
            <Text className="text-sm font-medium text-foreground mb-2">
              Төрөл
            </Text>
            <View className="flex-row gap-2">
              {CATEGORY_OPTIONS.map((opt) => (
                <Chip
                  key={opt.value}
                  label={opt.label}
                  selected={category === opt.value}
                  onPress={() =>
                    setCategory(category === opt.value ? null : opt.value)
                  }
                />
              ))}
            </View>
          </View>

          <Textarea
            label="Тайлбар"
            placeholder="Тайлбар оруулна уу"
            value={description}
            onChangeText={setDescription}
          />

          <Input
            label="Шагналт (₮)"
            placeholder="Жишээ: 5000000"
            value={prizePool}
            onChangeText={setPrizePool}
            keyboardType="numeric"
          />

          <Input
            label="Хамгийн их оролцогч"
            placeholder="Жишээ: 50"
            value={maxParticipants}
            onChangeText={setMaxParticipants}
            keyboardType="numeric"
          />

          <Button
            title={
              isEditing ? "Хадгах" : "Нэмэх"
            }
            onPress={handleSubmit}
            loading={isSubmitting}
            disabled={isSubmitting}
            className="mt-2"
          />
        </Card>
      </ScrollView>
    </View>
  );
}
