import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { HtmlLang } from "@/components/html-lang";
import { render as renderWithUtils } from "@/test/test-utils";

vi.mock("next/script", () => ({
  default: ({
    id,
    strategy,
    dangerouslySetInnerHTML,
  }: {
    id?: string;
    strategy?: string;
    dangerouslySetInnerHTML?: { __html: string };
  }) => (
    <script
      data-testid="next-script"
      data-id={id}
      data-strategy={strategy}
      dangerouslySetInnerHTML={dangerouslySetInnerHTML}
    />
  ),
}));

describe("HtmlLang", () => {
  it("injects a script that sets the html lang attribute to the current locale", () => {
    renderWithUtils(<HtmlLang />);
    const script = screen.getByTestId("next-script");
    expect(script).toHaveAttribute("data-id", "html-lang");
    expect(script).toHaveAttribute("data-strategy", "beforeInteractive");
    expect(script.innerHTML).toContain("document.documentElement.lang='mn'");
  });
});
