import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DestructiveAlert } from "@/components/shared/DestructiveAlert";

describe("DestructiveAlert", () => {
  it("renders the message", () => {
    const { container } = render(
      <DestructiveAlert message="Work order update failed" />,
    );
    expect(screen.getByText("Work order update failed")).toBeInTheDocument();
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("calls onRetry when the retry button is clicked", () => {
    const onRetry = vi.fn();
    render(<DestructiveAlert message="Failed" onRetry={onRetry} />);
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("omits the retry button when onRetry is not provided", () => {
    render(<DestructiveAlert message="Failed" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
