"use client";

import { PanelRightClose } from "lucide-react";
import { useRightSidebar } from "@/hooks/use-right-sidebar";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

const SIDEBAR_WIDTH = "w-64";

export function RightSidebar() {
  const { state, toggle, setActiveTab } = useRightSidebar();

  if (!state.isOpen || state.tabs.length === 0) return null;

  return (
    <aside
      className={cn(
        SIDEBAR_WIDTH,
        "shrink-0 border-l border-border/50 bg-background flex flex-col overflow-hidden",
      )}
    >
      <div className="flex items-center justify-between border-b border-border/50 pr-1 shrink-0">
        <Tabs
          value={state.activeTab}
          onValueChange={(v) => setActiveTab(v)}
          className="flex-1"
        >
          <TabsList variant="line" className="w-full justify-start px-1">
            {state.tabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className="text-xs h-7 px-2">
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggle}
          className="size-6 shrink-0 text-muted-foreground/60 hover:text-foreground"
        >
          <PanelRightClose className="size-3.5" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {state.tabs.map((tab) => (
            <TabsContent key={tab.value} value={tab.value} className="flex flex-col gap-2">
              {state.content[tab.value]}
            </TabsContent>
          ))}
        </div>
      </ScrollArea>
    </aside>
  );
}
