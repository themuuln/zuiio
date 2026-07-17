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
import { useReportLostHorse } from "@/hooks/useLostHorseMutations";

export default function ReportLostHorseScreen() {
  const router = useRouter();
  const reportLostHorse = useReportLostHorse();

  const [description, setDescription] = useState("");
  const [locationName, setLocationName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [animalType, setAnimalType] = useState("morь");
  const [breed, setBreed] = useState("");
  const [coatColor, setCoatColor] = useState("");

  async function handleSubmit() {
    try {
      await reportLostHorse.mutateAsync({
        description: description.trim() || undefined,
        location_name: locationName.trim() || undefined,
        contact_phone: contactPhone.trim() || undefined,
        animal_type: animalType || undefined,
        breed: breed.trim() || undefined,
        coat_color: coatColor.trim() || undefined,
      });
      Alert.alert("Амжилттай", "Морь алдагдсан гэж мэдээлэгдлээ", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert("Алдаа", "Мэдээлэл илгээхэд алдаа гарлаа");
    }
  }

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row items-center px-4 pt-12 pb-4">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} className="text-foreground" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-foreground ml-4">
          Морь алдагдсан гэж мэдээлэх
        </Text>
      </View>

      <ScrollView className="flex-1 px-4">
        <View className="mb-4">
          <Text className="text-sm font-medium text-foreground mb-1">Тайлбар</Text>
          <TextInput
            className="bg-card border border-border rounded-lg px-4 py-3 text-foreground"
            placeholder="Тайлбар (хүндэтгэл, тэмдэг гэх мэт)"
            placeholderTextColor="rgb(var(--muted-foreground))"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        <View className="mb-4">
          <Text className="text-sm font-medium text-foreground mb-1">Хамгийн сүүлд хаарсан газар</Text>
          <TextInput
            className="bg-card border border-border rounded-lg px-4 py-3 text-foreground"
            placeholder="Хамгийн сүүлд хаарсан газар"
            placeholderTextColor="rgb(var(--muted-foreground))"
            value={locationName}
            onChangeText={setLocationName}
          />
        </View>

        <View className="mb-4">
          <Text className="text-sm font-medium text-foreground mb-1">Холбооны утас</Text>
          <TextInput
            className="bg-card border border-border rounded-lg px-4 py-3 text-foreground"
            placeholder="Холбооны утас"
            placeholderTextColor="rgb(var(--muted-foreground))"
            keyboardType="phone-pad"
            value={contactPhone}
            onChangeText={setContactPhone}
          />
        </View>

        <View className="mb-4">
          <Text className="text-sm font-medium text-foreground mb-1">Амьтан</Text>
          <TextInput
            className="bg-card border border-border rounded-lg px-4 py-3 text-foreground"
            placeholder="Амьтан төрөл"
            placeholderTextColor="rgb(var(--muted-foreground))"
            value={animalType}
            onChangeText={setAnimalType}
          />
        </View>

        <View className="mb-4">
          <Text className="text-sm font-medium text-foreground mb-1">Үүлдэр</Text>
          <TextInput
            className="bg-card border border-border rounded-lg px-4 py-3 text-foreground"
            placeholder="Үүлдэр"
            placeholderTextColor="rgb(var(--muted-foreground))"
            value={breed}
            onChangeText={setBreed}
          />
        </View>

        <View className="mb-4">
          <Text className="text-sm font-medium text-foreground mb-1">Өнгө</Text>
          <TextInput
            className="bg-card border border-border rounded-lg px-4 py-3 text-foreground"
            placeholder="Бүсний өнгө"
            placeholderTextColor="rgb(var(--muted-foreground))"
            value={coatColor}
            onChangeText={setCoatColor}
          />
        </View>

        <TouchableOpacity
          className="bg-primary rounded-lg py-3 items-center mb-8"
          onPress={handleSubmit}
          disabled={reportLostHorse.isPending}
        >
          {reportLostHorse.isPending ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-primary-foreground font-semibold">
              Мэдээлэх
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
