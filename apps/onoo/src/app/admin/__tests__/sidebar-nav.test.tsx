/// <reference types="@testing-library/jest-dom/vitest" />
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

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

// Mock lucide-react icons as plain spans
vi.mock("lucide-react", () => {
  const icon = ({ className }: { className?: string }) => (
    <span data-testid="icon" className={className} />
  );
  return {
    Calendar: icon,
    LayoutDashboard: icon,
    MapPin: icon,
    Medal: icon,
    Settings2: icon,
    Timer: icon,
    Trophy: icon,
    UserCircle: icon,
    Users: icon,
  };
});

import { usePathname } from "next/navigation";
import { SidebarNav } from "../_components/sidebar-nav";

const mockUsePathname = vi.mocked(usePathname);

const NAV_ITEMS = [
  { href: "/admin", label: "Хянах цэс" },
  { href: "/admin/leagues", label: "Лиг" },
  { href: "/admin/seasons", label: "Улирал" },
  { href: "/admin/competitions", label: "Тэмцээн" },
  { href: "/admin/teams", label: "Баг" },
  { href: "/admin/players", label: "Тоглогч" },
  { href: "/admin/games", label: "Тоглолт" },
  { href: "/admin/venues", label: "Талбай" },
  { href: "/admin/ops", label: "Үйлдлүүд" },
];

function getNavLink(label: string): HTMLAnchorElement {
  const link = screen.getByText(label).closest("a");
  expect(link).not.toBeNull();
  return link as HTMLAnchorElement;
}
describe("SidebarNav", () => {
  it("renders all nav links", () => {
    mockUsePathname.mockReturnValue("/admin");
    render(<SidebarNav />);

    for (const { href, label } of NAV_ITEMS) {
      const link = screen.getByText(label);
      expect(link).toBeInTheDocument();
      expect(link.closest("a")).toHaveAttribute("href", href);
    }
  });

  it("highlights the active link for /admin root", () => {
    mockUsePathname.mockReturnValue("/admin");
    render(<SidebarNav />);

    const activeLink = getNavLink("Хянах цэс");
    expect(activeLink.className).toContain("bg-sidebar-accent");
    expect(activeLink.className).toContain("text-sidebar-accent-foreground");
  });

  it("highlights /admin/leagues when pathname is /admin/leagues", () => {
    mockUsePathname.mockReturnValue("/admin/leagues");
    render(<SidebarNav />);

    const leaguesLink = getNavLink("Лиг");
    expect(leaguesLink.className).toContain("bg-sidebar-accent");

    // /admin root should NOT be active (exact match required)
    const dashLink = getNavLink("Хянах цэс");
    expect(dashLink.className).not.toMatch(/\bbg-sidebar-accent(?!\s*\/)/);
  });

  it("highlights /admin/teams when pathname is /admin/teams/123", () => {
    mockUsePathname.mockReturnValue("/admin/teams/123");
    render(<SidebarNav />);

    const teamsLink = getNavLink("Баг");
    expect(teamsLink.className).toContain("bg-sidebar-accent");
  });

  it("applies non-active styling to inactive links", () => {
    mockUsePathname.mockReturnValue("/admin/games");
    render(<SidebarNav />);

    const inactiveLink = getNavLink("Лиг");
    expect(inactiveLink.className).toContain("text-sidebar-foreground/70");
    expect(inactiveLink.className).not.toMatch(/\bbg-sidebar-accent(?!\s*\/)/);
  });
});
