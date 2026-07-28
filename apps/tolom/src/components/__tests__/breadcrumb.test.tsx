import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Breadcrumb } from "@/components/breadcrumb";

// Mock next-intl Link
vi.mock("@/lib/i18n/navigation", () => ({
  Link: ({
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

describe("Breadcrumb (app)", () => {
  it("renders items with links", () => {
    render(
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Dashboard", href: "/dashboard" },
          { label: "Current Page" },
        ]}
      />,
    );
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Current Page")).toBeInTheDocument();
  });

  it("renders separators between items", () => {
    const { container } = render(
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Page" }]} />,
    );
    const chevrons = container.querySelectorAll(".lucide-chevron-right");
    expect(chevrons.length).toBeGreaterThanOrEqual(1);
  });

  it("renders last item as plain text", () => {
    render(
      <Breadcrumb
        items={[{ label: "Home", href: "/" }, { label: "Current" }]}
      />,
    );
    const current = screen.getByText("Current");
    expect(current.tagName).toBe("SPAN");
  });

  it("returns null for empty items", () => {
    const { container } = render(<Breadcrumb items={[]} />);
    expect(container.innerHTML).toBe("");
  });

  it("uses custom aria-label", () => {
    render(
      <Breadcrumb
        items={[{ label: "Home", href: "/" }]}
        ariaLabel="Navigation"
      />,
    );
    expect(screen.getByLabelText("Navigation")).toBeInTheDocument();
  });

  it("renders non-last item with onClick as button", () => {
    const handleClick = vi.fn();
    render(
      <Breadcrumb
        items={[{ label: "Back", onClick: handleClick }, { label: "Current" }]}
      />,
    );
    const btn = screen.getByText("Back");
    expect(btn.tagName).toBe("BUTTON");
    fireEvent.click(btn);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("renders dropdown items with popover trigger", () => {
    render(
      <Breadcrumb
        items={[
          {
            label: "Section",
            dropdownItems: [{ label: "Sub Page", onClick: vi.fn() }],
          },
          { label: "Current" },
        ]}
      />,
    );
    expect(screen.getByText("Section")).toBeInTheDocument();
  });
});
