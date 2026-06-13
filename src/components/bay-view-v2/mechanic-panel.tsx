"use client";

import { useDraggable } from "@dnd-kit/core";
import { UserPlus } from "lucide-react";
import { useTranslations } from "next-intl";
import React from "react";
import { MechanicAvatar } from "@/components/mechanic-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Typography } from "@/components/ui/typography";
import type { Profile } from "@/lib/types";
import { cn } from "@/lib/utils";

interface MechanicItemProps {
  mechanic: Profile & { current_jobs: number };
}

function MechanicItem({ mechanic }: MechanicItemProps) {
  const t = useTranslations("bayView");
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
      <MechanicAvatar mechanic={mechanic} className="size-6 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Typography.Text className="text-xs font-medium truncate leading-tight text-foreground/90">
            {mechanic.full_name ?? t("unknownCustomer")}
          </Typography.Text>
          <span
            className={cn(
              "size-1.5  shrink-0",
              isAvailable ? "bg-emerald-500" : "bg-emerald-400",
            )}
          />
        </div>
        <Typography.Muted className="text-xs text-muted-foreground/60 truncate leading-tight">
          {isAvailable
            ? t("availableStatus")
            : t("activeJobsCount", { count: jobCount })}
        </Typography.Muted>
      </div>
    </div>
  );
}

interface MechanicPanelProps {
  mechanics: (Profile & { current_jobs: number })[];
}

export const MechanicPanel = React.memo(function MechanicPanel({
  mechanics,
}: MechanicPanelProps) {
  const t = useTranslations("bayView");
  const activeMechanics = mechanics.filter((m) => m.current_jobs > 0);
  const availableMechanics = mechanics.filter((m) => m.current_jobs === 0);

  return (
    <Card size="sm" className="ring-0">
      <CardHeader className="gap-2 border-b border-border/40">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm">{t("mechanicRoster")}</CardTitle>
          {mechanics.length > 0 && (
            <Badge variant="outline">{mechanics.length}</Badge>
          )}
        </div>
        <CardDescription className="text-xs">
          {t("dragMechanicToBay")}
        </CardDescription>
      </CardHeader>

      <CardContent className="px-3 py-3">
        {mechanics.length === 0 ? (
          <Empty className="border border-dashed border-border/60 py-8">
            <EmptyHeader>
              <EmptyTitle>{t("noMechanics")}</EmptyTitle>
              <EmptyDescription>
                {t("mechanicEmptyDescription")}
              </EmptyDescription>
            </EmptyHeader>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                window.location.href = "/dashboard/organization/members";
              }}
              className="mt-2 gap-2"
            >
              <UserPlus className="size-4" />
              {t("inviteMechanic")}
            </Button>
          </Empty>
        ) : (
          <div className="flex flex-col gap-3">
            {activeMechanics.length > 0 && (
              <div>
                <div className="mb-1 flex items-center gap-2 px-1">
                  <Typography.Muted className="text-xs font-medium uppercase tracking-wider text-muted-foreground/50">
                    {t("workingLabel")}
                  </Typography.Muted>
                  <Badge variant="secondary" className="h-5 px-2 text-xs">
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
                <div className="mb-1 flex items-center gap-2 px-1">
                  <Typography.Muted className="text-xs font-medium uppercase tracking-wider text-muted-foreground/50">
                    {t("freeLabel")}
                  </Typography.Muted>
                  <Badge variant="outline" className="h-5 px-2 text-xs">
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
});
