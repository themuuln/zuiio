import { View, type ViewProps } from "react-native";

export function Card({ className, ...props }: ViewProps) {
  return (
    <View
      className={`bg-card rounded-xl p-4 border border-border ${className ?? ""}`}
      {...props}
    />
  );
}
