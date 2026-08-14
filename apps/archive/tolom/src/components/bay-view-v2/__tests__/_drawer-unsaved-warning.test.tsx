import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { render } from "@/test/test-utils";
import { UnsavedWarning } from "../_drawer-unsaved-warning";

describe("UnsavedWarning", () => {
  it("renders nothing when hidden", () => {
    render(
      <UnsavedWarning
        show={false}
        onDiscard={vi.fn()}
        onKeepEditing={vi.fn()}
      />,
    );
    expect(
      screen.queryByText("You have unsaved changes"),
    ).not.toBeInTheDocument();
  });

  it("renders the warning copy and actions when shown", () => {
    render(<UnsavedWarning show onDiscard={vi.fn()} onKeepEditing={vi.fn()} />);
    expect(screen.getByText("You have unsaved changes")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Discard" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Keep editing" }),
    ).toBeInTheDocument();
    // Save & Close is optional
    expect(
      screen.queryByRole("button", { name: "Save & Close" }),
    ).not.toBeInTheDocument();
  });

  it("renders Save & Close only when the handler is provided", () => {
    render(
      <UnsavedWarning
        show
        onDiscard={vi.fn()}
        onKeepEditing={vi.fn()}
        onSaveAndClose={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Save & Close" }),
    ).toBeInTheDocument();
  });

  it("calls onDiscard when Discard is clicked", async () => {
    const onDiscard = vi.fn();
    const user = userEvent.setup();
    render(
      <UnsavedWarning show onDiscard={onDiscard} onKeepEditing={vi.fn()} />,
    );

    await user.click(screen.getByRole("button", { name: "Discard" }));
    expect(onDiscard).toHaveBeenCalledTimes(1);
  });

  it("calls onKeepEditing when Keep editing is clicked", async () => {
    const onKeepEditing = vi.fn();
    const user = userEvent.setup();
    render(
      <UnsavedWarning show onDiscard={vi.fn()} onKeepEditing={onKeepEditing} />,
    );

    await user.click(screen.getByRole("button", { name: "Keep editing" }));
    expect(onKeepEditing).toHaveBeenCalledTimes(1);
  });

  it("calls onSaveAndClose when Save & Close is clicked", async () => {
    const onSaveAndClose = vi.fn();
    const user = userEvent.setup();
    render(
      <UnsavedWarning
        show
        onDiscard={vi.fn()}
        onKeepEditing={vi.fn()}
        onSaveAndClose={onSaveAndClose}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Save & Close" }));
    expect(onSaveAndClose).toHaveBeenCalledTimes(1);
  });
});
