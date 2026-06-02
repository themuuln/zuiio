/**
 * Plan-to-Feature mapping.
 * Defines which feature flags each subscription plan tier unlocks.
 */

export type PlanType = "starter" | "pro" | "business" | "enterprise";

/**
 * Feature flag keys used throughout the app.
 * These correspond to flag_key in the feature_flags table.
 */
export const FEATURE_KEYS = {
  // Operations
  WORK_ORDERS: "work_orders",
  BAY_VIEW: "bay_view",
  MECHANIC: "mechanic",
  MECHANIC_PERFORMANCE: "mechanic_performance",
  EOD_CLOSE: "eod_close",

  // CRM
  CUSTOMERS: "customers",
  VEHICLES: "vehicles",
  SERVICE_REMINDERS: "service_reminders",
  ESTIMATES: "estimates",
  APPOINTMENTS: "appointments",

  // Inventory
  INVENTORY: "inventory",
  PURCHASE_ORDERS: "purchase_orders",
  SUPPLIERS: "suppliers",
  PARTS_CARS: "parts_cars",
  INVENTORY_VALUATION: "inventory_valuation",
  INVENTORY_ALERTS: "inventory_alerts",

  // Financial
  FINANCE: "finance",
  EXPENSES: "expenses",
  PAYROLL: "payroll",
  REPORTS: "reports",

  // Settings & Config
  PRICE_RULES: "price_rules",
  COMMISSION_RULES: "commission_rules",
  DIAGNOSIS_LABELS: "diagnosis_labels",
  VEHICLE_MODELS: "vehicle_models",
  DATA_SHARING: "data_sharing",
  TELEGRAM: "telegram",
  SETTINGS: "settings",
} as const;

export type FeatureKey = (typeof FEATURE_KEYS)[keyof typeof FEATURE_KEYS];

/**
 * Features available in each plan tier.
 * Starter = essentials only. Enterprise = everything ("all").
 */
const STARTER_FEATURES: FeatureKey[] = [
  FEATURE_KEYS.WORK_ORDERS,
  FEATURE_KEYS.BAY_VIEW,
  FEATURE_KEYS.MECHANIC,
  FEATURE_KEYS.CUSTOMERS,
  FEATURE_KEYS.VEHICLES,
  FEATURE_KEYS.FINANCE,
  FEATURE_KEYS.EXPENSES,
  FEATURE_KEYS.REPORTS,
  FEATURE_KEYS.DIAGNOSIS_LABELS,
  FEATURE_KEYS.SETTINGS,
];

const PRO_FEATURES: FeatureKey[] = [
  ...STARTER_FEATURES,
  FEATURE_KEYS.MECHANIC_PERFORMANCE,
  FEATURE_KEYS.SERVICE_REMINDERS,
  FEATURE_KEYS.ESTIMATES,
  FEATURE_KEYS.APPOINTMENTS,
  FEATURE_KEYS.INVENTORY,
  FEATURE_KEYS.PAYROLL,
  FEATURE_KEYS.VEHICLE_MODELS,
];

const BUSINESS_FEATURES: FeatureKey[] = [
  ...PRO_FEATURES,
  FEATURE_KEYS.EOD_CLOSE,
  FEATURE_KEYS.PURCHASE_ORDERS,
  FEATURE_KEYS.SUPPLIERS,
  FEATURE_KEYS.PARTS_CARS,
  FEATURE_KEYS.INVENTORY_VALUATION,
  FEATURE_KEYS.INVENTORY_ALERTS,
  FEATURE_KEYS.PRICE_RULES,
  FEATURE_KEYS.COMMISSION_RULES,
  FEATURE_KEYS.DATA_SHARING,
  FEATURE_KEYS.TELEGRAM,
];

const ALL_FEATURES: FeatureKey[] = Object.values(FEATURE_KEYS);

export const PLAN_FEATURES: Record<PlanType, FeatureKey[] | "all"> = {
  starter: STARTER_FEATURES,
  pro: PRO_FEATURES,
  business: BUSINESS_FEATURES,
  enterprise: "all",
};

/**
 * Returns the list of feature keys available for a given plan type.
 * enterprise returns all known feature keys.
 */
export function getPlanFeatures(planType: PlanType): FeatureKey[] {
  const features = PLAN_FEATURES[planType];
  if (features === "all") {
    return ALL_FEATURES;
  }
  return features;
}

/**
 * Returns whether a specific feature is available for the given plan type.
 */
export function isPlanFeatureEnabled(
  planType: PlanType,
  feature: FeatureKey,
): boolean {
  const features = PLAN_FEATURES[planType];
  if (features === "all") return true;
  return features.includes(feature);
}

/**
 * Returns the next plan tier that includes a given feature (for upgrade prompts).
 * Returns null if the feature is available on the current plan or even enterprise doesn't have it.
 */
export function getNextPlanWithFeature(
  currentPlan: PlanType,
  feature: FeatureKey,
): PlanType | null {
  // If current plan already has the feature, no need to upgrade
  if (isPlanFeatureEnabled(currentPlan, feature)) {
    return null;
  }

  const tiers: PlanType[] = ["starter", "pro", "business", "enterprise"];
  const currentIdx = tiers.indexOf(currentPlan);

  for (let i = currentIdx + 1; i < tiers.length; i++) {
    if (isPlanFeatureEnabled(tiers[i], feature)) {
      return tiers[i];
    }
  }
  return null;
}
