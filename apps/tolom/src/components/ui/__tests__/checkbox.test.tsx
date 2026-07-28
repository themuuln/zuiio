import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Checkbox } from "@/components/ui/checkbox";

function renderCheckbox(ui: React.ReactElement) {
  const result = render(ui);
  function $(selector: string) {
    return result.baseElement.querySelector(selector);
  }
  return { ...result, $ };
}

describe("Checkbox", () => {
  it("renders with data-slot checkbox", () => {
    const { $ } = renderCheckbox(<Checkbox />);
    expect($("[data-slot='checkbox']")).toBeInTheDocument();
  });

  it("renders indicator with data-slot", () => {
    const { $ } = renderCheckbox(<Checkbox defaultChecked />);
    // Indicator is only rendered when checked
    expect($("[data-slot='checkbox-indicator']")).toBeInTheDocument();
  });

  it("toggles checked state on click", async () => {
    const user = userEvent.setup();
    const { $ } = renderCheckbox(<Checkbox />);
    const checkbox = $("[data-slot='checkbox']")!;
    await user.click(checkbox);
    expect(checkbox).toHaveAttribute("data-checked");
  });

  it("renders disabled state", () => {
    const { $ } = renderCheckbox(<Checkbox disabled />);
    const checkbox = $("[data-slot='checkbox']");
    expect(checkbox).toHaveAttribute("data-disabled");
  });

  it("accepts custom className", () => {
    const { $ } = renderCheckbox(<Checkbox className="custom-checkbox" />);
    expect($("[data-slot='checkbox']")?.className).toContain("custom-checkbox");
  });

  it("passes additional props", () => {
    render(<Checkbox data-testid="test-checkbox" />);
    expect(screen.getByTestId("test-checkbox")).toBeInTheDocument();
  });

  it("renders with aria-label", () => {
    render(<Checkbox aria-label="Accept terms" />);
    expect(screen.getByLabelText("Accept terms")).toBeInTheDocument();
  });
});
