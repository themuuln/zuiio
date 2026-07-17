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
import { useCreateHealthLog } from "@/hooks/useHealthLogMutations";

const logTypeOptions = [
  { value: "vaccination", label: "Вакцин" },
  { value: "shoeing", label: "Тахилт" },
  { value: "deworming", label: "Бөөлжүүлэх" },
  { value: "checkup", label: "Үзлэг" },
];

export default function NewHealthLogScreen() {
  const { id: horseId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const createLog = useCreateHealthLog();

  const [logType, setLogType] = useState("vaccination");
  const [date, setDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [notes, setNotes] = useState("");
  const [medicament, setMedicament] = useState("");
  const [cost, setCost] = useState("");
  const [farrierName, setFarrierName] = useState("");

  async function handleSubmit() {
    if (!date) {
      Alert.alert("Алдаа", "Огноо оруулна уу");
      return;
    }

    try {
      await createLog.mutateAsync({
        horse_id: horseId!,
        log_type: logType,
        date,
        notes: notes || undefined,
        medicament: medicament || undefined,
        cost: cost ? Number(cost) : undefined,
        farrier_name: farrierName || undefined,
      });
      Alert.alert("Амжилттай", "Тэмдэглэл нэмэгдлээ", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert("Алдаа", "Тэмдэглэл нэмэхэд алдаа гарлаа");
    }
  }

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row items-center justify-between px-4 pt-12 pb-4">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} className="text-foreground" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-foreground">
          Шинэ тэмдэглэл
        </Text>
        <View className="w-6" />
      </View>

      <ScrollView className="flex-1 px-4">
        <View className="bg-card rounded-2xl p-4 mb-4">
          <Text className="text-sm font-semibold text-muted-foreground mb-3">
            Төрөл
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {logTypeOptions.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                className={`rounded-lg px-4 py-2 ${
                  logType === opt.value ? "bg-primary" : "bg-secondary"
                }`}
                onPress={() => setLogType(opt.value)}
              >
                <Text
                  className={`font-medium ${
                    logType === opt.value
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

        {(logType === "vaccination" || logType === "deworming") && (
          <View className="bg-card rounded-2xl p-4 mb-4">
            <Text className="text-sm font-semibold text-muted-foreground mb-3">
              Эм
            </Text>
            <TextInput
              className="bg-secondary rounded-lg px-4 py-3 text-foreground"
              placeholder="Эмийн нэр"
              placeholderTextColor="#9CA3AF"
              value={medicament}
              onChangeText={setMedicament}
            />
          </View>
        )}

        {logType === "shoeing" && (
          <View className="bg-card rounded-2xl p-4 mb-4">
            <Text className="text-sm font-semibold text-muted-foreground mb-3">
              Мастер
            </Text>
            <TextInput
              className="bg-secondary rounded-lg px-4 py-3 text-foreground"
              placeholder="Мастерын нэр"
              placeholderTextColor="#9CA3AF"
              value={farrierName}
              onChangeText={setFarrierName}
            />
          </View>
        )}

        <View className="bg-card rounded-2xl p-4 mb-4">
          <Text className="text-sm font-semibold text-muted-foreground mb-3">
            Зардал (₮)
          </Text>
          <TextInput
            className="bg-secondary rounded-lg px-4 py-3 text-foreground"
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor="#9CA3AF"
            value={cost}
            onChangeText={setCost}
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
