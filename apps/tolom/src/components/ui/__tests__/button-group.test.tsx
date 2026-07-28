import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "@/components/ui/button";
import {
  ButtonGroup,
  ButtonGroupSeparator,
  ButtonGroupText,
} from "@/components/ui/button-group";

function renderButtonGroup(ui: React.ReactElement) {
  const result = render(ui);
  function $(selector: string) {
    return result.baseElement.querySelector(selector);
  }
  return { ...result, $ };
}

describe("ButtonGroup", () => {
  it("renders with role group", () => {
    const { $ } = renderButtonGroup(<ButtonGroup />);
    const group = $("[data-slot='button-group']");
    expect(group).toBeInTheDocument();
    expect(group).toHaveAttribute("role", "group");
  });

  it("renders with data-orientation when passed", () => {
    const { $ } = renderButtonGroup(
      <ButtonGroup orientation="horizontal">
        <Button>First</Button>
        <Button>Second</Button>
      </ButtonGroup>,
    );
    expect($("[data-slot='button-group']")).toHaveAttribute(
      "data-orientation",
      "horizontal",
    );
  });

  it("renders with vertical orientation prop", () => {
    const { $ } = renderButtonGroup(
      <ButtonGroup orientation="vertical">
        <Button>Top</Button>
        <Button>Bottom</Button>
      </ButtonGroup>,
    );
    expect($("[data-slot='button-group']")).toHaveAttribute(
      "data-orientation",
      "vertical",
    );
  });

  it("renders children", () => {
    render(
      <ButtonGroup>
        <Button>One</Button>
        <Button>Two</Button>
      </ButtonGroup>,
    );
    expect(screen.getByText("One")).toBeInTheDocument();
    expect(screen.getByText("Two")).toBeInTheDocument();
  });

  it("renders ButtonGroupText", () => {
    render(
      <ButtonGroup>
        <ButtonGroupText>Label</ButtonGroupText>
      </ButtonGroup>,
    );
    const text = screen.getByText("Label");
    expect(text).toBeInTheDocument();
    expect(text).toHaveAttribute("data-slot", "button-group-text");
  });

  it("renders ButtonGroupSeparator", () => {
    const { $ } = renderButtonGroup(
      <ButtonGroup>
        <Button>One</Button>
        <ButtonGroupSeparator />
        <Button>Two</Button>
      </ButtonGroup>,
    );
    expect($("[data-slot='button-group-separator']")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { $ } = renderButtonGroup(<ButtonGroup className="custom" />);
    expect($("[data-slot='button-group']")?.className).toContain("custom");
  });
});
