import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Input } from "@/components/ui/input";

function renderInput(ui: React.ReactElement) {
  const result = render(ui);
  function $(selector: string) {
    return result.baseElement.querySelector(selector);
  }
  return { ...result, $ };
}

describe("Input", () => {
  it("renders with data-slot input", () => {
    const { $ } = renderInput(<Input />);
    expect($("[data-slot='input']")).toBeInTheDocument();
  });

  it("renders with custom type", () => {
    render(<Input type="email" data-testid="test-input" />);
    const input = screen.getByTestId("test-input");
    expect(input).toHaveAttribute("type", "email");
  });

  it("renders with placeholder", () => {
    render(<Input placeholder="Enter name" />);
    expect(screen.getByPlaceholderText("Enter name")).toBeInTheDocument();
  });

  it("accepts custom className", () => {
    const { $ } = renderInput(<Input className="custom-input" />);
    expect($("[data-slot='input']")?.className).toContain("custom-input");
  });

  it("passes value correctly", () => {
    render(<Input value="test value" readOnly />);
    const input = screen.getByDisplayValue("test value");
    expect(input).toBeInTheDocument();
  });

  it("handles onChange", async () => {
    const user = userEvent.setup();
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      expect(e.target.value).toBe("a");
    };
    render(<Input onChange={handleChange} />);
    const input = screen.getByRole("textbox");
    await user.type(input, "a");
  });

  it("renders disabled state", () => {
    render(<Input disabled data-testid="test-input" />);
    expect(screen.getByTestId("test-input")).toBeDisabled();
  });

  it("renders required state", () => {
    render(<Input required data-testid="test-input" />);
    expect(screen.getByTestId("test-input")).toHaveAttribute("required");
  });

  it("passes additional props", () => {
    render(<Input data-testid="test-input" id="my-input" maxLength={10} />);
    const input = screen.getByTestId("test-input");
    expect(input).toHaveAttribute("id", "my-input");
    expect(input).toHaveAttribute("maxLength", "10");
  });

  it("renders with aria-invalid", () => {
    const { $ } = renderInput(<Input aria-invalid={true} />);
    expect($("[data-slot='input']")).toHaveAttribute("aria-invalid", "true");
  });
});
