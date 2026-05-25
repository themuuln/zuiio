"use client";

import { useDroppable } from "@dnd-kit/core";
import { ChevronDown, ChevronUp, Users, Wrench } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import type { Profile } from "@/lib/types";
import { cn } from "@/lib/utils";
import { MechanicChip } from "./mechanic-chip";

interface MechanicRosterProps {
  mechanics: (Profile & { current_jobs: number })[];
}

export function MechanicRoster({ mechanics }: MechanicRosterProps) {
  const { setNodeRef: setRosterDropRef, isOver: isRosterOver } = useDroppable({
    id: "mechanic-roster",
  });
  const t = useTranslations("bayView");
  const [collapsed, setCollapsed] = useState(false);
  const activeMechanics = mechanics.filter((m) => m.current_jobs > 0);
  const availableMechanics = mechanics.filter((m) => m.current_jobs === 0);

  return (
    <div className="overflow-hidden">
      <Button
        variant="ghost"
        onClick={() => setCollapsed(!collapsed)}
        className="w-full justify-between px-2 py-1.5 h-auto text-xs font-semibold"
      >
        <span className="flex items-center gap-2">
          <div className="flex size-6 items-center justify-center rounded-lg bg-blue-500/10 ring-1 ring-blue-500/15">
            <Users className="size-3 text-blue-600 dark:text-blue-400" />
          </div>
          <span>{t("mechanics")}</span>
          <Badge variant="secondary">
            {mechanics.length}
          </Badge>
        </span>
        {collapsed ? (
          <ChevronUp className="size-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="size-4 text-muted-foreground" />
        )}
      </Button>

      <div
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-300 ease-out",
          collapsed ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100",
        )}
      >
        <div className="overflow-hidden">
          <div
            ref={setRosterDropRef}
            className={cn(
              "flex flex-col gap-1.5 px-2 pb-1.5 transition-colors duration-200",
              isRosterOver && "rounded-lg bg-primary/5 ring-1 ring-primary/10",
            )}
          >
          {mechanics.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Wrench />
                </EmptyMedia>
                <EmptyTitle>{t("noMechanics")}</EmptyTitle>
              </EmptyHeader>
            </Empty>
          ) : (
            <>
              {activeMechanics.length > 0 && (
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 px-1 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                    <span className="size-1 rounded-full bg-emerald-500" />
                    <span>{t("working", { count: activeMechanics.length })}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    {activeMechanics.map((m) => (
                      <MechanicChip key={m.id} mechanic={m} />
                    ))}
                  </div>
                </div>
              )}
              {availableMechanics.length > 0 && (
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 px-1 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                    <span className="size-1 rounded-full bg-blue-500" />
                    <span>{t("availableMechanics", { count: availableMechanics.length })}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    {availableMechanics.map((m) => (
                      <MechanicChip key={m.id} mechanic={m} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}
