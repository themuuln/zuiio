import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Textarea } from "@/components/ui/textarea";

function renderTextarea(ui: React.ReactElement) {
  const result = render(ui);
  function $(selector: string) {
    return result.baseElement.querySelector(selector);
  }
  return { ...result, $ };
}

describe("Textarea", () => {
  it("renders with data-slot textarea", () => {
    const { $ } = renderTextarea(<Textarea />);
    expect($("[data-slot='textarea']")).toBeInTheDocument();
  });

  it("renders with placeholder", () => {
    render(<Textarea placeholder="Enter description" />);
    expect(
      screen.getByPlaceholderText("Enter description"),
    ).toBeInTheDocument();
  });

  it("accepts custom className", () => {
    const { $ } = renderTextarea(<Textarea className="custom-textarea" />);
    expect($("[data-slot='textarea']")?.className).toContain("custom-textarea");
  });

  it("passes value correctly", () => {
    render(<Textarea value="test content" readOnly />);
    expect(screen.getByDisplayValue("test content")).toBeInTheDocument();
  });

  it("handles onChange", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<Textarea onChange={handleChange} />);
    const textarea = screen.getByRole("textbox");
    await user.type(textarea, "abc");
    expect(handleChange).toHaveBeenCalled();
  });

  it("renders disabled state", () => {
    render(<Textarea disabled data-testid="test-textarea" />);
    expect(screen.getByTestId("test-textarea")).toBeDisabled();
  });

  it("renders required state", () => {
    render(<Textarea required data-testid="test-textarea" />);
    expect(screen.getByTestId("test-textarea")).toHaveAttribute("required");
  });

  it("passes rows prop", () => {
    render(<Textarea rows={5} data-testid="test-textarea" />);
    expect(screen.getByTestId("test-textarea")).toHaveAttribute("rows", "5");
  });

  it("renders with aria-invalid", () => {
    const { $ } = renderTextarea(<Textarea aria-invalid={true} />);
    expect($("[data-slot='textarea']")).toHaveAttribute("aria-invalid", "true");
  });
});
