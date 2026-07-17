import { View, Text, Image } from "react-native";

interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: { container: "w-8 h-8", text: "text-xs" },
  md: { container: "w-12 h-12", text: "text-sm" },
  lg: { container: "w-20 h-20", text: "text-xl" },
} as const;


function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}
function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function stringToColor(str: string): string {
  let hash = 0;
  for (const ch of str) {
    hash = ch.charCodeAt(0) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return hslToHex(hue, 55, 45);
}

export function Avatar({ uri, name = "", size = "md" }: AvatarProps) {
  const s = sizeMap[size];

  if (uri) {
    return (
      <Image
        source={{ uri }}
        className={`${s.container} rounded-full`}
        resizeMode="cover"
      />
    );
  }

  return (
    <View
      className={`${s.container} rounded-full items-center justify-center`}
      style={{ backgroundColor: stringToColor(name) }}
    >
      <Text className={`${s.text} font-bold text-white`}>
        {getInitials(name)}
      </Text>
    </View>
  );
}
