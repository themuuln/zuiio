/** Lightweight product shape used across sales, invoices, purchases, etc. */
export type ProductOption = {
  id: string;
  name: string;
  sale_price?: number | null;
  cost_price?: number | null;
  current_stock?: number | null;
  unit?: string | null;
  barcode?: string | null;
  image_url?: string | null;
  sku?: string | null;
};

/** Product shape for the shop product card */
export type ProductCardProduct = {
  id: string;
  name: string;
  unit: string | null;
  sale_price: number | null;
  current_stock: number | null;
  barcode: string | null;
  image_url: string | null;
  brand_name: string | null;
  brand_logo_url: string | null;
  category_name: string | null;
};

/** Row shape used in the products data table */
export type ProductRow = {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  unit: string | null;
  sale_price: number | null;
  cost_price: number | null;
  current_stock: number | null;
  min_stock: number | null;
  category_id: string | null;
  category_name: string | null;
  brand_id: string | null;
  brand_name: string | null;
  brand_logo_url: string | null;
  image_url: string | null;
};

/** Shape for the product browser/search drawer */
export type ProductBrowserItem = {
  id: string;
  name: string;
  sale_price: number | null;
  current_stock: number | null;
  unit: string | null;
  barcode: string | null;
  image_url: string | null;
};

/** Shape for product detail view */
export type ProductDetailData = {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  unit: string | null;
  category_name: string | null;
  cost_price: number | null;
  sale_price: number | null;
  current_stock: number | null;
  min_stock: number | null;
  image_url?: string | null;
  image_urls?: string[] | null;
};

/** Shape for the product edit form */
export type ProductEditData = {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  unit: string | null;
  category_name: string | null;
  brand_id: string | null;
  brand_name: string | null;
  brand_logo_url: string | null;
  cost_price: number | null;
  sale_price: number | null;
  current_stock: number | null;
  min_stock: number | null;
};

/** Unit group options for the unit combobox */
export const UNIT_GROUPS = [
  {
    label: "Нийтлэг",
    items: ["ширхэг", "кг", "гр", "л", "мл"] as const,
  },
  {
    label: "Бусад",
    items: ["м", "см", "уут", "хайрцаг", "багц", "хос", "ш"] as const,
  },
] as const;
