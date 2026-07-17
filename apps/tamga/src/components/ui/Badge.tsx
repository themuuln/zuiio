import { Text, View, type ViewProps } from "react-native";

interface BadgeProps extends ViewProps {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning";
  children: React.ReactNode;
}

const variantStyles = {
  default: "bg-primary",
  secondary: "bg-secondary",
  destructive: "bg-destructive",
  outline: "border border-border bg-transparent",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
} as const;

const textStyles = {
  default: "text-primary-foreground",
  secondary: "text-secondary-foreground",
  destructive: "text-destructive-foreground",
  outline: "text-foreground",
  success: "text-white",
  warning: "text-white",
} as const;

export function Badge({
  variant = "default",
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <View
      className={`rounded-full px-2.5 py-0.5 self-start ${variantStyles[variant]} ${className ?? ""}`}
      {...props}
    >
      <Text className={`text-xs font-medium ${textStyles[variant]}`}>
        {children}
      </Text>
    </View>
  );
}
