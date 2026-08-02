import { Pressable, Text, View } from "react-native";

interface QuantityStepperProps {
  quantity: number;
  onDecrement: () => void;
  onIncrement: () => void;
}

export function QuantityStepper({
  quantity,
  onDecrement,
  onIncrement,
}: QuantityStepperProps) {
  return (
    <View className="flex-row items-center gap-2">
      <Pressable
        onPress={onDecrement}
        className="h-8 w-8 items-center justify-center rounded-md border border-border bg-secondary active:opacity-70"
        hitSlop={8}
      >
        <Text className="text-base font-bold text-foreground">−</Text>
      </Pressable>
      <Text className="min-w-8 text-center text-sm font-semibold tabular-nums text-foreground">
        {quantity}
      </Text>
      <Pressable
        onPress={onIncrement}
        className="h-8 w-8 items-center justify-center rounded-md border border-border bg-secondary active:opacity-70"
        hitSlop={8}
      >
        <Text className="text-base font-bold text-foreground">+</Text>
      </Pressable>
    </View>
  );
}
