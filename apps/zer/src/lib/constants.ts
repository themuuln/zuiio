import {
  DEFAULT_LOCALE,
  type Locale,
  type MessageKey,
  messages,
  translate,
} from "@/lib/i18n/messages";

export const APP_NAME = messages[DEFAULT_LOCALE]["app.name"];
export const APP_DESCRIPTION = messages[DEFAULT_LOCALE]["app.description"];

export const PUBLIC_ROUTES = [
  "/landing",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/update-password",
  "/organization/new",
  "/sso",
  "/offline",
];

export const COMPANY_TYPES = [
  {
    value: "retail",
    labelKey: "companyType.retail",
    label: messages.mn["companyType.retail"],
  },
  {
    value: "wholesale",
    labelKey: "companyType.wholesale",
    label: messages.mn["companyType.wholesale"],
  },
  {
    value: "service",
    labelKey: "companyType.service",
    label: messages.mn["companyType.service"],
  },
  {
    value: "manufacturing",
    labelKey: "companyType.manufacturing",
    label: messages.mn["companyType.manufacturing"],
  },
  {
    value: "restaurant",
    labelKey: "companyType.restaurant",
    label: messages.mn["companyType.restaurant"],
  },
  {
    value: "gym",
    labelKey: "companyType.gym",
    label: messages.mn["companyType.gym"],
  },
  {
    value: "religious",
    labelKey: "companyType.religious",
    label: messages.mn["companyType.religious"],
  },
  {
    value: "other",
    labelKey: "companyType.other",
    label: messages.mn["companyType.other"],
  },
] as const;

export function getCompanyTypeLabel(
  type: string,
  locale: Locale = DEFAULT_LOCALE,
): string {
  const found = COMPANY_TYPES.find((companyType) => companyType.value === type);
  return found ? translate(locale, found.labelKey) : type;
}

// ─── Feature definitions for onboarding & sidebar gating ───

export interface FeatureDef {
  key: string;
  labelKey: MessageKey;
  descriptionKey: MessageKey;
  label: string;
  description: string;
}

const localizedFeature = (
  key: string,
  labelKey: MessageKey,
  descriptionKey: MessageKey,
): FeatureDef => ({
  key,
  labelKey,
  descriptionKey,
  label: messages[DEFAULT_LOCALE][labelKey],
  description: messages[DEFAULT_LOCALE][descriptionKey],
});

export const FEATURES: FeatureDef[] = [
  localizedFeature("sales", "feature.sales.label", "feature.sales.description"),
  localizedFeature("shop", "feature.shop.label", "feature.shop.description"),
  localizedFeature(
    "expenses",
    "feature.expenses.label",
    "feature.expenses.description",
  ),
  localizedFeature(
    "purchases",
    "feature.purchases.label",
    "feature.purchases.description",
  ),
  localizedFeature(
    "returns",
    "feature.returns.label",
    "feature.returns.description",
  ),
  localizedFeature(
    "deliveries",
    "feature.deliveries.label",
    "feature.deliveries.description",
  ),
  localizedFeature(
    "coupons",
    "feature.coupons.label",
    "feature.coupons.description",
  ),
  localizedFeature(
    "gift_cards",
    "feature.giftCards.label",
    "feature.giftCards.description",
  ),
  localizedFeature(
    "promotions",
    "feature.promotions.label",
    "feature.promotions.description",
  ),
  localizedFeature(
    "reviews",
    "feature.reviews.label",
    "feature.reviews.description",
  ),
  localizedFeature("blog", "feature.blog.label", "feature.blog.description"),
  localizedFeature(
    "webhooks",
    "feature.webhooks.label",
    "feature.webhooks.description",
  ),
  localizedFeature(
    "invoices",
    "feature.invoices.label",
    "feature.invoices.description",
  ),
  localizedFeature(
    "quotations",
    "feature.quotations.label",
    "feature.quotations.description",
  ),
  localizedFeature(
    "discounts",
    "feature.discounts.label",
    "feature.discounts.description",
  ),
  localizedFeature(
    "coupons",
    "feature.coupons.label",
    "feature.coupons.description",
  ),
  localizedFeature(
    "gift_cards",
    "feature.giftCards.label",
    "feature.giftCards.description",
  ),
  localizedFeature(
    "promotions",
    "feature.promotions.label",
    "feature.promotions.description",
  ),
  localizedFeature(
    "reports",
    "feature.reports.label",
    "feature.reports.description",
  ),
  localizedFeature(
    "commissions",
    "feature.commissions.label",
    "feature.commissions.description",
  ),
  localizedFeature(
    "accounting",
    "feature.accounting.label",
    "feature.accounting.description",
  ),
  localizedFeature("boms", "feature.boms.label", "feature.boms.description"),
  localizedFeature(
    "production_orders",
    "feature.productionOrders.label",
    "feature.productionOrders.description",
  ),
  localizedFeature(
    "job_costing",
    "feature.jobCosting.label",
    "feature.jobCosting.description",
  ),
  localizedFeature(
    "quality_control",
    "feature.qualityControl.label",
    "feature.qualityControl.description",
  ),
  localizedFeature(
    "material_tracking",
    "feature.materialTracking.label",
    "feature.materialTracking.description",
  ),
];

/**
 * Shared feature key constants used across nav, layout, and settings.
 * These keys gate sidebar items in navigation.ts and are pushed to
 * the allFeatures array in layout.tsx. Keep in sync.
 */
export const FEATURE_KEYS = {
  hr: "hr",
  manufacturing: [
    "boms",
    "production_orders",
    "job_costing",
    "quality_control",
    "material_tracking",
  ] as const,
} as const;

// Map nav item href → feature key for sidebar gating
export const NAV_FEATURE_MAP: Record<string, string> = {
  "/sales": "sales",
  "/shop": "shop",
  "/expenses": "expenses",
  "/purchases": "purchases",
  "/returns": "returns",
  "/deliveries": "deliveries",
  "/invoices": "invoices",
  "/quotations": "quotations",
  "/discounts": "discounts",
  "/reports": "reports",
  "/commissions": "commissions",
  "/bom": "boms",
  "/production": "production_orders",
  "/job-costing": "job_costing",
  "/accounting": "accounting",
};

export const PRESET_CATEGORIES: Record<string, readonly string[]> = {
  retail: ["Хүнс", "Ундаа", "Хувцас", "Гэр ахуй", "Цахилгаан бараа", "Бусад"],
  wholesale: [
    "Хүнс",
    "Ундаа",
    "Гэр ахуй",
    "Цахилгаан бараа",
    "Барилга",
    "Бусад",
  ],
  service: ["Засвар үйлчилгээ", "Зөвлөгөө", "Сургалт", "Бусад"],
  manufacturing: ["Түүхий эд", "Сав баглаа", "Бэлэн бүтээгдэхүүн", "Бусад"],
  restaurant: ["Хоол", "Ундаа", "Амттан", "Бусад"],
  gym: [
    "Protein",
    "Creatine",
    "Amino Acids / BCAA",
    "Vitamins & Minerals",
    "Omega & Oils",
    "Wellness & Health",
    "Хувцас",
    "Ундаа",
    "Бусад",
  ],
  fitness: [
    "Protein",
    "Creatine",
    "Amino Acids / BCAA",
    "Vitamins & Minerals",
    "Omega & Oils",
    "Wellness & Health",
    "Хувцас",
    "Ундаа",
    "Бусад",
  ],
  religious: [
    "Бурхан, Хийд",
    "Зурга",
    "Тахилын хэрэгсэл",
    "Ном, Судар",
    "Эрдэнэ",
    "Хадаг",
    "Шашин хувцас",
    "Утлага, хонх",
    "Дуут аяга",
    "Хийморь",
    "Бусад",
  ],
  other: ["Бусад"],
};
