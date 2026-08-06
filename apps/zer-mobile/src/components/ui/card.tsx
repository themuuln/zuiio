import { forwardRef } from "react";
import { Text, View, type ViewProps } from "react-native";
import { cn } from "@/lib/utils";

const Card = forwardRef<View, ViewProps>(({ className, ...props }, ref) => (
  <View
    ref={ref}
    className={cn("rounded-xl border border-border bg-card", className)}
    {...props}
  />
));
Card.displayName = "Card";

const CardHeader = forwardRef<View, ViewProps>(
  ({ className, ...props }, ref) => (
    <View ref={ref} className={cn("p-4 pb-2", className)} {...props} />
  ),
);
CardHeader.displayName = "CardHeader";

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}

const CardTitle = ({ children, className }: CardTitleProps) => (
  <Text className={cn("text-base font-bold text-foreground", className)}>
    {children}
  </Text>
);

interface CardDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

const CardDescription = ({ children, className }: CardDescriptionProps) => (
  <Text className={cn("text-sm text-muted-foreground", className)}>
    {children}
  </Text>
);

const CardContent = forwardRef<View, ViewProps>(
  ({ className, ...props }, ref) => (
    <View ref={ref} className={cn("p-4 pt-2", className)} {...props} />
  ),
);
CardContent.displayName = "CardContent";

const CardFooter = forwardRef<View, ViewProps>(
  ({ className, ...props }, ref) => (
    <View ref={ref} className={cn("p-4 pt-0", className)} {...props} />
  ),
);
CardFooter.displayName = "CardFooter";

export {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
};
