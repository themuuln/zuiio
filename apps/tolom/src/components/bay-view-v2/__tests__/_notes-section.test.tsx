import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { render } from "@/test/test-utils";
import { NotesSection } from "../_notes-section";

const t = (key: string) => key;

const mocks = vi.hoisted(() => {
  const mutateAsync = vi.fn();
  return { mutateAsync };
});

vi.mock("@zuiio/query", () => ({
  useOrgMutation: (config: Record<string, unknown>) => {
    const onSuccess = config.onSuccess as
      | ((data: unknown, vars: unknown) => void)
      | undefined;
    mocks.mutateAsync.mockImplementation(async (vars: unknown) => {
      onSuccess?.(undefined, vars);
    });
    return {
      mutateAsync: mocks.mutateAsync,
      mutate: vi.fn(),
      isPending: false,
    };
  },
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), dismiss: vi.fn() },
}));

vi.mock("@/lib/sentry-report-server", () => ({
  reportServerError: vi.fn(),
}));

vi.mock("@/lib/queries/keys", () => ({
  workOrderKeys: {
    all: (orgId: string) => ["organizations", orgId, "work-orders"],
  },
}));

describe("NotesSection", () => {
  const baseProps = {
    complaint: "Engine noise",
    diagnosis: "Belt worn",
    notes: "Call customer first",
    orgId: "org-1",
    workOrderId: "wo-1",
    onUpdated: vi.fn(),
    t,
  };

  it("renders nothing when all note fields are empty", () => {
    render(
      <NotesSection
        {...baseProps}
        complaint={null}
        diagnosis={null}
        notes={null}
      />,
    );
    expect(screen.queryByText("complaintAndNotes")).toBeNull();
  });

  it("rends all populated fields with their values", () => {
    render(<NotesSection {...baseProps} />);
    expect(screen.getByText("Engine noise")).toBeTruthy();
    expect(screen.getByText("Belt worn")).toBeTruthy();
    expect(screen.getByText("Call customer first")).toBeTruthy();
  });

  it("parses structured notes content before display", () => {
    render(
      <NotesSection
        {...baseProps}
        complaint={null}
        diagnosis={null}
        notes={{ content: "Structured body" } as unknown as string}
      />,
    );
    expect(screen.getByText("Structured body")).toBeTruthy();
  });

  it("saves an edited field and calls onUpdated", async () => {
    const onUpdated = vi.fn();
    render(<NotesSection {...baseProps} onUpdated={onUpdated} />);
    fireEvent.click(screen.getByRole("button", { name: "Edit complaint" }));
    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, { target: { value: "New complaint" } });
    fireEvent.click(screen.getByRole("button", { name: "saveNote" }));
    await waitFor(() => expect(screen.queryByRole("textbox")).toBeNull());
    expect(onUpdated).toHaveBeenCalledTimes(1);
    expect(mocks.mutateAsync).toHaveBeenCalledWith({
      complaint: "New complaint",
    });
  });

  it("reports an error toast when saving fails and keeps editing open", async () => {
    const toast = (await import("sonner")).toast as {
      error: ReturnType<typeof vi.fn>;
    };
    mocks.mutateAsync.mockRejectedValueOnce(new Error("network"));
    render(<NotesSection {...baseProps} />);
    fireEvent.click(screen.getByRole("button", { name: "Edit diagnosis" }));
    fireEvent.click(screen.getByRole("button", { name: "saveNote" }));
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(screen.getByRole("textbox")).toBeTruthy();
  });

  it("cancels an edit without saving", () => {
    render(<NotesSection {...baseProps} />);
    const callsBefore = mocks.mutateAsync.mock.calls.length;
    fireEvent.click(screen.getByRole("button", { name: "Edit internalNotes" }));
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "Changed" },
    });
    fireEvent.click(screen.getByRole("button", { name: "cancel" }));
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(mocks.mutateAsync.mock.calls.length).toBe(callsBefore);
  });
});
