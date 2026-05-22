"use client";

import { useMemo } from "react";
import { usePathname } from "@/lib/i18n/navigation";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

const SEGMENT_TO_NAV_KEY: Record<string, string> = {
  dashboard: "nav.dashboard",
  mechanic: "nav.mechanic",
  "bay-view": "nav.bayView",
  "work-orders": "nav.workOrders",
  customers: "nav.customers",
  vehicles: "nav.vehicles",
  "service-reminders": "nav.serviceReminders",
  inventory: "nav.inventory",
  "vehicle-models": "nav.vehicleModels",
  settings: "nav.settings",
  admin: "nav.admin",
  organization: "nav.organization",
  members: "nav.members",
  finance: "nav.finance",
  expenses: "nav.expenses",
  reports: "nav.reports",
  guide: "nav.guide",
  services: "nav.services",
  movements: "nav.inventoryMovements",
  "purchase-orders": "nav.inventoryPurchaseOrders",
  suppliers: "nav.inventorySuppliers",
  "parts-cars": "nav.inventoryPartsCars",
  alerts: "nav.inventoryAlerts",
  valuation: "nav.inventoryValuation",
  new: "common.createNew",
  edit: "common.edit",
};

function humanizeSlug(slug: string): string {
  if (slug === "new") return "common.createNew";
  if (slug === "edit") return "common.edit";
  if (/^[0-9a-f-]{36}$/.test(slug) || /^\d+$/.test(slug)) {
    return `#${slug.slice(0, 8)}`;
  }
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function useBreadcrumbs(): BreadcrumbItem[] {
  const pathname = usePathname();

  return useMemo(() => {
    const crumbs: BreadcrumbItem[] = [];
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length === 0) return crumbs;

    crumbs.push({ label: "nav.dashboard", href: "/dashboard" });
    if (segments.length === 1 && segments[0] === "dashboard") {
      return crumbs;
    }

    const secondSeg = segments[1];
    if (secondSeg && SEGMENT_TO_NAV_KEY[secondSeg]) {
      crumbs.push({
        label: SEGMENT_TO_NAV_KEY[secondSeg],
        href: `/${segments[0]}/${secondSeg}`,
      });
    }

    const remaining = segments.slice(2);
    for (let i = 0; i < remaining.length; i++) {
      const seg = remaining[i];
      const parentPath = `/${segments.slice(0, 2 + i + 1).join("/")}`;
      if (SEGMENT_TO_NAV_KEY[seg]) {
        crumbs.push({ label: SEGMENT_TO_NAV_KEY[seg], href: parentPath });
      } else {
        crumbs.push({
          label: humanizeSlug(seg),
          href: /^\d+$/.test(seg) ? undefined : parentPath,
        });
      }
    }

    return crumbs;
  }, [pathname]);
}
