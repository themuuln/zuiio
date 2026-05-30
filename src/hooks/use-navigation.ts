"use client";

import {
  AlertTriangle,
  BarChart3,
  Bell,
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
  isCollapsible?: boolean;
}

export interface NavBreadcrumb {
  labelKey: string;
  href?: string;
}

export interface NavSection {
  labelKey: string;
  icon: LucideIcon;
  items: NavItem[];
}

const primaryItems: NavItem[] = [
  {
    labelKey: "nav.dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
];

const navGroups: NavGroup[] = [
  {
    labelKey: "nav.group.operations",
    icon: Wrench,
    children: [
      {
        labelKey: "nav.bayView",
        href: "/dashboard/bay-view",
        icon: LayoutGrid,
      },
      {
        labelKey: "nav.mechanic",
        href: "/dashboard/mechanic",
        icon: Wrench,
      },
      {
        labelKey: "nav.workOrders",
        href: "/dashboard/work-orders",
        icon: ClipboardList,
      },
    ],
    isCollapsible: false,
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
      {
        labelKey: "nav.serviceReminders",
        href: "/dashboard/service-reminders",
        icon: Bell,
      },
    ],
    isCollapsible: false,
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
        labelKey: "nav.inventoryMovements",
        href: "/dashboard/inventory/movements",
        icon: ClipboardList,
      },
      {
        labelKey: "nav.inventoryPartsCars",
        href: "/dashboard/inventory/parts-cars",
        icon: Truck,
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
    isCollapsible: false,
  },
  {
    labelKey: "nav.group.financials",
    icon: DollarSign,
    children: [
      {
        labelKey: "nav.finance",
        href: "/dashboard/finance",
        icon: DollarSign,
      },
      {
        labelKey: "nav.expenses",
        href: "/dashboard/expenses",
        icon: TrendingUp,
      },
      {
        labelKey: "nav.reports",
        href: "/dashboard/reports",
        icon: BarChart3,
      },
      {
        labelKey: "nav.endOfDay",
        href: "/dashboard/eod-close",
        icon: ClipboardList,
      },
    ],
    isCollapsible: false,
  },
];

const utilityItems: NavItem[] = [
  { labelKey: "nav.guide", href: "/guide", icon: BookOpen },
];

const settingsItems: NavItem[] = [
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
  {
    labelKey: "nav.vehicleModels",
    href: "/dashboard/vehicle-models",
    icon: Warehouse,
  },
  { labelKey: "nav.settings", href: "/dashboard/settings", icon: Settings },
  { labelKey: "nav.admin", href: "/dashboard/admin", icon: Shield },
];

const allItems = [
  ...primaryItems,
  ...navGroups.flatMap((group) => group.children),
  ...utilityItems,
  ...settingsItems,
];

const sections: NavSection[] = [
  {
    labelKey: "nav.dashboard",
    icon: LayoutDashboard,
    items: primaryItems,
  },
  ...navGroups.map((group) => ({
    labelKey: group.labelKey,
    icon: group.icon,
    items: group.children,
  })),
  {
    labelKey: "nav.guide",
    icon: BookOpen,
    items: utilityItems,
  },
];

export function useNavigation() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const currentItem =
    [...allItems]
      .sort((a, b) => b.href.length - a.href.length)
      .find((item) => isActive(item.href)) ?? primaryItems[0];

  const currentGroup =
    navGroups.find((group) =>
      group.children.some((item) => item.href === currentItem.href),
    ) ?? null;
  const currentSection =
    sections.find((section) =>
      section.items.some((item) => item.href === currentItem.href),
    ) ?? sections[0];

  const breadcrumbs: NavBreadcrumb[] = currentGroup
    ? [
        { labelKey: "nav.dashboard", href: "/dashboard" },
        { labelKey: currentGroup.labelKey },
        { labelKey: currentItem.labelKey },
      ]
    : currentItem.href === "/dashboard"
      ? [{ labelKey: "nav.dashboard" }]
      : [
          { labelKey: "nav.dashboard", href: "/dashboard" },
          { labelKey: currentItem.labelKey },
        ];

  return {
    primaryItems,
    groups: navGroups,
    utilityItems,
    settingsItems,
    sections,
    currentSection,
    searchItems: allItems,
    currentItem,
    breadcrumbs,
    isActive,
    pathname,
  };
}
