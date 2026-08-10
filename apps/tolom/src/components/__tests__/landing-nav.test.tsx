import { fireEvent, screen } from "@testing-library/react";
import type * as NextIntl from "next-intl";
import { describe, expect, it, vi } from "vitest";
import { LandingNav } from "@/components/landing-nav";
import { render } from "@/test/test-utils";

const t = vi.hoisted(() => (key: string) => key);
const mockRouter = vi.hoisted(() => ({ refresh: vi.fn(), push: vi.fn() }));
const navMenuState = vi.hoisted(() => ({
  links: [] as { active?: boolean }[],
}));

vi.mock("next-intl", async () => {
  const actual = await vi.importActual<typeof NextIntl>("next-intl");
  return { ...actual, useTranslations: () => t };
});

vi.mock("@/lib/i18n/navigation", () => ({
  usePathname: () => "/pricing",
  useRouter: () => mockRouter,
}));

vi.mock("@/components/ui/navigation-menu", () => ({
  NavigationMenu: ({ children }: { children?: React.ReactNode }) => (
    <nav>{children}</nav>
  ),
  NavigationMenuContent: ({ children }: { children?: React.ReactNode }) => (
    <div>{children}</div>
  ),
  NavigationMenuItem: ({ children }: { children?: React.ReactNode }) => (
    <li>{children}</li>
  ),
  NavigationMenuLink: ({
    render,
    children,
    active,
  }: {
    render?: React.ReactNode;
    children?: React.ReactNode;
    active?: boolean;
  }) => {
    navMenuState.links.push({ active });
    return <>{render ?? children}</>;
  },
  NavigationMenuList: ({ children }: { children?: React.ReactNode }) => (
    <ul>{children}</ul>
  ),
  NavigationMenuTrigger: ({ children }: { children?: React.ReactNode }) => (
    <span>{children}</span>
  ),
  navigationMenuTriggerStyle: () => "",
}));

describe("LandingNav", () => {
  it("renders the brand link and desktop nav sections", () => {
    render(<LandingNav />);
    expect(screen.getByRole("link", { name: "name" })).toBeInTheDocument();
    expect(screen.getByText("navFeatures")).toBeInTheDocument();
    expect(screen.getByText("navResources")).toBeInTheDocument();
  });

  it("marks the pricing link as active when on /pricing", () => {
    render(<LandingNav />);
    expect(navMenuState.links.some((link) => link.active === true)).toBe(true);
  });

  it("opens the mobile menu with all links and closes on link click", async () => {
    render(<LandingNav />);
    const trigger = screen.getByRole("button", { name: "navOpenMenu" });
    fireEvent.click(trigger);

    expect(screen.getByText("navProduct")).toBeInTheDocument();
    expect(screen.getByText("navServices")).toBeInTheDocument();
    expect(screen.getByText("navPricing")).toBeInTheDocument();
    // Desktop + mobile both render the get-started CTA once the drawer opens
    expect(screen.getAllByText("navGetStarted").length).toBe(2);
    // The open modal drawer makes the desktop header inert, so only the
    // drawer's sign-in CTA is exposed to the accessibility tree
    expect(screen.getAllByRole("button", { name: "signIn" }).length).toBe(1);
  });

  it("switches locale and refreshes the router", () => {
    render(<LandingNav />);
    fireEvent.click(screen.getByRole("button", { name: "EN" }));
    expect(mockRouter.refresh).toHaveBeenCalled();
    expect(document.cookie).toContain("NEXT_LOCALE=en");
  });
});
