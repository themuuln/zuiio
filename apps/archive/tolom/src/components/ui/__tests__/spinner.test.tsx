import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Spinner } from "@/components/ui/spinner";

// Mock next-intl for the Spinner's useTranslations("common") call
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const messages: Record<string, string> = { loading: "Loading..." };
    return messages[key] ?? key;
  },
}));

function _renderSpinner(ui: React.ReactElement) {
  const result = render(ui);
  function $(selector: string) {
    return result.baseElement.querySelector(selector);
  }
  return { ...result, $ };
}

describe("Spinner", () => {
  it("renders with role status and loading aria-label", () => {
    render(<Spinner />);
    const spinner = screen.getByRole("status");
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveAttribute("aria-label", "Loading...");
  });

  it("renders an svg element", () => {
    render(<Spinner />);
    const svg = screen.getByRole("status");
    expect(svg.tagName).toBe("svg");
  });

  it("has animate-spin class by default", () => {
    render(<Spinner />);
    const svg = screen.getByRole("status");
    expect(svg.getAttribute("class")).toContain("animate-spin");
  });

  it("has default size-4 class", () => {
    render(<Spinner />);
    const svg = screen.getByRole("status");
    expect(svg.getAttribute("class")).toContain("size-4");
  });

  it("accepts custom className", () => {
    render(<Spinner className="h-8 w-8" />);
    const svg = screen.getByRole("status");
    expect(svg.getAttribute("class")).toContain("h-8");
    expect(svg.getAttribute("class")).toContain("w-8");
  });

  it("passes additional SVG props", () => {
    render(<Spinner data-testid="custom-spinner" strokeWidth={3} />);
    const spinner = screen.getByTestId("custom-spinner");
    expect(spinner).toHaveAttribute("stroke-width", "3");
  });
});
