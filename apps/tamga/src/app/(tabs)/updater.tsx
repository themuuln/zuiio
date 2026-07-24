import { View, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function UpdaterScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, paddingTop: insets.top + 16, paddingHorizontal: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: "bold" }}>Шинэчлэлт</Text>
      <Text style={{ marginTop: 8, color: "#666" }}>Удахгүй...</Text>
    </View>
  );
}
