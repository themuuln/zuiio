import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LocaleSwitcher } from "@/components/locale-switcher";

const mockRefresh = vi.fn();
const mockGetLocale = vi.fn();

vi.mock("next-intl", () => ({
  useLocale: () => mockGetLocale(),
}));

vi.mock("@/lib/i18n/navigation", () => ({
  useRouter: () => ({
    refresh: mockRefresh,
  }),
}));

vi.mock("@/lib/utils", () => ({
  setCookie: vi.fn(),
  cn: (...args: unknown[]) => args.filter(Boolean).join(" "),
  getInitials: (name: string | null) => {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "?";
    return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
  },
  formatCurrency: (v: number) => String(v),
  formatMNT: (v: number) => String(v),
  formatPlateNumber: (v: string) => v,
  stableStringify: (v: unknown) => JSON.stringify(v),
}));

describe("LocaleSwitcher", () => {
  beforeEach(() => {
    mockRefresh.mockClear();
    mockGetLocale.mockClear();
    mockGetLocale.mockReturnValue("mn");
  });

  it("renders Mongolian locale button as active", () => {
    mockGetLocale.mockReturnValue("mn");
    render(<LocaleSwitcher />);
    const mnButton = screen.getByText("MN");
    const enButton = screen.getByText("EN");
    expect(mnButton).toBeInTheDocument();
    expect(enButton).toBeInTheDocument();
  });

  it("renders English locale button as active", () => {
    mockGetLocale.mockReturnValue("en");
    render(<LocaleSwitcher />);
    expect(screen.getByText("MN")).toBeInTheDocument();
    expect(screen.getByText("EN")).toBeInTheDocument();
  });

  it("shows current locale with default variant", () => {
    mockGetLocale.mockReturnValue("mn");
    render(<LocaleSwitcher />);
    const mnButton = screen.getByText("MN").closest("button");
    expect(mnButton?.className).toContain("bg-primary");
  });

  it("shows non-current locale with ghost variant", () => {
    mockGetLocale.mockReturnValue("mn");
    render(<LocaleSwitcher />);
    const enButton = screen.getByText("EN").closest("button");
    expect(enButton?.className).toContain("hover:bg-muted");
  });
});
