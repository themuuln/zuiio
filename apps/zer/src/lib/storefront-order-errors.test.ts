import { describe, expect, it } from "vitest";
import {
  isExpectedStoreOrderRejection,
  STORE_ORDER_BUSINESS_MESSAGES,
  STORE_ORDER_SUBMIT_CONTEXT,
} from "./storefront-order-errors";

describe("isExpectedStoreOrderRejection", () => {
  it("classifies every known business message as expected", () => {
    for (const message of STORE_ORDER_BUSINESS_MESSAGES) {
      expect(
        isExpectedStoreOrderRejection(new Error(message), {
          context: STORE_ORDER_SUBMIT_CONTEXT,
        }),
      ).toBe(true);
    }
  });

  it("keeps unknown errors in the order-submit context", () => {
    expect(
      isExpectedStoreOrderRejection(new Error("connection reset"), {
        context: STORE_ORDER_SUBMIT_CONTEXT,
      }),
    ).toBe(false);
  });

  it("keeps business-looking messages outside the submit context", () => {
    expect(
      isExpectedStoreOrderRejection(new Error("Нөөц хүрэлцэхгүй байна"), {
        context: "storefront: save address",
      }),
    ).toBe(false);
    expect(
      isExpectedStoreOrderRejection(new Error("Нөөц хүрэлцэхгүй байна")),
    ).toBe(false);
  });

  it("handles non-Error message-bearing values", () => {
    // Bare string equal to a known business message is classified by content.
    expect(
      isExpectedStoreOrderRejection("Нөөц хүрэлцэхгүй байна", {
        context: STORE_ORDER_SUBMIT_CONTEXT,
      }),
    ).toBe(true);
    expect(
      isExpectedStoreOrderRejection(
        { message: "Купон олдсонгүй" },
        { context: STORE_ORDER_SUBMIT_CONTEXT },
      ),
    ).toBe(true);
  });
});
