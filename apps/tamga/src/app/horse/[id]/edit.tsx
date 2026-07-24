import { useState, useEffect } from "react";
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
import { useHorse } from "@/hooks/useHorses";
import { useUpdateHorse } from "@/hooks/useHorseMutations";

const coatOptions = [
  { value: "roan", label: "Хүрэн" },
  { value: "bay", label: "Шар" },
  { value: "black", label: "Хар" },
  { value: "chestnut", label: "Улаан" },
  { value: "grey", label: "Цагаан" },
];

const genderOptions = [
  { value: "stallion", label: "Эр" },
  { value: "mare", label: "Эм" },
  { value: "gelding", label: "Буурал" },
];

export default function EditHorseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: horse, isLoading } = useHorse(id);
  const updateHorse = useUpdateHorse();

  const [name, setName] = useState("");
  const [gender, setGender] = useState("stallion");
  const [coat, setCoat] = useState("roan");
  const [birthYear, setBirthYear] = useState(
    new Date().getFullYear() - 3,
  );

  useEffect(() => {
    if (horse) {
      setName(horse.name);
      setGender(horse.gender);
      setCoat(horse.coat);
      setBirthYear(horse.birth_year);
    }
  }, [horse]);

  if (isLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" className="text-primary" />
      </View>
    );
  }

  if (!horse) {
    return (
      <View className="flex-1 bg-background items-center justify-center px-6">
        <Ionicons name="alert-circle-outline" size={64} className="text-destructive" />
        <Text className="text-destructive mt-4 text-center">
          Морийн мэдээлэл олдсонгүй
        </Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4">
          <Text className="text-muted-foreground">Буцах</Text>
        </TouchableOpacity>
      </View>
    );
  }

  async function handleSubmit() {
    if (!name.trim()) {
      Alert.alert("Алдаа", "Нэр оруулна уу");
      return;
    }
    try {
      await updateHorse.mutateAsync({
        id: id!,
        name: name.trim(),
        gender,
        coat,
        birth_year: birthYear,
      });
      Alert.alert("Амжилттай", "Морийн мэдээлэл шинэчлэгдлээ", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert("Алдаа", "Шинэчлэхэд алдаа гарлаа");
    }
  }

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row items-center justify-between px-4 pt-12 pb-4">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} className="text-foreground" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-foreground">Морь засах</Text>
        <View className="w-6" />
      </View>

      <ScrollView className="flex-1 px-4">
        <View className="bg-card rounded-2xl p-4 mb-4">
          <Text className="text-sm font-semibold text-muted-foreground mb-3">
            Нэр *
          </Text>
          <TextInput
            className="bg-secondary rounded-lg px-4 py-3 text-foreground"
            placeholder="Морины нэр"
            placeholderTextColor="#9CA3AF"
            value={name}
            onChangeText={setName}
          />
        </View>

        <View className="bg-card rounded-2xl p-4 mb-4">
          <Text className="text-sm font-semibold text-muted-foreground mb-3">
            Хүйс
          </Text>
          <View className="flex-row gap-2">
            {genderOptions.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                className={`flex-1 rounded-lg py-3 items-center ${
                  gender === opt.value ? "bg-primary" : "bg-secondary"
                }`}
                onPress={() => setGender(opt.value)}
              >
                <Text
                  className={`font-medium ${
                    gender === opt.value
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
            Өнгө
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {coatOptions.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                className={`rounded-lg px-4 py-2 ${
                  coat === opt.value ? "bg-primary" : "bg-secondary"
                }`}
                onPress={() => setCoat(opt.value)}
              >
                <Text
                  className={`font-medium ${
                    coat === opt.value
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
            Төрсөн он
          </Text>
          <TextInput
            className="bg-secondary rounded-lg px-4 py-3 text-foreground"
            keyboardType="numeric"
            value={String(birthYear)}
            onChangeText={(t) => setBirthYear(Number(t))}
          />
        </View>

        <TouchableOpacity
          className="bg-primary rounded-xl py-4 items-center mb-8"
          onPress={handleSubmit}
          disabled={updateHorse.isPending}
        >
          {updateHorse.isPending ? (
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
