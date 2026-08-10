import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CreatePageHeader } from "@/components/ui/create-page-header";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const messages: Record<string, string> = { back: "Back" };
    return messages[key] ?? key;
  },
}));

vi.mock("@/lib/i18n/navigation", () => ({
  Link: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={String(href)} {...rest}>
      {children}
    </a>
  ),
}));

describe("CreatePageHeader", () => {
  it("renders the title and subtitle", () => {
    render(
      <CreatePageHeader
        backHref="/vehicles"
        title="Add Vehicle"
        subtitle="Register a new vehicle"
      />,
    );
    expect(
      screen.getByRole("heading", { name: "Add Vehicle" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Register a new vehicle")).toBeInTheDocument();
  });

  it("renders a back button linking to backHref", () => {
    render(<CreatePageHeader backHref="/vehicles" title="Add Vehicle" />);
    const backLink = screen.getByRole("link", { name: "Back" });
    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveAttribute("href", "/vehicles");
  });

  it("omits the subtitle when not provided", () => {
    render(<CreatePageHeader backHref="/vehicles" title="Add Vehicle" />);
    expect(screen.queryByRole("paragraph")).not.toBeInTheDocument();
  });

  it("renders action buttons", () => {
    render(
      <CreatePageHeader
        backHref="/vehicles"
        title="Add Vehicle"
        actions={<button type="button">Save</button>}
      />,
    );
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(
      <CreatePageHeader
        backHref="/vehicles"
        title="Add Vehicle"
        className="custom-header"
      />,
    );
    const root = container.querySelector(".custom-header");
    expect(root).toBeInTheDocument();
  });
});
