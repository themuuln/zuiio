"use client";

import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QuickAction {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  variant?: "default" | "secondary" | "outline" | "ghost";
}

export function QuickActions({ actions }: { actions: QuickAction[] }) {
  if (actions.length === 0) return null;
  return (
    <div className="flex flex-col gap-1">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <Button
            key={action.label}
            variant={action.variant ?? "outline"}
            size="sm"
            className="justify-start gap-2 h-8 text-xs"
            onClick={action.onClick}
          >
            <Icon className="size-3.5 shrink-0" />
            {action.label}
          </Button>
        );
      })}
    </div>
  );
}
