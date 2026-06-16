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
};
