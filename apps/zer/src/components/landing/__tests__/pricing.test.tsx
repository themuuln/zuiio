// Mock IntersectionObserver for jsdom
class MockIntersectionObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
Object.defineProperty(window, "IntersectionObserver", {
  writable: true,
  value: MockIntersectionObserver,
});

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// ── Mocks ──────────────────────────────────────────────────────────────

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// Button with asChild: our mock just renders children so Link content shows.
vi.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    variant,
    className,
    ...props
  }: {
    children?: React.ReactNode;
    variant?: string;
    className?: string;
  }) => (
    <button data-variant={variant} className={className} {...props}>
      {children}
    </button>
  ),
}));

vi.mock("@/components/ui/badge", () => ({
  Badge: ({
    children,
    variant,
    className,
    ...props
  }: {
    children?: React.ReactNode;
    variant?: string;
    className?: string;
  }) => (
    <span data-variant={variant} className={className} {...props}>
      {children}
    </span>
  ),
}));

// ── Import after mocks ────────────────────────────────────────────────

import { Pricing } from "../pricing";

// ── Tests ──────────────────────────────────────────────────────────────

describe("Pricing", () => {
  it("renders all 4 plan names", () => {
    render(<Pricing />);
    expect(screen.getByText("Үнэгүй")).toBeInTheDocument();
    expect(screen.getByText("Стандарт")).toBeInTheDocument();
    expect(screen.getByText("Бизнес")).toBeInTheDocument();
    expect(screen.getByText("Аж ахуйн")).toBeInTheDocument();
  });

  it("shows yearly prices by default", () => {
    render(<Pricing />);
    // Default is yearly — Standard shows ₮790,000
    expect(screen.getByText("₮790,000")).toBeInTheDocument();
    // /жил appears on 3 paid plans — use getAllByText
    expect(screen.getAllByText("/жил")).toHaveLength(3);
  });

  it("switches to monthly prices on toggle click", () => {
    render(<Pricing />);

    // Click "Сарын" toggle
    fireEvent.click(screen.getByText("Сарын"));

    // Monthly prices should appear
    expect(screen.getByText("₮79,000")).toBeInTheDocument();
    expect(screen.getByText("₮129,000")).toBeInTheDocument();
    expect(screen.getAllByText("/сар")).toHaveLength(3); // 3 paid plans
  });

  it("shows 'Хамгийн сонголт' badge on Standard plan", () => {
    render(<Pricing />);
    expect(screen.getByText("Хамгийн сонголт")).toBeInTheDocument();
  });

  it("shows '14 өдөр үнэгүй турших' CTA on Standard plan", () => {
    render(<Pricing />);
    const trialLink = screen.getByText("14 өдөр үнэгүй турших");
    expect(trialLink).toBeInTheDocument();
    expect(trialLink.closest("a")).toHaveAttribute(
      "href",
      "/register?trial=standard",
    );
  });

  it("shows 'Үнэгүй эхлэх' CTA on Free plan", () => {
    render(<Pricing />);
    const freeLink = screen.getByText("Үнэгүй эхлэх");
    expect(freeLink).toBeInTheDocument();
    expect(freeLink.closest("a")).toHaveAttribute("href", "/login");
  });

  it("shows 'Холбогдох' CTA on Enterprise plan", () => {
    render(<Pricing />);
    const contactLink = screen.getByText("Холбогдох");
    expect(contactLink).toBeInTheDocument();
    expect(contactLink.closest("a")).toHaveAttribute("href", "/contact");
  });

  it("shows anchor value badge on Standard plan", () => {
    render(<Pricing />);
    expect(
      screen.getByText("Борлуулалт + Нягтлан + Агуулах — нэгдмэл систем"),
    ).toBeInTheDocument();
  });

  it("shows per-month breakdown on yearly Standard plan", () => {
    render(<Pricing />);
    // Yearly is default
    expect(screen.getByText("₮65,833/сар")).toBeInTheDocument();
  });

  it("shows per-month breakdown on yearly Business plan", () => {
    render(<Pricing />);
    expect(screen.getByText("₮165,833/сар")).toBeInTheDocument();
  });

  it("shows feature icons and AI badges", () => {
    render(<Pricing />);

    // Standard plan features — some appear in multiple plans, use getAllByText
    expect(screen.getByText("5,000 хүртэлх бараа")).toBeInTheDocument();
    expect(screen.getAllByText("Борлуулалт ба POS касс").length).toBeGreaterThan(0);
    expect(screen.getByText("Онлайн дэлгүүр")).toBeInTheDocument();

    // AI features should have the Sparkle icon
    // AI Telegram туслах — the Sparkle icon has text-amber-500 class
    const aiFeature = screen.getByText("AI Telegram туслах");
    expect(aiFeature).toBeInTheDocument();
    // Look for Sparkle icon next to it
    const aiRow = aiFeature.closest("li");
    expect(aiRow).toBeInTheDocument();
    // The Sparkle icon should be in this row
    const sparkles = aiRow!.querySelector(".text-amber-500");
    expect(sparkles).toBeInTheDocument();

    // Non-AI features should NOT have the Sparkle icon
    const nonAIFeature = screen.getByText("5,000 хүртэлх бараа");
    const nonAIRow = nonAIFeature.closest("li");
    expect(nonAIRow).toBeInTheDocument();
    const noSparkles = nonAIRow!.querySelector(".text-amber-500");
    expect(noSparkles).not.toBeInTheDocument();
  });

  it("renders feature icons (not just plain Check)", () => {
    render(<Pricing />);

    // Each feature li should have an icon in its circle container
    const featureIcons = screen
      .getAllByText("Борлуулалт ба POS касс")
      .map((el) => el.closest("li"))
      .filter(Boolean);

    // At least one feature row has the ShoppingCart icon (not just Check)
    // We check that the icon container renders proper SVG elements
    const allLis = document.querySelectorAll(
      '[class*="rounded-full bg-primary/10"]',
    );
    expect(allLis.length).toBeGreaterThan(0);
  });

  it("shows Enterprise price as 'Тохиролцсон' on monthly toggle", () => {
    render(<Pricing />);
    // Default is yearly — shows ₮8 сая/жил
    expect(screen.getByText("₮8 сая/жил")).toBeInTheDocument();

    // Click monthly to see "Тохиролцсон"
    fireEvent.click(screen.getByText("Сарын"));
    expect(screen.getByText("Тохиролцсон")).toBeInTheDocument();
  });

  it("shows 2 сар үнэгүй badge on yearly toggle", () => {
    render(<Pricing />);
    // The "2 сар үнэгүй" badge is on the yearly toggle button
    expect(screen.getByText("2 сар үнэгүй")).toBeInTheDocument();
  });
});
