"use client";

import { useTranslations } from "next-intl";
import { useEffect, type ReactNode } from "react";
import { usePageHeader, type PageTab } from "@/hooks/use-page-header";

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
  const t = useTranslations();
  const { setTabs, setActiveTab } = usePageHeader();

  useEffect(() => {
    setTabs(SETTINGS_TABS);
    setActiveTab("general");

    return () => {
      setTabs([]);
    };
  }, [setTabs, setActiveTab]);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">{children}</div>
  );
}
