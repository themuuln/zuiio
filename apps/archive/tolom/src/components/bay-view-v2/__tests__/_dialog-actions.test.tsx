import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { render } from "@/test/test-utils";
import { DialogActions } from "../_dialog-actions";

describe("DialogActions", () => {
  it("renders default cancel and confirm labels", () => {
    render(<DialogActions onCancel={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirm" })).toBeInTheDocument();
  });

  it("renders custom labels", () => {
    render(
      <DialogActions
        onCancel={vi.fn()}
        cancelLabel="Болих"
        confirmLabel="Хадгалах"
      />,
    );
    expect(screen.getByRole("button", { name: "Болих" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Хадгалах" }),
    ).toBeInTheDocument();
  });

  it("calls onCancel when the cancel button is clicked", async () => {
    const onCancel = vi.fn();
    const user = userEvent.setup();
    render(<DialogActions onCancel={onCancel} />);

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("shows the saving label and disables both buttons while saving", () => {
    render(
      <DialogActions
        onCancel={vi.fn()}
        saving
        savingLabel="Хадгалж байна..."
      />,
    );
    const cancel = screen.getByRole("button", { name: "Cancel" });
    const confirm = screen.getByRole("button", {
      name: /Хадгалж байна/,
    });
    expect(cancel).toBeDisabled();
    expect(confirm).toBeDisabled();
  });

  it("does not fire onCancel while saving", async () => {
    const onCancel = vi.fn();
    const user = userEvent.setup();
    render(<DialogActions onCancel={onCancel} saving />);

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).not.toHaveBeenCalled();
  });
});
