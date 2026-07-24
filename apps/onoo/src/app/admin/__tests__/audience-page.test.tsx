/// <reference types="@testing-library/jest-dom/vitest" />
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Mock next/navigation ──
vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/admin/audience"),
}));

// ── Mock next/link ──
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// ── Mock lucide-react icons ──
vi.mock("lucide-react", () => {
  const icon = ({ className }: { className?: string }) => (
    <span data-testid="icon" className={className} />
  );
  return {
    Eye: icon,
    Users: icon,
    Gamepad2: icon,
    TrendingUp: icon,
  };
});

// ── Mock TanStack Query ──
const mockAudienceData = {
  totalsByType: [
    { entity_type: "player", total_views: 500 },
    { entity_type: "game", total_views: 300 },
  ],
  dailyTotals: [
    { view_date: "2026-07-01", total_views: 25 },
    { view_date: "2026-07-02", total_views: 30 },
    { view_date: "2026-07-03", total_views: 20 },
  ],
  topPlayers: [
    { entity_id: "player-1", view_count: 50 },
    { entity_id: "player-2", view_count: 40 },
  ],
  topGames: [
    { entity_id: "game-1", view_count: 30 },
    { entity_id: "game-2", view_count: 25 },
  ],
  grandTotal: 800,
};

let mockIsPending = false;

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(() => ({
    data: mockAudienceData,
    isPending: mockIsPending,
  })),
  useQueryClient: vi.fn(() => ({})),
}));

// ── Mock recharts (render as simple divs) ──
vi.mock("recharts", () => ({
  BarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Bar: () => <div data-testid="bar" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  Tooltip: () => <div data-testid="tooltip" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
}));

import { ViewBeacon } from "@/components/view-beacon";
import AudiencePage from "../audience/page";

// ── Test: ViewBeacon ──
describe("ViewBeacon", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    // Default visibility
    Object.defineProperty(document, "visibilityState", {
      value: "visible",
      writable: true,
    });
    // Mock sendBeacon so jsdom doesn't throw
    Object.defineProperty(navigator, "sendBeacon", {
      value: vi.fn(),
      writable: true,
    });
  });

  it("renders nothing", () => {
    const { container } = render(
      <ViewBeacon entityType="player" entityId="test-123" />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("fires sendBeacon on mount", () => {
    const sendBeacon = vi.fn();
    Object.defineProperty(navigator, "sendBeacon", {
      value: sendBeacon,
      writable: true,
    });

    render(<ViewBeacon entityType="player" entityId="test-123" />);
    expect(sendBeacon).toHaveBeenCalledTimes(1);
    expect(sendBeacon).toHaveBeenCalledWith(
      "/api/track",
      JSON.stringify({ entityType: "player", entityId: "test-123" }),
    );
  });

  it("fires only once on re-render", () => {
    const sendBeacon = vi.fn();
    Object.defineProperty(navigator, "sendBeacon", {
      value: sendBeacon,
      writable: true,
    });

    const { rerender } = render(
      <ViewBeacon entityType="player" entityId="test-123" />,
    );
    rerender(<ViewBeacon entityType="player" entityId="test-123" />);
    expect(sendBeacon).toHaveBeenCalledTimes(1);
  });

  it("skips when visibilityState is prerender", () => {
    Object.defineProperty(document, "visibilityState", {
      value: "prerender",
      writable: true,
    });
    const sendBeacon = vi.fn();
    Object.defineProperty(navigator, "sendBeacon", {
      value: sendBeacon,
      writable: true,
    });

    render(<ViewBeacon entityType="player" entityId="test-123" />);
    expect(sendBeacon).not.toHaveBeenCalled();
  });
});

// ── Test: Audience admin page ──
describe("Audience admin page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsPending = false;
    // Restore sendBeacon mock from ViewBeacon tests
    Object.defineProperty(navigator, "sendBeacon", {
      value: vi.fn(),
      writable: true,
    });
    Object.defineProperty(document, "visibilityState", {
      value: "visible",
      writable: true,
    });
  });

  it("renders page title", () => {
    render(<AudiencePage />);
    expect(screen.getByText("Үзэгчдийн статистик")).toBeInTheDocument();
  });

  it("renders summary cards with correct values", () => {
    render(<AudiencePage />);
    expect(screen.getByText("800")).toBeInTheDocument();
    expect(screen.getByText("500")).toBeInTheDocument();
    expect(screen.getByText("300")).toBeInTheDocument();
    // Daily average: 800 / 3 = 267
    expect(screen.getByText("267")).toBeInTheDocument();
  });

  it("renders date range picker", () => {
    render(<AudiencePage />);
    expect(screen.getByLabelText("Эхлэх")).toBeInTheDocument();
    expect(screen.getByLabelText("Дуусах")).toBeInTheDocument();
    expect(screen.getByText("Сүүлийн 30 хоног")).toBeInTheDocument();
  });

  it("renders daily chart", () => {
    render(<AudiencePage />);
    expect(screen.getByTestId("bar-chart")).toBeInTheDocument();
  });

  it("renders top players and top games tables", () => {
    render(<AudiencePage />);
    expect(screen.getByText("Шилдэг 10 тоглогч")).toBeInTheDocument();
    expect(screen.getByText("Шилдэг 10 тоглолт")).toBeInTheDocument();
    expect(screen.getByText("player-1")).toBeInTheDocument();
    expect(screen.getByText("game-1")).toBeInTheDocument();
  });

  it("shows loading state", () => {
    mockIsPending = true;
    render(<AudiencePage />);
    expect(screen.getByText("Ачааллаж байна...")).toBeInTheDocument();
  });
});
