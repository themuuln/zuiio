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
import { useCreateListing } from "@/hooks/useListingMutations";
import { useHorses } from "@/hooks/useHorses";

const HARDCODED_USER_ID = "11111111-1111-1111-1111-111111111111";

const listingTypeOptions = [
  { value: "sale", label: "Зарах" },
  { value: "lease", label: "Хөлслөх" },
  { value: "stud", label: "Үржүүлэх" },
];

export default function NewListingScreen() {
  const router = useRouter();
  const createListing = useCreateListing();
  const { data: horses = [] } = useHorses(HARDCODED_USER_ID);

  const [selectedHorse, setSelectedHorse] = useState("");
  const [listingType, setListingType] = useState("sale");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");

  async function handleSubmit() {
    if (!selectedHorse) {
      Alert.alert("Алдаа", "Морь сонгоно уу");
      return;
    }

    try {
      await createListing.mutateAsync({
        horse_id: selectedHorse,
        listing_type: listingType,
        price_mnt: price ? Number(price) : null,
        description: description.trim() || undefined,
        location: location.trim() || undefined,
      });
      Alert.alert("Амжилттай", "Зар нэмэгдлээ", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert("Алдаа", "Зар нэмэхэд алдаа гарлаа");
    }
  }

  if (horses.length === 0) {
    return (
      <View className="flex-1 bg-background">
        <View className="flex-row items-center justify-between px-4 pt-12 pb-4">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} className="text-foreground" />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-foreground">Шинэ зар</Text>
          <View className="w-6" />
        </View>
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="paw-outline" size={64} className="text-muted-foreground" />
          <Text className="text-muted-foreground mt-4 text-center">
            Морь байхгүй байна. Эхлээд морь нэмнэ үү.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row items-center justify-between px-4 pt-12 pb-4">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} className="text-foreground" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-foreground">Шинэ зар</Text>
        <View className="w-6" />
      </View>

      <ScrollView className="flex-1 px-4">
        {/* Horse selection */}
        <View className="bg-card rounded-2xl p-4 mb-4">
          <Text className="text-sm font-semibold text-muted-foreground mb-3">
            Морь сонгох *
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {horses.map((horse) => (
              <TouchableOpacity
                key={horse.id}
                className={`rounded-lg px-4 py-3 ${
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

        {/* Listing type */}
        <View className="bg-card rounded-2xl p-4 mb-4">
          <Text className="text-sm font-semibold text-muted-foreground mb-3">
            Зарын төрөл *
          </Text>
          <View className="flex-row gap-2">
            {listingTypeOptions.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                className={`flex-1 rounded-lg py-3 items-center ${
                  listingType === opt.value ? "bg-primary" : "bg-secondary"
                }`}
                onPress={() => setListingType(opt.value)}
              >
                <Text
                  className={`font-medium ${
                    listingType === opt.value
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

        {/* Price */}
        <View className="bg-card rounded-2xl p-4 mb-4">
          <Text className="text-sm font-semibold text-muted-foreground mb-3">
            Үнэ (₮)
          </Text>
          <TextInput
            className="bg-secondary rounded-lg px-4 py-3 text-foreground"
            placeholder="Тухайн болсон үнэ"
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
            value={price}
            onChangeText={setPrice}
          />
        </View>

        {/* Description */}
        <View className="bg-card rounded-2xl p-4 mb-4">
          <Text className="text-sm font-semibold text-muted-foreground mb-3">
            Тайлбар
          </Text>
          <TextInput
            className="bg-secondary rounded-lg px-4 py-3 text-foreground"
            placeholder="Морины талаархи мэдээлэл..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            value={description}
            onChangeText={setDescription}
          />
        </View>

        {/* Location */}
        <View className="bg-card rounded-2xl p-4 mb-4">
          <Text className="text-sm font-semibold text-muted-foreground mb-3">
            Байршил
          </Text>
          <TextInput
            className="bg-secondary rounded-lg px-4 py-3 text-foreground"
            placeholder="Хаана байна вэ?"
            placeholderTextColor="#9CA3AF"
            value={location}
            onChangeText={setLocation}
          />
        </View>

        <TouchableOpacity
          className="bg-primary rounded-xl py-4 items-center mb-8"
          onPress={handleSubmit}
          disabled={createListing.isPending}
        >
          {createListing.isPending ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-primary-foreground font-bold text-lg">
              Зар нэмэх
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
