export type CartItem = {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  unit: string;
  maxStock: number;
};

export type CartState = {
  items: CartItem[];
};

export type CartAction =
  | { type: "ADD_ITEM"; payload: CartItem }
  | { type: "REMOVE_ITEM"; payload: { productId: string } }
  | {
      type: "UPDATE_QUANTITY";
      payload: { productId: string; quantity: number };
    }
  | { type: "CLEAR_CART" }
  | { type: "LOAD_FROM_STORAGE"; payload: CartItem[] };

export function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      const existing = state.items.find(
        (item) => item.productId === action.payload.productId,
      );
      if (existing) {
        const newQty = Math.min(existing.quantity + 1, existing.maxStock);
        return {
          items: state.items.map((item) =>
            item.productId === action.payload.productId
              ? { ...item, quantity: newQty }
              : item,
          ),
        };
      }
      return {
        items: [...state.items, { ...action.payload, quantity: 1 }],
      };
    }
    case "REMOVE_ITEM":
      return {
        items: state.items.filter(
          (item) => item.productId !== action.payload.productId,
        ),
      };
    case "UPDATE_QUANTITY": {
      if (action.payload.quantity <= 0) {
        return {
          items: state.items.filter(
            (item) => item.productId !== action.payload.productId,
          ),
        };
      }
      return {
        items: state.items.map((item) =>
          item.productId === action.payload.productId
            ? {
                ...item,
                quantity: Math.min(action.payload.quantity, item.maxStock),
              }
            : item,
        ),
      };
    }
    case "LOAD_FROM_STORAGE":
      return { items: action.payload };
    case "CLEAR_CART":
      return { items: [] };
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
