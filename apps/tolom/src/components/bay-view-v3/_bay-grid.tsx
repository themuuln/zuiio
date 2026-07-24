"use client";

import { BayCard } from "./_bay-card";
import type { Bay } from "./types";

// ─── BayGrid ──────────────────────────────────────────────
// Responsive grid of bay cards.
// Uses layout-builder: Auto-fill Grid primitive.
// Cards auto-size: minimum 280px, fill available space.
// On mobile → 1 column. On tablet → 2. On desktop → 3+.

interface BayGridProps {
  bays: Bay[];
  selectedBayId?: string | null;
  onSelectBay?: (bayId: string) => void;
  onBayAction?: (bayId: string, action: string) => void;
}

export function BayGrid({
  bays,
  selectedBayId,
  onSelectBay,
  onBayAction,
}: BayGridProps) {
  if (bays.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
        <span className="text-3xl text-muted-foreground" aria-hidden="true">
          ◻
        </span>
        <p className="mt-2 text-sm font-medium text-muted-foreground">
          Хүсэлтийн дагуу бэй олдсонгүй
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Шүүлтүүрийг өөрчилж үзнэ үү
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {bays.map((bay) => (
        <BayCard
          key={bay.id}
          bay={bay}
          isSelected={bay.id === selectedBayId}
          onSelect={onSelectBay}
          onAction={onBayAction}
        />
      ))}
    </div>
  );
}
