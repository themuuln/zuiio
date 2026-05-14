"use client";

import {
  AlertTriangle,
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
  Shield,
  TrendingUp,
  Truck,
  Users,
  Warehouse,
  Wrench,
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
    {
      labelKey: "nav.mechanic",
      href: "/dashboard/mechanic",
      icon: Wrench,
    },
  ],
  groups: [
    {
      labelKey: "nav.group.operations",
      icon: LayoutGrid,
      children: [
        {
          labelKey: "nav.bayView",
          href: "/dashboard/bay-view",
          icon: LayoutGrid,
        },
        {
          labelKey: "nav.workOrders",
          href: "/dashboard/work-orders",
          icon: ClipboardList,
        },
      ],
    },
    {
      labelKey: "nav.group.crm",
      icon: Users,
      children: [
        {
          labelKey: "nav.customers",
          href: "/dashboard/customers",
          icon: Users,
        },
        { labelKey: "nav.vehicles", href: "/dashboard/vehicles", icon: Car },
      ],
    },
    {
      labelKey: "nav.group.inventory",
      icon: Package,
      children: [
        {
          labelKey: "nav.inventoryParts",
          href: "/dashboard/inventory",
          icon: Package,
        },
        {
          labelKey: "nav.inventoryMovements",
          href: "/dashboard/inventory/movements",
          icon: ClipboardList,
        },
        {
          labelKey: "nav.inventoryPurchaseOrders",
          href: "/dashboard/inventory/purchase-orders",
          icon: Truck,
        },
        {
          labelKey: "nav.inventorySuppliers",
          href: "/dashboard/inventory/suppliers",
          icon: Building2,
        },
        {
          labelKey: "nav.inventoryAlerts",
          href: "/dashboard/inventory/alerts",
          icon: AlertTriangle,
        },
        {
          labelKey: "nav.inventoryValuation",
          href: "/dashboard/inventory/valuation",
          icon: TrendingUp,
        },
      ],
    },
    {
      labelKey: "nav.group.business",
      icon: DollarSign,
      children: [
        {
          labelKey: "nav.finance",
          href: "/dashboard/finance",
          icon: DollarSign,
        },
        {
          labelKey: "nav.reports",
          href: "/dashboard/reports",
          icon: BarChart3,
        },
      ],
    },
    {
      labelKey: "nav.group.resources",
      icon: BookOpen,
      children: [{ labelKey: "nav.guide", href: "/guide", icon: BookOpen }],
    },
  ],
};

const settingsGroup: NavGroup = {
  labelKey: "nav.group.settings",
  icon: Settings,
  children: [
    {
      labelKey: "nav.vehicleModels",
      href: "/dashboard/vehicle-models",
      icon: Warehouse,
    },
    {
      labelKey: "nav.organization",
      href: "/dashboard/organization",
      icon: Building2,
    },
    {
      labelKey: "nav.members",
      href: "/dashboard/organization/members",
      icon: Users,
    },
    { labelKey: "nav.settings", href: "/dashboard/settings", icon: Settings },
    { labelKey: "nav.admin", href: "/dashboard/admin", icon: Shield },
  ],
};

export function useNavigation() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname === href || pathname.startsWith(`${href}/`);
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
