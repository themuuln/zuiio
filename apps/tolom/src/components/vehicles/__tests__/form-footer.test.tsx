import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FormFooter } from "@/components/vehicles/form-sections/_form-footer";

const t = (key: string) => key;
const commonT = (key: string) => key;

describe("FormFooter", () => {
  it("renders the submit button with the add-vehicle label", () => {
    render(
      <FormFooter
        onCancel={vi.fn()}
        disabled={false}
        isSubmitting={false}
        t={t}
        commonT={commonT}
      />,
    );
    expect(
      screen.getByRole("button", { name: "addVehicle" }),
    ).toBeInTheDocument();
  });

  it("shows the saving label while submitting", () => {
    render(
      <FormFooter
        onCancel={vi.fn()}
        disabled={false}
        isSubmitting={true}
        t={t}
        commonT={commonT}
      />,
    );
    expect(screen.getByRole("button", { name: "saving" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "addVehicle" })).toBeNull();
  });

  it("disables the submit button when disabled is true", () => {
    render(
      <FormFooter
        onCancel={vi.fn()}
        disabled={true}
        isSubmitting={false}
        t={t}
        commonT={commonT}
      />,
    );
    expect(screen.getByRole("button", { name: "addVehicle" })).toBeDisabled();
  });

  it("renders the cancel button only when onCancel is provided", () => {
    const { rerender } = render(
      <FormFooter
        onCancel={vi.fn()}
        disabled={false}
        isSubmitting={false}
        t={t}
        commonT={commonT}
      />,
    );
    expect(screen.getByRole("button", { name: "cancel" })).toBeInTheDocument();

    rerender(
      <FormFooter
        disabled={false}
        isSubmitting={false}
        t={t}
        commonT={commonT}
      />,
    );
    expect(screen.queryByRole("button", { name: "cancel" })).toBeNull();
  });

  it("calls onCancel when the cancel button is clicked", () => {
    const onCancel = vi.fn();
    render(
      <FormFooter
        onCancel={onCancel}
        disabled={false}
        isSubmitting={false}
        t={t}
        commonT={commonT}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "cancel" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("uses the translator functions for the button labels", () => {
    const tSpy = vi.fn((key: string) => key);
    const commonTSpy = vi.fn((key: string) => key);
    render(
      <FormFooter
        onCancel={vi.fn()}
        disabled={false}
        isSubmitting={false}
        t={tSpy}
        commonT={commonTSpy}
      />,
    );
    expect(tSpy).toHaveBeenCalledWith("addVehicle");
    expect(commonTSpy).toHaveBeenCalledWith("cancel");
  });
});
