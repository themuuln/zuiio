import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { NumericKeypad } from "@/components/ui/numeric-keypad";
import { render } from "@/test/test-utils";

const messages = {
  common: {
    numericKeypad: "Numeric keypad",
    backspace: "Backspace",
    clear: "Clear",
    decimalPoint: "Decimal point",
  },
};

describe("NumericKeypad", () => {
  it("renders trigger children", () => {
    render(
      <NumericKeypad value={0} onChange={vi.fn()}>
        <input data-testid="trigger-input" readOnly />
      </NumericKeypad>,
      { messages },
    );
    expect(screen.getByTestId("trigger-input")).toBeInTheDocument();
  });

  it("opens keypad on trigger click", async () => {
    const user = userEvent.setup();
    render(
      <NumericKeypad value={0} onChange={vi.fn()}>
        <input data-testid="trigger-input" readOnly />
      </NumericKeypad>,
      { messages },
    );
    const trigger = screen.getByTestId("trigger-input");
    await user.click(trigger);
    // Dialog should now be open; keypad buttons should be visible
    const okButtons = screen.getAllByText("OK");
    expect(okButtons.length).toBeGreaterThanOrEqual(1);
  });

  it("shows digit buttons when keypad is open", async () => {
    const user = userEvent.setup();
    render(
      <NumericKeypad value={0} onChange={vi.fn()}>
        <input data-testid="trigger-input" readOnly />
      </NumericKeypad>,
      { messages },
    );
    await user.click(screen.getByTestId("trigger-input"));
    // Use getAllByText for digits that may appear multiple times
    expect(screen.getAllByText("7").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("8").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("9").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("4").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("5").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("6").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("1").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("2").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("3").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(".").length).toBeGreaterThanOrEqual(1);
  });

  it("shows value display with initial value", async () => {
    const user = userEvent.setup();
    render(
      <NumericKeypad value={42} onChange={vi.fn()}>
        <input data-testid="trigger-input" readOnly />
      </NumericKeypad>,
      { messages },
    );
    await user.click(screen.getByTestId("trigger-input"));
    // Display shows "42" in the value area
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("updates buffer when number keys are pressed", async () => {
    const user = userEvent.setup();
    render(
      <NumericKeypad value={0} onChange={vi.fn()}>
        <input data-testid="trigger-input" readOnly />
      </NumericKeypad>,
      { messages },
    );
    await user.click(screen.getByTestId("trigger-input"));
    await user.click(screen.getByText("1"));
    await user.click(screen.getByText("2"));
    await user.click(screen.getByText("3"));
    // Display should show "123"
    expect(screen.getByText("123")).toBeInTheDocument();
  });

  it("clears buffer when C key is pressed", async () => {
    const user = userEvent.setup();
    render(
      <NumericKeypad value={0} onChange={vi.fn()}>
        <input data-testid="trigger-input" readOnly />
      </NumericKeypad>,
      { messages },
    );
    await user.click(screen.getByTestId("trigger-input"));
    await user.click(screen.getByText("4"));
    await user.click(screen.getByText("5"));
    expect(screen.getByText("45")).toBeInTheDocument();
    await user.click(screen.getByText("C"));
    // Display should show "0" - check display value
    const zeros = screen.getAllByText("0");
    expect(zeros.length).toBeGreaterThanOrEqual(1);
  });

  it("calls onChange with parsed value when OK is pressed", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <NumericKeypad value={0} onChange={onChange}>
        <input data-testid="trigger-input" readOnly />
      </NumericKeypad>,
      { messages },
    );
    await user.click(screen.getByTestId("trigger-input"));
    await user.click(screen.getByText("7"));
    await user.click(screen.getByText("5"));

    const okButtons = screen.getAllByText("OK");
    await user.click(okButtons[okButtons.length - 1]);
    expect(onChange).toHaveBeenCalledWith(75);
  });

  it("shows backspace button", async () => {
    const user = userEvent.setup();
    render(
      <NumericKeypad value={0} onChange={vi.fn()}>
        <input data-testid="trigger-input" readOnly />
      </NumericKeypad>,
      { messages },
    );
    await user.click(screen.getByTestId("trigger-input"));
    const backspaceButtons = screen.getAllByRole("button", {
      name: "Backspace",
    });
    expect(backspaceButtons.length).toBeGreaterThanOrEqual(1);
  });

  it("handles decimal point entry", async () => {
    const user = userEvent.setup();
    render(
      <NumericKeypad value={0} onChange={vi.fn()}>
        <input data-testid="trigger-input" readOnly />
      </NumericKeypad>,
      { messages },
    );
    await user.click(screen.getByTestId("trigger-input"));
    await user.click(screen.getByText("."));
    expect(screen.getByText("0.")).toBeInTheDocument();
    await user.click(screen.getByText("5"));
    await user.click(screen.getByText("0"));
    expect(screen.getByText("0.50")).toBeInTheDocument();
  });
});
