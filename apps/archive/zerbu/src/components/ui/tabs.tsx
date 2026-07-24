"use client";

import { cn } from "@/lib/utils/cn";

type Tab = {
  id: string;
  label: string;
};

type TabsProps = {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (id: string) => void;
  className?: string;
};

export function Tabs({ tabs, activeTab, onTabChange, className }: TabsProps) {
  return (
    <div className={cn("flex border-b-2 border-secondary/20 dark:border-dark-surface", className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            "px-4 py-2.5 text-sm font-medium transition-all duration-200 relative cursor-pointer",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
            activeTab === tab.id
              ? "text-primary"
              : "text-text-secondary hover:text-text dark:hover:text-dark-text",
          )}
        >
          {tab.label}
          {activeTab === tab.id && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
          )}
        </button>
      ))}
    </div>
  );
}
