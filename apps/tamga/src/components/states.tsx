import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <View className="flex-1 items-center justify-center px-6 py-12">
      <Ionicons name="alert-circle-outline" size={64} className="text-destructive" />
      <Text className="text-destructive mt-4 text-center font-medium">
        {message || "Алдаа гарлаа"}
      </Text>
      <Text className="text-muted-foreground mt-2 text-center text-sm">
        Холболт шалгаж, дахин оролдоно уу
      </Text>
      {onRetry && (
        <TouchableOpacity
          onPress={onRetry}
          className="mt-4 bg-primary px-6 py-3 rounded-lg"
        >
          <Text className="text-primary-foreground font-semibold">Дахин оролдох</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export function EmptyState({
  icon,
  title,
  subtitle,
}: {
  icon: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <View className="flex-1 items-center justify-center px-6 py-12">
      <Ionicons name={icon as any} size={64} className="text-muted-foreground" />
      <Text className="text-muted-foreground mt-4 text-center font-medium">{title}</Text>
      {subtitle && (
        <Text className="text-muted-foreground mt-2 text-center text-sm">{subtitle}</Text>
      )}
    </View>
  );
}

export function LoadingState({ text }: { text?: string }) {
  return (
    <View className="flex-1 items-center justify-center">
      <Ionicons name="sync" size={32} className="text-primary animate-spin" />
      <Text className="text-muted-foreground mt-4">{text || "Ачаалж байна..."}</Text>
    </View>
  );
}
