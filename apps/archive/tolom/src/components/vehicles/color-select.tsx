import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const COMMON_CAR_COLORS = [
  { label: "White", hex: "#ffffff" },
  { label: "Black", hex: "#1a1a1a" },
  { label: "Silver", hex: "#c0c0c0" },
  { label: "Gray", hex: "#808080" },
  { label: "Blue", hex: "#1565c0" },
  { label: "Red", hex: "#c62828" },
  { label: "Green", hex: "#2e7d32" },
  { label: "Yellow", hex: "#f9a825" },
  { label: "Brown", hex: "#6d4c41" },
  { label: "Beige", hex: "#d7ccc8" },
  { label: "Orange", hex: "#ef6c00" },
  { label: "Purple", hex: "#7b1fa2" },
  { label: "Navy", hex: "#0d47a1" },
  { label: "Gold", hex: "#ff8f00" },
  { label: "Teal", hex: "#00695c" },
] as const;

function getHex(label: string): string {
  return (
    COMMON_CAR_COLORS.find((c) => c.label.toLowerCase() === label.toLowerCase())
      ?.hex ?? ""
  );
}

interface ColorSelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function ColorSelect({
  value,
  onChange,
  placeholder = "Select color",
  className,
}: ColorSelectProps) {
  const hex = getHex(value);

  return (
    <div className={cn("relative w-full", className)}>
      {hex && (
        <span
          className="absolute left-2 top-1/2 z-10 size-4 -translate-y-1/2 rounded-sm border border-border"
          style={{ backgroundColor: hex }}
          aria-hidden="true"
        />
      )}
      <Select
        value={value || null}
        onValueChange={(val) => onChange(val ?? "")}
      >
        <SelectTrigger className={cn(hex && "pl-8")}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {COMMON_CAR_COLORS.map((color) => (
            <SelectItem key={color.label} value={color.label}>
              {color.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
