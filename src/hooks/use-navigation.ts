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
  Warehouse,
} from "lucide-react";
import { usePathname } from "@/lib/i18n/navigation";

export interface NavItem {
  labelKey: string;
  href: string;
  icon: LucideIcon;
}

export interface NavGroup {
  labelKey: string;
  icon: LucideIcon;
  children: NavItem[];
}

export type NavGroupConfig = {
  groups: NavGroup[];
  standalone: NavItem[];
};

const navigationConfig: NavGroupConfig = {
  standalone: [
    {
      labelKey: "nav.dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
  ],
  groups: [
    {
      labelKey: "nav.group.operations",
      icon: LayoutGrid,
      children: [
        { labelKey: "nav.bayView", href: "/dashboard/bay-view", icon: LayoutGrid },
        { labelKey: "nav.workOrders", href: "/dashboard/work-orders", icon: ClipboardList },
      ],
    },
    {
      labelKey: "nav.group.crm",
      icon: Users,
      children: [
        { labelKey: "nav.customers", href: "/dashboard/customers", icon: Users },
        { labelKey: "nav.vehicles", href: "/dashboard/vehicles", icon: Car },
      ],
    },
    {
      labelKey: "nav.group.business",
      icon: DollarSign,
      children: [
        { labelKey: "nav.inventory", href: "/dashboard/inventory", icon: Package },
        { labelKey: "nav.finance", href: "/dashboard/finance", icon: DollarSign },
        { labelKey: "nav.reports", href: "/dashboard/reports", icon: BarChart3 },
      ],
    },
    {
      labelKey: "nav.group.resources",
      icon: BookOpen,
      children: [
        { labelKey: "nav.guide", href: "/guide", icon: BookOpen },
      ],
    },
  ],
};

const settingsGroup: NavGroup = {
  labelKey: "nav.group.settings",
  icon: Settings,
  children: [
    { labelKey: "nav.vehicleModels", href: "/dashboard/vehicle-models", icon: Warehouse },
    { labelKey: "nav.organization", href: "/dashboard/organization", icon: Building2 },
    { labelKey: "nav.settings", href: "/dashboard/settings", icon: Settings },
  ],
};

export function useNavigation() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  }

  function groupHasActive(group: NavGroup) {
    return group.children.some((item) => isActive(item.href));
  }

  return {
    standalone: navigationConfig.standalone,
    groups: navigationConfig.groups,
    settingsGroup,
    isActive,
    groupHasActive,
    pathname,
  };
}
