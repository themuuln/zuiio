import { Switch as RNSwitch, Platform } from "react-native";

interface SwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  label?: string;
  nativeID?: string;
}

export function Switch({
  value,
  onValueChange,
  disabled,
  label,
  nativeID,
}: SwitchProps) {
  return (
    <RNSwitch
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      nativeID={nativeID}
      trackColor={{
        false: "rgb(var(--input))",
        true: "rgb(var(--primary))",
      }}
      thumbColor={
        Platform.OS === "ios"
          ? "white"
          : value
            ? "rgb(var(--primary-foreground))"
            : "rgb(var(--muted-foreground))"
      }
      ios_backgroundColor="rgb(var(--input))"
    />
  );
}
