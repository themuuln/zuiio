import Image from "next/image";
import { cn } from "@/lib/utils";

function Avatar({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="avatar"
      className={cn(
        "relative flex size-8 shrink-0 overflow-hidden rounded-full",
        className,
      )}
      {...props}
    />
  );
}

function AvatarImage({
  className,
  alt = "",
  ...props
}: Omit<React.ComponentProps<typeof Image>, "fill" | "sizes">) {
  return (
    <Image
      data-slot="avatar-image"
      className={cn("aspect-square size-full object-cover", className)}
      fill
      sizes="(max-width: 768px) 2rem, 2rem"
      alt={alt}
      {...props}
    />
  );
}

function AvatarFallback({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="avatar-fallback"
      className={cn(
        "flex size-full items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

export { Avatar, AvatarImage, AvatarFallback };
