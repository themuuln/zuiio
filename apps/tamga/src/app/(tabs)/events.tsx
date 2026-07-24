import { View, Text } from "react-native";

export default function EventsScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-background">
      <Text className="text-lg font-semibold text-foreground">
        Эвентүүд
      </Text>
      <Text className="text-muted-foreground mt-2">
        Уралдаан, үзэсгэлэн, сургалт
      </Text>
    </View>
  );
}
