import { TouchableOpacity, Text } from "react-native";

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  variant?: "default" | "outline";
}

export function Chip({
  label,
  selected = false,
  onPress,
  variant = "default",
}: ChipProps) {
  const bg = selected
    ? "bg-primary"
    : variant === "outline"
      ? "bg-transparent border border-border"
      : "bg-secondary";

  const text = selected
    ? "text-primary-foreground"
    : "text-secondary-foreground";

  return (
    <TouchableOpacity
      className={`rounded-full px-3 py-1.5 ${bg}`}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text className={`text-sm font-medium ${text}`}>{label}</Text>
    </TouchableOpacity>
  );
}
