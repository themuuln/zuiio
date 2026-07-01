export interface DiscountCondition {
  condition_type: "product" | "category";
  condition_value: string;
}

export interface DiscountParams {
  discountType: "percentage" | "fixed_amount";
  discountValue: number;
  cartTotal: number;
  appliesTo: string;
  items: Array<{
    productId: string;
    categoryId?: string;
    price: number;
    quantity: number;
  }>;
  conditions?: DiscountCondition[];
}

export interface DiscountResult {
  discountAmount: number;
  totalAfterDiscount: number;
  description: string;
}

function getApplicableSubtotal(
  items: DiscountParams["items"],
  appliesTo: string,
  conditions: DiscountCondition[],
): number {
  if (appliesTo === "all") {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  if (appliesTo === "selected_products") {
    const productIds = new Set(
      conditions
        .filter((c) => c.condition_type === "product")
        .map((c) => c.condition_value),
    );
    return items
      .filter((item) => productIds.has(item.productId))
      .reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  if (appliesTo === "selected_categories") {
    const categoryIds = new Set(
      conditions
        .filter((c) => c.condition_type === "category")
        .map((c) => c.condition_value),
    );
    return items
      .filter((item) => item.categoryId && categoryIds.has(item.categoryId))
      .reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  return 0;
}

export function calculateDiscount(params: DiscountParams): DiscountResult {
  const {
    discountType,
    discountValue,
    cartTotal,
    items,
    appliesTo,
    conditions,
  } = params;

  if (discountValue <= 0 || cartTotal <= 0) {
    return {
      discountAmount: 0,
      totalAfterDiscount: cartTotal,
      description: "",
    };
  }

  let applicableSubtotal: number;
  let description: string;

  if (appliesTo === "all") {
    applicableSubtotal = cartTotal;
    description =
      discountType === "percentage"
        ? `Бүх бараанд ${discountValue}% хямдрал`
        : `Бүх бараанд ${discountValue.toLocaleString()}₮ хямдрал`;
  } else if (
    (appliesTo === "selected_products" ||
      appliesTo === "selected_categories") &&
    conditions &&
    conditions.length > 0
  ) {
    applicableSubtotal = getApplicableSubtotal(items, appliesTo, conditions);

    if (applicableSubtotal <= 0) {
      return {
        discountAmount: 0,
        totalAfterDiscount: cartTotal,
        description: "Хямдрал тохирох бараа байхгүй",
      };
    }

    const matchLabel =
      appliesTo === "selected_products"
        ? "сонгосон бараанд"
        : "сонгосон ангилалд";
    description =
      discountType === "percentage"
        ? `${matchLabel} ${discountValue}% хямдрал`
        : `${matchLabel} ${discountValue.toLocaleString()}₮ хямдрал`;
  } else {
    return {
      discountAmount: 0,
      totalAfterDiscount: cartTotal,
      description: "Хямдралын нөхцөл тодорхойгүй",
    };
  }

  let discountAmount: number;
  if (discountType === "percentage") {
    discountAmount = applicableSubtotal * (discountValue / 100);
  } else {
    discountAmount = Math.min(discountValue, applicableSubtotal);
  }

  const totalAfterDiscount = Math.max(0, cartTotal - discountAmount);

  return { discountAmount, totalAfterDiscount, description };
}

export { getApplicableSubtotal as matchesSelectedProducts };
export { getApplicableSubtotal as matchesSelectedCategories };
