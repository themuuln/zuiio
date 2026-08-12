import { fireEvent, render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockCreateShopSale = vi.hoisted(() => vi.fn());
const mockToastSuccess = vi.hoisted(() => vi.fn());
const mockToastError = vi.hoisted(() => vi.fn());
const mockCapture = vi.hoisted(() => vi.fn());
const mockClearCart = vi.hoisted(() => vi.fn());
const mockInvalidateQueries = vi.hoisted(() => vi.fn());
const mockCancelQueries = vi.hoisted(() => vi.fn());
const mockGetQueriesData = vi.hoisted(() => vi.fn(() => []));
const mockSetQueriesData = vi.hoisted(() => vi.fn());

vi.mock("@/app/(dashboard)/shop/actions", () => ({
  createShopSale: mockCreateShopSale,
}));

vi.mock("sonner", () => ({
  toast: { success: mockToastSuccess, error: mockToastError },
}));

vi.mock("@zuiio/capture", () => ({ capture: mockCapture }));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { getUser: async () => ({ data: { user: null } }) },
  }),
}));

vi.mock("@/app/(dashboard)/shop/cart-context", () => ({
  useCart: () => ({
    items: [
      {
        productId: "p1",
        name: "Тест бүтээгдэхүүн",
        unitPrice: 80000,
        quantity: 1,
        unit: "ш",
        variantId: null,
      },
    ],
    totalAmount: 80000,
    clearCart: mockClearCart,
  }),
}));

vi.mock("@/lib/org-settings-context", () => ({
  useOrgSettings: () => ({
    organizationId: "org-1",
    companyType: "retail",
    hasSuppliers: true,
    hasInventory: true,
    hasCustomerCredit: true,
    hasMultiBranch: false,
    hasVariants: true,
    hasBrands: true,
    hasCategories: true,
    hasEmailReports: false,
    hasAuditLog: true,
    hasDeliveryTracking: false,
    hasCoupons: true,
    hasGiftCards: true,
    hasPromotions: true,
    hasCheckoutCustomer: true,
    hasCheckoutQuickAmounts: true,
    hasReceiptDrawer: true,
    trackStock: true,
    shopDefaultPaymentMethod: "card",
  }),
}));

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({
    cancelQueries: mockCancelQueries,
    getQueriesData: mockGetQueriesData,
    setQueriesData: mockSetQueriesData,
    invalidateQueries: mockInvalidateQueries,
  }),
  useQuery: () => ({ data: [], isPending: false }),
  useMutation: (config: {
    mutationFn: (vars: FormData) => Promise<unknown>;
    onMutate?: (vars: FormData) => unknown;
    onSuccess?: (data: unknown, vars: FormData, context?: unknown) => void;
    onError?: (err: unknown) => void;
    onSettled?: () => void;
  }) => ({
    isPending: false,
    isSuccess: false,
    error: null,
    mutate: async (vars: FormData) => {
      try {
        const result = await config.mutationFn(vars);
        const context = config.onMutate?.(vars);
        config.onSuccess?.(result, vars, context);
      } catch (err) {
        config.onError?.(err);
      } finally {
        config.onSettled?.();
      }
    },
  }),
}));

// Child checkout sections are covered by their own suites — stub them out.
vi.mock("@/components/shop/checkout-coupon", () => ({
  CheckoutCoupon: () => null,
}));
vi.mock("@/components/shop/checkout-gift-card", () => ({
  CheckoutGiftCard: () => null,
}));
vi.mock("@/components/shop/checkout-promotions", () => ({
  CheckoutPromotions: () => null,
}));
vi.mock("@/components/shop/customer-picker", () => ({
  CustomerPicker: () => null,
}));
vi.mock("@/components/shop/staff-picker", () => ({
  StaffPicker: () => null,
}));
vi.mock("@/components/ui/currency-selector", () => ({
  CurrencySelector: () => null,
  DEFAULT_CURRENCIES: [
    {
      id: "mnt",
      code: "MNT",
      name: "Монгол төгрөг",
      symbol: "₮",
      exchange_rate: 1.0,
      is_default: true,
    },
  ],
}));

import { CheckoutForm } from "./checkout-form";

describe("CheckoutForm success feedback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateShopSale.mockResolvedValue({ saleId: "sale-1" });
  });

  it("shows a success toast and clears the cart after an online sale", async () => {
    const onClose = vi.fn();
    const onReceiptOpen = vi.fn();
    const { container } = render(
      <CheckoutForm
        onClose={onClose}
        onReceiptOpen={onReceiptOpen}
        onStateChange={() => {}}
      />,
    );

    const form = container.querySelector("form");
    expect(form).not.toBeNull();
    if (form) fireEvent.submit(form);

    await waitFor(() => {
      expect(mockCreateShopSale).toHaveBeenCalledTimes(1);
    });
    expect(mockToastSuccess).toHaveBeenCalledWith(
      "Борлуулалт амжилттай үүсгэгдлээ.",
    );
    expect(mockClearCart).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
    expect(onReceiptOpen).toHaveBeenCalledWith("sale-1");
  });

  it("shows an error toast when the sale action returns an error", async () => {
    mockCreateShopSale.mockResolvedValue({
      error: "Сагсанд бүтээгдэхүүн байхгүй байна.",
    });
    const { container } = render(<CheckoutForm onStateChange={() => {}} />);

    const form = container.querySelector("form");
    expect(form).not.toBeNull();
    if (form) fireEvent.submit(form);

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith(
        "Сагсанд бүтээгдэхүүн байхгүй байна.",
      );
    });
    expect(mockClearCart).not.toHaveBeenCalled();
  });

  it("does not call the dead /api/currencies endpoint", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    render(<CheckoutForm onStateChange={() => {}} />);

    await waitFor(() => {
      expect(mockCreateShopSale).not.toHaveBeenCalled();
    });
    const calls = fetchSpy.mock.calls.map(([url]) => String(url));
    expect(calls).not.toContain("/api/currencies");
    fetchSpy.mockRestore();
  });
});
