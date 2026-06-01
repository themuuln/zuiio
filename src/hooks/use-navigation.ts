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
import { useCurrentUserRole } from "@/hooks/use-current-user-role";
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
        labelKey: "nav.mechanicPerformance",
        href: "/dashboard/mechanic-performance",
        icon: TrendingUp,
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

/** The Financials group label — hidden from mechanics who lack reports.read */
const FINANCIALS_GROUP_KEY = "nav.group.financials";

export function useNavigation() {
  const pathname = usePathname();
  const { isMechanic, loading: roleLoading } = useCurrentUserRole();

  function isActive(href: string) {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  // ── While role is loading, show nothing to avoid flash of unfiltered items ──
  const navReady = !roleLoading;

  // ── Filter nav items based on role ──────────────────────
  const filteredNavGroups = !navReady
    ? []
    : isMechanic
      ? navGroups
          .filter((g) => g.labelKey !== FINANCIALS_GROUP_KEY)
          .map((g) => ({
            ...g,
            // Bay View is already the primary home item — remove from Operations group
            children:
              g.labelKey === "nav.group.operations"
                ? g.children.filter((c) => c.href !== "/dashboard/bay-view")
                : g.children,
          }))
      : navGroups;

  const filteredPrimaryItems = !navReady
    ? []
    : isMechanic
      ? [
          {
            labelKey: "nav.bayView",
            href: "/dashboard/bay-view",
            icon: LayoutGrid,
          },
        ]
      : primaryItems;
  const filteredSettingsItems = !navReady ? [] : isMechanic ? [] : settingsItems;
  const filteredUtilityItems = navReady ? utilityItems : [];

  const filteredAllItems = [
    ...filteredPrimaryItems,
    ...filteredNavGroups.flatMap((group) => group.children),
    ...filteredUtilityItems,
    ...filteredSettingsItems,
  ];

  const filteredSections = !navReady
    ? []
    : isMechanic
      ? sections.filter((s) => s.labelKey !== FINANCIALS_GROUP_KEY)
    : sections;

  const resolvedCurrentItem =
    [...filteredAllItems]
      .sort((a, b) => b.href.length - a.href.length)
      .find((item) => isActive(item.href)) ??
    filteredPrimaryItems[0] ??
    null;

  const resolvedCurrentGroup =
    filteredNavGroups.find((group) =>
      group.children.some((item) => item.href === resolvedCurrentItem.href),
    ) ?? null;
  const resolvedCurrentSection =
    filteredSections.find((section) =>
      section.items.some((item) => item.href === resolvedCurrentItem.href),
    ) ?? filteredSections[0];

  const resolvedBreadcrumbs: NavBreadcrumb[] = resolvedCurrentGroup
    ? [
        { labelKey: "nav.dashboard", href: "/dashboard" },
        { labelKey: resolvedCurrentGroup.labelKey },
        { labelKey: resolvedCurrentItem.labelKey },
      ]
    : resolvedCurrentItem.href === "/dashboard"
      ? [{ labelKey: "nav.dashboard" }]
      : [
          { labelKey: "nav.dashboard", href: "/dashboard" },
          { labelKey: resolvedCurrentItem.labelKey },
        ];

  return {
    primaryItems: filteredPrimaryItems,
    groups: filteredNavGroups,
    utilityItems: filteredUtilityItems,
    settingsItems: filteredSettingsItems,
    sections: filteredSections,
    currentSection: resolvedCurrentSection,
    searchItems: filteredAllItems,
    currentItem: resolvedCurrentItem,
    breadcrumbs: resolvedBreadcrumbs,
    isActive,
    pathname,
  };
}
