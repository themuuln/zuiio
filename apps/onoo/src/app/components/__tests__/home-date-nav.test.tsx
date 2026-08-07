/// <reference types="@testing-library/jest-dom/vitest" />
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ usePathname: vi.fn() }));
vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: Record<string, unknown>) => (
    <a href={href as string} {...props}>
      {children as React.ReactNode}
    </a>
  ),
}));

import { HomeDateNav } from "../home-date-nav";

describe("HomeDateNav", () => {
  it("renders current date formatted", () => {
    render(<HomeDateNav currentDate="2026-07-22" />);
    expect(screen.getByText(/\d+/)).toBeInTheDocument();
  });

  it("has prev and next day links", () => {
    render(<HomeDateNav currentDate="2026-07-22" />);
    const links = screen.getAllByRole("link");
    expect(
      links.some((l) => l.getAttribute("href") === "/?date=2026-07-21"),
    ).toBe(true);
    expect(
      links.some((l) => l.getAttribute("href") === "/?date=2026-07-23"),
    ).toBe(true);
  });

  it("shows Өнөөдөр button when not today", () => {
    render(<HomeDateNav currentDate="2026-07-20" />);
    expect(screen.getByText("Өнөөдөр")).toBeInTheDocument();
  });

  it("hides Өнөөдөр button when current date is today", () => {
    const today = new Date().toLocaleDateString("en-CA", {
      timeZone: "Asia/Ulaanbaatar",
    });
    render(<HomeDateNav currentDate={today} />);
    expect(screen.queryByText("Өнөөдөр")).not.toBeInTheDocument();
  });
});
