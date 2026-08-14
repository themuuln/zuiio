"use client";

import { useEffect, useState } from "react";
import { usePathname } from "@/lib/i18n/navigation";

export interface RecentPageEntry {
  href: string;
  labelKey: string;
}

const STORAGE_KEY = "tolom-recent-pages";
const MAX_RECENT = 5;

function loadRecent(): RecentPageEntry[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (entry): entry is RecentPageEntry =>
        !!entry &&
        typeof entry === "object" &&
        typeof (entry as RecentPageEntry).href === "string" &&
        typeof (entry as RecentPageEntry).labelKey === "string",
    );
  } catch {
    return [];
  }
}

/**
 * Tracks the last few visited nav pages (localStorage-backed) so the sidebar
 * can show a "Recently Viewed" jump list. Only exact nav hrefs are tracked —
 * detail pages are resolved through their list page via the label map.
 */
export function useRecentPages(
  navItems: { href: string; labelKey: string }[],
): RecentPageEntry[] {
  const pathname = usePathname();
  const [recent, setRecent] = useState<RecentPageEntry[]>([]);

  // Hydrate once from storage (client-only).
  useEffect(() => {
    setRecent(loadRecent());
  }, []);

  useEffect(() => {
    const match = navItems.find((item) => item.href === pathname);
    if (!match) return;
    setRecent((prev) => {
      const next = [
        { href: match.href, labelKey: match.labelKey },
        ...prev.filter((entry) => entry.href !== match.href),
      ].slice(0, MAX_RECENT);
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* storage unavailable — ignore */
      }
      return next;
    });
  }, [pathname, navItems]);

  return recent;
}
