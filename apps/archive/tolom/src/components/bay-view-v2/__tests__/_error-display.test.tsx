import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { render } from "@/test/test-utils";
import { BayViewErrorState, ErrorSection } from "../_error-display";

describe("BayViewErrorState", () => {
  it("shows the connection message and retries when an error is present", async () => {
    const fetchData = vi.fn().mockResolvedValue(undefined);
    render(
      <BayViewErrorState error="boom" t={(key) => key} fetchData={fetchData} />,
    );

    expect(
      screen.getByText(
        "Couldn't load bay view. Check your internet connection.",
      ),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "retry" }));
    expect(fetchData).toHaveBeenCalledWith(true);
  });

  it("shows the no-data message and retries when there is no error", async () => {
    const fetchData = vi.fn().mockResolvedValue(undefined);
    render(
      <BayViewErrorState error={null} t={(key) => key} fetchData={fetchData} />,
    );

    expect(screen.getByText("noData")).toBeInTheDocument();
    expect(screen.queryByText(/internet connection/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "retry" }));
    expect(fetchData).toHaveBeenCalledWith(true);
  });
});

describe("ErrorSection", () => {
  it("renders its children when they do not throw", () => {
    render(
      <ErrorSection label="Bays">
        <div>happy content</div>
      </ErrorSection>,
    );
    expect(screen.getByText("happy content")).toBeInTheDocument();
    expect(screen.queryByText(/Something went wrong/)).not.toBeInTheDocument();
  });

  it("shows the labeled fallback when a child throws", () => {
    // React logs boundary errors to console.error — silence that noise here.
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    function Bomb(): never {
      throw new Error("kaboom");
    }

    render(
      <ErrorSection label="Queue">
        <Bomb />
      </ErrorSection>,
    );

    expect(
      screen.getByText("Queue — Something went wrong"),
    ).toBeInTheDocument();
    errorSpy.mockRestore();
  });
});
