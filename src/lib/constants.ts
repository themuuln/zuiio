export const APP_NAME = "Zer ERP";
export const APP_DESCRIPTION =
  "Mongolia-first mini ERP for small businesses managing inventory, sales, and cash flow.";

export const PUBLIC_ROUTES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/auth/callback",
] as const;

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: "Бэлэн",
  bank_transfer: "Данс",
  card: "Карт",
  invoice: "Нэхэмжлэл",
};

export const SALE_STATUS_LABELS: Record<string, string> = {
  completed: "Дууссан",
  pending: "Хүлээгдэж буй",
  cancelled: "Цуцлагдсан",
};

export const COMPANY_TYPES = [
  { value: "retail", label: "Жижиглэн худалдаа" },
  { value: "wholesale", label: "Бөөний худалдаа" },
  { value: "cafe", label: "Кафе" },
  { value: "restaurant", label: "Ресторан" },
  { value: "gym", label: "Фитнесс / Гим" },
  { value: "salon", label: "Гоо сайхан / Салон" },
  { value: "service", label: "Үйлчилгээ" },
  { value: "other", label: "Бусад" },
] as const;

export type CompanyType = (typeof COMPANY_TYPES)[number]["value"];

export function getCompanyTypeLabel(type: string): string {
  return COMPANY_TYPES.find((ct) => ct.value === type)?.label ?? type;
}

/**
 * Preset product categories per company type.
 * Shown as suggestions when creating products.
 */
export const PRESET_CATEGORIES: Record<string, string[]> = {
  retail: ["Хүнс", "Ундаа", "Ахуйн бараа", "Хувцас", "Цахилгаан бараа"],
  wholesale: ["Хүнс", "Ундаа", "Ахуйн бараа", "Барилгын материал"],
  cafe: ["Кофе", "Цай", "Зууш", "Амттан"],
  restaurant: ["Хоол", "Ундаа", "Зууш", "Амттан", "Согтууруулах ундаа"],
  gym: ["Supplement", "Хувцас", "Тоног төхөөрөмж", "Уураг"],
  salon: ["Үс засалт", "Хумс", "Арьс арчилгаа", "Бүтээгдэхүүн"],
  service: ["Үндсэн бүтээгдэхүүн", "Дагалдах хэрэгсэл"],
  other: [],
};
