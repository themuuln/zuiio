/**
 * Touch POS register — pure cart logic.
 *
 * Kept free of React/Supabase so the register's math (add, quantity caps,
 * totals, change, FormData building) is unit-testable and identical for the
 * online mutation and the offline queue path.
 */

import { formatRouteDate } from "@/lib/format";

/** Product shape served to the register by the /pos server page. */
export type PosProduct = {
  id: string;
  name: string;
  sale_price: number | null;
  current_stock: number | null;
  unit: string | null;
  barcode: string | null;
  sku: string | null;
  categoryId: string | null;
  image_url: string | null;
  has_variants: boolean;
};

/** One line in the register cart. */
export type PosLine = {
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  variantId?: string;
  variantLabel?: string;
  stock: number | null;
  imageUrl: string | null;
  unit: string | null;
};

export const PAYMENT_METHODS = [
  "cash",
  "card",
  "bank_transfer",
  "invoice",
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Бэлэн",
  card: "Карт",
  bank_transfer: "Данс",
  invoice: "Нэхэмжлэл",
};

/** Stock cap: null = not tracked (track_stock off), never block on null. */
function atStockCap(line: PosLine): boolean {
  return line.stock !== null && line.quantity >= line.stock;
}

/**
 * Add a product (or variant) to the cart. Tapping the same product again
 * increments its quantity instead of adding a duplicate line, capped at
 * tracked stock. Returns a new array (immutable).
 */
export function addProductToCart(
  lines: PosLine[],
  product: PosProduct,
  variant?: {
    id: string;
    label: string;
    salePrice: number | null;
    stock: number | null;
  },
): PosLine[] {
  const unitPrice = variant?.salePrice ?? product.sale_price ?? 0;
  const existingIndex = lines.findIndex(
    (line) =>
      line.productId === product.id &&
      (line.variantId ?? null) === (variant?.id ?? null),
  );

  // Tracked stock and sold out: mirror the grid's disabled tile — never
  // add a new line (a barcode scan must behave like a tap on the tile).
  const stock = variant?.stock ?? product.current_stock;
  if (stock !== null && stock <= 0) return lines;

  if (existingIndex >= 0) {
    if (atStockCap(lines[existingIndex])) return lines;
    return lines.map((line, index) =>
      index === existingIndex ? { ...line, quantity: line.quantity + 1 } : line,
    );
  }

  return [
    ...lines,
    {
      productId: product.id,
      productName: product.name,
      unitPrice,
      quantity: 1,
      ...(variant?.id
        ? { variantId: variant.id, variantLabel: variant.label }
        : {}),
      stock: variant?.stock ?? product.current_stock,
      imageUrl: product.image_url,
      unit: product.unit,
    },
  ];
}

/** Set a line's quantity; clamps to >= 1 and to tracked stock. */
export function setLineQuantity(
  lines: PosLine[],
  index: number,
  quantity: number,
): PosLine[] {
  if (index < 0 || index >= lines.length) return lines;
  const line = lines[index];
  const capped = Math.max(1, quantity);
  const next = line.stock !== null ? Math.min(capped, line.stock) : capped;
  return lines.map((l, i) => (i === index ? { ...l, quantity: next } : l));
}

export function removeLine(lines: PosLine[], index: number): PosLine[] {
  if (index < 0 || index >= lines.length) return lines;
  return lines.filter((_, i) => i !== index);
}

/** Tap the price in the cart to override the unit price (discounts). */
export function setLineUnitPrice(
  lines: PosLine[],
  index: number,
  unitPrice: number,
): PosLine[] {
  if (index < 0 || index >= lines.length) return lines;
  const price = Math.max(0, unitPrice);
  return lines.map((l, i) => (i === index ? { ...l, unitPrice: price } : l));
}

export function lineTotal(line: PosLine): number {
  return line.unitPrice * line.quantity;
}

export function cartSubtotal(lines: PosLine[]): number {
  return lines.reduce((sum, line) => sum + lineTotal(line), 0);
}

/** Total item count across lines (for the cart badge). */
export function cartCount(lines: PosLine[]): number {
  return lines.reduce((sum, line) => sum + line.quantity, 0);
}

/** Cash change: tendered - total, floored at 0. */
export function computeChange(tendered: number, total: number): number {
  return Math.max(0, tendered - total);
}

export type SaleFormPayload = {
  lines: PosLine[];
  paymentMethod: PaymentMethod;
  customerName?: string;
  customerPhone?: string;
  notes?: string;
};

/**
 * Build the exact FormData contract `createSale` (sales/new/actions.ts)
 * expects: items JSON, paid_amount, payment_method, payment_splits,
 * status=completed, sale_date, optional customer + notes. Stamps a
 * client-generated idempotency key so a retry after a lost response
 * returns the already-created sale instead of a duplicate (the offline
 * replay path overrides it with the queue's own key via formData.set).
 */
export function buildSaleFormData(payload: SaleFormPayload): FormData {
  const { lines, paymentMethod, customerName, customerPhone, notes } = payload;
  const total = cartSubtotal(lines);

  const itemsPayload = lines.map((line) => ({
    productId: line.productId,
    quantity: line.quantity,
    unitPrice: line.unitPrice,
    variantId: line.variantId ?? null,
  }));

  // Register sells one method per transaction; the split amount is the sale
  // total. Cash overpay is a change UX aid, never stored as overpayment.
  const splits = [{ method: paymentMethod, amount: total }];

  const formData = new FormData();
  formData.append("items", JSON.stringify(itemsPayload));
  formData.append("paid_amount", String(total));
  formData.append("payment_method", paymentMethod);
  formData.append("payment_splits", JSON.stringify(splits));
  formData.append("status", "completed");
  formData.append("sale_date", formatRouteDate());
  formData.append("idempotency_key", crypto.randomUUID());
  if (customerName) formData.append("customer_name", customerName);
  if (customerPhone) formData.append("customer_phone", customerPhone);
  if (notes) formData.append("notes", notes);
  return formData;
}
