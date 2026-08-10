import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from "@/components/ui/input-group";

function renderGroup(ui: React.ReactElement) {
  const result = render(ui);
  function $(selector: string) {
    return result.baseElement.querySelector(selector);
  }
  return { ...result, $ };
}

describe("InputGroup", () => {
  it("renders a group with role and aria-label", () => {
    const { $ } = renderGroup(
      <InputGroup>
        <InputGroupInput />
      </InputGroup>,
    );
    const group = $("[data-slot='input-group']");
    expect(group).toBeInTheDocument();
    expect(group?.getAttribute("role")).toBe("group");
    expect(group?.getAttribute("aria-label")).toBe("Input group");
  });

  it("applies custom className", () => {
    const { $ } = renderGroup(
      <InputGroup className="custom-group">
        <InputGroupInput />
      </InputGroup>,
    );
    expect($("[data-slot='input-group']")?.className).toContain("custom-group");
  });

  it("renders input with the group-control slot", () => {
    const { $ } = renderGroup(
      <InputGroup>
        <InputGroupInput aria-label="Search" />
      </InputGroup>,
    );
    const input = $("[data-slot='input-group-control']");
    expect(input).toBeInTheDocument();
    expect(input?.tagName).toBe("INPUT");
  });

  it("typing in the input updates its value", () => {
    renderGroup(
      <InputGroup>
        <InputGroupInput aria-label="Search" />
      </InputGroup>,
    );
    const input = screen.getByLabelText("Search");
    fireEvent.change(input, { target: { value: "oil" } });
    expect(input).toHaveValue("oil");
  });

  it("renders textarea with the group-control slot", () => {
    const { $ } = renderGroup(
      <InputGroup>
        <InputGroupTextarea aria-label="Notes" />
      </InputGroup>,
    );
    const textarea = $("[data-slot='input-group-control']");
    expect(textarea).toBeInTheDocument();
    expect(textarea?.tagName).toBe("TEXTAREA");
  });

  it("renders addon with default inline-start alignment", () => {
    const { $ } = renderGroup(
      <InputGroup>
        <InputGroupAddon>₮</InputGroupAddon>
        <InputGroupInput aria-label="Amount" />
      </InputGroup>,
    );
    const addon = $("[data-slot='input-group-addon']");
    expect(addon).toBeInTheDocument();
    expect(addon?.getAttribute("data-align")).toBe("inline-start");
    expect(addon?.getAttribute("role")).toBe("group");
  });

  it("renders addon with custom alignment", () => {
    const { $ } = renderGroup(
      <InputGroup>
        <InputGroupInput aria-label="Amount" />
        <InputGroupAddon align="inline-end">₮</InputGroupAddon>
      </InputGroup>,
    );
    expect(
      $("[data-slot='input-group-addon']")?.getAttribute("data-align"),
    ).toBe("inline-end");
  });

  it("clicking the addon focuses the input", () => {
    const { $ } = renderGroup(
      <InputGroup>
        <InputGroupAddon>₮</InputGroupAddon>
        <InputGroupInput aria-label="Amount" />
      </InputGroup>,
    );
    fireEvent.click($("[data-slot='input-group-addon']") as Element);
    expect(document.activeElement).toBe($("[data-slot='input-group-control']"));
  });

  it("pressing Enter on the addon focuses the input", () => {
    const { $ } = renderGroup(
      <InputGroup>
        <InputGroupAddon>₮</InputGroupAddon>
        <InputGroupInput aria-label="Amount" />
      </InputGroup>,
    );
    fireEvent.keyDown($("[data-slot='input-group-addon']") as Element, {
      key: "Enter",
    });
    expect(document.activeElement).toBe($("[data-slot='input-group-control']"));
  });

  it("does not steal focus when a button inside the addon is clicked", () => {
    const onClick = vi.fn();
    const { $ } = renderGroup(
      <InputGroup>
        <InputGroupAddon>
          <InputGroupButton aria-label="Search button" onClick={onClick}>
            Go
          </InputGroupButton>
        </InputGroupAddon>
        <InputGroupInput aria-label="Search" />
      </InputGroup>,
    );
    const button = screen.getByRole("button", { name: "Search button" });
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(document.activeElement).not.toBe(
      $("[data-slot='input-group-control']"),
    );
  });

  it("renders InputGroupButton with custom type", () => {
    const { $ } = renderGroup(
      <InputGroup>
        <InputGroupButton type="submit">Save</InputGroupButton>
      </InputGroup>,
    );
    const button = $("[data-slot='button']");
    expect(button?.getAttribute("type")).toBe("submit");
  });

  it("renders InputGroupText content", () => {
    renderGroup(
      <InputGroup>
        <InputGroupAddon>
          <InputGroupText>Unit</InputGroupText>
        </InputGroupAddon>
        <InputGroupInput aria-label="Qty" />
      </InputGroup>,
    );
    expect(screen.getByText("Unit")).toBeInTheDocument();
  });

  it("propagates disabled state to the input", () => {
    const { $ } = renderGroup(
      <InputGroup>
        <InputGroupInput aria-label="Disabled" disabled />
      </InputGroup>,
    );
    expect($("[data-slot='input-group-control']")).toBeDisabled();
  });

  it("propagates aria-invalid to the input", () => {
    const { $ } = renderGroup(
      <InputGroup>
        <InputGroupInput aria-label="Invalid" aria-invalid />
      </InputGroup>,
    );
    expect(
      $("[data-slot='input-group-control']")?.getAttribute("aria-invalid"),
    ).toBe("true");
  });
});
