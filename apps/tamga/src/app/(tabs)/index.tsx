import { View, Text, FlatList, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

interface Horse {
  id: string;
  name: string;
  breed: string;
  gender: "male" | "female";
  birthDate: string;
}

const MOCK_HORSES: Horse[] = [
  { id: "1", name: "Сүрэнжав", breed: "Монгол морь", gender: "male", birthDate: "2020-03-15" },
  { id: "2", name: "Алтанцэцэг", breed: "Ахалхын морь", gender: "female", birthDate: "2019-07-22" },
];

function HorseCard({ horse }: { horse: Horse }) {
  const router = useRouter();
  const age = new Date().getFullYear() - new Date(horse.birthDate).getFullYear();

  return (
    <TouchableOpacity
      className="bg-card rounded-xl p-4 mb-3 border border-border"
      onPress={() => router.push(`/horse/${horse.id}`)}
    >
      <Text className="text-lg font-bold text-foreground">{horse.name}</Text>
      <Text className="text-muted-foreground">
        {horse.breed} · {horse.gender === "male" ? "Эр" : "Эм"} · {age} нас
      </Text>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  return (
    <View className="flex-1 bg-background">
      <View className="px-4 pt-12 pb-4">
        <Text className="text-2xl font-bold text-foreground">Миний морь</Text>
        <Text className="text-muted-foreground">Тамга — Морины менежмент</Text>
      </View>

      {MOCK_HORSES.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="paw-outline" size={64} className="text-muted-foreground" />
          <Text className="text-muted-foreground mt-4 text-center">
            Морь байхгүй байна{"\n"}Морь нэмэх товчийг дарна уу
          </Text>
        </View>
      ) : (
        <FlatList
          data={MOCK_HORSES}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <HorseCard horse={item} />}
          contentContainerClassName="px-4 pb-20"
        />
      )}

      <TouchableOpacity className="absolute bottom-6 right-6 bg-primary w-14 h-14 rounded-full items-center justify-center shadow-lg">
        <Ionicons name="add" size={28} color="white" />
      </TouchableOpacity>
    </View>
  );
}
