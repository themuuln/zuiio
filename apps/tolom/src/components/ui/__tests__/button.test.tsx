import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Button } from "@/components/ui/button";

function renderButton(ui: React.ReactElement) {
  const result = render(ui);
  function $(selector: string) {
    return result.baseElement.querySelector(selector);
  }
  return { ...result, $ };
}

describe("Button", () => {
  it("renders with default variant and size", () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("data-slot", "button");
  });

  it("renders children content", () => {
    render(<Button>Submit</Button>);
    expect(screen.getByText("Submit")).toBeInTheDocument();
  });

  it("renders with outline variant", () => {
    render(<Button variant="outline">Outline</Button>);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("renders with secondary variant", () => {
    render(<Button variant="secondary">Secondary</Button>);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("renders with ghost variant", () => {
    render(<Button variant="ghost">Ghost</Button>);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("renders with destructive variant", () => {
    render(<Button variant="destructive">Destructive</Button>);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("renders with link variant", () => {
    render(<Button variant="link">Link</Button>);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("renders with sm size", () => {
    render(<Button size="sm">Small</Button>);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("renders with lg size", () => {
    render(<Button size="lg">Large</Button>);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("renders with icon size", () => {
    render(<Button size="icon" aria-label="Icon button" />);
    expect(screen.getByLabelText("Icon button")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { $ } = renderButton(<Button className="custom-btn">Styled</Button>);
    expect($("[data-slot='button']")?.className).toContain("custom-btn");
  });

  it("fires onClick when clicked", () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    fireEvent.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("passes additional props", () => {
    render(<Button data-testid="my-btn" type="submit" />);
    expect(screen.getByTestId("my-btn")).toHaveAttribute("type", "submit");
  });

  it("renders disabled button", () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });
});
