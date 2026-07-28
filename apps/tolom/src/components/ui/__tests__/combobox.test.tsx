import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  Combobox,
  ComboboxContent,
  ComboboxItem,
  ComboboxTrigger,
  ComboboxValue,
} from "@/components/ui/combobox";

describe("Combobox (static rendering)", () => {
  it("renders ComboboxTrigger with text", () => {
    render(
      <Combobox>
        <ComboboxTrigger>Select option</ComboboxTrigger>
      </Combobox>,
    );
    expect(screen.getByText("Select option")).toBeInTheDocument();
  });

  it("renders ComboboxValue text", () => {
    render(
      <Combobox>
        <ComboboxValue>Selected</ComboboxValue>
      </Combobox>,
    );
    expect(screen.getByText("Selected")).toBeInTheDocument();
  });

  it("renders combobox with items inside content", () => {
    render(
      <Combobox defaultOpen>
        <ComboboxContent>
          <ComboboxItem value="item1">Item 1</ComboboxItem>
          <ComboboxItem value="item2">Item 2</ComboboxItem>
        </ComboboxContent>
      </Combobox>,
    );
    expect(screen.getByText("Item 1")).toBeInTheDocument();
    expect(screen.getByText("Item 2")).toBeInTheDocument();
  });

  it("renders multiple items when defaultOpen", () => {
    render(
      <Combobox defaultOpen>
        <ComboboxContent>
          <ComboboxItem value="1">Option A</ComboboxItem>
          <ComboboxItem value="2">Option B</ComboboxItem>
          <ComboboxItem value="3">Option C</ComboboxItem>
        </ComboboxContent>
      </Combobox>,
    );
    expect(screen.getByText("Option A")).toBeInTheDocument();
    expect(screen.getByText("Option B")).toBeInTheDocument();
    expect(screen.getByText("Option C")).toBeInTheDocument();
  });
});
