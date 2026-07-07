import { forwardRef } from "react";
import { View, Text, StyleSheet, type ViewProps } from "react-native";
import { cn } from "@/lib/utils";

interface CardProps extends ViewProps {}

const Card = forwardRef<View, CardProps>(
  ({ className, ...props }, ref) => {
    return (
      <View
        className={cn(
          "rounded-lg border border-border bg-card p-4",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Card.displayName = "Card";

interface CardHeaderProps extends ViewProps {}

const CardHeader = forwardRef<View, CardHeaderProps>(
  ({ className, ...props }, ref) => {
    return (
      <View
        className={cn("flex flex-col space-y-1.5", className)}
        ref={ref}
        {...props}
      />
    );
  }
);

CardHeader.displayName = "CardHeader";

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}

const CardTitle = ({ children, className }: CardTitleProps) => {
  return (
    <Text
      className={cn(
        "text-lg font-semibold leading-none tracking-tight text-card-foreground",
        className
      )}
    >
      {children}
    </Text>
  );
};

interface CardDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

const CardDescription = ({ children, className }: CardDescriptionProps) => {
  return (
    <Text
      className={cn("text-sm text-muted-foreground", className)}
    >
      {children}
    </Text>
  );
};

interface CardContentProps extends ViewProps {}

const CardContent = forwardRef<View, CardContentProps>(
  ({ className, ...props }, ref) => {
    return (
      <View
        className={cn("pt-0", className)}
        ref={ref}
        {...props}
      />
    );
  }
);

CardContent.displayName = "CardContent";

interface CardFooterProps extends ViewProps {}

const CardFooter = forwardRef<View, CardFooterProps>(
  ({ className, ...props }, ref) => {
    return (
      <View
        className={cn("flex flex-row items-center pt-0", className)}
        ref={ref}
        {...props}
      />
    );
  }
);

CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
