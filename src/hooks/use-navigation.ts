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
  FileText,
  LayoutDashboard,
  LayoutGrid,
  type LucideIcon,
  Package,
  Settings,
  Shield,
  Sparkles,
  TrendingUp,
  Truck,
  Users,
  Warehouse,
  Wrench,
} from "lucide-react";
import { useCurrentUserRole } from "@/hooks/use-current-user-role";
import { usePathname } from "@/lib/i18n/navigation";
import { FEATURE_KEYS, type FeatureKey } from "@/lib/plan-features";
import { useAvailableFeatures } from "./use-available-features";

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
      {
        labelKey: "nav.services",
        href: "/dashboard/services",
        icon: Sparkles,
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
      {
        labelKey: "nav.estimates",
        href: "/dashboard/estimates",
        icon: FileText,
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
        labelKey: "nav.payroll",
        href: "/dashboard/payroll",
        icon: DollarSign,
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
  const { isFeatureEnabled, loading: featuresLoading } = useAvailableFeatures();

  const mechanicHomeItem: NavItem = {
    labelKey: "nav.bayView",
    href: "/dashboard/bay-view",
    icon: LayoutGrid,
  };

  // ── Filter nav items based on role (only once role is known) ──
  const isDefinitelyMechanic = !roleLoading && isMechanic;

  // Map nav groups/items to feature keys so they can be gated
  const navFeatureMap: Record<string, FeatureKey | undefined> = {
    "nav.group.inventory": FEATURE_KEYS.INVENTORY,
    "nav.mechanic": FEATURE_KEYS.MECHANIC,
    "nav.mechanicPerformance": FEATURE_KEYS.MECHANIC_PERFORMANCE,
    "nav.serviceReminders": FEATURE_KEYS.SERVICE_REMINDERS,
    "nav.payroll": FEATURE_KEYS.PAYROLL,
    "nav.estimates": FEATURE_KEYS.ESTIMATES,
    "nav.appointments": FEATURE_KEYS.APPOINTMENTS,
    "nav.vehicleModels": FEATURE_KEYS.VEHICLE_MODELS,
    "nav.endOfDay": FEATURE_KEYS.EOD_CLOSE,
    "nav.group.financials": FEATURE_KEYS.FINANCE,
    "/dashboard/inventory/alerts": FEATURE_KEYS.INVENTORY_ALERTS,
    "/dashboard/inventory/valuation": FEATURE_KEYS.INVENTORY_VALUATION,
    "/dashboard/inventory/purchase-orders": FEATURE_KEYS.PURCHASE_ORDERS,
    "/dashboard/inventory/suppliers": FEATURE_KEYS.SUPPLIERS,
    "/dashboard/inventory/parts-cars": FEATURE_KEYS.PARTS_CARS,
  };

  const isFeatureAllowed = (href: string): boolean => {
    const featureKey = navFeatureMap[href];
    if (!featureKey) return true; // no feature gate = always visible
    return isFeatureEnabled(featureKey);
  };

  const isGroupAllowed = (groupLabelKey: string): boolean => {
    const featureKey = navFeatureMap[groupLabelKey];
    if (!featureKey) return true;
    return isFeatureEnabled(featureKey);
  };

  let filteredNavGroups = isDefinitelyMechanic
    ? navGroups
        .filter((g) => g.labelKey !== FINANCIALS_GROUP_KEY)
        .map((g) => ({
          ...g,
          children:
            g.labelKey === "nav.group.operations"
              ? g.children.filter((c) => c.href !== "/dashboard/bay-view")
              : g.children,
        }))
    : navGroups;

  // Apply feature-flag filtering (after role filtering)
  filteredNavGroups = filteredNavGroups
    .filter((g) => isGroupAllowed(g.labelKey))
    .map((g) => ({
      ...g,
      children: g.children.filter((c) => isFeatureAllowed(c.href)),
    }))
    .filter((g) => g.children.length > 0); // hide empty groups

  const filteredPrimaryItems = isDefinitelyMechanic
    ? [mechanicHomeItem]
    : primaryItems.filter((item) => isFeatureAllowed(item.href));
  const filteredSettingsItems = isDefinitelyMechanic ? [] : settingsItems;
  const filteredUtilityItems = utilityItems;

  const filteredAllItems = [
    ...filteredPrimaryItems,
    ...filteredNavGroups.flatMap((group) => group.children),
    ...filteredUtilityItems,
    ...filteredSettingsItems,
  ];

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    // Exact match — unambiguous
    if (pathname === href) return true;
    // Prefix match — only if no other nav item is a better (longer) match.
    // This prevents parent items like /dashboard/inventory from highlighting
    // when on a child page like /dashboard/inventory/valuation.
    if (pathname.startsWith(`${href}/`)) {
      return !filteredAllItems.some(
        (item) =>
          item.href !== href &&
          (pathname === item.href || pathname.startsWith(`${item.href}/`)),
      );
    }
    return false;
  };

  const filteredSections = isDefinitelyMechanic
    ? sections.filter((s) => s.labelKey !== FINANCIALS_GROUP_KEY)
    : sections;

  // Stable fallback — never null
  const fallbackItem = isDefinitelyMechanic
    ? mechanicHomeItem
    : primaryItems[0];

  const resolvedCurrentItem =
    [...filteredAllItems]
      .sort((a, b) => b.href.length - a.href.length)
      .find((item) => isActive(item.href)) ?? fallbackItem;

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
    roleLoading: roleLoading || featuresLoading,
  };
}
