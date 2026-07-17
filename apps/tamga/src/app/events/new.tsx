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
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useCreateEvent } from "@/hooks/useEventMutations";
import { useHorses } from "@/hooks/useHorses";

const HARDCODED_USER_ID = "11111111-1111-1111-1111-111111111111";

const eventTypeOptions = [
  { value: "local", label: "Сумын" },
  { value: "national", label: "Улсын" },
  { value: "international", label: "Олон улсын" },
];

export default function NewEventScreen() {
  const router = useRouter();
  const createEvent = useCreateEvent();
  const { data: horses = [] } = useHorses(HARDCODED_USER_ID);

  const [selectedHorse, setSelectedHorse] = useState(horses[0]?.id || "");
  const [eventType, setEventType] = useState("local");
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [result, setResult] = useState("");
  const [prizeAmount, setPrizeAmount] = useState("");
  const [notes, setNotes] = useState("");

  async function handleSubmit() {
    if (!title.trim() || !selectedHorse) {
      Alert.alert("Алдаа", "Гарчиг болон морь сонгоно уу");
      return;
    }

    const horse = horses.find((h) => h.id === selectedHorse);

    try {
      await createEvent.mutateAsync({
        horse_id: selectedHorse,
        event_type: eventType,
        title: title.trim(),
        location: location || undefined,
        date,
        result: result || undefined,
        prize_amount: prizeAmount ? Number(prizeAmount) : undefined,
        notes: notes || undefined,
        horse_name: horse?.name,
      });
      Alert.alert("Амжилттай", "Эвент нэмэгдлээ", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert("Алдаа", "Эвент нэмэхэд алдаа гарлаа");
    }
  }

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row items-center justify-between px-4 pt-12 pb-4">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} className="text-foreground" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-foreground">
          Шинэ эвент
        </Text>
        <View className="w-6" />
      </View>

      <ScrollView className="flex-1 px-4">
        <View className="bg-card rounded-2xl p-4 mb-4">
          <Text className="text-sm font-semibold text-muted-foreground mb-3">
            Морь *
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {horses.map((horse) => (
              <TouchableOpacity
                key={horse.id}
                className={`rounded-lg px-4 py-2 ${
                  selectedHorse === horse.id ? "bg-primary" : "bg-secondary"
                }`}
                onPress={() => setSelectedHorse(horse.id)}
              >
                <Text
                  className={`font-medium ${
                    selectedHorse === horse.id
                      ? "text-primary-foreground"
                      : "text-secondary-foreground"
                  }`}
                >
                  {horse.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View className="bg-card rounded-2xl p-4 mb-4">
          <Text className="text-sm font-semibold text-muted-foreground mb-3">
            Төрөл
          </Text>
          <View className="flex-row gap-2">
            {eventTypeOptions.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                className={`flex-1 rounded-lg py-3 items-center ${
                  eventType === opt.value ? "bg-primary" : "bg-secondary"
                }`}
                onPress={() => setEventType(opt.value)}
              >
                <Text
                  className={`font-medium ${
                    eventType === opt.value
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

        <View className="bg-card rounded-2xl p-4 mb-4">
          <Text className="text-sm font-semibold text-muted-foreground mb-3">
            Гарчиг *
          </Text>
          <TextInput
            className="bg-secondary rounded-lg px-4 py-3 text-foreground"
            placeholder="Эвентийн нэр"
            placeholderTextColor="#9CA3AF"
            value={title}
            onChangeText={setTitle}
          />
        </View>

        <View className="bg-card rounded-2xl p-4 mb-4">
          <Text className="text-sm font-semibold text-muted-foreground mb-3">
            Байршил
          </Text>
          <TextInput
            className="bg-secondary rounded-lg px-4 py-3 text-foreground"
            placeholder="Байршил"
            placeholderTextColor="#9CA3AF"
            value={location}
            onChangeText={setLocation}
          />
        </View>

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

        <View className="bg-card rounded-2xl p-4 mb-4">
          <Text className="text-sm font-semibold text-muted-foreground mb-3">
            Үр дүн
          </Text>
          <TextInput
            className="bg-secondary rounded-lg px-4 py-3 text-foreground"
            placeholder="Жишээ: 1-р байр"
            placeholderTextColor="#9CA3AF"
            value={result}
            onChangeText={setResult}
          />
        </View>

        <View className="bg-card rounded-2xl p-4 mb-4">
          <Text className="text-sm font-semibold text-muted-foreground mb-3">
            Шагнал (₮)
          </Text>
          <TextInput
            className="bg-secondary rounded-lg px-4 py-3 text-foreground"
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor="#9CA3AF"
            value={prizeAmount}
            onChangeText={setPrizeAmount}
          />
        </View>

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
          disabled={createEvent.isPending}
        >
          {createEvent.isPending ? (
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
