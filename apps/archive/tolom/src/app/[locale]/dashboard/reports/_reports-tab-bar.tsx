import type { LucideIcon } from "lucide-react";
import type { KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import type { ReportType } from "./_helpers";

interface ReportsTabBarProps {
  tabs: { label: string; value: ReportType; icon: LucideIcon }[];
  activeTab: ReportType;
  onTabChange: (value: ReportType) => void;
  t: (key: string) => string;
}

export function ReportsTabBar({
  tabs,
  activeTab,
  onTabChange,
  t,
}: ReportsTabBarProps) {
  const handleTabKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    currentIndex: number,
  ) => {
    let nextIndex = currentIndex;

    switch (event.key) {
      case "ArrowRight":
        nextIndex = (currentIndex + 1) % tabs.length;
        break;
      case "ArrowLeft":
        nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
        break;
      case "Home":
        nextIndex = 0;
        break;
      case "End":
        nextIndex = tabs.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    const nextTab = tabs[nextIndex];
    onTabChange(nextTab.value);

    requestAnimationFrame(() => {
      document.getElementById(`reports-tab-${nextTab.value}`)?.focus();
    });
  };

  return (
    <div
      role="tablist"
      aria-label={t("title")}
      className="flex flex flex-wrap gap-1 rounded-lg border border-border bg-card p-0.5"
    >
      {tabs.map((tab, index) => {
        const isActive = activeTab === tab.value;

        return (
          <Button
            key={tab.value}
            id={`reports-tab-${tab.value}`}
            role="tab"
            type="button"
            aria-selected={isActive}
            aria-controls={`reports-panel-${tab.value}`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onTabChange(tab.value)}
            onKeyDown={(event) => handleTabKeyDown(event, index)}
            variant={isActive ? "default" : "ghost"}
            size="sm"
            className="rounded-md"
          >
            <tab.icon className="size-3.5" aria-hidden="true" />
            {tab.label}
          </Button>
        );
      })}
    </div>
  );
}
