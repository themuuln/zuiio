"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRightSidebar } from "@/hooks/use-right-sidebar";
import { cn } from "@/lib/utils";

function RightSidebarRail({
  activeTab,
  tabs,
  onSelect,
}: {
  activeTab: string;
  tabs: { value: string; label: string }[];
  onSelect: (value: string) => void;
}) {
  return (
    <div className="flex h-full w-12 shrink-0 flex-col items-center gap-2 border-l border-border/60 bg-background py-3">
      <div className="flex flex-1 flex-col items-center gap-2">
        {tabs.map((tab) => (
          <Button
            key={tab.value}
            variant="ghost"
            size="icon-sm"
            onClick={() => onSelect(tab.value)}
            aria-label={tab.label}
            title={tab.label}
            className={cn(
              "rounded-2xl text-[10px] font-semibold",
              tab.value === activeTab
                ? "border border-foreground/10 bg-foreground/8 text-foreground"
                : "border border-transparent bg-transparent text-muted-foreground/55 hover:border-border/70 hover:bg-accent/70 hover:text-foreground",
            )}
          >
            {tab.label.slice(0, 1)}
          </Button>
        ))}
      </div>
    </div>
  );
}

function RightSidebarPanel({
  activeTab,
  tabs,
  content,
  onSelect,
}: {
  activeTab: string;
  tabs: { value: string; label: string }[];
  content: Record<string, ReactNode>;
  onSelect: (value: string) => void;
}) {
  return (
    <div data-no-dnd="true" className="flex min-h-0 flex-1 flex-col">
      <Tabs
        value={activeTab}
        onValueChange={onSelect}
        className="min-h-0 flex-1"
      >
        <TabsList
          variant="line"
          className="sticky top-0 z-10 mt-3 h-auto w-full justify-start gap-1 rounded-2xl bg-background p-1"
        >
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="min-w-0 flex-1 rounded-xl px-2 py-2 text-xs"
            >
              <span className="truncate">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <ScrollArea className="min-h-0 flex-1">
          <div className="flex h-full min-h-0 flex-col p-3">
            {tabs.map((tab) => (
              <TabsContent
                key={tab.value}
                value={tab.value}
                className="mt-0 flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-border/50 bg-card/70 p-3 shadow-sm"
              >
                {content[tab.value]}
              </TabsContent>
            ))}
          </div>
        </ScrollArea>
      </Tabs>
    </div>
  );
}

export function RightSidebar() {
  const { state, setOpen, setActiveTab } = useRightSidebar();

  if (state.tabs.length === 0) return null;

  const handleSelect = (value: string) => {
    setActiveTab(value);
    setOpen(true);
  };

  return (
    <section className="flex h-full shrink-0 flex-row-reverse">
      <RightSidebarRail
        activeTab={state.activeTab}
        tabs={state.tabs}
        onSelect={handleSelect}
      />
      {/* Animated panel: always mounted, width transitions smoothly */}
      <div
        className={cn(
          "hidden h-full overflow-hidden border-l border-border/60 transition-all duration-300 ease-in-out md:block",
          state.isOpen ? "w-[19rem]" : "w-0",
        )}
      >
        <div className="flex h-full w-[19rem] bg-background">
          <RightSidebarPanel
            activeTab={state.activeTab}
            tabs={state.tabs}
            content={state.content}
            onSelect={setActiveTab}
          />
        </div>
      </div>
    </section>
  );
}
