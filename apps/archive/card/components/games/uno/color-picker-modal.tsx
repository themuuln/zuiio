"use client";

import { type CardColor } from "@/lib/game-engine/types";
import { cn } from "@/lib/utils";

interface ColorPickerModalProps {
  isOpen: boolean;
  onSelectColor: (color: CardColor) => void;
  onCancel?: () => void;
  cardValue?: string;
}

const COLORS: Array<{
  color: CardColor;
  label: string;
  bgClass: string;
  hoverClass: string;
}> = [
  { color: "red", label: "Red", bgClass: "bg-red-500", hoverClass: "hover:bg-red-600" },
  { color: "blue", label: "Blue", bgClass: "bg-blue-500", hoverClass: "hover:bg-blue-600" },
  { color: "green", label: "Green", bgClass: "bg-green-500", hoverClass: "hover:bg-green-600" },
  { color: "yellow", label: "Yellow", bgClass: "bg-yellow-400", hoverClass: "hover:bg-yellow-500" },
];

/**
 * Color picker modal for Wild and Wild Draw 4 cards.
 * Shows 4 color options (red, blue, green, yellow) in a grid.
 */
export function ColorPickerModal({
  isOpen,
  onSelectColor,
  onCancel,
  cardValue,
}: ColorPickerModalProps) {
  if (!isOpen) return null;

  const label = cardValue === "wild4" ? "Wild Draw 4" : "Wild";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="mx-4 w-full max-w-xs rounded-2xl bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200 dark:bg-gray-900">
        <div className="mb-6 text-center">
          <h2 className="text-lg font-bold">Choose a Color</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Pick the active color for your {label} card
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {COLORS.map(({ color, label, bgClass, hoverClass }) => (
            <button
              key={color}
              onClick={() => onSelectColor(color)}
              className={cn(
                "flex h-20 items-center justify-center rounded-xl text-lg font-bold text-white shadow-md transition-all active:scale-95",
                bgClass,
                hoverClass
              )}
              aria-label={`Select ${label}`}
            >
              {label}
            </button>
          ))}
        </div>

        {onCancel && (
          <button
            onClick={onCancel}
            className="mt-4 w-full rounded-lg py-2 text-sm text-muted-foreground transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
