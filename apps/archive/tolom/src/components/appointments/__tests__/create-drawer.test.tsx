import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { render } from "@/test/test-utils";
import { AppointmentCreateDrawer } from "../create-drawer";

vi.mock("next-intl", async (importOriginal) => {
  const mod = await importOriginal();
  return {
    ...mod,
    useTranslations: () => (key: string) => key,
  };
});

vi.mock("@/components/appointments/appointment-form", () => ({
  AppointmentForm: ({
    onSuccess,
    onCancel,
  }: {
    onSuccess?: () => void;
    onCancel?: () => void;
  }) => (
    <div>
      <button type="button" onClick={() => onSuccess?.()}>
        trigger-success
      </button>
      <button type="button" onClick={() => onCancel?.()}>
        trigger-cancel
      </button>
    </div>
  ),
}));

describe("AppointmentCreateDrawer", () => {
  it("renders the form inside the modal when open", () => {
    render(
      <AppointmentCreateDrawer open onOpenChange={vi.fn()} orgId="org-1" />,
    );
    expect(screen.getByText("newAppointment")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "trigger-success" }),
    ).toBeInTheDocument();
  });

  it("renders nothing when closed", () => {
    render(
      <AppointmentCreateDrawer
        open={false}
        onOpenChange={vi.fn()}
        orgId="org-1"
      />,
    );
    expect(screen.queryByText("newAppointment")).not.toBeInTheDocument();
  });

  it("closes and fires onCreated after the form succeeds", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const onCreated = vi.fn();
    render(
      <AppointmentCreateDrawer
        open
        onOpenChange={onOpenChange}
        orgId="org-1"
        onCreated={onCreated}
      />,
    );

    await user.click(screen.getByRole("button", { name: "trigger-success" }));

    expect(onCreated).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("closes without onCreated when the form is cancelled", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const onCreated = vi.fn();
    render(
      <AppointmentCreateDrawer
        open
        onOpenChange={onOpenChange}
        orgId="org-1"
        onCreated={onCreated}
      />,
    );

    await user.click(screen.getByRole("button", { name: "trigger-cancel" }));

    expect(onCreated).not.toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
