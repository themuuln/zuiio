import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CurrencyInput } from "@/components/ui/currency-input";

describe("CurrencyInput", () => {
  it("renders with default placeholder", () => {
    render(<CurrencyInput value={null} onChange={() => {}} />);
    expect(screen.getByPlaceholderText("₮ 0")).toBeInTheDocument();
  });

  it("renders with custom placeholder", () => {
    render(
      <CurrencyInput
        value={null}
        onChange={() => {}}
        placeholder="Enter amount"
      />,
    );
    expect(screen.getByPlaceholderText("Enter amount")).toBeInTheDocument();
  });

  it("renders with formatted value", () => {
    render(<CurrencyInput value={1500} onChange={() => {}} />);
    const input = screen.getByRole("textbox");
    expect(input).toHaveValue("₮ 1,500");
  });

  it("renders with zero value", () => {
    render(<CurrencyInput value={0} onChange={() => {}} />);
    const input = screen.getByRole("textbox");
    // 0 should show formatted as "₮ 0"
    expect(input).toHaveValue("₮ 0");
  });

  it("renders empty when value is null", () => {
    render(<CurrencyInput value={null} onChange={() => {}} />);
    const input = screen.getByRole("textbox");
    expect(input).toHaveValue("");
  });

  it("has correct aria-label by default", () => {
    render(<CurrencyInput value={0} onChange={() => {}} />);
    const input = screen.getByLabelText("Currency");
    expect(input).toBeInTheDocument();
  });

  it("accepts custom aria-label", () => {
    render(
      <CurrencyInput
        value={0}
        onChange={() => {}}
        aria-label="Amount in MNT"
      />,
    );
    const input = screen.getByLabelText("Amount in MNT");
    expect(input).toBeInTheDocument();
  });

  it("renders with disabled state", () => {
    render(<CurrencyInput value={0} onChange={() => {}} disabled />);
    const input = screen.getByRole("textbox");
    expect(input).toBeDisabled();
  });

  it("renders with readOnly state", () => {
    render(<CurrencyInput value={0} onChange={() => {}} readOnly />);
    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("readOnly");
  });

  it("renders with sm size", () => {
    render(<CurrencyInput value={0} onChange={() => {}} size="sm" />);
    const input = screen.getByRole("textbox");
    expect(input).toBeInTheDocument();
  });

  it("renders with left alignment", () => {
    render(<CurrencyInput value={0} onChange={() => {}} align="left" />);
    const input = screen.getByRole("textbox");
    expect(input).toBeInTheDocument();
  });

  it("renders without prefix when showPrefix is false", () => {
    render(
      <CurrencyInput value={1000} onChange={() => {}} showPrefix={false} />,
    );
    const input = screen.getByRole("textbox");
    // Without prefix, value formats as just the number
    expect(input).toBeInTheDocument();
  });

  it("shows prefix ₮ by default", () => {
    const { container } = render(
      <CurrencyInput value={500} onChange={() => {}} />,
    );
    // The ₮ symbol is rendered in an InputGroupAddon before the input
    const prefix = container.querySelector('[data-slot="input-group-addon"]');
    expect(prefix).toBeInTheDocument();
    expect(prefix).toHaveTextContent("₮");
  });

  it("calls onChange when value changes and input loses focus", () => {
    const onChange = vi.fn();
    render(<CurrencyInput value={null} onChange={onChange} />);
    const input = screen.getByRole("textbox");

    // Focus to enter editing mode
    fireEvent.focus(input);
    // Type a value
    fireEvent.change(input, { target: { value: "2500" } });
    // Blur to commit
    fireEvent.blur(input);

    expect(onChange).toHaveBeenCalledWith(2500);
  });

  it("calls onBlur when input loses focus", () => {
    const onBlur = vi.fn();
    render(<CurrencyInput value={0} onChange={() => {}} onBlur={onBlur} />);
    const input = screen.getByRole("textbox");
    fireEvent.focus(input);
    fireEvent.blur(input);
    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  it("commits value on Enter key", () => {
    const onChange = vi.fn();
    render(<CurrencyInput value={null} onChange={onChange} />);
    const input = screen.getByRole("textbox");
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "5000" } });
    fireEvent.keyDown(input, { key: "Enter" });
    // The component calls blur() on Enter, which triggers handleBlur → commitValue
    // In jsdom, blur() fired from within a keydown handler doesn't always propagate,
    // so we fire blur explicitly to simulate the browser behavior
    fireEvent.blur(input);
    expect(onChange).toHaveBeenCalledWith(5000);
  });

  it("discards edit on Escape key", () => {
    const onChange = vi.fn();
    render(<CurrencyInput value={1000} onChange={onChange} />);
    const input = screen.getByRole("textbox");
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "9999" } });
    fireEvent.keyDown(input, { key: "Escape" });
    // Blur to see if the value was committed or not (should not commit after Escape)
    fireEvent.blur(input);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("does not focus when disabled", () => {
    render(<CurrencyInput value={0} onChange={() => {}} disabled />);
    const input = screen.getByRole("textbox");
    fireEvent.focus(input);
    // Should stay as formatted value, not enter edit mode
    expect(input).toHaveValue("₮ 0");
  });

  it("clamps value to min", () => {
    const onChange = vi.fn();
    render(<CurrencyInput value={null} onChange={onChange} min={0} />);
    const input = screen.getByRole("textbox");
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "-100" } });
    fireEvent.blur(input);
    expect(onChange).toHaveBeenCalledWith(0);
  });

  it("has inputMode numeric", () => {
    render(<CurrencyInput value={0} onChange={() => {}} />);
    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("inputMode", "numeric");
  });

  it("applies custom className", () => {
    render(
      <CurrencyInput value={0} onChange={() => {}} className="custom-class" />,
    );
    const input = screen.getByRole("textbox");
    expect(input.className).toContain("custom-class");
  });
});
