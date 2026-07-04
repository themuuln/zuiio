// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TemplateCard } from "./TemplateCard";
import type { Template } from "@/types/template";

const baseTemplate: Template = {
  id: "t1",
  name: "Welcome Greeting",
  description: "A friendly welcome message",
  category: "welcome",
  channels: ["messenger"],
  flow_json: { nodes: [], edges: [] },
  is_builtin: true,
  usageCount: 42,
  userId: null,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

describe("TemplateCard", () => {
  it("renders the template name", () => {
    render(<TemplateCard template={baseTemplate} />);
    expect(screen.getByText("Welcome Greeting")).toBeDefined();
  });

  it("renders the template description", () => {
    render(<TemplateCard template={baseTemplate} />);
    expect(screen.getByText("A friendly welcome message")).toBeDefined();
  });

  it("renders the category badge", () => {
    render(<TemplateCard template={baseTemplate} />);
    expect(screen.getByText("Welcome")).toBeDefined();
  });

  it("renders the usage count", () => {
    render(<TemplateCard template={baseTemplate} />);
    expect(screen.getByText("Used 42 times")).toBeDefined();
  });

  it('shows "Never used" for zero usage count', () => {
    render(
      <TemplateCard template={{ ...baseTemplate, usageCount: 0 }} />,
    );
    expect(screen.getByText("Never used")).toBeDefined();
  });

  it('shows "Used 1 time" for single usage count', () => {
    render(
      <TemplateCard template={{ ...baseTemplate, usageCount: 1 }} />,
    );
    expect(screen.getByText("Used 1 time")).toBeDefined();
  });

  it('shows "No description" when description is empty', () => {
    render(
      <TemplateCard template={{ ...baseTemplate, description: "" }} />,
    );
    expect(screen.getByText("No description")).toBeDefined();
  });

  it("renders Use Template button when onUseTemplate is provided", () => {
    render(
      <TemplateCard template={baseTemplate} onUseTemplate={vi.fn()} />,
    );
    expect(screen.getByText("Use Template")).toBeDefined();
  });

  it("does not render Use Template button when onUseTemplate is not provided", () => {
    render(<TemplateCard template={baseTemplate} />);
    expect(screen.queryByText("Use Template")).toBeNull();
  });

  it("calls onUseTemplate when Use Template button is clicked", async () => {
    const onUseTemplate = vi.fn();
    render(
      <TemplateCard
        template={baseTemplate}
        onUseTemplate={onUseTemplate}
      />,
    );

    await userEvent.click(screen.getByText("Use Template"));
    expect(onUseTemplate).toHaveBeenCalledTimes(1);
    expect(onUseTemplate).toHaveBeenCalledWith(baseTemplate);
  });

  it("renders different category badges correctly", () => {
    const categories: Array<{ category: Template["category"]; label: string }> = [
      { category: "support", label: "Support" },
      { category: "sales", label: "Sales" },
      { category: "notifications", label: "Notifications" },
      { category: "general", label: "General" },
    ];

    for (const { category, label } of categories) {
      const { unmount } = render(
        <TemplateCard template={{ ...baseTemplate, category }} />,
      );
      expect(screen.getByText(label)).toBeDefined();
      unmount();
    }
  });
});
