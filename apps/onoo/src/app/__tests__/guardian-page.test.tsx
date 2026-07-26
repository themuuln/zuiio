/// <reference types="@testing-library/jest-dom/vitest" />
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// ── Mock next/link ────────────────────────────────────────────────────────────

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: Record<string, unknown>) => (
    <a href={href as string} {...props}>
      {children as React.ReactNode}
    </a>
  ),
}));

// ── Mock lucide-react ─────────────────────────────────────────────────────────

vi.mock("lucide-react", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  const Icon = ({ className }: { className?: string }) => (
    <span data-testid="icon" className={className} />
  );
  const mocked: Record<string, unknown> = {};
  for (const key of Object.keys(actual)) mocked[key] = Icon;
  return mocked;
});

// ── Mock @/components/ui ──────────────────────────────────────────────────────

vi.mock("@/components/ui", () => ({
  Card: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card">{children}</div>
  ),
  CardContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card-content">{children}</div>
  ),
  CardHeader: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card-header">{children}</div>
  ),
  CardTitle: ({ children }: { children: React.ReactNode }) => (
    <h2 data-testid="card-title">{children}</h2>
  ),
  Button: ({
    children,
    onClick,
    disabled,
    className,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    className?: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={className}
    >
      {children}
    </button>
  ),
  Badge: ({
    children,
    variant,
    className,
  }: {
    children: React.ReactNode;
    variant?: string;
    className?: string;
  }) => (
    <span data-testid="badge" data-variant={variant} className={className}>
      {children}
    </span>
  ),
  Empty: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="empty">{children}</div>
  ),
  EmptyContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  EmptyTitle: ({ children }: { children: React.ReactNode }) => (
    <h2>{children}</h2>
  ),
  EmptyDescription: ({ children }: { children: React.ReactNode }) => (
    <p>{children}</p>
  ),
}));

// ── Mock @/app/lib/shared ─────────────────────────────────────────────────────

vi.mock("@/app/lib/shared", () => ({
  formatDate: vi.fn(() => "2025-01-15"),
}));

// ═══════════════════════════════════════════════════════════════════════════════
// Tests — GuardianPage is an async Server Component; test sub-components directly
// ═══════════════════════════════════════════════════════════════════════════════

describe("GuardianPage — sub-components", () => {
  it("UnauthenticatedState renders login required message", async () => {
    const { UnauthenticatedState } = await import("../guardian/page");
    render(<UnauthenticatedState />);
    expect(screen.getByText("Нэвтрэх шаардлагатай")).toBeInTheDocument();
  });

  it("NoChildrenState renders not-linked message", async () => {
    const { NoChildrenState } = await import("../guardian/page");
    render(<NoChildrenState />);
    expect(
      screen.getByText("Та эцэг/эх хэрэглэгчтэй холбогдоогүй байна"),
    ).toBeInTheDocument();
  });

  it("AnnouncementsSection shows empty state when no announcements", async () => {
    const { AnnouncementsSection } = await import("../guardian/page");
    render(<AnnouncementsSection announcements={[]} />);
    expect(screen.getByText("Зар мэдээ байхгүй")).toBeInTheDocument();
  });

  it("AnnouncementsSection renders announcement items", async () => {
    const { AnnouncementsSection } = await import("../guardian/page");
    render(
      <AnnouncementsSection
        announcements={[
          {
            id: "a1",
            title: "Тэмцээн",
            body: "Бүртгэл эхэллээ.",
            created_at: "2026-07-01T00:00:00Z",
          },
        ]}
      />,
    );
    expect(screen.getByText("Тэмцээн")).toBeInTheDocument();
    expect(screen.getByText("Бүртгэл эхэллээ.")).toBeInTheDocument();
  });

  it("ChildCard renders child info", async () => {
    const { ChildCard } = await import("../guardian/page");
    render(
      <ChildCard
        child={{
          id: "c1",
          student_id: "s1",
          student_name: "Баттулга",
          program_name: "Сагсан бөмбөгийн суурь",
          attendance_percentage: 85,
          photo_url: null,
        }}
        present={17}
        total={20}
      />,
    );
    expect(screen.getByText("Баттулга")).toBeInTheDocument();
    expect(screen.getByText("Сагсан бөмбөгийн суурь")).toBeInTheDocument();
    expect(
      screen.getByText(
        (content) =>
          content.includes("17") &&
          content.includes("20") &&
          content.includes("/"),
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Дэлгэрэнгүй")).toBeInTheDocument();
  });

  it("ChildCard renders detail link", async () => {
    const { ChildCard } = await import("../guardian/page");
    render(
      <ChildCard
        child={{
          id: "c1",
          student_id: "s1",
          student_name: "Баттулга",
          program_name: "Суурь",
          attendance_percentage: 80,
          photo_url: null,
        }}
        present={8}
        total={10}
      />,
    );
    const link = screen.getByText("Дэлгэрэнгүй").closest("a");
    expect(link).toHaveAttribute("href", "/guardian/children/s1");
  });
});
