import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@/test/test-utils";
import type { StatusNotesModalProps } from "../status-notes-modal";
import { StatusNotesModal } from "../status-notes-modal";

const tMock = vi.hoisted(() => ({
  t: (key: string) => key,
}));
vi.mock("next-intl", async () => {
  const actual = await vi.importActual<typeof import("next-intl")>("next-intl");
  return {
    ...actual,
    useTranslations: () => tMock.t,
  };
});

const onConfirm = vi.fn();
const onCancel = vi.fn();

function renderModal(props?: Partial<StatusNotesModalProps>) {
  return render(
    <StatusNotesModal
      woId="wo-1"
      newStatus="Completed"
      onConfirm={onConfirm}
      onCancel={onCancel}
      {...props}
    />,
  );
}

describe("StatusNotesModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows the mapped title for a known status and the note prompt", () => {
    renderModal();
    // Title appears in the dialog header AND on the submit button
    expect(
      screen.getAllByText("statusNotesCompleteTitle").length,
    ).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("addNotePrompt")).toBeInTheDocument();
  });

  it("falls back to the generic title for unknown statuses", () => {
    renderModal({ newStatus: "Diagnosing" });
    expect(
      screen.getAllByText("statusNotesGenericTitle").length,
    ).toBeGreaterThanOrEqual(2);
  });

  it("submits the work order id and status on confirm", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.type(screen.getByPlaceholderText("notePlaceholder"), "Serviced");
    await user.click(
      screen.getByRole("button", { name: "statusNotesCompleteTitle" }),
    );

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledWith("wo-1", "Completed", "Serviced");
  });

  it("submits the work order id and status without notes", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(
      screen.getByRole("button", { name: "statusNotesCompleteTitle" }),
    );

    expect(onConfirm).toHaveBeenCalledWith("wo-1", "Completed", undefined);
  });

  it("submits when Enter is pressed in the input", async () => {
    const user = userEvent.setup();
    renderModal();

    const input = screen.getByPlaceholderText("notePlaceholder");
    await user.type(input, "quick note{Enter}");

    expect(onConfirm).toHaveBeenCalledWith("wo-1", "Completed", "quick note");
  });

  it("calls onCancel from the cancel button", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole("button", { name: "cancel" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("calls onCancel when the dialog is dismissed", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.keyboard("{Escape}");
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
