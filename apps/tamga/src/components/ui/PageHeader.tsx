import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
}

export function PageHeader({
  title,
  subtitle,
  showBack = false,
  rightAction,
}: PageHeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-row items-center justify-between px-4 pb-4" style={{ paddingTop: insets.top + 12 }}>
      <View className="flex-row items-center gap-3">
        {showBack && (
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} className="text-foreground" />
          </TouchableOpacity>
        )}
        <View>
          <Text className="text-xl font-bold text-foreground">{title}</Text>
          {subtitle && (
            <Text className="text-muted-foreground text-sm">{subtitle}</Text>
          )}
        </View>
      </View>
      {rightAction}
    </View>
  );
}
