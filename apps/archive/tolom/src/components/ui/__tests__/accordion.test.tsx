import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

function renderAccordion(ui: React.ReactElement) {
  const result = render(ui);
  function $(selector: string) {
    return result.baseElement.querySelector(selector);
  }
  function $$(selector: string) {
    return result.baseElement.querySelectorAll(selector);
  }
  return { ...result, $, $$ };
}

describe("Accordion", () => {
  it("renders root with data-slot", () => {
    const { $ } = renderAccordion(<Accordion />);
    expect($("[data-slot='accordion']")).toBeInTheDocument();
  });

  it("renders accordion item", () => {
    const { $ } = renderAccordion(
      <Accordion>
        <AccordionItem value="item-1" />
      </Accordion>,
    );
    expect($("[data-slot='accordion-item']")).toBeInTheDocument();
  });

  it("renders trigger with chevron icons", () => {
    render(
      <Accordion>
        <AccordionItem value="item-1">
          <AccordionTrigger>Section 1</AccordionTrigger>
        </AccordionItem>
      </Accordion>,
    );
    expect(screen.getByText("Section 1")).toBeInTheDocument();
    const trigger = screen
      .getByText("Section 1")
      .closest("[data-slot='accordion-trigger']");
    expect(trigger).toBeInTheDocument();
  });

  it("renders content when item is open", () => {
    render(
      <Accordion defaultValue={["item-1"]}>
        <AccordionItem value="item-1">
          <AccordionTrigger>Trigger</AccordionTrigger>
          <AccordionContent>Content here</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );
    expect(screen.getByText("Content here")).toBeInTheDocument();
  });

  it("renders content element with data-slot", () => {
    render(
      <Accordion defaultValue={["item-1"]}>
        <AccordionItem value="item-1">
          <AccordionTrigger>Trigger</AccordionTrigger>
          <AccordionContent>Content</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );
    expect(
      screen.getByText("Content").closest("[data-slot='accordion-content']"),
    ).toBeInTheDocument();
  });

  it("applies custom className on root", () => {
    const { $ } = renderAccordion(
      <Accordion className="custom-root">
        <AccordionItem value="i">
          <AccordionContent>Content</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );
    expect($("[data-slot='accordion']")?.className).toContain("custom-root");
  });

  it("renders multiple items", () => {
    const { $$ } = renderAccordion(
      <Accordion>
        <AccordionItem value="item-1">
          <AccordionTrigger>First</AccordionTrigger>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>Second</AccordionTrigger>
        </AccordionItem>
      </Accordion>,
    );
    expect($$("[data-slot='accordion-item']")).toHaveLength(2);
  });
});
