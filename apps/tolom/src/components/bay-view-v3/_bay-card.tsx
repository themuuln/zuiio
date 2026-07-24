"use client";

import { BAY_STATUS_META, type Bay } from "./types";

// ─── BayCard ──────────────────────────────────────────────
// A single bay's visual representation.
// Uses layout-builder Stack primitive for vertical internal rhythm.
// Status drives the entire card: border, background, and action set.

interface BayCardProps {
  bay: Bay;
  isSelected?: boolean;
  onSelect?: (bayId: string) => void;
  onAction?: (bayId: string, action: string) => void;
}

export function BayCard({ bay, isSelected, onSelect, onAction }: BayCardProps) {
  const meta = BAY_STATUS_META[bay.status];
  const progress =
    bay.status === "in-progress" && bay.estimatedMinutes
      ? Math.min((bay.elapsedMinutes / bay.estimatedMinutes) * 100, 100)
      : null;

  return (
    <button
      type="button"
      onClick={() => onSelect?.(bay.id)}
      className={`
        group relative flex flex-col rounded-xl border p-4
        text-left transition-all duration-200
        hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
        ${meta.bg} ${meta.ring} ring-1
        ${isSelected ? "ring-2 ring-primary shadow-md" : ""}
        ${bay.status === "empty" ? "border-dashed" : "border-solid"}
      `}
    >
      {/* ── Header: Bay Number + Status ────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold tracking-tight">{bay.number}</span>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${meta.color}`}
          >
            <span aria-hidden="true">{meta.icon}</span>
            {meta.label}
          </span>
        </div>

        {/* Elapsed time badge (in-progress only) */}
        {progress !== null && (
          <span className="text-xs tabular-nums text-muted-foreground">
            {(() => {
              const h = Math.floor(bay.elapsedMinutes / 60);
              const m = bay.elapsedMinutes % 60;
              return h > 0 ? `${h}ц ${m}м` : `${m}м`;
            })()}
          </span>
        )}
      </div>

      {/* ── Progress Bar (in-progress only) ──────────────── */}
      {progress !== null && (
        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full bg-blue-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* ── Vehicle Info ─────────────────────────────────── */}
      {bay.vehicle ? (
        <div className="mt-3 space-y-1">
          <p className="truncate text-sm font-medium leading-tight">
            {bay.vehicle.make} {bay.vehicle.model}
          </p>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded bg-background/80 px-1.5 py-0.5 font-mono text-xs font-semibold">
              {bay.vehicle.plateNumber}
            </span>
            <span className="text-xs text-muted-foreground">
              {bay.vehicle.year} · {bay.vehicle.color}
            </span>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex h-10 items-center text-sm text-muted-foreground">
          Машин байхгүй
        </div>
      )}

      {/* ── Mechanics Row ────────────────────────────────── */}
      {bay.mechanics.length > 0 && (
        <div className="mt-3 flex items-center gap-1.5">
          {bay.mechanics.map((m) => (
            <span
              key={m.id}
              className="inline-flex items-center gap-1 rounded-full bg-background/80 px-2 py-0.5 text-xs"
            >
              <span className="inline-block size-1.5 rounded-full bg-primary" />
              {m.name}
            </span>
          ))}
        </div>
      )}

      {/* ── Services Summary ─────────────────────────────── */}
      {bay.services.length > 0 && (
        <div className="mt-auto pt-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {bay.services.filter((s) => s.status === "completed").length}/
              {bay.services.length} үйлчилгээ
            </span>
            <span className="font-medium tabular-nums">
              ₮
              {new Intl.NumberFormat("mn-MN").format(
                bay.services.reduce((sum, s) => sum + s.price, 0),
              )}
            </span>
          </div>
        </div>
      )}

      {/* ── Quick Actions (visible on hover) ─────────────── */}
      <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        {bay.status === "empty" && (
          <ActionChip
            label="Машин оруулах"
            onClick={(e) => {
              e.stopPropagation();
              onAction?.(bay.id, "assign-vehicle");
            }}
          />
        )}
        {bay.status === "in-progress" && (
          <ActionChip
            label="Дуусгах"
            onClick={(e) => {
              e.stopPropagation();
              onAction?.(bay.id, "complete");
            }}
          />
        )}
        {bay.status === "ready-for-pickup" && (
          <ActionChip
            label="Олгох"
            onClick={(e) => {
              e.stopPropagation();
              onAction?.(bay.id, "pickup");
            }}
          />
        )}
      </div>
    </button>
  );
}

// ─── ActionChip ───────────────────────────────────────────

function ActionChip({
  label,
  onClick,
}: {
  label: string;
  onClick: (e: React.MouseEvent) => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
    >
      {label}
    </button>
  );
}
