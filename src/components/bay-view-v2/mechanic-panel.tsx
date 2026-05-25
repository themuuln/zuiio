"use client";

import { useDraggable } from "@dnd-kit/core";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import type { Profile } from "@/lib/types";
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
        "flex items-center gap-2 border border-border/60 bg-card px-3 py-2 cursor-grab select-none transition-colors touch-manipulation",
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
              "size-1.5  shrink-0",
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
    <Card size="sm" className="bg-card/90">
      <CardHeader className="gap-2 border-b border-border/40">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm">Mechanic Roster</CardTitle>
          {mechanics.length > 0 && (
            <Badge variant="outline">{mechanics.length}</Badge>
          )}
        </div>
        <CardDescription className="text-[11px]">
          Drag a mechanic onto a bay to assign work.
        </CardDescription>
      </CardHeader>

      <CardContent className="px-3 py-3">
        {mechanics.length === 0 ? (
          <Empty className="border border-dashed border-border/60 py-8">
            <EmptyHeader>
              <EmptyTitle>No mechanics available</EmptyTitle>
              <EmptyDescription>
                Add or register mechanics to start assigning work from Bay View.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="flex flex-col gap-3">
            {activeMechanics.length > 0 && (
              <div>
                <div className="mb-1 flex items-center gap-2 px-0.5">
                  <p className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground/50">
                    Working
                  </p>
                  <Badge variant="secondary" className="h-5 px-1.5 text-[9px]">
                    {activeMechanics.length}
                  </Badge>
                </div>
                <div className="flex flex-col gap-1">
                  {activeMechanics.map((m) => (
                    <MechanicItem key={m.id} mechanic={m} />
                  ))}
                </div>
              </div>
            )}
            {availableMechanics.length > 0 && (
              <div>
                <div className="mb-1 flex items-center gap-2 px-0.5">
                  <p className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground/50">
                    Free
                  </p>
                  <Badge variant="outline" className="h-5 px-1.5 text-[9px]">
                    {availableMechanics.length}
                  </Badge>
                </div>
                <div className="flex flex-col gap-1">
                  {availableMechanics.map((m) => (
                    <MechanicItem key={m.id} mechanic={m} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
