import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const MOCK_HORSES: Record<string, {
  id: string;
  name: string;
  breed: string;
  gender: string;
  birthDate: string;
  color: string;
  owner: string;
  status: string;
}> = {
  "1": {
    id: "1",
    name: "Сүрэнжав",
    breed: "Монгол морь",
    gender: "male",
    birthDate: "2020-03-15",
    color: "Хүрэн",
    owner: "Бат-Эрдэнэ",
    status: "Идэвхтэй",
  },
  "2": {
    id: "2",
    name: "Алтанцэцэг",
    breed: "Ахалхын морь",
    gender: "female",
    birthDate: "2019-07-22",
    color: "Шар",
    owner: "Бат-Эрдэнэ",
    status: "Идэвхтэй",
  },
};

type Tab = "info" | "health" | "training";

export default function HorseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("info");

  const horse = MOCK_HORSES[id ?? "1"];

  if (!horse) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <Text className="text-muted-foreground">Морь олдсонгүй</Text>
      </View>
    );
  }

  const age = new Date().getFullYear() - new Date(horse.birthDate).getFullYear();

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pt-12 pb-4">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} className="text-foreground" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-foreground">Морийн мэдээлэл</Text>
        <TouchableOpacity>
          <Ionicons name="create-outline" size={24} className="text-primary" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-4">
        {/* Hero */}
        <View className="bg-card rounded-2xl p-6 mb-4">
          <Text className="text-2xl font-bold text-foreground mb-1">{horse.name}</Text>
          <Text className="text-muted-foreground mb-4">{horse.breed}</Text>
          <View className="flex-row flex-wrap gap-3">
            <View className="bg-secondary rounded-lg px-3 py-1">
              <Text className="text-secondary-foreground text-sm">{horse.color}</Text>
            </View>
            <View className="bg-secondary rounded-lg px-3 py-1">
              <Text className="text-secondary-foreground text-sm">{age} нас</Text>
            </View>
            <View className="bg-secondary rounded-lg px-3 py-1">
              <Text className="text-secondary-foreground text-sm">
                {horse.gender === "male" ? "Эр" : "Эм"}
              </Text>
            </View>
            <View className="bg-primary/10 rounded-lg px-3 py-1">
              <Text className="text-primary text-sm">{horse.status}</Text>
            </View>
          </View>
        </View>

        {/* Tabs */}
        <View className="flex-row bg-card rounded-xl p-1 mb-4">
          {([
            ["info", "Мэдээлэл"],
            ["health", "Эрүүл мэнд"],
            ["training", "Сургалт"],
          ] as const).map(([key, label]) => (
            <TouchableOpacity
              key={key}
              className={`flex-1 py-2 rounded-lg ${
                activeTab === key ? "bg-primary" : ""
              }`}
              onPress={() => setActiveTab(key)}
            >
              <Text
                className={`text-center font-medium ${
                  activeTab === key
                    ? "text-primary-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        {activeTab === "info" && (
          <View className="bg-card rounded-xl p-4 mb-4">
            {[
              ["Нэр", horse.name],
              ["Угсаа", horse.breed],
              ["Нялхас", horse.birthDate],
              ["Нас", `${age} нас`],
              ["Хүйс", horse.gender === "male" ? "Эр" : "Эм"],
              ["Өнгө", horse.color],
              ["Эзэн", horse.owner],
              ["Төлөв", horse.status],
            ].map(([label, value]) => (
              <View
                key={label}
                className="flex-row justify-between py-2 border-b border-border"
              >
                <Text className="text-muted-foreground">{label}</Text>
                <Text className="text-foreground font-medium">{value}</Text>
              </View>
            ))}
          </View>
        )}

        {activeTab === "health" && (
          <View className="bg-card rounded-xl p-6 items-center mb-4">
            <Ionicons name="medkit-outline" size={48} className="text-muted-foreground" />
            <Text className="text-muted-foreground mt-3">Эрүүл мэндийн мэдээлэл байхгүй</Text>
          </View>
        )}

        {activeTab === "training" && (
          <View className="bg-card rounded-xl p-6 items-center mb-4">
            <Ionicons name="fitness-outline" size={48} className="text-muted-foreground" />
            <Text className="text-muted-foreground mt-3">Сургалтын мэдээлэл байхгүй</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
