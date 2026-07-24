import { useState } from "react";
import { View, Text, ScrollView, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCreateFeedLog, useCreateFeedSchedule } from "@/hooks/useNutrition";
import { PageHeader } from "@/components/ui/PageHeader";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";

type Mode = "log" | "schedule";

const FEED_TYPES = [
  { label: "Өвс", value: "hay" },
  { label: "Үр тариа", value: "grain" },
  { label: "Нэмэлт", value: "supplement" },
  { label: "Бусад", value: "other" },
];

export default function NutritionNewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("log");
  const [feedType, setFeedType] = useState("hay");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState("08:00");
  const [frequency, setFrequency] = useState("daily");
  const [notes, setNotes] = useState("");

  const createLog = useCreateFeedLog(id);
  const createSchedule = useCreateFeedSchedule(id);

  const handleSubmit = async () => {
    if (!amount) {
      Alert.alert("Алдаа", "Хэмжээ оруулна уу");
      return;
    }

    try {
      if (mode === "log") {
        await createLog.mutateAsync({
          feed_type: feedType,
          amount_kg: Number.parseFloat(amount),
          date,
          notes: notes || undefined,
        });
      } else {
        await createSchedule.mutateAsync({
          feed_type: feedType,
          amount_kg: Number.parseFloat(amount),
          frequency,
          time_of_day: time,
        });
      }
      Alert.alert("Амжилттай", "Хооллолт нэмэгдлээ", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert("Алдаа", "Нэмэхэд алдаа гарлаа");
    }
  };

  return (
    <View className="flex-1 bg-background">
      <PageHeader title="Хооллолт нэмэх" showBack />

      <ScrollView className="flex-1 px-4" contentContainerClassName="pb-20">
        <View className="flex-row gap-2 mb-4">
          <Chip label="Бүртгэл" selected={mode === "log"} onPress={() => setMode("log")} />
          <Chip label="Хуваарь" selected={mode === "schedule"} onPress={() => setMode("schedule")} />
        </View>

        <Text className="text-sm font-medium text-foreground mb-1.5">Тэжээлийн төрөл</Text>
        <View className="flex-row gap-2 mb-4">
          {FEED_TYPES.map((ft) => (
            <Chip key={ft.value} label={ft.label} selected={feedType === ft.value} onPress={() => setFeedType(ft.value)} />
          ))}
        </View>

        <Input label="Хэмжээ (кг)" value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="5" />

        {mode === "log" ? (
          <Input label="Огноо" value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" />
        ) : (
          <>
            <Input label="Цаг" value={time} onChangeText={setTime} placeholder="08:00" />
            <Input label="Давтамж" value={frequency} onChangeText={setFrequency} placeholder="daily, weekly..." />
          </>
        )}

        <Input label="Тэмдэглэл" value={notes} onChangeText={setNotes} placeholder="Нэмэлт мэдээлэл..." multiline />

        <Button
          title={mode === "log" ? "Бүртгэх" : "Хуваарь нэмэх"}
          onPress={handleSubmit}
          loading={createLog.isPending || createSchedule.isPending}
          className="mt-4"
        />
      </ScrollView>
    </View>
  );
}
