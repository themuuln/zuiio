import { Constants } from "@/lib/supabase/types";

/**
 * All available app permissions matching the DB enum.
 */
export const APP_PERMISSIONS = Constants.public.Enums.app_permission;

/** Type for a single permission string */
export type AppPermission = (typeof APP_PERMISSIONS)[number];

/** Groups of permissions for display in the UI */
export const PERMISSION_GROUPS: {
  label: string;
  key: string;
  permissions: AppPermission[];
}[] = [
  {
    label: "Бүтээгдэхүүн",
    key: "products",
    permissions: APP_PERMISSIONS.filter((p) => p.startsWith("products.")),
  },
  {
    label: "Ангилалууд",
    key: "categories",
    permissions: APP_PERMISSIONS.filter((p) => p.startsWith("categories.")),
  },
  {
    label: "Брэндүүд",
    key: "brands",
    permissions: APP_PERMISSIONS.filter((p) => p.startsWith("brands.")),
  },
  {
    label: "Харилцагчид",
    key: "contacts",
    permissions: APP_PERMISSIONS.filter((p) => p.startsWith("contacts.")),
  },
  {
    label: "Купонууд",
    key: "coupons",
    permissions: APP_PERMISSIONS.filter((p) => p.startsWith("coupons.")),
  },
  {
    label: "Сурталчилгаа",
    key: "promotions",
    permissions: APP_PERMISSIONS.filter((p) => p.startsWith("promotions.")),
  },
  {
    label: "Борлуулалт",
    key: "sales",
    permissions: APP_PERMISSIONS.filter((p) => p.startsWith("sales.")),
  },
  {
    label: "Зарлага",
    key: "expenses",
    permissions: APP_PERMISSIONS.filter((p) => p.startsWith("expenses.")),
  },
  {
    label: "Нэхэмжлэл",
    key: "invoices",
    permissions: APP_PERMISSIONS.filter((p) => p.startsWith("invoices.")),
  },
  {
    label: "Агуулах",
    key: "warehouses",
    permissions: APP_PERMISSIONS.filter((p) => p.startsWith("warehouses.")),
  },
  {
    label: "Барааны хөдөлгөөн",
    key: "stock_movements",
    permissions: APP_PERMISSIONS.filter((p) =>
      p.startsWith("stock_movements."),
    ),
  },
  {
    label: "Хэмжих нэгж",
    key: "uom_conversions",
    permissions: APP_PERMISSIONS.filter((p) =>
      p.startsWith("uom_conversions."),
    ),
  },
  {
    label: "Гишүүд",
    key: "members",
    permissions: APP_PERMISSIONS.filter((p) => p.startsWith("members.")),
  },
  {
    label: "Удирдлага",
    key: "admin",
    permissions: APP_PERMISSIONS.filter((p) =>
      [
        "roles.manage",
        "settings.manage",
        "reports.manage",
        "notifications.manage",
        "audit_log.read",
        "emails.manage",
      ].includes(p),
    ),
  },
  {
    label: "И-мэйл",
    key: "emails",
    permissions: APP_PERMISSIONS.filter((p) => p.startsWith("emails.")),
  },
  {
    label: "Худалдан авалт",
    key: "purchases",
    permissions: APP_PERMISSIONS.filter((p) => p.startsWith("purchases.")),
  },
  {
    label: "Үнийн санал",
    key: "quotations",
    permissions: APP_PERMISSIONS.filter((p) => p.startsWith("quotations.")),
  },
  {
    label: "Буцаалт",
    key: "returns",
    permissions: APP_PERMISSIONS.filter((p) => p.startsWith("returns.")),
  },
  {
    label: "Нягтлан бодох бүртгэл",
    key: "accounting",
    permissions: APP_PERMISSIONS.filter((p) =>
      ["accounting.manage"].includes(p),
    ),
  },
  {
    label: "Хямдрал",
    key: "discounts",
    permissions: APP_PERMISSIONS.filter((p) => p.startsWith("discounts.")),
  },
  {
    label: "Бэлгийн карт",
    key: "gift_cards",
    permissions: APP_PERMISSIONS.filter((p) => p.startsWith("gift_cards.")),
  },
  {
    label: "Үйлдвэрлэл",
    key: "manufacturing",
    permissions: APP_PERMISSIONS.filter((p) =>
      [
        "boms.create",
        "boms.read",
        "boms.update",
        "boms.delete",
        "production_orders.create",
        "production_orders.read",
        "production_orders.update",
        "production_orders.delete",
        "production_costs.read",
        "quality_checks.create",
        "quality_checks.read",
      ].includes(p),
    ),
  },
];

/** Human-readable labels for each permission */
export const PERMISSION_LABELS: Record<AppPermission, string> = {
  "products.create": "Бүтээгдэхүүн үүсгэх",
  "products.read": "Бүтээгдэхүүн харах",
  "products.update": "Бүтээгдэхүүн засах",
  "products.delete": "Бүтээгдэхүүн устгах",
  "categories.create": "Ангилал үүсгэх",
  "categories.read": "Ангилал харах",
  "categories.update": "Ангилал засах",
  "categories.delete": "Ангилал устгах",
  "brands.create": "Брэнд үүсгэх",
  "brands.read": "Брэнд харах",
  "brands.update": "Брэнд засах",
  "brands.delete": "Брэнд устгах",
  "contacts.create": "Харилцагч үүсгэх",
  "contacts.read": "Харилцагч харах",
  "contacts.update": "Харилцагч засах",
  "contacts.delete": "Харилцагч устгах",
  "coupons.create": "Купон үүсгэх",
  "coupons.read": "Купон харах",
  "coupons.update": "Купон засах",
  "coupons.delete": "Купон устгах",
  "promotions.create": "Сурталчилгаа үүсгэх",
  "promotions.read": "Сурталчилгаа харах",
  "promotions.update": "Сурталчилгаа засах",
  "promotions.delete": "Сурталчилгаа устгах",
  "sales.create": "Борлуулалт үүсгэх",
  "sales.read": "Борлуулалт харах",
  "sales.update": "Борлуулалт засах",
  "sales.delete": "Борлуулалт устгах",
  "expenses.create": "Зарлага үүсгэх",
  "expenses.read": "Зарлага харах",
  "expenses.update": "Зарлага засах",
  "expenses.delete": "Зарлага устгах",
  "invoices.create": "Нэхэмжлэл үүсгэх",
  "invoices.read": "Нэхэмжлэл харах",
  "invoices.update": "Нэхэмжлэл засах",
  "invoices.delete": "Нэхэмжлэл устгах",
  "warehouses.create": "Агуулах үүсгэх",
  "warehouses.read": "Агуулах харах",
  "warehouses.update": "Агуулах засах",
  "warehouses.delete": "Агуулах устгах",
  "stock_movements.create": "Барааны хөдөлгөөн үүсгэх",
  "stock_movements.read": "Барааны хөдөлгөөн харах",
  "stock_movements.update": "Барааны хөдөлгөөн засах",
  "stock_movements.delete": "Барааны хөдөлгөөн устгах",
  "uom_conversions.create": "Хэмжих нэгж үүсгэх",
  "uom_conversions.read": "Хэмжих нэгж харах",
  "uom_conversions.update": "Хэмжих нэгж засах",
  "uom_conversions.delete": "Хэмжих нэгж устгах",
  "members.read": "Гишүүд харах",
  "members.invite": "Гишүүд урих",
  "members.remove": "Гишүүд хасах",
  "members.manage_role": "Гишүүдийн үүрэг өөрчлөх",
  "roles.manage": "Үүрэг, эрхүүдийг удирдах",
  "settings.manage": "Тохиргоо удирдах",
  "reports.manage": "Тайлан удирдах",
  "notifications.manage": "Мэдэгдэл удирдах",
  "audit_log.read": "Үйлдлийн түүх харах",
  "emails.manage": "И-мэйл тохиргоо удирдах",
  "purchases.create": "Худалдан авалт үүсгэх",
  "purchases.read": "Худалдан авалт харах",
  "purchases.update": "Худалдан авалт засах",
  "purchases.delete": "Худалдан авалт устгах",
  "quotations.create": "Үнийн санал үүсгэх",
  "quotations.read": "Үнийн санал харах",
  "quotations.update": "Үнийн санал засах",
  "quotations.delete": "Үнийн санал устгах",
  "returns.create": "Буцаалт үүсгэх",
  "returns.read": "Буцаалт харах",
  "returns.update": "Буцаалт засах",
  "returns.delete": "Буцаалт устгах",
  "accounting.manage": "Нягтлан бодох бүртгэл удирдах",
  "discounts.create": "Хямдрал үүсгэх",
  "discounts.read": "Хямдрал харах",
  "discounts.update": "Хямдрал засах",
  "discounts.delete": "Хямдрал устгах",
  "gift_cards.create": "Бэлгийн карт үүсгэх",
  "gift_cards.read": "Бэлгийн карт харах",
  "gift_cards.update": "Бэлгийн карт засах",
  "gift_cards.delete": "Бэлгийн карт устгах",
  "boms.create": "BOM үүсгэх",
  "boms.read": "BOM харах",
  "boms.update": "BOM засах",
  "boms.delete": "BOM устгах",
  "production_orders.create": "Үйлдвэрлэлийн захиалга үүсгэх",
  "production_orders.read": "Үйлдвэрлэлийн захиалга харах",
  "production_orders.update": "Үйлдвэрлэлийн захиалга засах",
  "production_orders.delete": "Үйлдвэрлэлийн захиалга устгах",
  "production_costs.read": "Үйлдвэрлэлийн зардал харах",
  "quality_checks.create": "Чанарын шалгалт бүртгэх",
  "quality_checks.read": "Чанарын шалгалт харах",
} as Record<AppPermission, string>;
