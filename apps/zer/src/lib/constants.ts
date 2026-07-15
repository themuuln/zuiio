export const APP_NAME = "Zer";
export const APP_DESCRIPTION = "Small business ERP system";

export const PUBLIC_ROUTES = [
  "/landing",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/update-password",
  "/organization/new",
];

export const COMPANY_TYPES = [
  { value: "retail", label: "Жижиглэн худалдаа" },
  { value: "wholesale", label: "Бөөний худалдаа" },
  { value: "service", label: "Үйлчилгээ" },
  { value: "manufacturing", label: "Үйлдвэрлэл" },
  { value: "restaurant", label: "Ресторан" },
  { value: "gym", label: "Фитнес / Спорт клуб" },
  { value: "religious", label: "Шашны дэлгүүр" },
  { value: "other", label: "Бусад" },
] as const;

export function getCompanyTypeLabel(type: string): string {
  const found = COMPANY_TYPES.find((ct) => ct.value === type);
  return found?.label ?? type;
}

// ─── Feature definitions for onboarding & sidebar gating ───

export interface FeatureDef {
  key: string;
  label: string;
  description: string;
}

export const FEATURES: FeatureDef[] = [
  {
    key: "sales",
    label: "Борлуулалт",
    description: "Борлуулалтын бүртгэл, касс",
  },
  { key: "shop", label: "Дэлгүүр", description: "Дэлгүүрийн интерфейс" },
  { key: "expenses", label: "Зарлага", description: "Зарлагын бүртгэл" },
  {
    key: "purchases",
    label: "Худалдан авалт",
    description: "Худалдан авалтын бүртгэл",
  },
  { key: "returns", label: "Буцаалт", description: "Буцаалтын бүртгэл" },
  {
    key: "invoices",
    label: "Нэхэмжлэх",
    description: "Нэхэмжлэх үүсгэх, илгээх",
  },
  {
    key: "quotations",
    label: "Үнийн санал",
    description: "Үнийн санал бэлтгэх",
  },
  { key: "discounts", label: "Хямдрал", description: "Хямдрал, урамшуулал" },
  { key: "reports", label: "Тайлан", description: "Тайлан, шинжилгээ" },
  { key: "commissions", label: "Комисс", description: "Комиссын тооцоо" },
  { key: "accounting", label: "Нягтлан", description: "Нягтлан бодох бүртгэл" },
];

/**
 * Shared feature key constants used across nav, layout, and settings.
 * These keys gate sidebar items in navigation.ts and are pushed to
 * the allFeatures array in layout.tsx. Keep in sync.
 */
export const FEATURE_KEYS = {
  hr: "hr",
} as const;

// Map nav item href → feature key for sidebar gating
export const NAV_FEATURE_MAP: Record<string, string> = {
  "/sales": "sales",
  "/shop": "shop",
  "/expenses": "expenses",
  "/purchases": "purchases",
  "/returns": "returns",
  "/invoices": "invoices",
  "/quotations": "quotations",
  "/discounts": "discounts",
  "/reports": "reports",
  "/commissions": "commissions",
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
  ],
  other: ["Бусад"],
};
