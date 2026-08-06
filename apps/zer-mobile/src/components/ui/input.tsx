import { forwardRef } from "react";
import { TextInput, type TextInputProps } from "react-native";
import { cn } from "@/lib/utils";

const Input = forwardRef<TextInput, TextInputProps>(
  ({ className, ...props }, ref) => {
    return (
      <TextInput
        className={cn(
          "h-10 border border-border bg-background px-3 py-2 text-sm text-foreground",
          "placeholder:text-muted-foreground",
          "disabled:opacity-50",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";

export { Input };
