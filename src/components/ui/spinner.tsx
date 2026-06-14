import { SpinnerIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <output aria-label="Loading" className="contents">
      <SpinnerIcon
        className={cn("size-4 animate-spin", className)}
        {...props}
      />
    </output>
  );
}

export { Spinner };
