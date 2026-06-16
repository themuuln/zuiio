import { render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { Button } from "@/components/ui/button";
import { DetailDrawer } from "@/components/ui/detail-drawer";

/**
 * Helper: render a component and return baseElement + query helpers
 * that also search portal content (Base UI renders drawers in portals).
 */
function renderDrawer(ui: React.ReactElement) {
  const result = render(ui);
  function $(selector: string) {
    return result.baseElement.querySelector(selector);
  }
  function $$(selector: string) {
    return result.baseElement.querySelectorAll(selector);
  }
  return { ...result, $, $$ };
}

function TestDrawer({ actions }: { actions?: React.ReactNode }) {
  const [open, setOpen] = useState(true);

  return (
    <DetailDrawer open={open} onOpenChange={setOpen}>
      <DetailDrawer.Header actions={actions}>
        <DetailDrawer.Title>Test Title</DetailDrawer.Title>
        <DetailDrawer.Description>Test Description</DetailDrawer.Description>
      </DetailDrawer.Header>
      <DetailDrawer.Body>
        <p>Content</p>
      </DetailDrawer.Body>
      <DetailDrawer.Footer>
        <Button>Cancel</Button>
        <Button>Save</Button>
      </DetailDrawer.Footer>
    </DetailDrawer>
  );
}

describe("DetailDrawer", () => {
  it("renders header, body, and footer", () => {
    render(<TestDrawer />);

    expect(screen.getByText("Test Title")).toBeInTheDocument();
    expect(screen.getByText("Test Description")).toBeInTheDocument();
    expect(screen.getByText("Content")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
    expect(screen.getByText("Save")).toBeInTheDocument();
  });

  it("renders actions in the header when provided", () => {
    render(<TestDrawer actions={<Button>Action Button</Button>} />);

    expect(screen.getByText("Action Button")).toBeInTheDocument();
  });

  it("renders body with scrollable overflow class", () => {
    const { $ } = renderDrawer(<TestDrawer />);

    const body = $(".overflow-y-auto");
    expect(body).toBeInTheDocument();
    expect(body).toHaveTextContent("Content");
  });

  it("renders footer as shrink-0", () => {
    const { $$ } = renderDrawer(<TestDrawer />);

    const shrinkItems = $$(".shrink-0");
    // Header and footer both have shrink-0
    expect(shrinkItems.length).toBeGreaterThanOrEqual(2);
  });

  it("renders proper width class when size is specified", () => {
    const { $ } = renderDrawer(
      <DetailDrawer open size="2xl" onOpenChange={() => {}}>
        <DetailDrawer.Header>
          <DetailDrawer.Title>Wide Drawer</DetailDrawer.Title>
        </DetailDrawer.Header>
        <DetailDrawer.Body>
          <p>Wide content</p>
        </DetailDrawer.Body>
      </DetailDrawer>,
    );

    const content = $('[class*="max-w-2xl"]');
    expect(content).toBeInTheDocument();
  });

  it("renders Divider component", () => {
    const { $ } = renderDrawer(
      <DetailDrawer open onOpenChange={() => {}}>
        <DetailDrawer.Header>
          <DetailDrawer.Title>Test</DetailDrawer.Title>
        </DetailDrawer.Header>
        <DetailDrawer.Divider />
        <DetailDrawer.Body>
          <p>Content after divider</p>
        </DetailDrawer.Body>
      </DetailDrawer>,
    );

    // The divider adds border-t border-border (outside header/footer)
    // Header has border-b, Divider has border-t
    const divider = $(".border-t.border-border");
    expect(divider).toBeInTheDocument();
    // Divider is not the header (header has border-b, this has border-t)
    expect(divider?.className).toContain("my-4");
  });

  it("renders Section with label", () => {
    render(
      <DetailDrawer open onOpenChange={() => {}}>
        <DetailDrawer.Header>
          <DetailDrawer.Title>Test</DetailDrawer.Title>
        </DetailDrawer.Header>
        <DetailDrawer.Body>
          <DetailDrawer.Section label="Details">
            <p>Section content</p>
          </DetailDrawer.Section>
        </DetailDrawer.Body>
      </DetailDrawer>,
    );

    expect(screen.getByText("Details")).toBeInTheDocument();
    expect(screen.getByText("Section content")).toBeInTheDocument();
  });

  it("header can hide border with bordered=false", () => {
    const { $ } = renderDrawer(
      <DetailDrawer open onOpenChange={() => {}}>
        <DetailDrawer.Header bordered={false}>
          <DetailDrawer.Title>Borderless</DetailDrawer.Title>
        </DetailDrawer.Header>
      </DetailDrawer>,
    );

    const header = $("[data-slot='drawer-header']");
    expect(header).toBeInTheDocument();
    expect(header?.className).not.toContain("border-b");
  });

  it("accepts modal=false prop", () => {
    // Should not throw when modal=false is passed
    expect(() => {
      render(
        <DetailDrawer open modal={false} onOpenChange={() => {}}>
          <DetailDrawer.Header>
            <DetailDrawer.Title>Non-modal</DetailDrawer.Title>
          </DetailDrawer.Header>
          <DetailDrawer.Body>
            <p>Content</p>
          </DetailDrawer.Body>
        </DetailDrawer>,
      );
    }).not.toThrow();
  });
});
