"use client";

import {
  BarChart3,
  Bell,
  Building2,
  CalendarDays,
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

export interface NavSubItem {
  labelKey: string;
  href: string;
  requiredPermission?: { resource: string; action: string };
}

export interface NavItem {
  labelKey: string;
  href: string;
  icon: LucideIcon;
  requiredPermission?: { resource: string; action: string };
  children?: NavSubItem[];
}

export interface NavGroup {
  labelKey: string;
  icon: LucideIcon;
  children: NavItem[];
  isCollapsible?: boolean;
  requiredPermission?: { resource: string; action: string };
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
    requiredPermission: { resource: "work_orders", action: "read" },
    children: [
      {
        labelKey: "nav.bayView",
        href: "/dashboard/bay-view",
        icon: LayoutGrid,
        requiredPermission: { resource: "work_orders", action: "read" },
      },
      {
        labelKey: "nav.workOrders",
        href: "/dashboard/work-orders",
        icon: ClipboardList,
        requiredPermission: { resource: "work_orders", action: "read" },
      },
      {
        labelKey: "nav.services",
        href: "/dashboard/services",
        icon: Sparkles,
        requiredPermission: { resource: "services", action: "read" },
      },
      {
        labelKey: "nav.appointments",
        href: "/dashboard/appointments",
        icon: CalendarDays,
        requiredPermission: { resource: "appointments", action: "read" },
      },
    ],
    isCollapsible: false,
  },
  {
    labelKey: "nav.group.customers",
    icon: Users,
    requiredPermission: { resource: "customers", action: "read" },
    children: [
      {
        labelKey: "nav.customers",
        href: "/dashboard/customers",
        icon: Users,
        requiredPermission: { resource: "customers", action: "read" },
      },
      {
        labelKey: "nav.serviceReminders",
        href: "/dashboard/service-reminders",
        icon: Bell,
        requiredPermission: { resource: "service_reminders", action: "read" },
      },
    ],
    isCollapsible: false,
  },
  {
    labelKey: "nav.group.inventory",
    icon: Package,
    requiredPermission: { resource: "inventory", action: "read" },
    children: [
      {
        labelKey: "nav.inventoryParts",
        href: "/dashboard/inventory",
        icon: Package,
        requiredPermission: { resource: "inventory", action: "read" },
        children: [
          {
            labelKey: "nav.inventoryParts",
            href: "/dashboard/inventory",
            requiredPermission: { resource: "inventory", action: "read" },
          },
          {
            labelKey: "nav.inventoryAlerts",
            href: "/dashboard/inventory/alerts",
            requiredPermission: { resource: "inventory", action: "read" },
          },
          {
            labelKey: "nav.inventoryMovements",
            href: "/dashboard/inventory/movements",
            requiredPermission: { resource: "inventory", action: "read" },
          },
          {
            labelKey: "nav.inventoryTransfers",
            href: "/dashboard/inventory/transfers",
            requiredPermission: { resource: "inventory", action: "read" },
          },
          {
            labelKey: "nav.inventoryPurchaseOrders",
            href: "/dashboard/inventory/purchase-orders",
            requiredPermission: { resource: "inventory", action: "read" },
          },
          {
            labelKey: "nav.inventorySuppliers",
            href: "/dashboard/inventory/suppliers",
            requiredPermission: { resource: "inventory", action: "read" },
          },
          {
            labelKey: "nav.inventoryPartsCars",
            href: "/dashboard/inventory/parts-cars",
            requiredPermission: { resource: "inventory", action: "read" },
          },
          {
            labelKey: "nav.inventoryValuation",
            href: "/dashboard/inventory/valuation",
            requiredPermission: { resource: "inventory", action: "read" },
          },
        ],
      },
    ],
    isCollapsible: false,
  },
  {
    labelKey: "nav.group.finances",
    icon: DollarSign,
    requiredPermission: { resource: "invoices", action: "read" },
    children: [
      {
        labelKey: "nav.finance",
        href: "/dashboard/finance",
        icon: DollarSign,
        requiredPermission: { resource: "invoices", action: "read" },
      },
      {
        labelKey: "nav.reports",
        href: "/dashboard/reports",
        icon: BarChart3,
        requiredPermission: { resource: "reports", action: "read" },
        children: [
          {
            labelKey: "nav.reports",
            href: "/dashboard/reports",
            requiredPermission: { resource: "reports", action: "read" },
          },
          {
            labelKey: "nav.taxReport",
            href: "/dashboard/reports/tax",
            requiredPermission: { resource: "reports", action: "read" },
          },
        ],
      },
      {
        labelKey: "nav.expenses",
        href: "/dashboard/expenses",
        icon: DollarSign,
        requiredPermission: { resource: "expenses", action: "read" },
        children: [
          {
            labelKey: "nav.expenses",
            href: "/dashboard/expenses",
            requiredPermission: { resource: "expenses", action: "read" },
          },
          {
            labelKey: "nav.newExpense",
            href: "/dashboard/expenses/new",
            requiredPermission: { resource: "expenses", action: "create" },
          },
          {
            labelKey: "nav.expenseCategories",
            href: "/dashboard/expenses/categories",
            requiredPermission: {
              resource: "expense_categories",
              action: "read",
            },
          },
        ],
      },
      {
        labelKey: "nav.estimates",
        href: "/dashboard/estimates",
        icon: DollarSign,
        requiredPermission: { resource: "work_orders", action: "read" },
        children: [
          {
            labelKey: "nav.estimates",
            href: "/dashboard/estimates",
            requiredPermission: { resource: "work_orders", action: "read" },
          },
          {
            labelKey: "nav.newEstimate",
            href: "/dashboard/estimates/new",
            requiredPermission: { resource: "work_orders", action: "create" },
          },
        ],
      },
      {
        labelKey: "nav.cashRegister",
        href: "/dashboard/cash-register",
        icon: DollarSign,
        requiredPermission: { resource: "cash_register", action: "read" },
        children: [
          {
            labelKey: "nav.cashRegister",
            href: "/dashboard/cash-register",
            requiredPermission: { resource: "cash_register", action: "read" },
          },
          {
            labelKey: "nav.cashRegisterHistory",
            href: "/dashboard/cash-register/history",
            requiredPermission: { resource: "cash_register", action: "read" },
          },
        ],
      },
      {
        labelKey: "nav.endOfDay",
        href: "/dashboard/eod-close",
        icon: DollarSign,
        requiredPermission: { resource: "day_close", action: "read" },
      },
      {
        labelKey: "nav.payroll",
        href: "/dashboard/payroll",
        icon: DollarSign,
        requiredPermission: { resource: "payroll", action: "read" },
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
  {
    labelKey: "nav.settings",
    href: "/dashboard/settings",
    icon: Settings,
    requiredPermission: { resource: "settings", action: "read" },
  },
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
  const {
    isMechanic,
    isOrgOwner,
    hasPermission,
    loading: roleLoading,
  } = useCurrentUserRole();
  const { isFeatureEnabled, loading: featuresLoading } = useAvailableFeatures();

  const mechanicHomeItem: NavItem = {
    labelKey: "nav.bayView",
    href: "/dashboard/bay-view",
    icon: LayoutGrid,
  };

  const isDefinitelyMechanic = !roleLoading && isMechanic;

  // ── Permission-based filtering ──
  const isPermissionAllowed = (perm?: {
    resource: string;
    action: string;
  }): boolean => {
    if (!perm) return true;
    // Org Owner always has access
    if (isOrgOwner) return true;
    return hasPermission(
      perm.resource,
      perm.action as
        | "read"
        | "create"
        | "update"
        | "delete"
        | "manage"
        | "invite"
        | "write",
    );
  };

  // Map nav groups/items to feature keys so they can be gated
  const navFeatureMap: Record<string, FeatureKey | undefined> = {
    "nav.group.inventory": FEATURE_KEYS.INVENTORY,
    "nav.serviceReminders": FEATURE_KEYS.SERVICE_REMINDERS,
    "nav.group.finances": FEATURE_KEYS.FINANCE,
  };

  const isFeatureAllowed = (href: string): boolean => {
    const featureKey = navFeatureMap[href];
    if (!featureKey) return true;
    return isFeatureEnabled(featureKey);
  };

  const isGroupAllowed = (
    groupLabelKey: string,
    groupPerm?: { resource: string; action: string },
  ): boolean => {
    // Permission gate first
    if (groupPerm && !isPermissionAllowed(groupPerm)) return false;
    // Then feature gate
    const featureKey = navFeatureMap[groupLabelKey];
    if (!featureKey) return true;
    return isFeatureEnabled(featureKey);
  };

  // For mechanics: only show shop-floor items with mechanic safe items
  let filteredNavGroups = isDefinitelyMechanic
    ? navGroups
        .filter((g) => g.labelKey === "nav.group.shopFloor")
        .map((g) => ({
          ...g,
          children: g.children.filter((c) => c.href !== "/dashboard/bay-view"),
        }))
    : navGroups;

  // Apply permission filtering then feature-flag filtering
  filteredNavGroups = filteredNavGroups
    .filter((g) => isGroupAllowed(g.labelKey, g.requiredPermission))
    .map((g) => ({
      ...g,
      children: g.children.filter(
        (c) =>
          isPermissionAllowed(c.requiredPermission) && isFeatureAllowed(c.href),
      ),
    }))
    .filter((g) => g.children.length > 0);

  const filteredPrimaryItems = isDefinitelyMechanic
    ? [mechanicHomeItem]
    : primaryItems.filter((item) => isFeatureAllowed(item.href));

  const filteredSettingsItems = isDefinitelyMechanic
    ? []
    : settingsItems.filter((s) =>
        s.requiredPermission ? isPermissionAllowed(s.requiredPermission) : true,
      );

  const filteredUtilityItems = utilityItems;

  // Flatten NavItems including nested children for search/active matching
  const flattenItems = (items: NavItem[]): NavItem[] => {
    const result: NavItem[] = [];
    for (const item of items) {
      result.push(item);
      if (item.children) {
        for (const child of item.children) {
          if (child.href === item.href) continue;
          result.push({
            labelKey: child.labelKey,
            href: child.href,
            icon: item.icon,
          });
        }
      }
    }
    return result;
  };

  const filteredAllItems = [
    ...filteredPrimaryItems,
    ...filteredNavGroups.flatMap((group) => flattenItems(group.children)),
    ...filteredUtilityItems,
    ...filteredSettingsItems,
  ];

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    if (pathname === href) return true;
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

  const fallbackItem = isDefinitelyMechanic
    ? mechanicHomeItem
    : primaryItems[0];

  const resolvedCurrentItem =
    [...filteredAllItems]
      .sort((a, b) => b.href.length - a.href.length)
      .find((item) => isActive(item.href)) ?? fallbackItem;

  const resolvedCurrentGroup =
    filteredNavGroups.find((group) => {
      if (group.children.some((item) => item.href === resolvedCurrentItem.href))
        return true;
      return group.children.some((item) =>
        item.children?.some((sub) => sub.href === resolvedCurrentItem.href),
      );
    }) ?? null;

  const resolvedCurrentSection =
    filteredSections.find((section) => {
      if (section.items.some((item) => item.href === resolvedCurrentItem.href))
        return true;
      return section.items.some((item) =>
        item.children?.some((sub) => sub.href === resolvedCurrentItem.href),
      );
    }) ?? filteredSections[0];

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
