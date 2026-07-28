import { render } from "@testing-library/react";
import type React from "react";
import { describe, expect, it, vi } from "vitest";
import { PageHeader } from "@/components/page-header";

// Mock next-intl
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = {
      "header.actions": "Actions",
      "header.quickCreate": "Quick Create",
      "common.search": "Search",
    };
    return map[key] ?? key;
  },
}));

// Mock hooks
vi.mock("@/hooks/use-navigation", () => ({
  useNavigation: () => ({
    push: vi.fn(),
    searchItems: [],
    breadcrumbs: [],
  }),
}));

vi.mock("@/hooks/use-page-header", () => ({
  usePageHeader: () => ({
    searchItems: [],
    pathname: "/dashboard",
    navItems: [],
  }),
}));

// Mock i18n navigation
vi.mock("@/lib/i18n/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/dashboard",
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

// Mock @/lib/utils
vi.mock("@/lib/utils", () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(" "),
}));

// Mock sidebar (SidebarTrigger requires SidebarProvider context)
vi.mock("@/components/ui/sidebar", () => ({
  SidebarTrigger: ({ ...props }: React.ComponentProps<"button">) => (
    <button data-slot="sidebar-trigger" {...props} />
  ),
}));

describe("PageHeader", () => {
  it("renders without crashing", () => {
    const { container } = render(<PageHeader />);
    expect(container.textContent).toBeDefined();
  });
});
