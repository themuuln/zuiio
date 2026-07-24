import { TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface FABProps {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  className?: string;
}

export function FAB({ icon, onPress, className }: FABProps) {
  return (
    <TouchableOpacity
      className={`absolute bottom-6 right-6 bg-primary w-14 h-14 rounded-full items-center justify-center shadow-lg ${className ?? ""}`}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Ionicons name={icon} size={28} color="white" />
    </TouchableOpacity>
  );
}
