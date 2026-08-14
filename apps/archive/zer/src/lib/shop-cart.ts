export type CartItem = {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  unit: string;
  maxStock: number;
  variantId?: string;
  variantLabels?: string;
  variantOptionIds?: string[];
};

/**
 * Get a unique cart item key that distinguishes items by both productId and variantId.
 * Items without a variant are keyed by productId alone.
 */
export function getCartItemKey(item: {
  productId: string;
  variantId?: string;
}): string {
  return item.variantId
    ? `${item.productId}::${item.variantId}`
    : item.productId;
}

export type DiscountInfo = {
  discountId: string;
  discountName: string;
  discountAmount: number;
};

export type CartState = {
  items: CartItem[];
  discount: DiscountInfo | null;
};

export type CartAction =
  | { type: "ADD_ITEM"; payload: CartItem }
  | { type: "REMOVE_ITEM"; payload: { cartItemKey: string } }
  | {
      type: "UPDATE_QUANTITY";
      payload: { cartItemKey: string; quantity: number };
    }
  | { type: "CLEAR_CART" }
  | { type: "LOAD_FROM_STORAGE"; payload: CartItem[] }
  | { type: "APPLY_DISCOUNT"; payload: DiscountInfo }
  | { type: "REMOVE_DISCOUNT" };

export function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      const key = getCartItemKey(action.payload);
      const existing = state.items.find((item) => getCartItemKey(item) === key);
      if (existing) {
        const newQty = Math.min(existing.quantity + 1, existing.maxStock);
        return {
          ...state,
          items: state.items.map((item) =>
            getCartItemKey(item) === key ? { ...item, quantity: newQty } : item,
          ),
        };
      }
      return {
        ...state,
        items: [...state.items, { ...action.payload, quantity: 1 }],
      };
    }
    case "REMOVE_ITEM":
      return {
        ...state,
        items: state.items.filter(
          (item) => getCartItemKey(item) !== action.payload.cartItemKey,
        ),
      };
    case "UPDATE_QUANTITY": {
      if (action.payload.quantity <= 0) {
        return {
          ...state,
          items: state.items.filter(
            (item) => getCartItemKey(item) !== action.payload.cartItemKey,
          ),
        };
      }
      return {
        ...state,
        items: state.items.map((item) =>
          getCartItemKey(item) === action.payload.cartItemKey
            ? {
                ...item,
                quantity: Math.min(action.payload.quantity, item.maxStock),
              }
            : item,
        ),
      };
    }
    case "LOAD_FROM_STORAGE":
      return { ...state, items: action.payload };
    case "CLEAR_CART":
      return { items: [], discount: null };
    case "APPLY_DISCOUNT":
      return { ...state, discount: action.payload };
    case "REMOVE_DISCOUNT":
      return { ...state, discount: null };
    default:
      return state;
  }
}

/**
 * Validate that a cart quantity is within allowed bounds.
 * Returns an error message string if invalid, or null if valid.
 */
export function validateCartQuantity(quantity: number, maxStock: number) {
  if (!Number.isFinite(quantity) || quantity < 1) {
    return "Тоо хэмжээ хамгийн багадаа 1 байх ёстой.";
  }

  if (quantity > maxStock) {
    return `Үлдэгдэл хүрэлцэхгүй байна. (макс: ${maxStock})`;
  }

  return null;
}

/**
 * Validate that an item can be added to cart.
 */
export function validateCartItem(item: {
  productId: string;
  name: string;
  unitPrice: number;
  maxStock: number;
}) {
  if (!item.productId) {
    return "Бүтээгдэхүүн сонгоно уу.";
  }

  if (!item.name.trim()) {
    return "Бүтээгдэхүүний нэр хоосон байна.";
  }

  if (!Number.isFinite(item.unitPrice) || item.unitPrice < 0) {
    return "Үнэ буруу байна.";
  }

  if (!Number.isFinite(item.maxStock) || item.maxStock < 0) {
    return "Үлдэгдэл буруу байна.";
  }

  if (item.maxStock <= 0) {
    return "Бүтээгдэхүүний үлдэгдэл дууссан байна.";
  }

  return null;
}

/**
 * Compute total amount for all cart items.
 */
export function computeTotalAmount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
}

/**
 * Compute total item count (sum of quantities).
 */
export function computeItemCount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

/**
 * Compute discounted total from subtotal and discount amount.
 * Returns max(0, subtotal - discountAmount).
 */
export function computeDiscountedTotal(
  subtotal: number,
  discountAmount: number,
): number {
  return Math.max(0, subtotal - discountAmount);
}
