export const APP_NAME = "Zer";
export const APP_DESCRIPTION = "Small business ERP system";

export const PUBLIC_ROUTES = [
  "/landing",
  "/login",
  "/register",
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
  { value: "fitness", label: "Фитнес бараа" },
  { value: "other", label: "Бусад" },
] as const;

export function getCompanyTypeLabel(type: string): string {
  const found = COMPANY_TYPES.find((ct) => ct.value === type);
  return found?.label ?? type;
}

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
  other: ["Бусад"],
};
