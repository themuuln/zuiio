import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ResponsiveFormModal } from "@/components/ui/responsive-form-modal";

function TestChild({
  onSuccess,
  onCancel,
}: {
  onSuccess?: () => void;
  onCancel?: () => void;
}) {
  return (
    <>
      <button type="button" onClick={onSuccess}>
        Child Save
      </button>
      <button type="button" onClick={onCancel}>
        Child Cancel
      </button>
    </>
  );
}

function renderModal(overrides: {
  open?: boolean;
  useDialogOnDesktop?: boolean;
  footer?: React.ReactNode;
  onOpenChange?: (open: boolean) => void;
  desc?: string;
}) {
  return render(
    <ResponsiveFormModal
      open={overrides.open ?? true}
      onOpenChange={overrides.onOpenChange ?? vi.fn()}
      title="Modal Title"
      desc={overrides.desc}
      useDialogOnDesktop={overrides.useDialogOnDesktop}
      footer={overrides.footer}
    >
      <TestChild />
    </ResponsiveFormModal>,
  );
}

describe("ResponsiveFormModal", () => {
  afterEach(() => {
    window.innerWidth = 1024;
  });

  it("renders the title, description and children on desktop (sheet)", () => {
    renderModal({ desc: "Modal description" });
    expect(screen.getByText("Modal Title")).toBeInTheDocument();
    expect(screen.getByText("Modal description")).toBeInTheDocument();
    expect(screen.getByText("Child Save")).toBeInTheDocument();
  });

  it("renders the footer on desktop", () => {
    renderModal({ footer: <div>footer content</div> });
    expect(screen.getByText("footer content")).toBeInTheDocument();
  });

  it("renders the centered dialog variant with useDialogOnDesktop", () => {
    renderModal({ useDialogOnDesktop: true, desc: "Dialog description" });
    expect(screen.getByText("Modal Title")).toBeInTheDocument();
    expect(screen.getByText("Dialog description")).toBeInTheDocument();
    expect(screen.getByText("Child Save")).toBeInTheDocument();
  });

  it("renders the mobile drawer when the viewport is small", async () => {
    window.innerWidth = 375;
    renderModal({ desc: "Mobile description" });
    expect(await screen.findByText("Modal Title")).toBeInTheDocument();
    expect(screen.getByText("Mobile description")).toBeInTheDocument();
    expect(screen.getByText("Child Save")).toBeInTheDocument();
  });

  it("renders nothing when closed", () => {
    renderModal({ open: false });
    expect(screen.queryByText("Modal Title")).not.toBeInTheDocument();
    expect(screen.queryByText("Child Save")).not.toBeInTheDocument();
  });

  it("calls the child onSuccess and closes the modal", async () => {
    const childOnSuccess = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <ResponsiveFormModal open onOpenChange={onOpenChange} title="Modal Title">
        <TestChild onSuccess={childOnSuccess} />
      </ResponsiveFormModal>,
    );
    fireEvent.click(screen.getByText("Child Save"));
    expect(childOnSuccess).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("calls the child onCancel and closes the modal", () => {
    const childOnCancel = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <ResponsiveFormModal open onOpenChange={onOpenChange} title="Modal Title">
        <TestChild onCancel={childOnCancel} />
      </ResponsiveFormModal>,
    );
    fireEvent.click(screen.getByText("Child Cancel"));
    expect(childOnCancel).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
