import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

function renderRZ(ui: React.ReactElement) {
  const result = render(ui);
  function $(selector: string) {
    return result.baseElement.querySelector(selector);
  }
  function $$(selector: string) {
    return result.baseElement.querySelectorAll(selector);
  }
  return { ...result, $, $$ };
}

describe("ResizablePanelGroup", () => {
  it("renders panel group with data-slot", () => {
    const { $ } = renderRZ(
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel>left</ResizablePanel>
        <ResizableHandle />
        <ResizablePanel>right</ResizablePanel>
      </ResizablePanelGroup>,
    );
    expect($("[data-slot='resizable-panel-group']")).toBeInTheDocument();
  });

  it("renders panels with data-slot", () => {
    const { $$ } = renderRZ(
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel>Panel A</ResizablePanel>
        <ResizableHandle />
        <ResizablePanel>Panel B</ResizablePanel>
      </ResizablePanelGroup>,
    );
    expect($$("[data-slot='resizable-panel']")).toHaveLength(2);
  });

  it("renders handle between panels", () => {
    const { $ } = renderRZ(
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel>A</ResizablePanel>
        <ResizableHandle />
        <ResizablePanel>B</ResizablePanel>
      </ResizablePanelGroup>,
    );
    expect($("[data-slot='resizable-handle']")).toBeInTheDocument();
  });

  it("renders handle with grip icon when withHandle is true", () => {
    const { $ } = renderRZ(
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel>A</ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel>B</ResizablePanel>
      </ResizablePanelGroup>,
    );
    const handle = $("[data-slot='resizable-handle']");
    expect(handle).toBeInTheDocument();
    expect(handle?.querySelector("div")).toBeInTheDocument();
  });

  it("renders handle without grip icon by default", () => {
    const { $ } = renderRZ(
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel>A</ResizablePanel>
        <ResizableHandle />
        <ResizablePanel>B</ResizablePanel>
      </ResizablePanelGroup>,
    );
    const handle = $("[data-slot='resizable-handle']");
    expect(handle?.querySelector("div")).toBeNull();
  });

  it("renders with horizontal direction", () => {
    const { $ } = renderRZ(
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel>left</ResizablePanel>
        <ResizableHandle />
        <ResizablePanel>right</ResizablePanel>
      </ResizablePanelGroup>,
    );
    const group = $("[data-slot='resizable-panel-group']");
    expect(group).toBeInTheDocument();
  });

  it("renders panel children content", () => {
    renderRZ(
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel>Hello World</ResizablePanel>
        <ResizableHandle />
        <ResizablePanel />
      </ResizablePanelGroup>,
    );
    expect(screen.getByText("Hello World")).toBeInTheDocument();
  });
});
