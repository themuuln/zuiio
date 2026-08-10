import type { OrgSetup } from "./types";

/**
 * Bujin - Home & Beauty (Улаанбаатар).
 * Facebook: https://www.facebook.com/Bujinbeauty
 *
 * Source: `bujin.pdf` — Солонгос гоо сайхны бүтээгдэхүүний эх сурвалжийн
 * жагсаалт (Coupang/Amazon/beautypops.mn, ₩ үнэтэй). Бүтээгдэхүүний нэр,
 * брэнд, ангилал нь тухайн жагсаалтаас гаргасан. Борлуулалтын үнэ хоосон
 * (0) — апп дотроос тохируулна.
 */
export const bujin: OrgSetup = {
  org: {
    name: "Bujin - Home & Beauty",
    slug: "bujin-beauty",
    currency: "MNT",
    company_type: "retail",
    onboarding_completed: true,
    flags: {
      has_brands: true,
      has_categories: true,
      has_variants: true,
      has_track_stock: true,
      has_inventory: true,
      has_suppliers: true,
      has_customer_credit: true,
      has_checkout_customer: true,
      has_checkout_quick_amounts: true,
      has_receipt_drawer: true,
      has_audit_log: true,
      has_delivery_tracking: true,
    },
  },
  branch: {
    name: "Үндсэн салбар",
    slug: "main",
    address: "Улаанбаатар",
  },
  publicProfile: {
    display_name: "Bujin - Home & Beauty",
    description:
      "Солонгос гоо сайхны бүтээгдэхүүн, гэр ахуйн хэрэгцээт бараа. Түргэн шуурхай хүргэлттэй. Чанартай сонголт, найдвартай үйлчилгээ.",
    website_url: "https://www.facebook.com/Bujinbeauty",
    address: "Улаанбаатар",
    catalog_enabled: true,
  },
  categories: [
    { name: "Шампунь", slug: "shampoo" },
    { name: "Кондиционер", slug: "conditioner" },
    { name: "Триментмент", slug: "treatment" },
    { name: "Хүүхдийн арчилгаа", slug: "kids-care" },
    { name: "Биеийн арчилгаа", slug: "body-care" },
  ],
  brands: [
    { name: "Kerasys" },
    { name: "Mise en Scene" },
    { name: "Ryo" },
    { name: "Dove" },
    { name: "Niju" },
    { name: "Ecopure" },
    { name: "Pedison" },
  ],
  products: [
    // ── Kerasys (шампунь/кондиционер, 600мл) ──────────────────
    {
      name: "Kerasys Elegance Sensual Шампунь 600мл",
      sku: "BUJ-KER-01",
      category: "shampoo",
      brand: "Kerasys",
      min_stock: 3,
    },
    {
      name: "Kerasys Moisturizing Шампунь 600мл",
      sku: "BUJ-KER-02",
      category: "shampoo",
      brand: "Kerasys",
      min_stock: 3,
    },
    {
      name: "Kerasys Balancing Кондиционер 600мл",
      sku: "BUJ-KER-03",
      category: "conditioner",
      brand: "Kerasys",
      min_stock: 3,
    },
    {
      name: "Kerasys Perfume Green Lily Шампунь",
      sku: "BUJ-KER-04",
      category: "shampoo",
      brand: "Kerasys",
      min_stock: 3,
    },
    {
      name: "Kerasys Fresh Lush Шампунь",
      sku: "BUJ-KER-05",
      category: "shampoo",
      brand: "Kerasys",
      min_stock: 3,
    },
    {
      name: "Kerasys White Daisy Шампунь",
      sku: "BUJ-KER-06",
      category: "shampoo",
      brand: "Kerasys",
      min_stock: 3,
    },
    {
      name: "Kerasys Violet Rose Шампунь",
      sku: "BUJ-KER-07",
      category: "shampoo",
      brand: "Kerasys",
      min_stock: 3,
    },
    {
      name: "Kerasys Cherry Blossom Шампунь 1.5л",
      sku: "BUJ-KER-08",
      category: "shampoo",
      brand: "Kerasys",
      min_stock: 3,
    },
    {
      name: "Kerasys Daily Damage Шампунь",
      sku: "BUJ-KER-09",
      category: "shampoo",
      brand: "Kerasys",
      min_stock: 3,
    },
    // ── Mise en Scene ─────────────────────────────────────────
    {
      name: "Mise en Scene Super Rich Шампунь",
      sku: "BUJ-MIS-01",
      category: "shampoo",
      brand: "Mise en Scene",
      min_stock: 3,
    },
    {
      name: "Mise en Scene Original Шампунь",
      sku: "BUJ-MIS-02",
      category: "shampoo",
      brand: "Mise en Scene",
      min_stock: 3,
    },
    {
      name: "Mise en Scene Original Кондиционер",
      sku: "BUJ-MIS-03",
      category: "conditioner",
      brand: "Mise en Scene",
      min_stock: 3,
    },
    // ── Ryo ───────────────────────────────────────────────────
    {
      name: "Ryo Hair Strength Volume Шампунь",
      sku: "BUJ-RYO-01",
      category: "shampoo",
      brand: "Ryo",
      min_stock: 3,
    },
    {
      name: "Ryo Damage Care Шампунь",
      sku: "BUJ-RYO-02",
      category: "shampoo",
      brand: "Ryo",
      min_stock: 3,
    },
    {
      name: "Ryo Deep Cleansing Шампунь",
      sku: "BUJ-RYO-03",
      category: "shampoo",
      brand: "Ryo",
      min_stock: 3,
    },
    // ── Dove ──────────────────────────────────────────────────
    {
      name: "Dove Beauty Nourishing Биеийн гель",
      sku: "BUJ-DOV-01",
      category: "body-care",
      brand: "Dove",
      min_stock: 3,
    },
    {
      name: "Dove Gentle Scrub Биеийн гель",
      sku: "BUJ-DOV-02",
      category: "body-care",
      brand: "Dove",
      min_stock: 3,
    },
    // ── Хүүхдийн арчилгаа ─────────────────────────────────────
    {
      name: "Niju Kids Шампунь 3-in-1",
      sku: "BUJ-NIJ-01",
      category: "kids-care",
      brand: "Niju",
      min_stock: 3,
    },
    {
      name: "Ecopure Шампунь",
      sku: "BUJ-ECO-01",
      category: "shampoo",
      brand: "Ecopure",
      min_stock: 3,
    },
    // ── Триментмент ───────────────────────────────────────────
    {
      name: "Pedison Propolis Триментмент (өнгөт үс)",
      sku: "BUJ-PED-01",
      category: "treatment",
      brand: "Pedison",
      min_stock: 3,
    },
  ],
  users: [
    {
      email: "owner@bujin.mn",
      role: "owner",
      full_name: "Bujin эзэмшигч",
    },
    {
      email: "staff@bujin.mn",
      role: "staff",
      full_name: "Bujin ажилтан",
    },
  ],
};

export default bujin;
