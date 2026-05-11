"use client";

import {
  BarChart3,
  Building2,
  Car,
  ClipboardList,
  DollarSign,
  LayoutDashboard,
  type LucideIcon,
  Package,
  Settings,
  Users,
} from "lucide-react";
import { usePathname } from "next/navigation";

export type NavSection = "main" | "settings";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  section: NavSection;
}

const navigationItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    section: "main",
  },
  {
    label: "Work Orders",
    href: "/dashboard/work-orders",
    icon: ClipboardList,
    section: "main",
  },
  {
    label: "Customers",
    href: "/dashboard/customers",
    icon: Users,
    section: "main",
  },
  {
    label: "Vehicles",
    href: "/dashboard/vehicles",
    icon: Car,
    section: "main",
  },
  {
    label: "Inventory",
    href: "/dashboard/inventory",
    icon: Package,
    section: "main",
  },
  {
    label: "Finance",
    href: "/dashboard/finance",
    icon: DollarSign,
    section: "main",
  },
  {
    label: "Reports",
    href: "/dashboard/reports",
    icon: BarChart3,
    section: "main",
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
    section: "settings",
  },
  {
    label: "Organization",
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
