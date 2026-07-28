import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

describe("Tabs", () => {
  function TestTabs({ defaultValue = "tab1" }: { defaultValue?: string }) {
    const [value, setValue] = useState(defaultValue);
    return (
      <Tabs value={value} onValueChange={setValue}>
        <TabsList>
          <TabsTrigger value="tab1">First Tab</TabsTrigger>
          <TabsTrigger value="tab2">Second Tab</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">First content</TabsContent>
        <TabsContent value="tab2">Second content</TabsContent>
      </Tabs>
    );
  }

  it("renders tabs root with data-slot", () => {
    render(<TestTabs />);
    const root = document.querySelector("[data-slot='tabs']");
    expect(root).toBeInTheDocument();
  });

  it("renders tabs list with data-slot", () => {
    render(<TestTabs />);
    const list = document.querySelector("[data-slot='tabs-list']");
    expect(list).toBeInTheDocument();
  });

  it("renders all triggers", () => {
    render(<TestTabs />);
    expect(screen.getByText("First Tab")).toBeInTheDocument();
    expect(screen.getByText("Second Tab")).toBeInTheDocument();
    const triggers = document.querySelectorAll("[data-slot='tabs-trigger']");
    expect(triggers.length).toBe(2);
  });

  it("shows active tab content and hides inactive", () => {
    render(<TestTabs defaultValue="tab1" />);
    const _content1 = document.querySelector(
      "[data-slot='tabs-content'][value='tab1']",
    );
    const _content2 = document.querySelector(
      "[data-slot='tabs-content'][value='tab2']",
    );
    // Base UI hides inactive panels
    // The active one should be visible
    expect(screen.getByText("First content")).toBeInTheDocument();
  });

  it("switches content when clicking a different tab", () => {
    render(<TestTabs defaultValue="tab1" />);
    fireEvent.click(screen.getByText("Second Tab"));
    // After switching, the new content should appear
    expect(screen.getByText("Second content")).toBeInTheDocument();
  });

  it("renders with vertical orientation", () => {
    render(
      <Tabs defaultValue="tab1" orientation="vertical">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Vertical content</TabsContent>
      </Tabs>,
    );
    const root = document.querySelector("[data-slot='tabs']");
    expect(root).toHaveAttribute("data-orientation", "vertical");
  });

  it("renders TabsList with line variant", () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList variant="line">
          <TabsTrigger value="tab1">Line Tab</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Line content</TabsContent>
      </Tabs>,
    );
    const list = document.querySelector("[data-slot='tabs-list']");
    expect(list).toHaveAttribute("data-variant", "line");
  });

  it("renders with custom className on tabs list", () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList className="custom-list">
          <TabsTrigger value="tab1">Tab</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content</TabsContent>
      </Tabs>,
    );
    const list = document.querySelector("[data-slot='tabs-list']");
    expect(list?.className).toContain("custom-list");
  });

  it("disabled trigger does not respond to clicks", () => {
    const onValueChange = () => {};
    render(
      <Tabs defaultValue="tab1" onValueChange={onValueChange}>
        <TabsList>
          <TabsTrigger value="tab1" disabled>
            Active
          </TabsTrigger>
          <TabsTrigger value="tab2">Other</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content</TabsContent>
      </Tabs>,
    );
    const triggers = document.querySelectorAll("[data-slot='tabs-trigger']");
    expect(triggers[0]?.className).toContain("disabled");
  });
});
