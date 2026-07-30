import {
  ArrowCounterClockwise,
  Buildings,
  Calculator,
  ChartBar,
  CheckCircle,
  ClipboardText,
  Clock,
  Coin,
  CreditCard,
  Cube,
  CurrencyDollar,
  FileText,
  Folder,
  Gift,
  Megaphone,
  Tag,
  House,
  IdentificationBadge,
  MapPin,
  Package,
  Percent,
  Storefront,
  Trolley,
  Users,
  Warehouse,
} from "@phosphor-icons/react/dist/ssr";
import { FEATURE_KEYS } from "@/lib/constants";

export type NavItem = {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  featureKey?: string;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export const navGroups: NavGroup[] = [
  {
    label: "Үндсэн",
    items: [{ title: "Хяналтын самбар", href: "/", icon: House }],
  },
  {
    label: "Үйл ажиллагаа",
    items: [
      {
        title: "Борлуулалт",
        href: "/sales",
        icon: CurrencyDollar,
        featureKey: "sales",
      },
      {
        title: "Дэлгүүр",
        href: "/shop",
        icon: Storefront,
        featureKey: "shop",
      },
      {
        title: "Зарлага",
        href: "/expenses",
        icon: CreditCard,
        featureKey: "expenses",
      },
      {
        title: "Худалдан авалт",
        href: "/purchases",
        icon: Trolley,
        featureKey: "purchases",
      },
      {
        title: "Буцаалт",
        href: "/returns",
        icon: ArrowCounterClockwise,
        featureKey: "returns",
      },
    ],
  },
  {
    label: "Бүртгэл",
    items: [
      { title: "Бүтээгдэхүүн", href: "/products", icon: Package },
      { title: "Багц", href: "/products/bundles", icon: Cube },
      { title: "Бөөн импорт", href: "/products/bulk", icon: Cube },
      {
        title: "Ангилалууд",
        href: "/inventory/categories",
        icon: Folder,
        featureKey: "_categories",
      },
      {
        title: "Агуулах",
        href: "/inventory/warehouses",
        icon: Warehouse,
        featureKey: "_inventory",
      },
      {
        title: "Үлдэгдэл хөдөлгөөн",
        href: "/inventory/movements",
        icon: MapPin,
        featureKey: "_inventory",
      },
      {
        title: "Тохируулга",
        href: "/inventory/adjustments",
        icon: MapPin,
        featureKey: "_inventory",
      },
      {
        title: "Дахин захиалга",
        href: "/inventory/restock",
        icon: Clock,
        featureKey: "_inventory",
      },
      {
        title: "Салбарууд",
        href: "/settings/branches",
        icon: Buildings,
        featureKey: "_multi_branch",
      },
      { title: "Харилцагчид", href: "/customers", icon: Users },
      {
        title: "Нийлүүлэгчид",
        href: "/suppliers",
        icon: Buildings,
        featureKey: "_suppliers",
      },
    ],
  },
  {
    label: "Баримт бичиг",
    items: [
      {
        title: "Нэхэмжлэл",
        href: "/invoices",
        icon: FileText,
        featureKey: "invoices",
      },
      {
        title: "Үнийн санал",
        href: "/quotations",
        icon: ClipboardText,
        featureKey: "quotations",
      },
      {
        title: "Хямдрал",
        href: "/discounts",
        icon: Percent,
        featureKey: "discounts",
      },
      {
        title: "Купон",
        href: "/coupons",
        icon: Tag,
        featureKey: "coupons",
      },
      {
        title: "Бэлгийн карт",
        href: "/gift-cards",
        icon: Gift,
        featureKey: "gift_cards",
      },
      {
        title: "Сурталчилгаа",
        href: "/promotions",
        icon: Megaphone,
        featureKey: "promotions",
      },
    ],
  },
  {
    label: "Шинжилгээ",
    items: [
      {
        title: "Тайлан",
        href: "/reports",
        icon: ChartBar,
        featureKey: "reports",
      },
      {
        title: "Комисс",
        href: "/commissions",
        icon: Coin,
        featureKey: "commissions",
      },
      {
        title: "Нягтлан бодох бүртгэл",
        href: "/accounting",
        icon: Calculator,
        featureKey: "accounting",
      },
    ],
  },
  {
    label: "Үйлдвэрлэл",
    items: [
      {
        title: "BOM",
        href: "/bom",
        icon: Cube,
        featureKey: "boms",
      },
      {
        title: "Үйлдвэрлэлийн захиалга",
        href: "/production",
        icon: ClipboardText,
        featureKey: "production_orders",
      },
      {
        title: "Чанарын хяналт",
        href: "/quality",
        icon: CheckCircle,
        featureKey: "quality_control",
      },
    ],
  },
  {
    label: "Хүний нөөц",
    items: [
      {
        title: "Ажилтны бүртгэл",
        href: "/hr",
        icon: IdentificationBadge,
        featureKey: FEATURE_KEYS.hr,
      },
      {
        title: "Цалин",
        href: "/hr/payroll",
        icon: CurrencyDollar,
        featureKey: FEATURE_KEYS.hr,
      },
    ],
  },
  {
    label: "Систем",
    items: [
      {
        title: "Брэнд сан",
        href: "/settings/presets",
        icon: Cube,
        featureKey: "_brands",
      },
      {
        title: "Үйлдлийн түүх",
        href: "/audit",
        icon: Clock,
        featureKey: "_audit_log",
      },
    ],
  },
];

export function filterNavGroups(
  groups: NavGroup[],
  enabledFeatures: string[],
  hasMultiBranch: boolean,
): NavGroup[] {
  if (!enabledFeatures || enabledFeatures.length === 0) return groups;
  const featureSet = new Set(enabledFeatures);
  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (item.featureKey === "_multi_branch") {
          return hasMultiBranch;
        }
        if (item.featureKey === "_inventory") {
          return featureSet.has("_inventory");
        }
        if (item.featureKey === "_customer_credit") {
          return featureSet.has("_customer_credit");
        }
        if (item.featureKey === "_categories") {
          return featureSet.has("_categories");
        }
        if (item.featureKey === "_brands") {
          return featureSet.has("_brands");
        }
        if (item.featureKey === "_audit_log") {
          return featureSet.has("_audit_log");
        }
        if (item.featureKey === "_suppliers") {
          return featureSet.has("_suppliers");
        }
        return !item.featureKey || featureSet.has(item.featureKey);
      }),
    }))
    .filter((group) => group.items.length > 0);
}
