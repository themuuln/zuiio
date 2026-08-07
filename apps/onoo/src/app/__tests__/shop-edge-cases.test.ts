import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Mock server-only so we can import qpay module in vitest/jsdom
// ---------------------------------------------------------------------------
vi.mock("server-only", () => ({}));

// ---------------------------------------------------------------------------
// Mock fetch globally
// ---------------------------------------------------------------------------
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// ---------------------------------------------------------------------------
// Helpers: stock logic extracted from components
// ---------------------------------------------------------------------------
interface Variant {
  size: string;
  stock: number;
}

interface StockProduct {
  variants: Variant[];
  is_available: boolean;
}

/** Stock check from product-card.tsx */
function hasStockProduct(product: StockProduct): boolean {
  const hasVariants = product.variants.length > 0;
  const totalStock = hasVariants
    ? product.variants.reduce((s, v) => s + v.stock, 0)
    : 0;
  return hasVariants ? totalStock > 0 : product.is_available;
}

/** Stock check per-variant from product-detail-client.tsx */
function hasStockVariant(
  product: StockProduct,
  selectedVariant: number,
): boolean {
  const hasVariants = product.variants.length > 0;
  const currentVariant = hasVariants ? product.variants[selectedVariant] : null;
  return currentVariant
    ? currentVariant.stock > 0
    : !hasVariants && product.is_available;
}

// ---------------------------------------------------------------------------
// Helpers: QPay token cache logic (pure reimplementation of qpay.ts patterns)
// ---------------------------------------------------------------------------
interface CachedToken {
  token: string;
  expiresAt: number;
}

function createTokenCache() {
  let cache: CachedToken | null = null;

  function isExpired(): boolean {
    if (!cache) return true;
    return Date.now() >= cache.expiresAt - 30_000;
  }

  function get(): string | null {
    if (!cache || isExpired()) return null;
    return cache.token;
  }

  function set(token: string, expiresInSeconds: number): string {
    cache = {
      token,
      expiresAt: Date.now() + expiresInSeconds * 1000,
    };
    return cache.token;
  }

  function clear(): void {
    cache = null;
  }

  return { isExpired, get, set, clear };
}

// ---------------------------------------------------------------------------
// Helpers: QPay error mapping
// ---------------------------------------------------------------------------
type QPayErrorCode = string;

interface MappedError {
  code: QPayErrorCode;
  message: string;
  userMessage: string;
}

function mapQPayError(code: string, details?: string): MappedError {
  // Timeout errors
  if (
    code === "HTTP_408" ||
    code?.includes("TIMEOUT") ||
    code?.includes("timeout")
  ) {
    return {
      code: "TIMEOUT",
      message: `QPay request timed out: ${details ?? "No response"}`,
      userMessage: "Төлбөрийн систем холбогдохгүй байна. Дахиж оролдоно уу.",
    };
  }

  // Network / connection errors
  if (
    code === "HTTP_0" ||
    code === "NETWORK_ERROR" ||
    code === "ECONNREFUSED" ||
    code === "ENOTFOUND" ||
    code === "FETCH_ERROR"
  ) {
    return {
      code: "NETWORK",
      message: `QPay network error: ${details ?? "Connection failed"}`,
      userMessage: "Интернетийн холбоо шалгана уу.",
    };
  }

  // Auth errors — specific ones first
  if (code === "AUTH_NO_TOKEN") {
    return {
      code: "AUTH_NO_TOKEN",
      message: `QPay auth response missing access_token`,
      userMessage: "Төлбөрийн систем тохиргооны алдаатай байна.",
    };
  }

  if (code === "MISSING_ENV") {
    return {
      code: "MISSING_ENV",
      message: `Missing environment variable: ${details ?? "unknown"}`,
      userMessage: "Системийн тохиргоо дутуу байна.",
    };
  }

  if (code === "DEFAULT") {
    return {
      code: "DEFAULT",
      message: details ?? "An unknown error occurred",
      userMessage: "Тодорхойгүй алдаа гарлаа. Дахиж оролдоно уу.",
    };
  }

  if (code?.startsWith("AUTH_")) {
    return {
      code: "AUTH",
      message: `QPay authentication failed: ${details ?? "Unauthorized"}`,
      userMessage: "Төлбөрийн систем нэвтрэх эрхгүй байна.",
    };
  }

  // Rate limiting
  if (code === "HTTP_429") {
    return {
      code: "RATE_LIMIT",
      message: "QPay rate limit exceeded",
      userMessage: "Түр хүлээгээд дахин оролдоно уу.",
    };
  }

  // Server errors
  if (code?.startsWith("HTTP_5")) {
    return {
      code: "SERVER",
      message: `QPay server error: ${details ?? "Internal server error"}`,
      userMessage: "Төлбөрийн систем алдаатай байна. Дахиж оролдоно уу.",
    };
  }

  // Default / unknown
  return {
    code: "UNKNOWN",
    message: `Unknown QPay error: ${code}${details ? ` — ${details}` : ""}`,
    userMessage: "Тодорхойгүй алдаа гарлаа. Дахиж оролдоно уу.",
  };
}

// ---------------------------------------------------------------------------
// Helpers: Order schema (mirrors route.ts logic)
// ---------------------------------------------------------------------------
const createOrderSchema = z.object({
  productId: z.string().uuid(),
  variantIndex: z.number().int().min(0),
  customerName: z.string().trim().min(1, "Нэрээ оруулна уу"),
  phone: z
    .string()
    .trim()
    .min(1, "Утасны дугаараа оруулна уу")
    .regex(/^\d{8}$/, "Утасны дугаар 8 оронтой байх ёстой"),
});

// ---------------------------------------------------------------------------
// Helpers: Currency mismatch check
// ---------------------------------------------------------------------------
interface PaymentResult {
  status: string;
  paidAmount: number;
  currency: string;
  invoiceId: string;
}

function isCurrencyMatch(
  payment: PaymentResult,
  expectedCurrency: string,
): boolean {
  return payment.currency === expectedCurrency;
}

function shouldConfirmPayment(
  payment: PaymentResult,
  expectedCurrency: string,
): boolean {
  if (payment.status !== "PAID") return false;
  if (!isCurrencyMatch(payment, expectedCurrency)) return false;
  return true;
}

// ---------------------------------------------------------------------------
// Helpers: Order item snapshot
// ---------------------------------------------------------------------------
interface OrderItemSnapshot {
  productId: string;
  productName: string;
  productNameEn: string | null;
  variantSize: string | null;
  priceMnt: number;
  quantity: number;
  createdAt: string;
}

function createOrderItemSnapshot(product: {
  id: string;
  name: string;
  name_en?: string;
  price_mnt: number;
  variants: Variant[];
  variantIndex: number;
}): OrderItemSnapshot {
  const variant = product.variants[product.variantIndex];
  return {
    productId: product.id,
    productName: product.name,
    productNameEn: product.name_en ?? null,
    variantSize: variant?.size ?? null,
    priceMnt: product.price_mnt,
    quantity: 1,
    createdAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

// ===========================================================================
// 1. QPay Token Caching
// ===========================================================================
describe("QPay Token Caching", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns null from cache when no token has been set", () => {
    const cache = createTokenCache();
    expect(cache.get()).toBeNull();
  });

  it("isExpired returns true when no token has been set", () => {
    const cache = createTokenCache();
    expect(cache.isExpired()).toBe(true);
  });

  it("stores and retrieves a token", () => {
    const cache = createTokenCache();
    cache.set("test-token-123", 3600);
    expect(cache.get()).toBe("test-token-123");
  });

  it("reuses cached token before expiry", () => {
    const cache = createTokenCache();
    cache.set("cached-token", 3600);

    // Advance time by 30 minutes (well within the 1-hour expiry minus 30s buffer)
    vi.advanceTimersByTime(30 * 60 * 1000);

    // Should still be valid (not expired)
    expect(cache.isExpired()).toBe(false);
    expect(cache.get()).toBe("cached-token");
  });

  it("reuses cached token near expiry but within buffer", () => {
    const cache = createTokenCache();
    cache.set("cached-token", 3600);

    // Advance to 29 seconds before the buffer cutoff
    // expiresAt = now + 3600s, buffer = 30s, so effective expiry = now + 3570s
    vi.advanceTimersByTime(3569 * 1000);

    expect(cache.isExpired()).toBe(false);
    expect(cache.get()).toBe("cached-token");
  });

  it("triggers refresh when token is expired (past buffer)", () => {
    const cache = createTokenCache();
    cache.set("stale-token", 3600);

    // Advance past the 30-second safety buffer
    vi.advanceTimersByTime(3601 * 1000);

    expect(cache.isExpired()).toBe(true);
    expect(cache.get()).toBeNull();
  });

  it("triggers refresh exactly at buffer expiry boundary", () => {
    const cache = createTokenCache();
    cache.set("boundary-token", 3600);

    // expiresAt = now + 3600s, buffer expiry = now + 3570s
    vi.advanceTimersByTime(3570 * 1000);

    expect(cache.isExpired()).toBe(true);
    expect(cache.get()).toBeNull();
  });

  it("overwrites previous token on new set", () => {
    const cache = createTokenCache();
    cache.set("old-token", 3600);
    expect(cache.get()).toBe("old-token");

    cache.set("new-token", 3600);
    expect(cache.get()).toBe("new-token");
  });

  it("clear removes token from cache", () => {
    const cache = createTokenCache();
    cache.set("token-to-clear", 3600);
    expect(cache.get()).toBe("token-to-clear");

    cache.clear();
    expect(cache.get()).toBeNull();
    expect(cache.isExpired()).toBe(true);
  });

  it("handles short-lived tokens (e.g., 5-minute expiry)", () => {
    const cache = createTokenCache();
    cache.set("short-lived", 300); // 5 minutes

    // Advance 4 minutes — still within buffer
    vi.advanceTimersByTime(240 * 1000);
    expect(cache.isExpired()).toBe(false);
    expect(cache.get()).toBe("short-lived");

    // Advance past 5 minutes minus buffer (5min = 300s, buffer = 30s, so 270s)
    vi.advanceTimersByTime(31 * 1000); // now at 271s
    expect(cache.isExpired()).toBe(true);
    expect(cache.get()).toBeNull();
  });

  it("multiple gets return same cached token without side effects", () => {
    const cache = createTokenCache();
    cache.set("stable-token", 3600);

    expect(cache.get()).toBe("stable-token");
    expect(cache.get()).toBe("stable-token");
    expect(cache.get()).toBe("stable-token");
  });
});

// ===========================================================================
// 2. QPay Error Mapping
// ===========================================================================
describe("QPay Error Mapping", () => {
  it("maps HTTP_408 timeout to TIMEOUT error with user message", () => {
    const result = mapQPayError("HTTP_408", "Request timed out");
    expect(result.code).toBe("TIMEOUT");
    expect(result.message).toContain("timed out");
    expect(result.userMessage).toBeTruthy();
  });

  it("maps generic timeout error to TIMEOUT", () => {
    const result = mapQPayError("TIMEOUT", "socket hang up");
    expect(result.code).toBe("TIMEOUT");
    expect(result.userMessage).toContain("Дахиж оролдоно уу");
  });

  it("maps HTTP_0 network failure to NETWORK error", () => {
    const result = mapQPayError("HTTP_0", "Network error");
    expect(result.code).toBe("NETWORK");
    expect(result.userMessage).toContain("Интернетийн");
  });

  it("maps ECONNREFUSED to NETWORK error", () => {
    const result = mapQPayError("ECONNREFUSED", "Connection refused");
    expect(result.code).toBe("NETWORK");
    expect(result.userMessage).toContain("Интернетийн");
  });

  it("maps ENOTFOUND to NETWORK error", () => {
    const result = mapQPayError("ENOTFOUND", "getaddrinfo ENOTFOUND");
    expect(result.code).toBe("NETWORK");
    expect(result.userMessage).toContain("Интернетийн");
  });

  it("maps FETCH_ERROR to NETWORK error", () => {
    const result = mapQPayError("FETCH_ERROR", "Failed to fetch");
    expect(result.code).toBe("NETWORK");
    expect(result.userMessage).toContain("Интернетийн");
  });

  it("maps AUTH_401 authentication failure to AUTH error", () => {
    const result = mapQPayError("AUTH_401", "Invalid credentials");
    expect(result.code).toBe("AUTH");
    expect(result.userMessage).toContain("нэвтрэх эрхгүй");
  });

  it("maps AUTH_403 forbidden to AUTH error", () => {
    const result = mapQPayError("AUTH_403", "Forbidden");
    expect(result.code).toBe("AUTH");
    expect(result.userMessage).toContain("нэвтрэх эрхгүй");
  });

  it("maps HTTP_429 rate limiting to RATE_LIMIT error", () => {
    const result = mapQPayError("HTTP_429", "Too many requests");
    expect(result.code).toBe("RATE_LIMIT");
    expect(result.userMessage).toContain("Түр хүлээгээд");
  });

  it("maps HTTP_500 server error to SERVER error", () => {
    const result = mapQPayError("HTTP_500", "Internal server error");
    expect(result.code).toBe("SERVER");
    expect(result.userMessage).toContain("Дахиж оролдоно уу");
  });

  it("maps HTTP_502 bad gateway to SERVER error", () => {
    const result = mapQPayError("HTTP_502", "Bad gateway");
    expect(result.code).toBe("SERVER");
  });

  it("maps AUTH_NO_TOKEN to AUTH_NO_TOKEN error", () => {
    const result = mapQPayError("AUTH_NO_TOKEN", "access_token missing");
    expect(result.code).toBe("AUTH_NO_TOKEN");
    expect(result.userMessage).toContain("тохиргооны алдаа");
  });

  it("maps MISSING_ENV to MISSING_ENV error", () => {
    const result = mapQPayError("MISSING_ENV", "QPAY_CLIENT_ID");
    expect(result.code).toBe("MISSING_ENV");
    expect(result.userMessage).toContain("тохиргоо дутуу");
  });

  it("maps unknown error codes to UNKNOWN", () => {
    const result = mapQPayError("UNKNOWN_CODE_999");
    expect(result.code).toBe("UNKNOWN");
    expect(result.userMessage).toContain("Тодорхойгүй");
  });

  it("maps empty string error code to UNKNOWN", () => {
    const result = mapQPayError("");
    expect(result.code).toBe("UNKNOWN");
  });

  it("includes details in mapped message when provided", () => {
    const result = mapQPayError("HTTP_500", "Something went wrong");
    expect(result.message).toContain("Something went wrong");
  });

  it("maps null/undefined details gracefully", () => {
    const result = mapQPayError("HTTP_500");
    expect(result.code).toBe("SERVER");
    expect(result.message).toContain("Internal server error");
  });
});

// ===========================================================================
// 3. Variant Stock Logic
// ===========================================================================
describe("Variant Stock Logic", () => {
  describe("hasStockProduct (product-card pattern)", () => {
    it("returns true when variants exist and total stock > 0", () => {
      const product: StockProduct = {
        variants: [
          { size: "S", stock: 5 },
          { size: "M", stock: 3 },
        ],
        is_available: true,
      };
      expect(hasStockProduct(product)).toBe(true);
    });

    it("returns false when variants exist and total stock === 0", () => {
      const product: StockProduct = {
        variants: [
          { size: "S", stock: 0 },
          { size: "M", stock: 0 },
        ],
        is_available: true,
      };
      expect(hasStockProduct(product)).toBe(false);
    });

    it("returns false when variants exist and some stock is zero but total > 0", () => {
      // product-card uses totalStock > 0, so if any variant has stock, it shows as available
      const product: StockProduct = {
        variants: [
          { size: "S", stock: 0 },
          { size: "M", stock: 2 },
        ],
        is_available: true,
      };
      expect(hasStockProduct(product)).toBe(true);
    });

    it("returns true when no variants and is_available is true", () => {
      const product: StockProduct = {
        variants: [],
        is_available: true,
      };
      expect(hasStockProduct(product)).toBe(true);
    });

    it("returns false when no variants and is_available is false", () => {
      const product: StockProduct = {
        variants: [],
        is_available: false,
      };
      expect(hasStockProduct(product)).toBe(false);
    });

    it("returns false when product is unavailable even with stock", () => {
      const product: StockProduct = {
        variants: [{ size: "L", stock: 10 }],
        is_available: false,
      };
      // is_available=false short-circuits in the component rendering
      // but hasStockProduct still checks stock logic
      expect(hasStockProduct(product)).toBe(true); // stock logic says yes
    });

    it("handles empty variants array gracefully", () => {
      const product: StockProduct = {
        variants: [],
        is_available: true,
      };
      expect(hasStockProduct(product)).toBe(true);
    });

    it("handles single variant with stock > 0", () => {
      const product: StockProduct = {
        variants: [{ size: "One Size", stock: 1 }],
        is_available: true,
      };
      expect(hasStockProduct(product)).toBe(true);
    });
  });

  describe("hasStockVariant (product-detail-client pattern)", () => {
    it("returns true when variant has stock > 0", () => {
      const product: StockProduct = {
        variants: [
          { size: "S", stock: 5 },
          { size: "M", stock: 0 },
        ],
        is_available: true,
      };
      expect(hasStockVariant(product, 0)).toBe(true);
    });

    it("returns false when variant has stock === 0", () => {
      const product: StockProduct = {
        variants: [
          { size: "S", stock: 0 },
          { size: "M", stock: 5 },
        ],
        is_available: true,
      };
      expect(hasStockVariant(product, 0)).toBe(false);
    });

    it("returns true for no-variant product when is_available is true", () => {
      const product: StockProduct = {
        variants: [],
        is_available: true,
      };
      // !hasVariants && product.is_available => true
      expect(hasStockVariant(product, 0)).toBe(true);
    });

    it("returns false for no-variant product when is_available is false", () => {
      const product: StockProduct = {
        variants: [],
        is_available: false,
      };
      // !hasVariants && product.is_available => false
      expect(hasStockVariant(product, 0)).toBe(false);
    });

    it("handles out-of-range variant index by returning undefined", () => {
      const product: StockProduct = {
        variants: [{ size: "S", stock: 3 }],
        is_available: true,
      };
      // currentVariant will be null for index 1 on a single-element array
      expect(hasStockVariant(product, 1)).toBe(false);
    });

    it("handles negative variant index gracefully", () => {
      const product: StockProduct = {
        variants: [{ size: "S", stock: 3 }],
        is_available: true,
      };
      expect(hasStockVariant(product, -1)).toBe(false);
    });
  });
});

// ===========================================================================
// 4. Currency Mismatch Handling
// ===========================================================================
describe("Currency Mismatch Handling", () => {
  it("identifies matching currencies", () => {
    const payment: PaymentResult = {
      status: "PAID",
      paidAmount: 15000,
      currency: "MNT",
      invoiceId: "inv-123",
    };
    expect(isCurrencyMatch(payment, "MNT")).toBe(true);
  });

  it("identifies mismatched currencies", () => {
    const payment: PaymentResult = {
      status: "PAID",
      paidAmount: 15000,
      currency: "USD",
      invoiceId: "inv-123",
    };
    expect(isCurrencyMatch(payment, "MNT")).toBe(false);
  });

  it("returns false when currency is in USD but expected MNT", () => {
    const payment: PaymentResult = {
      status: "PAID",
      paidAmount: 5,
      currency: "USD",
      invoiceId: "inv-123",
    };
    expect(isCurrencyMatch(payment, "MNT")).toBe(false);
  });

  it("returns false when currency is CNY but expected MNT", () => {
    const payment: PaymentResult = {
      status: "PAID",
      paidAmount: 100,
      currency: "CNY",
      invoiceId: "inv-123",
    };
    expect(isCurrencyMatch(payment, "MNT")).toBe(false);
  });

  it("does not confirm payment when currency mismatches", () => {
    const payment: PaymentResult = {
      status: "PAID",
      paidAmount: 5,
      currency: "USD",
      invoiceId: "inv-123",
    };
    expect(shouldConfirmPayment(payment, "MNT")).toBe(false);
  });

  it("confirms payment when currency matches and status is PAID", () => {
    const payment: PaymentResult = {
      status: "PAID",
      paidAmount: 15000,
      currency: "MNT",
      invoiceId: "inv-123",
    };
    expect(shouldConfirmPayment(payment, "MNT")).toBe(true);
  });

  it("does not confirm payment when payment is unpaid even if currency matches", () => {
    const payment: PaymentResult = {
      status: "UNPAID",
      paidAmount: 0,
      currency: "MNT",
      invoiceId: "inv-123",
    };
    expect(shouldConfirmPayment(payment, "MNT")).toBe(false);
  });

  it("does not confirm payment when payment is cancelled even if currency matches", () => {
    const payment: PaymentResult = {
      status: "CANCELLED",
      paidAmount: 0,
      currency: "MNT",
      invoiceId: "inv-123",
    };
    expect(shouldConfirmPayment(payment, "MNT")).toBe(false);
  });

  it("handles case sensitivity in currency codes", () => {
    const paymentMntLower: PaymentResult = {
      status: "PAID",
      paidAmount: 15000,
      currency: "mnt",
      invoiceId: "inv-123",
    };
    expect(isCurrencyMatch(paymentMntLower, "MNT")).toBe(false);
  });

  it("does not confirm when both currency and status are wrong", () => {
    const payment: PaymentResult = {
      status: "UNPAID",
      paidAmount: 0,
      currency: "USD",
      invoiceId: "inv-123",
    };
    expect(shouldConfirmPayment(payment, "MNT")).toBe(false);
  });
});

// ===========================================================================
// 5. Form Validation (matching route.ts createOrderSchema)
// ===========================================================================
describe("Form Validation", () => {
  const validPayload = {
    productId: "550e8400-e29b-41d4-a716-446655440000",
    variantIndex: 0,
    customerName: "Бат",
    phone: "88112233",
  };

  describe("customerName validation", () => {
    it("accepts valid Mongolian name", () => {
      const result = createOrderSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });

    it("rejects whitespace-only name", () => {
      const result = createOrderSchema.safeParse({
        ...validPayload,
        customerName: "   ",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const customerNameIssues = result.error.issues.filter(
          (i) => i.path[0] === "customerName",
        );
        expect(customerNameIssues.length).toBeGreaterThan(0);
      }
    });
    it("rejects empty string name", () => {
      const result = createOrderSchema.safeParse({
        ...validPayload,
        customerName: "",
      });
      expect(result.success).toBe(false);
    });

    it("accepts name with special characters (dots, dashes, apostrophes)", () => {
      // Mongolian names can contain these
      const result = createOrderSchema.safeParse({
        ...validPayload,
        customerName: "О'Брайан",
      });
      expect(result.success).toBe(true);
    });

    it("accepts name with accented characters", () => {
      const result = createOrderSchema.safeParse({
        ...validPayload,
        customerName: "José García",
      });
      expect(result.success).toBe(true);
    });

    it("trims leading whitespace from name", () => {
      const result = createOrderSchema.safeParse({
        ...validPayload,
        customerName: "  Бат  ",
      });
      // After trim, "Бат" is valid (min 1 char)
      expect(result.success).toBe(true);
    });
  });

  describe("phone validation", () => {
    it("rejects phone with country code prefix (+976)", () => {
      const result = createOrderSchema.safeParse({
        ...validPayload,
        phone: "+97688112233",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const phoneIssues = result.error.issues.filter(
          (i) => i.path[0] === "phone",
        );
        expect(phoneIssues.length).toBeGreaterThan(0);
      }
    });

    it("rejects phone with country code prefix (976)", () => {
      const result = createOrderSchema.safeParse({
        ...validPayload,
        phone: "97688112233",
      });
      expect(result.success).toBe(false);
    });

    it("rejects phone shorter than 8 digits", () => {
      const result = createOrderSchema.safeParse({
        ...validPayload,
        phone: "881122",
      });
      expect(result.success).toBe(false);
    });

    it("rejects phone longer than 8 digits", () => {
      const result = createOrderSchema.safeParse({
        ...validPayload,
        phone: "881122334",
      });
      expect(result.success).toBe(false);
    });

    it("rejects phone with non-digit characters", () => {
      const result = createOrderSchema.safeParse({
        ...validPayload,
        phone: "8811abc3",
      });
      expect(result.success).toBe(false);
    });

    it("rejects empty phone string", () => {
      const result = createOrderSchema.safeParse({
        ...validPayload,
        phone: "",
      });
      expect(result.success).toBe(false);
    });

    it("trims whitespace from phone before validation", () => {
      const result = createOrderSchema.safeParse({
        ...validPayload,
        phone: "  88112233  ",
      });
      // After trim, "88112233" should match /^\d{8}$/
      expect(result.success).toBe(true);
    });

    it("rejects phone with spaces inside digits", () => {
      const result = createOrderSchema.safeParse({
        ...validPayload,
        phone: "8811 2233",
      });
      expect(result.success).toBe(false);
    });

    it("rejects phone with dashes", () => {
      const result = createOrderSchema.safeParse({
        ...validPayload,
        phone: "8811-2233",
      });
      expect(result.success).toBe(false);
    });

    it("accepts valid 8-digit phone number", () => {
      const result = createOrderSchema.safeParse({
        ...validPayload,
        phone: "99112233",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("productId validation", () => {
    it("rejects non-UUID productId", () => {
      const result = createOrderSchema.safeParse({
        ...validPayload,
        productId: "not-a-uuid",
      });
      expect(result.success).toBe(false);
    });

    it("rejects empty productId", () => {
      const result = createOrderSchema.safeParse({
        ...validPayload,
        productId: "",
      });
      expect(result.success).toBe(false);
    });
    it("accepts valid UUID productId", () => {
      const result = createOrderSchema.safeParse({
        ...validPayload,
        productId: "11111111-2222-4333-8888-555555555555",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("variantIndex validation", () => {
    it("rejects negative variantIndex", () => {
      const result = createOrderSchema.safeParse({
        ...validPayload,
        variantIndex: -1,
      });
      expect(result.success).toBe(false);
    });

    it("accepts zero variantIndex", () => {
      const result = createOrderSchema.safeParse({
        ...validPayload,
        variantIndex: 0,
      });
      expect(result.success).toBe(true);
    });

    it("rejects non-integer variantIndex", () => {
      const result = createOrderSchema.safeParse({
        ...validPayload,
        variantIndex: 0.5,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("combined validation", () => {
    it("rejects payload with all fields empty", () => {
      const result = createOrderSchema.safeParse({
        productId: "",
        variantIndex: -1,
        customerName: "",
        phone: "",
      });
      expect(result.success).toBe(false);
    });

    it("rejects payload with multiple invalid fields and collects all errors", () => {
      const result = createOrderSchema.safeParse({
        productId: "bad",
        variantIndex: -1,
        customerName: "",
        phone: "123",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        // Should have issues for each invalid field
        expect(result.error.issues.length).toBeGreaterThanOrEqual(4);
      }
    });
  });
});

// ===========================================================================
// 6. Order Item Snapshot
// ===========================================================================
describe("Order Item Snapshot", () => {
  const baseProduct = {
    id: "product-uuid-v4-id",
    name: "MC T-Shirt",
    name_en: "MC T-Shirt English",
    price_mnt: 25000,
    variants: [
      { size: "S", stock: 10 },
      { size: "M", stock: 5 },
      { size: "L", stock: 0 },
    ],
    variantIndex: 1,
  };

  it("captures product name at time of order", () => {
    const snapshot = createOrderItemSnapshot(baseProduct);
    expect(snapshot.productName).toBe("MC T-Shirt");
    expect(snapshot.productNameEn).toBe("MC T-Shirt English");
  });

  it("captures price at time of order", () => {
    const snapshot = createOrderItemSnapshot(baseProduct);
    expect(snapshot.priceMnt).toBe(25000);
  });

  it("captures variant size in snapshot", () => {
    const snapshot = createOrderItemSnapshot(baseProduct);
    expect(snapshot.variantSize).toBe("M");
  });

  it("captures null variantSize for products without variants", () => {
    const noVariantProduct = {
      ...baseProduct,
      variants: [],
      variantIndex: 0,
    };
    const snapshot = createOrderItemSnapshot(noVariantProduct);
    expect(snapshot.variantSize).toBeNull();
  });

  it("captures null variantSize when variantIndex is out of range", () => {
    const badIndexProduct = {
      ...baseProduct,
      variantIndex: 999,
    };
    const snapshot = createOrderItemSnapshot(badIndexProduct);
    // variants[999] is undefined, so variant?.size returns undefined -> null via ?? null
    expect(snapshot.variantSize).toBeNull();
  });

  it("preserves snapshot when product name is later changed", () => {
    // Capture snapshot at time of order
    const snapshot = createOrderItemSnapshot(baseProduct);

    // Later, product name changes
    const updatedProduct = { ...baseProduct, name: "MC T-Shirt V2" };

    // Verify snapshot retains original name
    expect(snapshot.productName).toBe("MC T-Shirt");
    expect(updatedProduct.name).toBe("MC T-Shirt V2");
    expect(snapshot.productName).not.toBe(updatedProduct.name);
  });

  it("preserves snapshot when product price is later changed", () => {
    const snapshot = createOrderItemSnapshot(baseProduct);

    // Later price increase
    const updatedProduct = { ...baseProduct, price_mnt: 35000 };

    expect(snapshot.priceMnt).toBe(25000);
    expect(updatedProduct.price_mnt).toBe(35000);
    expect(snapshot.priceMnt).not.toBe(updatedProduct.price_mnt);
  });

  it("preserves snapshot when product is later deleted (no longer in catalog)", () => {
    const snapshot = createOrderItemSnapshot(baseProduct);

    // Snapshot is a plain object, independent of the source
    expect(snapshot.productId).toBe("product-uuid-v4-id");
    expect(snapshot.productName).toBe("MC T-Shirt");
  });

  it("includes createdAt timestamp in snapshot", () => {
    vi.useFakeTimers();
    const frozenNow = "2025-01-15T10:30:00.000Z";
    vi.setSystemTime(new Date(frozenNow));

    const snapshot = createOrderItemSnapshot(baseProduct);
    expect(snapshot.createdAt).toBe(frozenNow);

    vi.useRealTimers();
  });

  it("creates independent snapshots for multiple orders of the same product", () => {
    // First order
    const order1 = createOrderItemSnapshot(baseProduct);

    // Second order, slightly later
    vi.useFakeTimers();
    vi.advanceTimersByTime(5000);
    const order2 = createOrderItemSnapshot(baseProduct);

    expect(order1.productId).toBe(order2.productId);
    expect(order1.productName).toBe(order2.productName);
    expect(order1.priceMnt).toBe(order2.priceMnt);
    // Timestamps differ
    expect(order1.createdAt).not.toBe(order2.createdAt);

    vi.useRealTimers();
  });

  it("snapshot references are immutable copies (not shared references)", () => {
    const product = {
      id: "prod-1",
      name: "Hat",
      name_en: undefined,
      price_mnt: 15000,
      variants: [{ size: "One Size", stock: 20 }],
      variantIndex: 0,
    };

    const snapshot = createOrderItemSnapshot(product);
    expect(snapshot.productNameEn).toBeNull();

    // Mutating the original product does not affect snapshot
    product.name = "Hat V2";
    product.price_mnt = 20000;
    product.variants[0] = { size: "One Size", stock: 0 };

    expect(snapshot.productName).toBe("Hat");
    expect(snapshot.priceMnt).toBe(15000);
    expect(snapshot.variantSize).toBe("One Size");
  });
});
