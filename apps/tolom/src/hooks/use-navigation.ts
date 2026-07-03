"use client";

import {
  BarChart3,
  Bell,
  Building2,
  ClipboardList,
  DollarSign,
  LayoutDashboard,
  LayoutGrid,
  type LucideIcon,
  Package,
  Settings,
  Sparkles,
  Users,
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
    labelKey: "nav.group.shopFloor",
    icon: Wrench,
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
      {
        labelKey: "nav.services",
        href: "/dashboard/services",
        icon: Sparkles,
      },
    ],
    isCollapsible: false,
  },
  {
    labelKey: "nav.group.customers",
    icon: Users,
    children: [
      {
        labelKey: "nav.customers",
        href: "/dashboard/customers",
        icon: Users,
      },
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
    ],
    isCollapsible: false,
  },
  {
    labelKey: "nav.group.finances",
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
    isCollapsible: false,
  },
];

const utilityItems: NavItem[] = [];

const settingsItems: NavItem[] = [
  {
    labelKey: "nav.organization",
    href: "/dashboard/organization",
    icon: Building2,
  },
  { labelKey: "nav.settings", href: "/dashboard/settings", icon: Settings },
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
];

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
    "nav.serviceReminders": FEATURE_KEYS.SERVICE_REMINDERS,
    "nav.group.finances": FEATURE_KEYS.FINANCE,
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

  // For mechanics: only show Bay View (primary) + Work Orders / Services
  let filteredNavGroups = isDefinitelyMechanic
    ? navGroups
        .filter((g) => g.labelKey === "nav.group.shopFloor")
        .map((g) => ({
          ...g,
          children: g.children.filter((c) => c.href !== "/dashboard/bay-view"),
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
    ? sections.filter(
        (s) =>
          s.labelKey === "nav.group.shopFloor" ||
          s.labelKey === "nav.dashboard",
      )
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
