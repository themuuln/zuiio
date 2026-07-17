import { View, Text } from "react-native";

interface InfoRowProps {
  label: string;
  value: string | number | null | undefined;
}

export function InfoRow({ label, value }: InfoRowProps) {
  return (
    <View className="flex-row justify-between py-2.5 border-b border-border">
      <Text className="text-muted-foreground">{label}</Text>
      <Text className="text-foreground font-medium">
        {value ?? "—"}
      </Text>
    </View>
  );
}
