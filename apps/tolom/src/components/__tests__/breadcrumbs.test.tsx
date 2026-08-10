import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Breadcrumbs, type BreadcrumbsItem } from "@/components/breadcrumbs";

// breadcrumb.tsx links via @/lib/i18n/navigation, which pulls in
// next-intl/navigation -> next/navigation (not resolvable in vitest).
vi.mock("@/lib/i18n/navigation", () => ({
  Link: ({
    href,
    children,
    className,
  }: {
    href: string;
    children?: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

describe("Breadcrumbs", () => {
  it("renders breadcrumb items with separators", () => {
    const items: BreadcrumbsItem[] = [
      { label: "Home", href: "/" },
      { label: "Customers" },
    ];
    render(<Breadcrumbs items={items} ariaLabel="Site breadcrumb" />);

    const nav = screen.getByRole("navigation", { name: "Site breadcrumb" });
    expect(nav).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(screen.getByText("Customers")).toBeInTheDocument();
    expect(nav.querySelectorAll("li")).toHaveLength(2);
  });

  it("marks the last item as current", () => {
    render(<Breadcrumbs items={[{ label: "Home" }]} />);
    const current = screen.getByText("Home");
    expect(current).toHaveAttribute("aria-current", "page");
  });

  it("renders clickable items for onClick breadcrumbs", () => {
    const onClick = vi.fn();
    render(
      <Breadcrumbs
        items={[{ label: "Filtered", onClick }, { label: "Current" }]}
        ariaLabel="crumb"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Filtered" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("renders nothing for an empty item list", () => {
    const { container } = render(<Breadcrumbs items={[]} />);
    expect(container.firstChild).toBeNull();
  });
});
