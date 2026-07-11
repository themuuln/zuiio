import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  type TouchableOpacityProps,
} from "react-native";

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: "primary" | "secondary" | "destructive";
  loading?: boolean;
}

export function Button({
  title,
  variant = "primary",
  loading,
  disabled,
  className,
  ...props
}: ButtonProps) {
  const bg = {
    primary: "bg-primary",
    secondary: "bg-secondary",
    destructive: "bg-destructive",
  }[variant];

  const fg = {
    primary: "text-primary-foreground",
    secondary: "text-secondary-foreground",
    destructive: "text-destructive-foreground",
  }[variant];

  return (
    <TouchableOpacity
      className={`${bg} rounded-xl py-3 items-center ${disabled || loading ? "opacity-50" : ""} ${className ?? ""}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color="white" />
      ) : (
        <Text className={`${fg} font-semibold`}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}
