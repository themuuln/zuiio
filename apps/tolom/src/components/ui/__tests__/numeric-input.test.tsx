import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { NumericInput } from "@/components/ui/numeric-input";

describe("NumericInput", () => {
  it("renders the value as text", () => {
    render(<NumericInput value={5} onChange={() => {}} />);
    expect(screen.getByRole("textbox")).toHaveValue("5");
  });

  it("renders zero correctly", () => {
    render(<NumericInput value={0} onChange={() => {}} />);
    expect(screen.getByRole("textbox")).toHaveValue("0");
  });

  it("renders the placeholder", () => {
    render(<NumericInput value={0} onChange={() => {}} placeholder="Qty" />);
    expect(screen.getByPlaceholderText("Qty")).toBeInTheDocument();
  });

  it("has a default aria-label of Numeric", () => {
    render(<NumericInput value={0} onChange={() => {}} />);
    expect(screen.getByLabelText("Numeric")).toBeInTheDocument();
  });

  it("accepts a custom aria-label", () => {
    render(
      <NumericInput value={0} onChange={() => {}} aria-label="Odometer" />,
    );
    expect(screen.getByLabelText("Odometer")).toBeInTheDocument();
  });

  it("uses inputMode numeric for integer steps", () => {
    render(<NumericInput value={0} onChange={() => {}} />);
    expect(screen.getByRole("textbox")).toHaveAttribute("inputMode", "numeric");
  });

  it("uses inputMode decimal for fractional steps", () => {
    render(<NumericInput value={0} step={0.01} onChange={() => {}} />);
    expect(screen.getByRole("textbox")).toHaveAttribute("inputMode", "decimal");
  });

  it("renders with type text (no native number spinners)", () => {
    render(<NumericInput value={0} onChange={() => {}} />);
    expect(screen.getByRole("textbox")).toHaveAttribute("type", "text");
  });

  it("disables editing when disabled", () => {
    const onChange = vi.fn();
    render(<NumericInput value={7} onChange={onChange} disabled />);
    const input = screen.getByRole("textbox");
    expect(input).toBeDisabled();
    fireEvent.focus(input);
    expect(input).toHaveValue("7");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("does not enter edit mode when readOnly", () => {
    render(<NumericInput value={7} onChange={() => {}} readOnly />);
    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("readOnly");
    fireEvent.focus(input);
    expect(input).toHaveValue("7");
  });

  it("commits the typed value on blur", () => {
    const onChange = vi.fn();
    render(<NumericInput value={5} onChange={onChange} />);
    const input = screen.getByRole("textbox");
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "10" } });
    fireEvent.blur(input);
    expect(onChange).toHaveBeenCalledWith(10);
  });

  it("commits the typed value on Enter", () => {
    const onChange = vi.fn();
    render(<NumericInput value={5} onChange={onChange} />);
    const input = screen.getByRole("textbox");
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "12" } });
    fireEvent.keyDown(input, { key: "Enter" });
    // Enter blurs the input; blur commits
    fireEvent.blur(input);
    expect(onChange).toHaveBeenCalledWith(12);
  });

  it("clamps the value to the minimum on commit", () => {
    const onChange = vi.fn();
    render(<NumericInput value={5} min={0} onChange={onChange} />);
    const input = screen.getByRole("textbox");
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "-5" } });
    fireEvent.blur(input);
    expect(onChange).toHaveBeenCalledWith(0);
  });

  it("clamps the value to the maximum on commit", () => {
    const onChange = vi.fn();
    render(<NumericInput value={5} max={100} onChange={onChange} />);
    const input = screen.getByRole("textbox");
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "150" } });
    fireEvent.blur(input);
    expect(onChange).toHaveBeenCalledWith(100);
  });

  it("rejects decimal input in integer mode", () => {
    const onChange = vi.fn();
    render(<NumericInput value={5} onChange={onChange} />);
    const input = screen.getByRole("textbox");
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "3.7" } });
    fireEvent.blur(input);
    // the decimal point is filtered out — edit state keeps the previous value
    expect(onChange).not.toHaveBeenCalled();
  });

  it("keeps decimals for fractional steps", () => {
    const onChange = vi.fn();
    render(<NumericInput value={5} step={0.5} onChange={onChange} />);
    const input = screen.getByRole("textbox");
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "1.5" } });
    fireEvent.blur(input);
    expect(onChange).toHaveBeenCalledWith(1.5);
  });

  it("commits 0 when the input is cleared", () => {
    const onChange = vi.fn();
    render(<NumericInput value={5} onChange={onChange} />);
    const input = screen.getByRole("textbox");
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "" } });
    fireEvent.blur(input);
    expect(onChange).toHaveBeenCalledWith(0);
  });

  it("reverts the display to the committed value on Escape", () => {
    const onChange = vi.fn();
    render(<NumericInput value={100} onChange={onChange} />);
    const input = screen.getByRole("textbox");
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "999" } });
    fireEvent.keyDown(input, { key: "Escape" });
    // editing mode is exited — the committed value is shown again
    expect(input).toHaveValue("100");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("ignores non-numeric characters while typing", () => {
    const onChange = vi.fn();
    render(<NumericInput value={5} onChange={onChange} />);
    const input = screen.getByRole("textbox");
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "ab12c" } });
    // the invalid text is not accepted into edit state
    expect(input).toHaveValue("5");
    fireEvent.blur(input);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("does not call onChange when the committed value is unchanged", () => {
    const onChange = vi.fn();
    render(<NumericInput value={5} onChange={onChange} />);
    const input = screen.getByRole("textbox");
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "5" } });
    fireEvent.blur(input);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("calls onBlur on blur", () => {
    const onBlur = vi.fn();
    render(<NumericInput value={5} onChange={() => {}} onBlur={onBlur} />);
    const input = screen.getByRole("textbox");
    fireEvent.focus(input);
    fireEvent.blur(input);
    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  it("applies size and align classes", () => {
    const { container } = render(
      <NumericInput value={0} onChange={() => {}} size="sm" align="right" />,
    );
    const input = container.querySelector("input");
    expect(input?.className).toContain("h-8");
    expect(input?.className).toContain("text-right");
  });

  it("applies custom className", () => {
    render(
      <NumericInput value={0} onChange={() => {}} className="custom-input" />,
    );
    expect(screen.getByRole("textbox").className).toContain("custom-input");
  });
});
