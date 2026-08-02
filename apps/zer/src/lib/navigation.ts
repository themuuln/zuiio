import {
  ArrowCounterClockwise,
  Article,
  Buildings,
  Calculator,
  ChartBar,
  ChatCircleText,
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
  House,
  IdentificationBadge,
  ImageSquare,
  MapPin,
  Megaphone,
  Package,
  Percent,
  Sparkle,
  Storefront,
  Tag,
  Trolley,
  Truck,
  Users,
  Warehouse,
  WebhooksLogo,
} from "@phosphor-icons/react/dist/ssr";
import { FEATURE_KEYS } from "@/lib/constants";
import { type MessageKey, messages } from "@/lib/i18n/messages";

export type NavItem = {
  title: string;
  titleKey?: MessageKey;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  featureKey?: string;
};

export type NavGroup = {
  label: string;
  labelKey?: MessageKey;
  items: NavItem[];
};

function navItem(
  titleKey: MessageKey,
  href: string,
  icon: React.ComponentType<{ className?: string }>,
  featureKey?: string,
): NavItem {
  return {
    title: messages.mn[titleKey],
    titleKey,
    href,
    icon,
    ...(featureKey ? { featureKey } : {}),
  };
}

function navGroup(labelKey: MessageKey, items: NavItem[]): NavGroup {
  return {
    label: messages.mn[labelKey],
    labelKey,
    items,
  };
}

export const navGroups: NavGroup[] = [
  navGroup("nav.group.main", [navItem("nav.dashboard", "/", House)]),
  navGroup("nav.group.operations", [
    navItem("nav.sales", "/sales", CurrencyDollar, "sales"),
    navItem("nav.shop", "/shop", Storefront, "shop"),
    navItem("nav.expenses", "/expenses", CreditCard, "expenses"),
    navItem("nav.purchases", "/purchases", Trolley, "purchases"),
    navItem("nav.returns", "/returns", ArrowCounterClockwise, "returns"),
    navItem("nav.deliveries", "/deliveries", Truck, "deliveries"),
    navItem("nav.coupons", "/coupons", Tag, "coupons"),
    navItem("nav.giftCards", "/gift-cards", Gift, "gift_cards"),
    navItem("nav.promotions", "/promotions", Sparkle, "promotions"),
  ]),
  navGroup("nav.group.records", [
    navItem("nav.products", "/products", Package),
    navItem("nav.bundles", "/products/bundles", Cube),
    navItem("nav.bulkImport", "/products/bulk", Cube),
    navItem("nav.categories", "/inventory/categories", Folder, "_categories"),
    navItem("nav.warehouses", "/inventory/warehouses", Warehouse, "_inventory"),
    navItem("nav.stockMovements", "/inventory/movements", MapPin, "_inventory"),
    navItem("nav.adjustments", "/inventory/adjustments", MapPin, "_inventory"),
    navItem("nav.restock", "/inventory/restock", Clock, "_inventory"),
    navItem("nav.branches", "/settings/branches", Buildings, "_multi_branch"),
    navItem("nav.customers", "/customers", Users),
    navItem("nav.suppliers", "/suppliers", Buildings, "_suppliers"),
  ]),
  navGroup("nav.group.documents", [
    navItem("nav.invoices", "/invoices", FileText, "invoices"),
    navItem("nav.quotations", "/quotations", ClipboardText, "quotations"),
    navItem("nav.discounts", "/discounts", Percent, "discounts"),
    navItem("nav.coupons", "/coupons", Tag, "coupons"),
    navItem("nav.giftCards", "/gift-cards", Gift, "gift_cards"),
    navItem("nav.promotions", "/promotions", Megaphone, "promotions"),
    navItem("nav.reviews", "/reviews", ChatCircleText, "reviews"),
    navItem("nav.blog", "/blog", Article, "blog"),
  ]),
  navGroup("nav.group.analytics", [
    navItem("nav.reports", "/reports", ChartBar, "reports"),
    navItem("nav.commissions", "/commissions", Coin, "commissions"),
    navItem("nav.accounting", "/accounting", Calculator, "accounting"),
  ]),
  navGroup("nav.group.ai", [
    navItem("nav.aiPoster", "/ai/poster", ImageSquare),
    navItem("nav.aiEnhance", "/ai/enhance", ImageSquare),
    navItem("nav.aiLogo", "/ai/logo", ImageSquare),
    navItem("nav.aiNaming", "/ai/naming", Sparkle),
  ]),
  navGroup("nav.group.production", [
    navItem("nav.bom", "/bom", Cube, "boms"),
    navItem(
      "nav.productionOrders",
      "/production",
      ClipboardText,
      "production_orders",
    ),
    navItem("nav.quality", "/quality", CheckCircle, "quality_control"),
  ]),
  navGroup("nav.group.people", [
    navItem("nav.employees", "/hr", IdentificationBadge, FEATURE_KEYS.hr),
    navItem("nav.payroll", "/hr/payroll", CurrencyDollar, FEATURE_KEYS.hr),
  ]),
  navGroup("nav.group.system", [
    navItem("nav.brandLibrary", "/settings/presets", Cube, "_brands"),
    navItem("nav.auditLog", "/audit", Clock, "_audit_log"),
    navItem("nav.webhooks", "/webhooks", WebhooksLogo, "webhooks"),
  ]),
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
