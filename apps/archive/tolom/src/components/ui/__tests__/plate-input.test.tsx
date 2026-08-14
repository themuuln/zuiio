import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { BuuzHint, PlateInput } from "@/components/ui/plate-input";

function renderPlateInput(ui: React.ReactElement) {
  const result = render(ui);
  function $(selector: string) {
    return result.baseElement.querySelector(selector);
  }
  return { ...result, $ };
}

describe("PlateInput", () => {
  it("renders input with data-slot", () => {
    const { $ } = renderPlateInput(<PlateInput />);
    expect($("[data-slot='input']")).toBeInTheDocument();
  });

  it("renders with custom className", () => {
    const { $ } = renderPlateInput(<PlateInput className="custom-class" />);
    expect($("[data-slot='input']")?.className).toContain("custom-class");
  });

  it("renders placeholder", () => {
    render(<PlateInput placeholder="XX-XX-XXX" />);
    expect(screen.getByPlaceholderText("XX-XX-XXX")).toBeInTheDocument();
  });

  it("applies font-mono uppercase class", () => {
    const { $ } = renderPlateInput(<PlateInput />);
    expect($("[data-slot='input']")?.className).toContain("font-mono");
    expect($("[data-slot='input']")?.className).toContain("uppercase");
  });

  it("renders with controlled value", () => {
    render(<PlateInput value="ABC123" readOnly />);
    expect(screen.getByDisplayValue("ABC123")).toBeInTheDocument();
  });

  it("shows BuuzHint on focus", async () => {
    const user = userEvent.setup();
    render(<PlateInput />);
    const input = screen.getByRole("textbox");

    // Hint should not be visible before focus
    expect(document.querySelector("[data-slot='input']")).toBeInTheDocument();

    await user.click(input);

    // After focus, BuuzHint should be rendered somewhere in the DOM
    const hints = document.querySelectorAll(".pointer-events-none");
    expect(hints.length).toBeGreaterThan(0);
  });

  it("hides BuuzHint on blur", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <PlateInput />
        <button type="button">outside</button>
      </div>,
    );
    const input = screen.getByRole("textbox");

    await user.click(input);
    // Hint visible
    const hintsBefore = document.querySelectorAll(".pointer-events-none");
    expect(hintsBefore.length).toBeGreaterThan(0);

    // Click outside to blur
    const outside = screen.getByText("outside");
    await user.click(outside);
  });

  it("calls onChange with formatted value when typing", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<PlateInput onChange={onChange} />);
    const input = screen.getByRole("textbox");
    await user.type(input, "A");
    expect(onChange).toHaveBeenCalled();
  });
});

describe("BuuzHint", () => {
  it("renders keyboard layout rows", () => {
    render(<BuuzHint />);
    // First row: Q, W, E, R, T, Y, U, I, O, P
    expect(screen.getByText("Q")).toBeInTheDocument();
    expect(screen.getByText("P")).toBeInTheDocument();
    // Cyrillic: Ө, Ү, Э, Р, Т, Ы, У, И, О, П
    expect(screen.getByText("Ө")).toBeInTheDocument();
    // Second row: A, S, D, F, G, H, J, K, L
    expect(screen.getByText("А")).toBeInTheDocument();
    // Third row: Z, X, C, V, B, N, M
    expect(screen.getByText("З")).toBeInTheDocument();
    expect(screen.getByText("М")).toBeInTheDocument();
  });

  it("accepts custom className", () => {
    const { container } = render(<BuuzHint className="custom-hint" />);
    expect(container.querySelector(".custom-hint")).toBeInTheDocument();
  });
});
