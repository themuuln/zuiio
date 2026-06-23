/** A product option for combobox/select components */
export interface ProductOption {
  id: string;
  name: string;
  sku?: string | null;
  sale_price?: number;
  cost_price?: number;
  current_stock?: number;
  unit?: string | null;
  category_id?: string | null;
  brand_id?: string | null;
  image_url?: string | null;
}

/** A contact/customer option for combobox/select components */
export interface CustomerOption {
  id: string;
  name: string;
  phone?: string | null;
}

/** A supplier option for combobox/select components */
export interface SupplierOption {
  id: string;
  name: string;
  phone?: string | null;
}

/** A line item in a sale/purchase/invoice/return/etc. */
export interface LineItem {
  productId?: string;
  productName?: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  totalPrice?: number;
  variantId?: string | null;
}

/** Simple form state returned by server actions (legacy pattern) */
export interface FormState {
  error?: string;
  success?: true;
}

/**
 * Typed action result — discriminated union for server actions.
 *
 * Usage:
 * ```ts
 * type CreateSaleResult = ActionResult<{ saleId: string }>;
 * // → { success: true; data: { saleId: string } } | { success: false; error: string; fieldErrors?: Record<string, string[]> }
 * ```
 */
export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

/** Convenience constructors for ActionResult */
export function ok<T>(data: T): ActionResult<T> {
  return { success: true, data };
}

export function err(
  error: string,
  fieldErrors?: Record<string, string[]>,
): ActionResult<never> {
  return { success: false, error, fieldErrors };
}

/** A sale item reference used in forms */
export interface SaleItemData {
  productId: string;
  quantity: number;
  unitPrice: number;
  variantId?: string;
}

/** A cart item for the shop module */
export interface CartItemData {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  unit: string;
  variantId?: string;
}
