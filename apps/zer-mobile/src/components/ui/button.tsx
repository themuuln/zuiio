import { cva, type VariantProps } from "class-variance-authority";
import type { ReactNode } from "react";
import {
  Text,
  TouchableOpacity,
  type TouchableOpacityProps,
} from "react-native";
import { cn } from "@/lib/utils";

const buttonVariants = cva("flex-row items-center justify-center", {
  variants: {
    variant: {
      default: "bg-primary",
      destructive: "bg-destructive",
      outline: "border border-border bg-transparent",
      secondary: "bg-secondary",
      ghost: "bg-transparent",
      link: "bg-transparent",
    },
    size: {
      default: "h-10 px-4 py-2",
      sm: "h-8 px-3",
      lg: "h-12 px-6",
      icon: "h-10 w-10",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
});

interface ButtonProps
  extends TouchableOpacityProps,
    VariantProps<typeof buttonVariants> {
  title?: string;
  children?: ReactNode;
}

function Button({
  className,
  variant,
  size,
  title,
  children,
  ...props
}: ButtonProps) {
  return (
    <TouchableOpacity
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {title && (
        <Text className="text-primary-foreground font-semibold">{title}</Text>
      )}
      {children}
    </TouchableOpacity>
  );
}

Button.displayName = "Button";

export { Button, buttonVariants };
