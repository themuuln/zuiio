import { View, ActivityIndicator, Text } from "react-native";

export function Loading({ message = "Ачаалж байна..." }: { message?: string }) {
  return (
    <View className="flex-1 items-center justify-center bg-background">
      <ActivityIndicator size="large" className="text-primary" />
      <Text className="text-muted-foreground mt-4">{message}</Text>
    </View>
  );
}
