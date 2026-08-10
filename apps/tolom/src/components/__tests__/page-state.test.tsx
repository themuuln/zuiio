import { fireEvent, render, screen } from "@testing-library/react";
import type * as NextIntl from "next-intl";
import { describe, expect, it, vi } from "vitest";
import {
  DataTableSkeleton,
  InlineErrorState,
  ListPageSkeleton,
  PageErrorState,
  PageNotFoundState,
  PageShellSkeleton,
} from "@/components/page-state";
import { render as renderWithUtils } from "@/test/test-utils";

const t = vi.hoisted(() => (key: string) => key);
vi.mock("next-intl", async () => {
  const actual = await vi.importActual<typeof NextIntl>("next-intl");
  return { ...actual, useTranslations: () => t };
});

describe("PageErrorState", () => {
  it("renders the description and a working retry button", () => {
    const onRetry = vi.fn();
    renderWithUtils(
      <PageErrorState
        title="Oops"
        description="Load failed"
        onRetry={onRetry}
      />,
    );
    expect(screen.getByText("Load failed")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "retry" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("falls back to the default title and omits retry without onRetry", () => {
    renderWithUtils(<PageErrorState description="Load failed" />);
    expect(screen.getByText("somethingWentWrong")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "retry" }),
    ).not.toBeInTheDocument();
  });
});

describe("InlineErrorState", () => {
  it("renders the message and retry action", () => {
    const onRetry = vi.fn();
    render(<InlineErrorState message="Bad request" onRetry={onRetry} />);
    expect(screen.getByText("Bad request")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("renders without a retry button when not provided", () => {
    render(<InlineErrorState message="Bad request" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});

describe("PageNotFoundState", () => {
  it("uses default copy when no props are given", () => {
    renderWithUtils(<PageNotFoundState />);
    expect(screen.getByText("pageNotFound")).toBeInTheDocument();
    expect(screen.getByText("pageNotFoundDescription")).toBeInTheDocument();
  });

  it("renders a custom action", () => {
    renderWithUtils(
      <PageNotFoundState
        title="404"
        description="Missing"
        action={<button type="button">Go home</button>}
      />,
    );
    expect(screen.getByText("Go home")).toBeInTheDocument();
  });
});

describe("PageShellSkeleton", () => {
  it("renders the requested number of card skeletons", () => {
    const { container } = render(<PageShellSkeleton cards={2} />);
    expect(
      container.querySelectorAll('[data-slot="skeleton"]').length,
    ).toBeGreaterThanOrEqual(2);
  });

  it("renders a title when provided instead of a skeleton", () => {
    render(<PageShellSkeleton title="Dashboard" description="Overview" />);
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Overview")).toBeInTheDocument();
  });
});

describe("ListPageSkeleton", () => {
  it("renders one skeleton row per requested row", () => {
    const { container } = render(<ListPageSkeleton rows={3} />);
    expect(
      container.querySelectorAll('[data-slot="skeleton"]').length,
    ).toBeGreaterThan(3 * 2);
  });

  it("hides the search skeleton when showSearch is false", () => {
    const { container } = render(
      <ListPageSkeleton rows={1} showSearch={false} />,
    );
    const search = container.querySelector(".h-10.w-full");
    expect(search).toBeNull();
  });
});

describe("DataTableSkeleton", () => {
  it("renders rows x columns skeletons", () => {
    const { container } = render(<DataTableSkeleton columns={2} rows={3} />);
    // 1 toolbar skeleton + 3 rows x 2 columns
    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBe(
      1 + 3 * 2,
    );
  });
});
