import { View, Text } from "react-native";

export default function MarketScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-background">
      <Text className="text-lg font-semibold text-foreground">
        Морины зах
      </Text>
      <Text className="text-muted-foreground mt-2">
        Морин худалдах, худалдан авах
      </Text>
    </View>
  );
}
