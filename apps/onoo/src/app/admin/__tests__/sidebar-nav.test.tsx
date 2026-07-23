/// <reference types="@testing-library/jest-dom/vitest" />
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AdminLayoutProvider } from "@/components/admin/admin-layout-context";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("lucide-react", () => {
  const icon = ({ className }: { className?: string }) => (
    <span data-testid="icon" className={className} />
  );
  return {
    Activity: icon,
    ArrowLeftRight: icon,
    Award: icon,
    BookOpen: icon,
    Calendar: icon,
    ClipboardList: icon,
    CreditCard: icon,
    FileCheck: icon,
    HardDrive: icon,
    LayoutDashboard: icon,
    MapPin: icon,
    Medal: icon,
    Package: icon,
    Scale: icon,
    School: icon,
    ShieldAlert: icon,
    ShoppingCart: icon,
    Timer: icon,
    Trophy: icon,
    UserCircle: icon,
    Users: icon,
    X: icon,
  };
});

import { usePathname } from "next/navigation";

const mockUsePathname = vi.mocked(usePathname);
const NAV_LABELS = [
  "Хянах самбар",
  "Лиг",
  "Тэмцээн",
  "Шагнал",
  "Баг",
  "Тоглогч",
  "Тоглолт",
  "Талбай",
  "Үйлдлүүд",
  "Бүтээгдэхүүн",
  "Захиалга",
  "Профайл",
  "Хөтөлбөр",
  "Дасгалжуулагч",
  "Төлбөр",
  "Байршил",
];

function getNavLink(label: string): HTMLAnchorElement {
  const link = screen.getByText(label).closest("a");
  expect(link).not.toBeNull();
  return link as HTMLAnchorElement;
}

function renderSidebar() {
  return render(
    <AdminLayoutProvider>
      <AdminSidebar />
    </AdminLayoutProvider>,
  );
}

describe("AdminSidebar", () => {
  it("renders all nav links", () => {
    mockUsePathname.mockReturnValue("/admin");
    renderSidebar();

    for (const label of NAV_LABELS) {
      // "Тэмцээн" appears both as group heading and nav link
      const elements = screen.getAllByText(label);
      expect(elements.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("includes logout link in the footer", () => {
    mockUsePathname.mockReturnValue("/admin");
    renderSidebar();

    const logoutLink = screen.getByText("Гарах").closest("a");
    expect(logoutLink).toHaveAttribute("href", "/admin/login?signout=true");
  });

  it("shows brand logo and title", () => {
    mockUsePathname.mockReturnValue("/admin");
    renderSidebar();

    expect(screen.getByText("Оноо")).toBeInTheDocument();
  });

  it("highlights the active link for /admin root", () => {
    mockUsePathname.mockReturnValue("/admin");
    renderSidebar();

    const activeLink = getNavLink("Хянах самбар");
    expect(activeLink.className).toContain("bg-sidebar-accent");
  });

  it("highlights /admin/leagues when pathname is /admin/leagues", () => {
    mockUsePathname.mockReturnValue("/admin/leagues");
    renderSidebar();

    const leaguesLink = getNavLink("Лиг");
    expect(leaguesLink.className).toContain("bg-sidebar-accent");
  });

  it("highlights /admin/teams when pathname is /admin/teams/123", () => {
    mockUsePathname.mockReturnValue("/admin/teams/123");
    renderSidebar();

    const teamsLink = getNavLink("Баг");
    expect(teamsLink.className).toContain("bg-sidebar-accent");
  });

  it("applies non-active styling to inactive links", () => {
    mockUsePathname.mockReturnValue("/admin/games");
    renderSidebar();

    const inactiveLink = getNavLink("Лиг");
    expect(inactiveLink.className).toContain("text-sidebar-foreground/70");
  });
});
