import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useCreateTrainingLog } from "@/hooks/useTrainingMutations";
import { useAuth } from "@/lib/auth";

const trainingTypeOptions = [
  { value: "gallop", label: "Галоп" },
  { value: "sprint", label: "Спринт" },
  { value: "endurance", label: "Тэсвэр чадвар" },
  { value: "rest", label: "Амралт" },
];

const intensityOptions = [
  { value: "low", label: "Бага" },
  { value: "medium", label: "Дунд" },
  { value: "high", label: "Өндөр" },
];

export default function NewTrainingLogScreen() {
  const { id: horseId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const createLog = useCreateTrainingLog();
  const { user } = useAuth();

  const [trainingType, setTrainingType] = useState("gallop");
  const [date, setDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [duration, setDuration] = useState("");
  const [distance, setDistance] = useState("");
  const [handlerName, setHandlerName] = useState("");
  const [weather, setWeather] = useState("");
  const [notes, setNotes] = useState("");

  async function handleSubmit() {
    if (!date) {
      Alert.alert("Алдаа", "Огноо оруулна уу");
      return;
    }
    if (!duration || Number(duration) <= 0) {
      Alert.alert("Алдаа", "Хугацаа оруулна уу");
      return;
    }

    try {
      await createLog.mutateAsync({
        owner_id: user?.id ?? "",
        horse_id: horseId!,
        type: trainingType,
        date: new Date(date).toISOString(),
        duration_minutes: Number(duration),
        distance_km: distance ? Number(distance) : undefined,
        notes: notes || undefined,
        handler_name: handlerName || undefined,
        weather: weather || undefined,
      });
      Alert.alert("Амжилттай", "Сургалтын тэмдэглэл нэмэгдлээ", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert("Алдаа", "Сургалтын тэмдэглэл нэмэхэд алдаа гарлаа");
    }
  }

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row items-center justify-between px-4 pt-12 pb-4">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} className="text-foreground" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-foreground">
          Шинэ сургалтын тэмдэглэл
        </Text>
        <View className="w-6" />
      </View>

      <ScrollView className="flex-1 px-4">
        {/* Training Type */}
        <View className="bg-card rounded-2xl p-4 mb-4">
          <Text className="text-sm font-semibold text-muted-foreground mb-3">
            Төрөл
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {trainingTypeOptions.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                className={`rounded-lg px-4 py-2 ${
                  trainingType === opt.value ? "bg-primary" : "bg-secondary"
                }`}
                onPress={() => setTrainingType(opt.value)}
              >
                <Text
                  className={`font-medium ${
                    trainingType === opt.value
                      ? "text-primary-foreground"
                      : "text-secondary-foreground"
                  }`}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Date */}
        <View className="bg-card rounded-2xl p-4 mb-4">
          <Text className="text-sm font-semibold text-muted-foreground mb-3">
            Огноо *
          </Text>
          <TextInput
            className="bg-secondary rounded-lg px-4 py-3 text-foreground"
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#9CA3AF"
            value={date}
            onChangeText={setDate}
          />
        </View>

        {/* Duration */}
        <View className="bg-card rounded-2xl p-4 mb-4">
          <Text className="text-sm font-semibold text-muted-foreground mb-3">
            Хугацаа (мин) *
          </Text>
          <TextInput
            className="bg-secondary rounded-lg px-4 py-3 text-foreground"
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor="#9CA3AF"
            value={duration}
            onChangeText={setDuration}
          />
        </View>

        {/* Distance */}
        <View className="bg-card rounded-2xl p-4 mb-4">
          <Text className="text-sm font-semibold text-muted-foreground mb-3">
            Зам (км)
          </Text>
          <TextInput
            className="bg-secondary rounded-lg px-4 py-3 text-foreground"
            keyboardType="numeric"
            placeholder="0.00"
            placeholderTextColor="#9CA3AF"
            value={distance}
            onChangeText={setDistance}
          />
        </View>

        {/* Intensity */}
        <View className="bg-card rounded-2xl p-4 mb-4">
          <Text className="text-sm font-semibold text-muted-foreground mb-3">
            Ачаалал
          </Text>
          <View className="flex-row gap-2">
            {intensityOptions.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                className={`flex-1 rounded-lg py-2 items-center ${
                  weather === opt.value ? "bg-primary" : "bg-secondary"
                }`}
                onPress={() => setWeather(opt.value)}
              >
                <Text
                  className={`font-medium ${
                    weather === opt.value
                      ? "text-primary-foreground"
                      : "text-secondary-foreground"
                  }`}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Handler Name */}
        <View className="bg-card rounded-2xl p-4 mb-4">
          <Text className="text-sm font-semibold text-muted-foreground mb-3">
            Завын нэр
          </Text>
          <TextInput
            className="bg-secondary rounded-lg px-4 py-3 text-foreground"
            placeholder="Завын нэр"
            placeholderTextColor="#9CA3AF"
            value={handlerName}
            onChangeText={setHandlerName}
          />
        </View>

        {/* Notes */}
        <View className="bg-card rounded-2xl p-4 mb-4">
          <Text className="text-sm font-semibold text-muted-foreground mb-3">
            Тэмдэглэл
          </Text>
          <TextInput
            className="bg-secondary rounded-lg px-4 py-3 text-foreground"
            placeholder="Нэмэлт тэмдэглэл"
            placeholderTextColor="#9CA3AF"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
          />
        </View>

        <TouchableOpacity
          className="bg-primary rounded-xl py-4 items-center mb-8"
          onPress={handleSubmit}
          disabled={createLog.isPending}
        >
          {createLog.isPending ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-primary-foreground font-bold text-lg">
              Хадгалах
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
