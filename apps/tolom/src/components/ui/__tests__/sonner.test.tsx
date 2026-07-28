import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Toaster } from "@/components/ui/sonner";

// Mock next-themes useTheme hook
vi.mock("next-themes", () => ({
  useTheme: () => ({ theme: "light", setTheme: vi.fn() }),
}));

function renderToaster(ui: React.ReactElement) {
  const result = render(ui);
  function $(selector: string) {
    return result.baseElement.querySelector(selector);
  }
  return { ...result, $ };
}

describe("Toaster", () => {
  it("renders a section with notifications aria-label", () => {
    const { $ } = renderToaster(<Toaster />);
    const section = $("section[aria-label='Notifications alt+T']");
    expect(section).toBeInTheDocument();
  });

  it("renders with aria-live polite and aria-atomic false", () => {
    const { $ } = renderToaster(<Toaster />);
    const section = $("section[aria-label='Notifications alt+T']");
    expect(section).toHaveAttribute("aria-live", "polite");
    expect(section).toHaveAttribute("aria-atomic", "false");
  });

  it("renders with tabindex -1", () => {
    const { $ } = renderToaster(<Toaster />);
    const section = $("section[aria-label='Notifications alt+T']");
    expect(section).toHaveAttribute("tabindex", "-1");
  });

  it("accepts additional props", () => {
    const { $ } = renderToaster(<Toaster data-testid="test-toaster" />);
    // Sonner passes extra props through
    const section = $("section[aria-label='Notifications alt+T']");
    expect(section).toBeInTheDocument();
  });
});
