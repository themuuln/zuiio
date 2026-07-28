import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

function renderRG(ui: React.ReactElement) {
  const result = render(ui);
  function $(selector: string) {
    return result.baseElement.querySelector(selector);
  }
  function $$(selector: string) {
    return result.baseElement.querySelectorAll(selector);
  }
  return { ...result, $, $$ };
}

describe("RadioGroup", () => {
  it("renders with data-slot radio-group", () => {
    const { $ } = renderRG(
      <RadioGroup>
        <RadioGroupItem value="a" />
      </RadioGroup>,
    );
    expect($("[data-slot='radio-group']")).toBeInTheDocument();
  });

  it("renders radio group items with data-slot", () => {
    const { $$ } = renderRG(
      <RadioGroup>
        <RadioGroupItem value="a" />
        <RadioGroupItem value="b" />
      </RadioGroup>,
    );
    expect($$("[data-slot='radio-group-item']")).toHaveLength(2);
  });

  it("renders indicator on checked items", () => {
    const { $ } = renderRG(
      <RadioGroup defaultValue="a">
        <RadioGroupItem value="a" />
        <RadioGroupItem value="b" />
      </RadioGroup>,
    );
    expect($("[data-slot='radio-group-indicator']")).toBeInTheDocument();
  });

  it("changes selected value on click", async () => {
    const user = userEvent.setup();
    const { $ } = renderRG(
      <RadioGroup defaultValue="a">
        <RadioGroupItem value="a" />
        <RadioGroupItem value="b" />
      </RadioGroup>,
    );
    const items = $("[data-slot='radio-group']")?.querySelectorAll(
      "[data-slot='radio-group-item']",
    );
    expect(items[0]).toHaveAttribute("data-checked");
    expect(items[1]).not.toHaveAttribute("data-checked");
    await user.click(items[1]!);
    expect(items[1]).toHaveAttribute("data-checked");
  });

  it("accepts custom className on group", () => {
    const { $ } = renderRG(
      <RadioGroup className="custom-group">
        <RadioGroupItem value="a" />
      </RadioGroup>,
    );
    expect($("[data-slot='radio-group']")?.className).toContain("custom-group");
  });

  it("accepts custom className on item", () => {
    const { $ } = renderRG(
      <RadioGroup>
        <RadioGroupItem value="a" className="custom-item" />
      </RadioGroup>,
    );
    expect($("[data-slot='radio-group-item']")?.className).toContain(
      "custom-item",
    );
  });

  it("renders disabled items", () => {
    const { $ } = renderRG(
      <RadioGroup>
        <RadioGroupItem value="a" disabled />
      </RadioGroup>,
    );
    expect($("[data-slot='radio-group-item']")).toHaveAttribute(
      "data-disabled",
    );
  });

  it("renders with value via controlled prop", () => {
    const { $ } = renderRG(
      <RadioGroup value="b">
        <RadioGroupItem value="a" />
        <RadioGroupItem value="b" />
      </RadioGroup>,
    );
    const items = $("[data-slot='radio-group']")?.querySelectorAll(
      "[data-slot='radio-group-item']",
    );
    expect(items[1]).toHaveAttribute("data-checked");
  });
});
