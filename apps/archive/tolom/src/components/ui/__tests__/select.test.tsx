import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * Helper: render a component and return baseElement + query helpers
 * that also search portal content (Base UI renders select popups in portals).
 */
function _renderSelect(ui: React.ReactElement) {
  const result = render(ui);
  function $(selector: string) {
    return result.baseElement.querySelector(selector);
  }
  function $$(selector: string) {
    return result.baseElement.querySelectorAll(selector);
  }
  return { ...result, $, $$ };
}

describe("Select", () => {
  function TestSelect({
    defaultValue = "apple",
    onValueChange,
  }: {
    defaultValue?: string;
    onValueChange?: (value: string) => void;
  }) {
    const [value, setValue] = useState(defaultValue);
    return (
      <Select
        value={value}
        onValueChange={(v) => {
          setValue(v);
          onValueChange?.(v);
        }}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Fruits</SelectLabel>
            <SelectItem value="apple">Apple</SelectItem>
            <SelectItem value="banana">Banana</SelectItem>
            <SelectItem value="cherry">Cherry</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    );
  }

  it("renders trigger with data-slot", () => {
    render(<TestSelect />);
    const trigger = document.querySelector("[data-slot='select-trigger']");
    expect(trigger).toBeInTheDocument();
  });

  it("renders trigger with default value", () => {
    render(<TestSelect defaultValue="apple" />);
    // Base UI renders the value as-is (lowercase "apple")
    expect(screen.getByText("apple")).toBeInTheDocument();
  });

  it("renders with sm size", () => {
    render(
      <Select defaultValue="apple">
        <SelectTrigger size="sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="apple">Apple</SelectItem>
        </SelectContent>
      </Select>,
    );
    const trigger = document.querySelector("[data-slot='select-trigger']");
    expect(trigger).toHaveAttribute("data-size", "sm");
  });

  it("renders placeholder when no value matches", () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Pick a fruit" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="apple">Apple</SelectItem>
        </SelectContent>
      </Select>,
    );
    expect(screen.getByText("Pick a fruit")).toBeInTheDocument();
  });

  it("opens popup on trigger click", () => {
    render(<TestSelect />);
    const trigger = document.querySelector("[data-slot='select-trigger']");
    expect(trigger).toBeInTheDocument();

    // Click to open
    if (!trigger) throw new Error("select trigger not found");
    fireEvent.click(trigger);

    // Base UI renders content in a portal
    const content = document.querySelector("[data-slot='select-content']");
    expect(content).toBeInTheDocument();
  });
  it("mounts popup inside the nearest drawer", () => {
    render(
      <Drawer open onOpenChange={() => undefined}>
        <DrawerContent showCloseButton={false}>
          <DrawerTitle>Drawer</DrawerTitle>
          <TestSelect />
        </DrawerContent>
      </Drawer>,
    );

    const trigger = document.querySelector("[data-slot='select-trigger']");
    if (!trigger) throw new Error("select trigger not found");
    fireEvent.click(trigger);

    const content = document.querySelector("[data-slot='select-content']");
    expect(content).toBeInTheDocument();
    expect(content?.closest("[data-slot='drawer-popup']")).toBeInTheDocument();
  });

  it("shows select item labels when opened", () => {
    render(<TestSelect />);
    const trigger = document.querySelector("[data-slot='select-trigger']");
    if (!trigger) throw new Error("select trigger not found");
    fireEvent.click(trigger);

    expect(screen.getByText("Banana")).toBeInTheDocument();
    expect(screen.getByText("Cherry")).toBeInTheDocument();
  });

  it("renders group label", () => {
    render(<TestSelect />);
    const trigger = document.querySelector("[data-slot='select-trigger']");
    if (!trigger) throw new Error("select trigger not found");
    fireEvent.click(trigger);

    expect(screen.getByText("Fruits")).toBeInTheDocument();
  });

  it("renders separator", () => {
    render(
      <Select defaultValue="apple">
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="apple">Apple</SelectItem>
          <SelectSeparator />
          <SelectItem value="other">Other</SelectItem>
        </SelectContent>
      </Select>,
    );
    const trigger = document.querySelector("[data-slot='select-trigger']");
    if (!trigger) throw new Error("select trigger not found");
    fireEvent.click(trigger);

    const sep = document.querySelector("[data-slot='select-separator']");
    expect(sep).toBeInTheDocument();
  });

  it("renders with custom className on trigger", () => {
    render(
      <Select defaultValue="apple">
        <SelectTrigger className="custom-trigger">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="apple">Apple</SelectItem>
        </SelectContent>
      </Select>,
    );
    const trigger = document.querySelector("[data-slot='select-trigger']");
    expect(trigger?.className).toContain("custom-trigger");
  });

  it("disabled trigger does not open popup", () => {
    render(
      <Select disabled>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="apple">Apple</SelectItem>
        </SelectContent>
      </Select>,
    );
    const trigger = document.querySelector("[data-slot='select-trigger']");
    expect(trigger?.className).toContain("disabled");
  });
});
