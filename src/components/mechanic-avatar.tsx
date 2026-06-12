import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getMechanicColor, getMechanicInitials } from "@/lib/mechanic-colors";
import { cn } from "@/lib/utils";

interface MechanicAvatarProps {
  mechanic: {
    id: string;
    full_name: string | null;
    avatar_url?: string | null;
  };
  /** Avatar size — matches Avatar component's size prop. Default: "default" */
  size?: "sm" | "default" | "lg";
  /** Additional classes (e.g. custom size like "size-4", "size-5") */
  className?: string;
}

/**
 * Colorized mechanic avatar with deterministic background color.
 * Shows avatar_url image when available, falls back to colored initials.
 */
export function MechanicAvatar({
  mechanic,
  size = "default",
  className,
}: MechanicAvatarProps) {
  const color = getMechanicColor(mechanic.id);
  const initials = getMechanicInitials(mechanic.full_name);

  return (
    <Avatar size={size} className={cn("after:hidden", className)}>
      {mechanic.avatar_url && <AvatarImage src={mechanic.avatar_url} alt="" />}
      <AvatarFallback className={cn("font-medium", color.bg, color.text)}>
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
