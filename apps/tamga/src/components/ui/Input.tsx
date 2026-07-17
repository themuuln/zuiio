import { forwardRef } from "react";
import {
  TextInput,
  Text,
  View,
  type TextInputProps,
} from "react-native";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<TextInput, InputProps>(
  ({ label, error, hint, className, ...props }, ref) => {
    return (
      <View className="mb-4">
        {label && (
          <Text className="text-sm font-medium text-foreground mb-1.5">
            {label}
          </Text>
        )}
        <TextInput
          ref={ref}
          className={`bg-card border rounded-xl px-4 py-3 text-foreground text-base ${
            error
              ? "border-destructive"
              : "border-border"
          } ${props.editable === false ? "opacity-50" : ""} ${className ?? ""}`}
          placeholderTextColor="rgb(var(--muted-foreground))"
          {...props}
        />
        {error && (
          <Text className="text-destructive text-xs mt-1">{error}</Text>
        )}
        {hint && !error && (
          <Text className="text-muted-foreground text-xs mt-1">{hint}</Text>
        )}
      </View>
    );
  }
);

Input.displayName = "Input";
