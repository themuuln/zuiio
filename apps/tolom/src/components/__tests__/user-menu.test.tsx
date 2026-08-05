import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import UserMenu from "@/components/user-menu";

let mockProfile: { fullName: string; username: string; email: string } | null =
  {
    fullName: "Test User",
    username: "testuser",
    email: "test@example.com",
  };

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = {
      "userMenu.settings": "Settings",
      "userMenu.signOut": "Sign out",
      "userMenu.user": "User",
      "userMenu.signedInAs": "Signed in as",
    };
    return map[key] ?? key;
  },
}));

vi.mock("@/lib/i18n/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/lib/queries/use-profile", () => ({
  useProfile: () => ({ data: mockProfile, isLoading: false }),
}));

vi.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  DropdownMenuGroup: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  DropdownMenuItem: ({
    children,
    onClick,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
  }) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  ),
  DropdownMenuSeparator: () => <hr />,
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

vi.mock("@/components/ui/avatar", () => ({
  Avatar: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
  AvatarFallback: ({ children }: { children?: React.ReactNode }) => (
    <>{children}</>
  ),
}));

vi.mock("@/components/ui/item", () => ({
  Item: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  ItemContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  ItemDescription: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  ItemMedia: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  ItemTitle: ({ children }: { children: React.ReactNode }) => (
    <span>{children}</span>
  ),
}));

vi.mock("@/components/ui/skeleton", () => ({
  Skeleton: () => null,
}));

vi.mock("@/lib/utils", () => ({
  getInitials: (name: string | null) => {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "?";
    return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
  },
  cn: (...args: unknown[]) => args.filter(Boolean).join(" "),
  formatCurrency: (v: number) => String(v),
  formatMNT: (v: number) => String(v),
  formatPlateNumber: (v: string) => v,
  stableStringify: (v: unknown) => JSON.stringify(v),
}));

describe("UserMenu", () => {
  beforeEach(() => {
    mockProfile = {
      fullName: "Test User",
      username: "testuser",
      email: "test@example.com",
    };
  });

  it("renders user name in document", () => {
    render(<UserMenu />);
    const matches = screen.getAllByText("Test User");
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it("renders @testuser text in document", () => {
    render(<UserMenu />);
    expect(screen.getByText(/@testuser/)).toBeInTheDocument();
  });

  it("renders initials in document", () => {
    const { container } = render(<UserMenu />);
    expect(container.textContent).toContain("TU");
  });

  it("renders with collapsed prop", () => {
    const { container } = render(<UserMenu collapsed />);
    expect(container.textContent).toContain("Test User");
  });

  it("renders ellipsis when profile is null", () => {
    mockProfile = null;
    const { container } = render(<UserMenu />);
    expect(container.textContent).toContain("\u2026");
  });
});
