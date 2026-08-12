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
    children?: React.ReactNode;
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
    asChild: _asChild,
    ...props
  }: {
    children?: React.ReactNode;
    variant?: string;
    className?: string;
    asChild?: boolean;
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

// Plan names, prices and the "Хамгийн сонголт" badge render twice:
// once in the plan card row and once in the comparison table header.

// ── Tests ──────────────────────────────────────────────────────────────

describe("Pricing", () => {
  it("renders all 4 plan cards", () => {
    render(<Pricing />);
    expect(screen.getAllByText("Үнэгүй")).toHaveLength(2); // card + table header
    expect(screen.getAllByText("Стандарт")).toHaveLength(2);
    expect(screen.getAllByText("Бизнес")).toHaveLength(2);
    expect(screen.getAllByText("Аж ахуйн")).toHaveLength(2);
  });

  it("shows yearly prices by default", () => {
    render(<Pricing />);
    // Standard yearly price appears in the card and the table header
    expect(screen.getAllByText("₮790,000")).toHaveLength(2);
    // /жил on 3 paid plans in cards + 3 in table header
    expect(screen.getAllByText("/жил")).toHaveLength(6);
  });

  it("switches to monthly prices on toggle click", () => {
    render(<Pricing />);

    // Click "Сарын" toggle
    fireEvent.click(screen.getByText("Сарын"));

    // Monthly prices should appear in cards and table header
    expect(screen.getAllByText("₮79,000")).toHaveLength(2);
    expect(screen.getAllByText("₮129,000")).toHaveLength(2);
    expect(screen.getAllByText("/сар")).toHaveLength(6);
  });

  it("shows 'Хамгийн сонголт' badge on Standard plan", () => {
    render(<Pricing />);
    expect(screen.getAllByText("Хамгийн сонголт")).toHaveLength(2);
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

  it("renders grouped comparison sections", () => {
    render(<Pricing />);
    expect(screen.getByText("Багцын мэдээлэл")).toBeInTheDocument();
    expect(screen.getByText("Бараа ба борлуулалт")).toBeInTheDocument();
    expect(screen.getByText("Харилцагч ба онлайн дэлгүүр")).toBeInTheDocument();
    expect(screen.getByText("Тайлан ба дэмжлэг")).toBeInTheDocument();
    expect(screen.getByText("AI боломжууд")).toBeInTheDocument();
    expect(screen.getByText("Нягтлан ба үйлдвэрлэл")).toBeInTheDocument();
    expect(screen.getByText("Аж ахуйн түвшин")).toBeInTheDocument();
  });

  it("shows per-plan limit values in the comparison table", () => {
    render(<Pricing />);
    // Барааны тоо row: 200 / 5,000 / Хязгааргүй / Хязгааргүй
    expect(screen.getByText("200")).toBeInTheDocument();
    expect(screen.getByText("5,000")).toBeInTheDocument();
    expect(screen.getAllByText("Хязгааргүй")).toHaveLength(2);
    expect(screen.getByText("Барааны тоо")).toBeInTheDocument();
  });

  it("renders check and dash indicators for included/excluded features", () => {
    render(<Pricing />);
    // Included features render a primary-colored Check icon
    expect(
      document.querySelectorAll("svg.text-primary").length,
    ).toBeGreaterThan(0);
    // Excluded features render a muted Minus icon
    expect(
      document.querySelectorAll("svg.text-muted-foreground\\/40").length,
    ).toBeGreaterThan(0);
  });

  it("shows Enterprise price as 'Тохиролцсон' on monthly toggle", () => {
    render(<Pricing />);
    // Default is yearly — card + table header show ₮8 сая/жил
    expect(screen.getAllByText("₮8 сая/жил")).toHaveLength(2);

    // Click monthly: card + table header price become Тохиролцсон
    // (plus the table header suffix label)
    fireEvent.click(screen.getByText("Сарын"));
    expect(screen.getAllByText("Тохиролцсон").length).toBeGreaterThanOrEqual(3);
  });

  it("shows 2 сар үнэгүй badge on yearly toggle", () => {
    render(<Pricing />);
    // The "2 сар үнэгүй" badge is on the yearly toggle button
    expect(screen.getByText("2 сар үнэгүй")).toBeInTheDocument();
  });
});
