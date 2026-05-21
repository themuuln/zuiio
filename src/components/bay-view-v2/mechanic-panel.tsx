"use client";

import { useDraggable } from "@dnd-kit/core";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { Profile } from "@/lib/database.types";
import { cn } from "@/lib/utils";

interface MechanicItemProps {
  mechanic: Profile & { current_jobs: number };
}

function MechanicItem({ mechanic }: MechanicItemProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `mechanic-${mechanic.id}`,
      data: { type: "mechanic", mechanicId: mechanic.id },
    });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 50,
      }
    : undefined;

  const initials = mechanic.full_name
    ? mechanic.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  const jobCount = mechanic.current_jobs;
  const isAvailable = jobCount === 0;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={style}
      className={cn(
        "flex items-center gap-2 rounded-md border border-border/60 bg-card px-2 py-1.5 cursor-grab select-none transition-colors touch-manipulation",
        isDragging && "opacity-50 shadow-xl z-50",
        !isDragging && "hover:border-border hover:bg-muted/20",
      )}
    >
      <Avatar className="size-6 shrink-0">
        <AvatarFallback className="text-[8px] bg-primary/8 text-primary font-medium">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-[11px] font-medium truncate leading-tight text-foreground/90">
            {mechanic.full_name ?? "Unknown"}
          </p>
          <span
            className={cn(
              "size-1.5 rounded-full shrink-0",
              isAvailable ? "bg-emerald-500" : "bg-amber-400",
            )}
          />
        </div>
        <p className="text-[9px] text-muted-foreground/60 truncate leading-tight">
          {isAvailable ? "Available" : `${jobCount} active`}
        </p>
      </div>
    </div>
  );
}

interface MechanicPanelProps {
  mechanics: (Profile & { current_jobs: number })[];
}

export function MechanicPanel({ mechanics }: MechanicPanelProps) {
  const activeMechanics = mechanics.filter((m) => m.current_jobs > 0);
  const availableMechanics = mechanics.filter((m) => m.current_jobs === 0);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between px-0.5">
        <span className="text-xs font-semibold text-foreground/80">Mechanic Roster</span>
        {mechanics.length > 0 && (
          <span className="text-[9px] text-muted-foreground/50">{mechanics.length} total</span>
        )}
      </div>

      {mechanics.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-4 text-center text-muted-foreground/60 rounded-lg border border-dashed">
          <p className="text-[10px]">No mechanics available</p>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {activeMechanics.length > 0 && (
            <div>
              <p className="text-[9px] font-medium text-muted-foreground/40 uppercase tracking-wider mb-1 px-0.5">
                Working — {activeMechanics.length}
              </p>
              <div className="flex flex-col gap-1">
                {activeMechanics.map((m) => (
                  <MechanicItem key={m.id} mechanic={m} />
                ))}
              </div>
            </div>
          )}
          {availableMechanics.length > 0 && (
            <div>
              <p className="text-[9px] font-medium text-muted-foreground/40 uppercase tracking-wider mb-1 px-0.5">
                Free — {availableMechanics.length}
              </p>
              <div className="flex flex-col gap-1">
                {availableMechanics.map((m) => (
                  <MechanicItem key={m.id} mechanic={m} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
