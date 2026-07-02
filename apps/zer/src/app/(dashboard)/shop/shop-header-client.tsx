"use client";

import { PanelLeftIcon } from "lucide-react";
import { useSidebarState } from "@/app/(dashboard)/dashboard-shell";
import { Button } from "@/components/ui/button";

/**
 * Shop header with a sidebar toggle button.
 */
export function ShopHeaderClient() {
  const { open, setOpen } = useSidebarState();

  return (
    <header className="sticky top-0 z-40 flex h-[52px] items-center border-b border-border bg-card px-4">
      <div className="flex w-full items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="size-8 shrink-0"
          onClick={() => setOpen(!open)}
          aria-label="Хажуугийн цэс"
        >
          <PanelLeftIcon className="size-4" />
        </Button>
        <span className="text-sm font-semibold">Дэлгүүр</span>
      </div>
    </header>
  );
}
