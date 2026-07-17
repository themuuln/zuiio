import { View, type ViewProps } from "react-native";

interface ProgressProps extends ViewProps {
  value: number; // 0-100
  max?: number;
}

export function Progress({
  value,
  max = 100,
  className,
  ...props
}: ProgressProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <View
      className={`h-2 bg-secondary rounded-full overflow-hidden ${className ?? ""}`}
      {...props}
    >
      <View
        className="h-full bg-primary rounded-full"
        style={{ width: `${pct}%` }}
      />
    </View>
  );
}
