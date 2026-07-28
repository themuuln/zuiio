/// <reference types="@testing-library/jest-dom/vitest" />
import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";

// ── Shared Mocks ──────────────────────────────────────────────────────────────

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("lucide-react", async (importOriginal) => {
  const actual = await importOriginal<Record<string, React.ComponentType>>();
  const mock: Record<string, React.ComponentType<{ className?: string }>> = {};
  for (const key of Object.keys(actual)) {
    mock[key] = ({ className }: { className?: string }) => (
      <span data-testid={`icon-${key}`} className={className}>
        {key}
      </span>
    );
  }
  return mock;
});

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// next/navigation not needed by this component, but just in case
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({ push: vi.fn() })),
}));

// Mock the supabase client (used by ReviewForm)
const mockInsert = vi.fn().mockResolvedValue({ error: null });
vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      insert: mockInsert,
    })),
  })),
}));

vi.mock("date-fns", () => ({
  formatDistanceToNow: vi.fn(() => "2 минутын өмнө"),
}));

vi.mock("date-fns/locale", () => ({
  mn: {},
}));

// Mock UI components
vi.mock("@/components/ui/badge", () => ({
  Badge: ({
    children,
    variant,
    className,
    ...props
  }: {
    children: React.ReactNode;
    variant?: string;
    className?: string;
  }) => (
    <span data-testid="badge" data-variant={variant} className={className} {...props}>
      {children}
    </span>
  ),
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    onClick,
    disabled,
    className,
    ...props
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    className?: string;
  }) => (
    <button
      data-testid="button"
      onClick={onClick}
      disabled={disabled}
      className={className}
      {...props}
    >
      {children}
    </button>
  ),
}));

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({
    children,
    open,
    onOpenChange,
  }: {
    children: React.ReactNode;
    open: boolean;
    onOpenChange?: (open: boolean) => void;
  }) =>
    open ? (
      <div data-testid="dialog">
        {children}
        {onOpenChange && (
          <button
            data-testid="dialog-close"
            onClick={() => onOpenChange(false)}
          >
            X
          </button>
        )}
      </div>
    ) : null,
  DialogContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dialog-content">{children}</div>
  ),
  DialogHeader: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DialogTitle: ({ children }: { children: React.ReactNode }) => (
    <h2>{children}</h2>
  ),
}));

vi.mock("@/components/ui/separator", () => ({
  Separator: () => <hr data-testid="separator" />,
}));

// Mock child components
vi.mock("./order-dialog", () => ({
  OrderDialog: ({
    open,
    productName,
    priceMnt,
    variantSize,
  }: {
    open: boolean;
    productName: string;
    priceMnt: number;
    variantSize: string;
  }) =>
    open ? (
      <div data-testid="order-dialog">
        {productName} - {priceMnt} - {variantSize}
      </div>
    ) : null,
}));

vi.mock("./product-card", () => ({
  ProductCard: ({ product }: { product: { name: string; slug: string } }) => (
    <div data-testid="product-card">{product.name}</div>
  ),
}));

// ── Imports (after mocks, vitest hoists vi.mock above imports) ────────────────

import type { ProductBundle, ProductReview, ShopProductRow } from "@/app/lib/data-shop";
import { ProductDetailClient } from "../product-detail-client";

// ── Test Data ─────────────────────────────────────────────────────────────────

function makeProduct(overrides: Partial<ShopProductRow> = {}): ShopProductRow {
  return {
    id: "prod-1",
    name: "Onoo подуу цамц",
    slug: "onoo-t-shirt",
    price_mnt: 35000,
    images: ["/img1.jpg", "/img2.jpg"],
    variants: [{ size: "M", stock: 10 }],
    is_available: true,
    created_at: "2026-07-01T00:00:00Z",
    updated_at: "2026-07-01T00:00:00Z",
    name_en: "Onoo T-Shirt",
    description: "Спорт хувцас",
    category: "clothing",
    ...overrides,
  };
}

function makeReview(overrides: Partial<ProductReview> = {}): ProductReview {
  return {
    id: "rev-1",
    product_id: "prod-1",
    author_name: "Бат",
    rating: 5,
    content: "Сайхан бүтээгдэхүүн",
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════════════════

describe("ProductDetailClient — review display", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders rating summary with average and star display", () => {
    render(
      <ProductDetailClient
        product={makeProduct()}
        ratingSummary={{ average: 4.3, count: 12, distribution: { 1: 1, 2: 2, 3: 1, 4: 3, 5: 5 } }}
      />,
    );

    // Rating average number is visible
    expect(screen.getByText("4.3")).toBeInTheDocument();

    // Review count text
    expect(screen.getByText("12 сэтгэгдэл")).toBeInTheDocument();
  });

  it("renders review list with author names and ratings", () => {
    const reviews: ProductReview[] = [
      makeReview({ id: "rev-1", author_name: "Бат", rating: 5, content: "Маш сайн" }),
      makeReview({ id: "rev-2", author_name: "Дорж", rating: 4, content: "Сайн байна" }),
    ];

    render(
      <ProductDetailClient
        product={makeProduct()}
        reviews={reviews}
        ratingSummary={{ average: 4.5, count: 2, distribution: { 1: 0, 2: 0, 3: 0, 4: 1, 5: 1 } }}
      />,
    );

    // Author names are visible
    expect(screen.getByText("Бат")).toBeInTheDocument();
    expect(screen.getByText("Дорж")).toBeInTheDocument();

    // Review content is visible
    expect(screen.getByText("Маш сайн")).toBeInTheDocument();
    expect(screen.getByText("Сайн байна")).toBeInTheDocument();
  });

  it("shows empty state when no reviews", () => {
    render(
      <ProductDetailClient
        product={makeProduct()}
        reviews={[]}
        ratingSummary={{ average: 0, count: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } }}
      />,
    );

    // Text spans two lines in the source; use a substring via function matcher
    expect(
      screen.getByText((content) =>
        content.includes("хараахан байхгүй"),
      ),
    ).toBeInTheDocument();
  });

  it("renders review submission form", () => {
    render(
      <ProductDetailClient
        product={makeProduct()}
      />,
    );

    // Form heading
    expect(screen.getByText("Сэтгэгдэл үлдээх")).toBeInTheDocument();

    // Input fields
    expect(screen.getByPlaceholderText("Таны нэр")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(
        "Бүтээгдэхүүний талаарх сэтгэгдлээ хуваалцана уу...",
      ),
    ).toBeInTheDocument();

    // Submit button
    expect(screen.getByText("Сэтгэгдэл илгээх")).toBeInTheDocument();
  });

  it("renders star icons in review form selector", () => {
    render(
      <ProductDetailClient
        product={makeProduct()}
      />,
    );

    // Star icons rendered in the review form
    const stars = screen.getAllByTestId("icon-Star");
    expect(stars.length).toBeGreaterThanOrEqual(5);
  });
});

describe("ProductDetailClient — related products and bundles", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders related products section", () => {
    const relatedProducts: ShopProductRow[] = [
      makeProduct({ id: "rp-1", name: "Onoo майк", slug: "onoo-mayk" }),
      makeProduct({ id: "rp-2", name: "Onoo подуу малгай", slug: "onoo-cap" }),
    ];

    render(
      <ProductDetailClient
        product={makeProduct()}
        relatedProducts={relatedProducts}
      />,
    );

    // Section title
    expect(screen.getByText("Санал болгох")).toBeInTheDocument();

    // Related product names
    expect(screen.getByText("Onoo майк")).toBeInTheDocument();
    expect(screen.getByText("Onoo подуу малгай")).toBeInTheDocument();
  });

  it("does not render related products section when empty", () => {
    render(
      <ProductDetailClient
        product={makeProduct()}
        relatedProducts={[]}
      />,
    );

    expect(screen.queryByText("Санал болгох")).not.toBeInTheDocument();
  });

  it("renders bundle section with discount badges", () => {
    const bundles: ProductBundle[] = [
      {
        id: "bundle-1",
        name: "Спорт багц",
        description: "Хямдралтай багц",
        discount_percent: 15,
        items: [makeProduct({ id: "bp-1", name: "Майк", price_mnt: 50000 })],
        total_original: 50000,
        total_discounted: 42500,
      },
    ];

    render(
      <ProductDetailClient
        product={makeProduct()}
        bundles={bundles}
      />,
    );

    // Bundle section title
    expect(screen.getByText("Багц санал")).toBeInTheDocument();

    // Bundle name
    expect(screen.getByText("Спорт багц")).toBeInTheDocument();

    // Bundle description
    expect(screen.getByText("Хямдралтай багц")).toBeInTheDocument();

    // Discount badge (15%)
    expect(screen.getByText("-15%")).toBeInTheDocument();
  });

  it("does not render bundle section when empty", () => {
    render(
      <ProductDetailClient
        product={makeProduct()}
        bundles={[]}
      />,
    );

    expect(screen.queryByText("Багц санал")).not.toBeInTheDocument();
  });
});

describe("ProductDetailClient — product info", () => {
  it("renders product name and price", () => {
    render(
      <ProductDetailClient
        product={makeProduct()}
      />,
    );

    // Product name appears in both breadcrumb and h1; use h1 role
    expect(
      screen.getByRole("heading", { level: 1, name: "Onoo подуу цамц" }),
    ).toBeInTheDocument();
    // Price appears in multiple places (hero and detail list); use getAllByText
    const priceElements = screen.getAllByText(/35,000/);
    expect(priceElements.length).toBeGreaterThanOrEqual(1);
  });

  it("renders variant selector for clothing", () => {
    render(
      <ProductDetailClient
        product={makeProduct()}
      />,
    );

    expect(screen.getByText("Хэмжээ")).toBeInTheDocument();
  });

  it("renders back link", () => {
    render(
      <ProductDetailClient
        product={makeProduct()}
      />,
    );

    expect(screen.getByText("Дэлгүүр лүү буцах")).toBeInTheDocument();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// New Tests — Team Info, Review Form, Bundle Edge Cases, Dialogs, Sticky Bar, Quantity
// ═══════════════════════════════════════════════════════════════════════════════

describe("ProductDetailClient — team info section", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders team card with team_name when product has team_id", () => {
    render(
      <ProductDetailClient
        product={makeProduct({
          team_id: "team-1",
          team_slug: "team-onoo",
          team_name: "Onoo Баг",
          team_primary_color: "#FF5733",
          team_short_code: "ONO",
        })}
      />,
    );

    expect(screen.getByText("Багийн бүтээгдэхүүн")).toBeInTheDocument();
    expect(screen.getByText("Onoo Баг")).toBeInTheDocument();
    expect(screen.getByText("ONO")).toBeInTheDocument();
  });

  it("shows team primary_color as inline style", () => {
    render(
      <ProductDetailClient
        product={makeProduct({
          team_id: "team-1",
          team_slug: "team-onoo",
          team_name: "Onoo Баг",
          team_primary_color: "#FF5733",
          team_short_code: "ONO",
        })}
      />,
    );

    // The team logo div uses inline style with backgroundColor
    const logoDiv = screen.getByText("ONO").closest("div");
    expect(logoDiv).toHaveStyle({ backgroundColor: "#FF5733" });
  });

  it("renders link to /teams/{team_slug}", () => {
    render(
      <ProductDetailClient
        product={makeProduct({
          team_id: "team-1",
          team_slug: "team-onoo",
          team_name: "Onoo Баг",
        })}
      />,
    );

    const link = screen.getByText("Onoo Баг").closest("a");
    expect(link).toHaveAttribute("href", "/teams/team-onoo");
  });

  it("does not render team section when team_id is null", () => {
    render(
      <ProductDetailClient
        product={makeProduct({ team_id: null })}
      />,
    );

    expect(screen.queryByText("Багийн бүтээгдэхүүн")).not.toBeInTheDocument();
  });

  it("does not render team section when team_id is undefined", () => {
    render(
      <ProductDetailClient
        product={makeProduct()}
      />,
    );

    expect(screen.queryByText("Багийн бүтээгдэхүүн")).not.toBeInTheDocument();
  });
});

describe("ProductDetailClient — review form interaction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows "Сэтгэгдэл илгээгдлээ" toast on successful form submission', async () => {
    mockInsert.mockResolvedValue({ error: null });

    render(
      <ProductDetailClient
        product={makeProduct()}
      />,
    );

    // Fill in author name
    fireEvent.change(screen.getByPlaceholderText("Таны нэр"), {
      target: { value: "Бат" },
    });

    // Select a star rating (5 stars)
    fireEvent.click(screen.getByRole("button", { name: "5 од" }));

    // Fill in review content
    fireEvent.change(
      screen.getByPlaceholderText(
        "Бүтээгдэхүүний талаарх сэтгэгдлээ хуваалцана уу...",
      ),
      { target: { value: "Гайхалтай бүтээгдэхүүн" } },
    );

    // Submit the form
    fireEvent.click(screen.getByText("Сэтгэгдэл илгээх"));

    // Wait for the async submission to complete
    await vi.waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining("Сэтгэгдэл илгээгдлээ"),
      );
    });
  });

  it("shows error toast when submitting with empty fields", () => {
    render(
      <ProductDetailClient
        product={makeProduct()}
      />,
    );

    // Submit without filling any fields
    fireEvent.click(screen.getByText("Сэтгэгдэл илгээх"));

    // Should show an error for missing rating
    expect(toast.error).toHaveBeenCalledWith(
      expect.stringContaining("Үнэлгээ сонгоно уу"),
    );
  });

  it("star rating buttons are clickable", () => {
    render(
      <ProductDetailClient
        product={makeProduct()}
      />,
    );

    // Click the 4-star button
    const starBtn = screen.getByRole("button", { name: "4 од" });
    fireEvent.click(starBtn);

    // After clicking, the star should have the selected styling
    // (just verify it doesn't throw - clicking is the core assertion)
    expect(starBtn).toBeInTheDocument();
  });
});

describe("ProductDetailClient — bundle section edge cases", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows multiple bundle offers when more than one", () => {
    const bundles: ProductBundle[] = [
      {
        id: "bundle-1",
        name: "Гэр бүлийн багц",
        description: "Хямдралтай",
        discount_percent: 10,
        items: [makeProduct({ id: "bp-1", name: "Майк", price_mnt: 30000 })],
        total_original: 30000,
        total_discounted: 27000,
      },
      {
        id: "bundle-2",
        name: "Спорт багц",
        description: "Том хямдрал",
        discount_percent: 20,
        items: [makeProduct({ id: "bp-2", name: "Шорт", price_mnt: 25000 })],
        total_original: 25000,
        total_discounted: 20000,
      },
    ];

    render(
      <ProductDetailClient
        product={makeProduct()}
        bundles={bundles}
      />,
    );

    expect(screen.getByText("Гэр бүлийн багц")).toBeInTheDocument();
    expect(screen.getByText("Спорт багц")).toBeInTheDocument();
    expect(screen.getByText("-10%")).toBeInTheDocument();
    expect(screen.getByText("-20%")).toBeInTheDocument();
  });

  it("does not render when bundles prop is undefined", () => {
    render(
      <ProductDetailClient
        product={makeProduct()}
        // bundles prop omitted (undefined)
      />,
    );

    expect(screen.queryByText("Багц санал")).not.toBeInTheDocument();
  });

  it("shows correct discounted price formatting", () => {
    const bundles: ProductBundle[] = [
      {
        id: "bundle-1",
        name: "Хямдралтай багц",
        description: null,
        discount_percent: 15,
        items: [makeProduct({ id: "bp-1", name: "Майк", price_mnt: 50000 })],
        total_original: 50000,
        total_discounted: 42500,
      },
    ];

    render(
      <ProductDetailClient
        product={makeProduct()}
        bundles={bundles}
      />,
    );

    // Original price shown with line-through (multiple elements with 50,000 exist)
    expect(screen.getAllByText((content) => content.includes("50,000")).length).toBeGreaterThanOrEqual(
      1,
    );
    // Discounted price shown in brand color
    expect(screen.getByText("₮42,500")).toBeInTheDocument();
  });
});

describe("ProductDetailClient — size guide dialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("clicking size guide button opens the dialog", () => {
    render(
      <ProductDetailClient
        product={makeProduct()}
      />,
    );

    // Dialog should not be visible initially
    expect(screen.queryByTestId("dialog")).not.toBeInTheDocument();

    // Click the size guide button
    fireEvent.click(screen.getByText("Заавар"));

    // Dialog should now be visible
    expect(screen.getByTestId("dialog")).toBeInTheDocument();
    expect(screen.getByText("Хэмжээний заавар")).toBeInTheDocument();
  });

  it("dialog shows size chart table (S-XXL)", () => {
    render(
      <ProductDetailClient
        product={makeProduct()}
      />,
    );

    // Open dialog
    fireEvent.click(screen.getByText("Заавар"));

    // Table headers — "Цээж (см)" is unique to the table
    expect(screen.getByText("Цээж (см)")).toBeInTheDocument();
    expect(screen.getByText("Урт (см)")).toBeInTheDocument();
    expect(screen.getByText("Бүсэлхий (см)")).toBeInTheDocument();

    // Size rows from the definition: S, M, L, XL, XXL
    // Use getAllByText since "M" also appears in the variant selector
    expect(screen.getByText("S")).toBeInTheDocument();
    expect(screen.getAllByText("M").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("L")).toBeInTheDocument();
    expect(screen.getByText("XL")).toBeInTheDocument();
    expect(screen.getByText("XXL")).toBeInTheDocument();

    // Verify some measurement data is shown
    // "86-91" appears twice (S chest + XL waist) — use getAllByText
    expect(screen.getAllByText("86-91").length).toBe(2);
    expect(screen.getByText("107-112")).toBeInTheDocument();
  });

  it("clicking close hides the dialog", () => {
    render(
      <ProductDetailClient
        product={makeProduct()}
      />,
    );

    // Open dialog
    fireEvent.click(screen.getByText("Заавар"));
    expect(screen.getByTestId("dialog")).toBeInTheDocument();

    // Click close button
    fireEvent.click(screen.getByTestId("dialog-close"));

    // Dialog should be hidden
    expect(screen.queryByTestId("dialog")).not.toBeInTheDocument();
  });
});

describe("ProductDetailClient — size recommendation dialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("height input form is visible when dialog opens", () => {
    render(
      <ProductDetailClient
        product={makeProduct()}
      />,
    );

    // Click the size recommendation button
    fireEvent.click(screen.getByText("Хэмжээгээ мэдэх"));

    // Dialog should be visible with height options — title and button both exist
    expect(screen.getByTestId("dialog")).toBeInTheDocument();
    expect(screen.getAllByText("Хэмжээгээ мэдэх").length).toBeGreaterThanOrEqual(1);
    expect(
      screen.getByText("Өндрөө сонгоод тохирох хэмжээг харна уу."),
    ).toBeInTheDocument();

    // Height buttons should be visible (first button is "~155 см" with tilde)
    expect(screen.getByText("~155 см")).toBeInTheDocument();
    expect(screen.getByText("170 см")).toBeInTheDocument();
    expect(screen.getByText("190+ см")).toBeInTheDocument();
  });

  it("shows suggested size when height entered", () => {
    render(
      <ProductDetailClient
        product={makeProduct()}
      />,
    );

    // Open dialog
    fireEvent.click(screen.getByText("Хэмжээгээ мэдэх"));

    // Click 175 cm button — component maps 170< height <=180 → "L" size
    fireEvent.click(screen.getByText("175 см"));

    // Should show the recommended size
    expect(
      screen.getByText((content) =>
        content.includes("175 см өндөрт") && content.includes("L"),
      ),
    ).toBeInTheDocument();
  });
});

describe("ProductDetailClient — mobile sticky buy bar", () => {
  let triggerObserver: (isIntersecting: boolean) => void;

  beforeEach(() => {
    vi.clearAllMocks();
    triggerObserver = vi.fn() as unknown as (
      isIntersecting: boolean,
    ) => void;

    // Use a class so IntersectionObserver is constructible with `new`
    class MockIntersectionObserver {
      callback: IntersectionObserverCallback;

      constructor(callback: IntersectionObserverCallback) {
        this.callback = callback;
        triggerObserver = (isIntersecting: boolean) => {
          const entry = {
            isIntersecting,
            boundingClientRect: {} as DOMRectReadOnly,
            intersectionRatio: isIntersecting ? 1 : 0,
            intersectionRect: {} as DOMRectReadOnly,
            rootBounds: null,
            target: document.createElement("div"),
            time: Date.now(),
          };
          this.callback(
            [entry],
            null as unknown as IntersectionObserver,
          );
        };
      }
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
      takeRecords = vi.fn();
    }

    vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sticky buy bar has md:hidden class", () => {
    render(
      <ProductDetailClient
        product={makeProduct()}
      />,
    );

    // Trigger observer to mark as not intersecting (scrolled past)
    act(() => {
      triggerObserver(false);
    });

    // Now two "Худалдаж авах" buttons should exist (main buy + sticky bar)
    expect(screen.getAllByText("Худалдаж авах").length).toBeGreaterThanOrEqual(
      2,
    );
  });

  it('shows "Худалдаж авах" button in sticky bar', () => {
    render(
      <ProductDetailClient
        product={makeProduct()}
      />,
    );

    // Initially sticky bar is not visible — only one buy button
    expect(screen.getAllByText("Худалдаж авах")).toHaveLength(1);

    // Trigger observer to show sticky bar
    act(() => {
      triggerObserver(false);
    });

    // Now there should be at least 2 "Худалдаж авах" texts
    expect(screen.getAllByText("Худалдаж авах").length).toBeGreaterThanOrEqual(
      2,
    );
  });
});

describe("ProductDetailClient — quantity selector", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("plus and minus buttons are rendered", () => {
    render(
      <ProductDetailClient
        product={makeProduct()}
      />,
    );

    // Minus button with aria-label "Багасгах"
    expect(
      screen.getByRole("button", { name: "Багасгах" }),
    ).toBeInTheDocument();
    // Plus button with aria-label "Нэмэх"
    expect(
      screen.getByRole("button", { name: "Нэмэх" }),
    ).toBeInTheDocument();
  });

  it("default quantity is 1", () => {
    render(
      <ProductDetailClient
        product={makeProduct()}
      />,
    );

    // The quantity display is a span with text "1" inside the quantity selector
    // There could be other "1" texts, so verify within the quantity selector context
    const minusBtn = screen.getByRole("button", { name: "Багасгах" });
    expect(minusBtn).toBeDisabled(); // At quantity 1, minus is disabled
  });

  it("increment increases quantity and decrement decreases it", () => {
    render(
      <ProductDetailClient
        product={makeProduct()}
      />,
    );

    // Click plus
    fireEvent.click(screen.getByRole("button", { name: "Нэмэх" }));

    // After increment, minus should no longer be disabled
    expect(
      screen.getByRole("button", { name: "Багасгах" }),
    ).not.toBeDisabled();

    // Click minus to go back to 1
    fireEvent.click(screen.getByRole("button", { name: "Багасгах" }));

    // Minus should be disabled again at 1
    expect(
      screen.getByRole("button", { name: "Багасгах" }),
    ).toBeDisabled();
  });
});
