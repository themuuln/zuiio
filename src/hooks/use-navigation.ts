"use client";

import {
  BarChart3,
  BookOpen,
  Building2,
  Car,
  ClipboardList,
  DollarSign,
  LayoutDashboard,
  LayoutGrid,
  type LucideIcon,
  Package,
  Settings,
  Users,
} from "lucide-react";
import { usePathname } from "@/lib/i18n/navigation";

export type NavSection = "main" | "settings";

export interface NavItem {
  labelKey: string;
  href: string;
  icon: LucideIcon;
  section: NavSection;
}

const navigationItems: NavItem[] = [
  {
    labelKey: "nav.dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    section: "main",
  },
  {
    labelKey: "nav.bayView",
    href: "/dashboard/bay-view",
    icon: LayoutGrid,
    section: "main",
  },
  {
    labelKey: "nav.workOrders",
    href: "/dashboard/work-orders",
    icon: ClipboardList,
    section: "main",
  },
  {
    labelKey: "nav.customers",
    href: "/dashboard/customers",
    icon: Users,
    section: "main",
  },
  {
    labelKey: "nav.vehicles",
    href: "/dashboard/vehicles",
    icon: Car,
    section: "main",
  },
  {
    labelKey: "nav.inventory",
    href: "/dashboard/inventory",
    icon: Package,
    section: "main",
  },
  {
    labelKey: "nav.finance",
    href: "/dashboard/finance",
    icon: DollarSign,
    section: "main",
  },
  {
    labelKey: "nav.reports",
    href: "/dashboard/reports",
    icon: BarChart3,
    section: "main",
  },
  {
    labelKey: "nav.guide",
    href: "/dashboard/guide",
    icon: BookOpen,
    section: "main",
  },
  {
    labelKey: "nav.settings",
    href: "/dashboard/settings",
    icon: Settings,
    section: "settings",
  },
  {
    labelKey: "nav.organization",
    href: "/dashboard/organization",
    icon: Building2,
    section: "settings",
  },
];

export function useNavigation() {
  const pathname = usePathname();

  const mainItems = navigationItems.filter((item) => item.section === "main");
  const settingsItems = navigationItems.filter(
    (item) => item.section === "settings",
  );

  function isActive(href: string) {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  }

  return {
    mainItems,
    settingsItems,
    isActive,
    pathname,
  };
}
