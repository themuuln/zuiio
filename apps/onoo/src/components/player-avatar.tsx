interface PlayerAvatarProps {
  photoUrl?: string | null;
  name: string;
  primaryColor?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
}

const SIZE_MAP = {
  sm: 32,
  md: 48,
  lg: 64,
  xl: 96,
} as const;

const TEXT_SIZE_MAP = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
  xl: "text-2xl",
} as const;

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!)
    .join("")
    .toUpperCase();
}

export function PlayerAvatar({
  photoUrl,
  name,
  primaryColor,
  size = "md",
}: PlayerAvatarProps) {
  const px = SIZE_MAP[size];

  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={name}
        width={px}
        height={px}
        className="shrink-0 rounded-full object-cover"
      />
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full font-bold text-white ${TEXT_SIZE_MAP[size]}`}
      style={{
        width: px,
        height: px,
        backgroundColor: primaryColor || "#1e293b",
      }}
      aria-hidden="true"
    >
      {getInitials(name)}
    </div>
  );
}
