export interface BundleRow {
  id: string;
  name: string;
  sku: string | null;
  sale_price: number | null;
  cost_price: number | null;
  description: string | null;
  is_active: boolean;
  created_at: string | null;
  product_bundle_items: Array<{
    id: string;
    product_id: string | null;
    quantity: number;
    products: { name: string; sku: string | null } | null;
  }>;
}

export interface SimpleProductOption {
  id: string;
  name: string;
  sku: string | null;
  sale_price: number | null;
  cost_price: number | null;
}
