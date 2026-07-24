import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, subtitle, action }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center px-6 py-12">
      <Ionicons name={icon} size={64} className="text-muted-foreground" />
      <Text className="text-muted-foreground mt-4 text-center font-medium text-lg">
        {title}
      </Text>
      {subtitle && (
        <Text className="text-muted-foreground mt-2 text-center text-sm">
          {subtitle}
        </Text>
      )}
      {action && <View className="mt-6">{action}</View>}
    </View>
  );
}
