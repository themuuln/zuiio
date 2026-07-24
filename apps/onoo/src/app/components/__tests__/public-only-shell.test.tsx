/// <reference types="@testing-library/jest-dom/vitest" />
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// usePathname is mocked globally in vitest.setup.ts, but we override per test
const mockUsePathname = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
}));

import { PublicOnlyShell } from "../public-only-shell";

function TestChild() {
  return <div data-testid="public-child">Visible</div>;
}

describe("PublicOnlyShell", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("public routes — renders children", () => {
    it("renders children on public root path", () => {
      mockUsePathname.mockReturnValue("/");
      render(
        <PublicOnlyShell>
          <TestChild />
        </PublicOnlyShell>,
      );
      expect(screen.getByTestId("public-child")).toBeInTheDocument();
    });

    it("renders children on public sub-page", () => {
      mockUsePathname.mockReturnValue("/games");
      render(
        <PublicOnlyShell>
          <TestChild />
        </PublicOnlyShell>,
      );
      expect(screen.getByTestId("public-child")).toBeInTheDocument();
    });

    it("renders children on nested public page", () => {
      mockUsePathname.mockReturnValue("/standings/division-a");
      render(
        <PublicOnlyShell>
          <TestChild />
        </PublicOnlyShell>,
      );
      expect(screen.getByTestId("public-child")).toBeInTheDocument();
    });
  });

  describe("admin routes — hides children", () => {
    it("returns null for /admin dashboard", () => {
      mockUsePathname.mockReturnValue("/admin");
      const { container } = render(
        <PublicOnlyShell>
          <TestChild />
        </PublicOnlyShell>,
      );
      expect(container).toBeEmptyDOMElement();
    });

    it("returns null for /admin login", () => {
      mockUsePathname.mockReturnValue("/admin/login");
      const { container } = render(
        <PublicOnlyShell>
          <TestChild />
        </PublicOnlyShell>,
      );
      expect(container).toBeEmptyDOMElement();
    });

    it("returns null for deep admin sub-paths", () => {
      mockUsePathname.mockReturnValue("/admin/games/123/edit");
      const { container } = render(
        <PublicOnlyShell>
          <TestChild />
        </PublicOnlyShell>,
      );
      expect(container).toBeEmptyDOMElement();
    });

    it("returns null for admin teams page", () => {
      mockUsePathname.mockReturnValue("/admin/teams");
      const { container } = render(
        <PublicOnlyShell>
          <TestChild />
        </PublicOnlyShell>,
      );
      expect(container).toBeEmptyDOMElement();
    });

    it("returns null for admin academy sub-pages", () => {
      mockUsePathname.mockReturnValue("/admin/academy/students");
      const { container } = render(
        <PublicOnlyShell>
          <TestChild />
        </PublicOnlyShell>,
      );
      expect(container).toBeEmptyDOMElement();
    });

    it("handles trailing slash on /admin/", () => {
      mockUsePathname.mockReturnValue("/admin/");
      const { container } = render(
        <PublicOnlyShell>
          <TestChild />
        </PublicOnlyShell>,
      );
      expect(container).toBeEmptyDOMElement();
    });
  });
});
