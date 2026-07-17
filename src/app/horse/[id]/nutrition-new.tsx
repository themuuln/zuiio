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
import { useCreateFeedLog, useCreateFeedSchedule } from "@/hooks/useNutrition";

const feedTypeOptions = [
  { value: "hay", label: "Өвс" },
  { value: "grain", label: "Үр тариа" },
  { value: "supplement", label: "Нэмэлт" },
  { value: "other", label: "Бусад" },
];

const frequencyOptions = [
  { value: "daily", label: "Өдөр бүр" },
  { value: "twice_daily", label: "Өдөрт 2 удаа" },
  { value: "weekly", label: "Долоо хоногт" },
  { value: "as_needed", label: "Шаардлагатай үед" },
];

type Mode = "log" | "schedule";

export default function NewNutritionScreen() {
  const { id: horseId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const createFeedLog = useCreateFeedLog();
  const createFeedSchedule = useCreateFeedSchedule();

  const [mode, setMode] = useState<Mode>("log");
  const [feedType, setFeedType] = useState("hay");
  const [amountKg, setAmountKg] = useState("");
  const [date, setDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [notes, setNotes] = useState("");
  const [frequency, setFrequency] = useState("daily");
  const [timeOfDay, setTimeOfDay] = useState("08:00");

  async function handleSubmit() {
    if (!amountKg || Number(amountKg) <= 0) {
      Alert.alert("Анхааруулга", "Хэмжээг оруулна уу");
      return;
    }

    try {
      if (mode === "log") {
        await createFeedLog.mutateAsync({
          horse_id: horseId,
          feed_type: feedType,
          amount_kg: Number(amountKg),
          date,
          notes: notes || undefined,
        });
      } else {
        await createFeedSchedule.mutateAsync({
          horse_id: horseId,
          feed_type: feedType,
          amount_kg: Number(amountKg),
          frequency,
          time_of_day: timeOfDay || undefined,
        });
      }
      router.back();
    } catch {
      Alert.alert("Алдаа", "Хадгалахад алдаа гарлаа");
    }
  }

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row items-center justify-between px-4 pt-12 pb-4">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} className="text-foreground" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-foreground">
          Шинэ хооллолт
        </Text>
        <View className="w-6" />
      </View>

      <ScrollView className="flex-1 px-4">
        {/* Mode Toggle */}
        <View className="bg-card rounded-2xl p-4 mb-4">
          <Text className="text-sm font-semibold text-muted-foreground mb-3">
            Төрөл
          </Text>
          <View className="flex-row gap-2">
            <TouchableOpacity
              className={`flex-1 rounded-lg py-3 items-center ${mode === "log" ? "bg-primary" : "bg-secondary"}`}
              onPress={() => setMode("log")}
            >
              <Text
                className={`font-medium ${mode === "log" ? "text-primary-foreground" : "text-secondary-foreground"}`}
              >
                Хоолны тэмдэглэл
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 rounded-lg py-3 items-center ${mode === "schedule" ? "bg-primary" : "bg-secondary"}`}
              onPress={() => setMode("schedule")}
            >
              <Text
                className={`font-medium ${mode === "schedule" ? "text-primary-foreground" : "text-secondary-foreground"}`}
              >
                Хуваарь
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Feed Type */}
        <View className="bg-card rounded-2xl p-4 mb-4">
          <Text className="text-sm font-semibold text-muted-foreground mb-3">
            Хоолны төрөл
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {feedTypeOptions.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                className={`rounded-lg px-4 py-2 ${feedType === opt.value ? "bg-primary" : "bg-secondary"}`}
                onPress={() => setFeedType(opt.value)}
              >
                <Text
                  className={`font-medium ${feedType === opt.value ? "text-primary-foreground" : "text-secondary-foreground"}`}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Amount */}
        <View className="bg-card rounded-2xl p-4 mb-4">
          <Text className="text-sm font-semibold text-muted-foreground mb-3">
            Хэмжээ (кг) *
          </Text>
          <TextInput
            className="bg-secondary rounded-lg px-4 py-3 text-foreground"
            keyboardType="numeric"
            placeholder="0.0"
            placeholderTextColor="#9CA3AF"
            value={amountKg}
            onChangeText={setAmountKg}
          />
        </View>

        {mode === "log" && (
          <>
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
          </>
        )}

        {mode === "schedule" && (
          <>
            {/* Frequency */}
            <View className="bg-card rounded-2xl p-4 mb-4">
              <Text className="text-sm font-semibold text-muted-foreground mb-3">
                Давтамж
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {frequencyOptions.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    className={`rounded-lg px-4 py-2 ${frequency === opt.value ? "bg-primary" : "bg-secondary"}`}
                    onPress={() => setFrequency(opt.value)}
                  >
                    <Text
                      className={`font-medium ${frequency === opt.value ? "text-primary-foreground" : "text-secondary-foreground"}`}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Time of Day */}
            <View className="bg-card rounded-2xl p-4 mb-4">
              <Text className="text-sm font-semibold text-muted-foreground mb-3">
                Цаг
              </Text>
              <TextInput
                className="bg-secondary rounded-lg px-4 py-3 text-foreground"
                placeholder="HH:MM"
                placeholderTextColor="#9CA3AF"
                value={timeOfDay}
                onChangeText={setTimeOfDay}
              />
            </View>
          </>
        )}

        <TouchableOpacity
          className="bg-primary rounded-xl py-4 items-center mb-8"
          onPress={handleSubmit}
          disabled={createFeedLog.isPending || createFeedSchedule.isPending}
        >
          {createFeedLog.isPending || createFeedSchedule.isPending ? (
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
