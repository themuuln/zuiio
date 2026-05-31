"use client";

import { type ReactNode, useEffect } from "react";
import { type PageTab, usePageHeader } from "@/hooks/use-page-header";

const SETTINGS_TABS: PageTab[] = [
  { value: "general", label: "General" },
  { value: "appearance", label: "Appearance" },
  { value: "telegram", label: "Telegram Bot" },
  { value: "niche", label: "Vehicle Niche" },
  { value: "sharing", label: "Data Sharing" },
  { value: "commission", label: "Commission Rules" },
  { value: "diagnosis", label: "Diagnosis Labels" },
  { value: "export", label: "Data & Export" },
];

export default function SettingsLayout({ children }: { children: ReactNode }) {
  const { setTabs, setActiveTab } = usePageHeader();

  useEffect(() => {
    setTabs(SETTINGS_TABS);
    setActiveTab("general");

    return () => {
      setTabs([]);
    };
  }, [setTabs, setActiveTab]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      {children}
    </div>
  );
}
