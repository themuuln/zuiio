"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { type SidebarTab, useRightSidebar } from "@/hooks/use-right-sidebar";
import { cn } from "@/lib/utils";

function BottomBar({
  activeTab,
  tabs,
  onSelect,
  isOpen,
}: {
  activeTab: string;
  tabs: SidebarTab[];
  onSelect: (value: string) => void;
  isOpen: boolean;
}) {
  return (
    <div className="flex shrink-0 items-center gap-1 border-t border-border/60 bg-background px-3 py-2">
      {tabs.map((tab) => (
        <Button
          key={tab.value}
          variant="ghost"
          size="sm"
          onClick={() => onSelect(tab.value)}
          aria-label={tab.label}
          title={tab.label}
          className={cn(
            "rounded-xl px-3 py-1 text-xs font-medium",
            tab.value === activeTab && isOpen
              ? "border border-foreground/10 bg-foreground/8 text-foreground"
              : "border border-transparent bg-transparent text-muted-foreground/55 hover:border-border/70 hover:bg-accent/70 hover:text-foreground",
          )}
        >
          {tab.icon && <span className="mr-1.5 inline-flex">{tab.icon}</span>}
          <span className="truncate">{tab.label}</span>
        </Button>
      ))}
    </div>
  );
}

function BottomPanel({
  activeTab,
  tabs,
  content,
  onSelect,
}: {
  activeTab: string;
  tabs: SidebarTab[];
  content: Record<string, ReactNode>;
  onSelect: (value: string) => void;
}) {
  const validTabs = tabs.filter((tab) => content[tab.value] != null);

  return (
    <div
      data-no-dnd="true"
      className="flex min-h-0 flex-1 flex-col overflow-hidden"
    >
      <Tabs
        value={activeTab}
        onValueChange={onSelect}
        className="min-h-0 flex-1"
      >
        <ScrollArea className="min-h-0 flex-1">
          <div className="flex min-h-0 flex-col p-3">
            {validTabs.map((tab) => (
              <TabsContent
                key={tab.value}
                value={tab.value}
                className="mt-0 flex min-h-0 flex-col overflow-hidden rounded-2xl border border-border/50 bg-card/70 p-3 shadow-sm"
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
    if (state.isOpen && state.activeTab === value) {
      setOpen(false);
      return;
    }
    setActiveTab(value);
    setOpen(true);
  };

  return (
    <section className="flex shrink-0 flex-col border-t border-border/60 bg-background">
      <div
        className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out",
          state.isOpen ? "h-[22rem]" : "h-0",
        )}
      >
        {state.isOpen && (
          <BottomPanel
            activeTab={state.activeTab}
            tabs={state.tabs}
            content={state.content}
            onSelect={setActiveTab}
          />
        )}
      </div>
      <BottomBar
        activeTab={state.activeTab}
        tabs={state.tabs}
        onSelect={handleSelect}
        isOpen={state.isOpen}
      />
    </section>
  );
}
