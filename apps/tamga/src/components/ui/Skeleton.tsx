import { View, type ViewStyle, type DimensionValue } from "react-native";

interface SkeletonProps {
  width?: DimensionValue;
  height?: DimensionValue;
  rounded?: boolean;
  className?: string;
  style?: ViewStyle;
}

export function Skeleton({
  width,
  height = 16,
  rounded = false,
  className,
  style,
}: SkeletonProps) {
  return (
    <View
      className={`bg-muted animate-pulse ${rounded ? "rounded-full" : "rounded-md"} ${className ?? ""}`}
      style={[{ width, height }, style]}
    />
  );
}
