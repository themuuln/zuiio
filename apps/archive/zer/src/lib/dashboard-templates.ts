/**
 * Dashboard template presets.
 *
 * Server-safe module: pure data + lookups only — no React, no client imports.
 * Section ids map 1:1 to components rendered by the dashboard page.
 */
import type { MessageKey } from "@/lib/i18n/messages";

export const DASHBOARD_SECTION_IDS = [
  "today-pulse",
  "quick-shortcuts",
  "recent-sales",
  "monthly-trend",
  "delivery-stats",
  "low-stock",
] as const;

export type DashboardSectionId = (typeof DASHBOARD_SECTION_IDS)[number];

export interface DashboardTemplate {
  id: string;
  labelKey: MessageKey;
  descriptionKey: MessageKey;
  sections: DashboardSectionId[];
}

export const DEFAULT_TEMPLATE_ID = "default";

export const DASHBOARD_TEMPLATES: DashboardTemplate[] = [
  {
    id: "default",
    labelKey: "dashboardTemplate.default.label",
    descriptionKey: "dashboardTemplate.default.description",
    sections: [
      "today-pulse",
      "quick-shortcuts",
      "recent-sales",
      "monthly-trend",
      "delivery-stats",
    ],
  },
  {
    id: "retail",
    labelKey: "dashboardTemplate.retail.label",
    descriptionKey: "dashboardTemplate.retail.description",
    sections: [
      "today-pulse",
      "quick-shortcuts",
      "recent-sales",
      "monthly-trend",
      "low-stock",
    ],
  },
  {
    id: "financial",
    labelKey: "dashboardTemplate.financial.label",
    descriptionKey: "dashboardTemplate.financial.description",
    sections: ["today-pulse", "recent-sales", "monthly-trend"],
  },
  {
    id: "inventory",
    labelKey: "dashboardTemplate.inventory.label",
    descriptionKey: "dashboardTemplate.inventory.description",
    sections: ["today-pulse", "low-stock", "recent-sales"],
  },
];

/**
 * Resolve a template by id, falling back to the default template for
 * unknown/missing ids (e.g. unmigrated rows or corrupt values).
 */
export function templateById(id: string | null | undefined): DashboardTemplate {
  return (
    DASHBOARD_TEMPLATES.find((template) => template.id === id) ??
    DASHBOARD_TEMPLATES[0]
  );
}

/**
 * Map an organization's company type to a recommended dashboard template id.
 * Used during onboarding to pre-select a sensible layout.
 */
export function templateForCompanyType(
  companyType: string | null | undefined,
): string {
  switch (companyType) {
    case "retail":
    case "restaurant":
    case "cafe":
      return "retail";
    case "service":
      return "financial";
    case "manufacturing":
    case "wholesale":
      return "inventory";
    default:
      return DEFAULT_TEMPLATE_ID;
  }
}
