import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { render } from "@/test/test-utils";
import { QuickCreateBranchDrawer } from "../quick-create-branch-drawer";

vi.mock("next-intl", async (importOriginal) => {
  const mod = await importOriginal();
  return {
    ...mod,
    useTranslations: () => (key: string) => key,
  };
});

vi.mock("../branch-form", () => ({
  BranchForm: ({
    onSuccess,
    onCancel,
  }: {
    onSuccess?: (branch: unknown) => void;
    onCancel?: () => void;
  }) => (
    <div>
      <button type="button" onClick={() => onSuccess?.({ id: "b-1" })}>
        trigger-success
      </button>
      <button type="button" onClick={() => onCancel?.()}>
        trigger-cancel
      </button>
    </div>
  ),
}));

describe("QuickCreateBranchDrawer", () => {
  it("renders the branch form inside the modal when open", () => {
    render(<QuickCreateBranchDrawer open onOpenChange={vi.fn()} />);
    expect(screen.getByText("settings.addBranch")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "trigger-success" }),
    ).toBeInTheDocument();
  });

  it("renders nothing when closed", () => {
    render(<QuickCreateBranchDrawer open={false} onOpenChange={vi.fn()} />);
    expect(screen.queryByText("settings.addBranch")).not.toBeInTheDocument();
  });

  it("closes and fires onCreated after the branch is created", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const onCreated = vi.fn();
    render(
      <QuickCreateBranchDrawer
        open
        onOpenChange={onOpenChange}
        onCreated={onCreated}
      />,
    );

    await user.click(screen.getByRole("button", { name: "trigger-success" }));

    expect(onCreated).toHaveBeenCalledWith({ id: "b-1" });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("closes without onCreated when the form is cancelled", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const onCreated = vi.fn();
    render(
      <QuickCreateBranchDrawer
        open
        onOpenChange={onOpenChange}
        onCreated={onCreated}
      />,
    );

    await user.click(screen.getByRole("button", { name: "trigger-cancel" }));

    expect(onCreated).not.toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
