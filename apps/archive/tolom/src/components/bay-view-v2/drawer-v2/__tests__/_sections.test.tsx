import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@/test/test-utils";
import { NotesSectionV2 } from "../_sections";

interface NotesProps {
  complaint?: string | null;
  diagnosis?: string | null;
  notes?: string | null;
  t: (key: string) => string;
  onSaveNoteField?: (
    field: "complaint" | "diagnosis" | "notes",
    value: string,
  ) => void;
}

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

const onSaveNoteField = vi.fn();

function renderNotes(props?: Partial<NotesProps>) {
  return render(
    <NotesSectionV2
      complaint="Engine noise"
      diagnosis={null}
      notes="Call customer before pickup"
      t={tMock.t}
      onSaveNoteField={onSaveNoteField}
      {...props}
    />,
  );
}

describe("NotesSectionV2", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders complaint, diagnosis and notes values", () => {
    renderNotes();
    expect(screen.getByText("Engine noise")).toBeInTheDocument();
    // Empty fields show the placeholder
    expect(screen.getByText("—")).toBeInTheDocument();
    expect(screen.getByText("Call customer before pickup")).toBeInTheDocument();
  });

  it("enters edit mode on the first field when the header pencil is clicked", async () => {
    const user = userEvent.setup();
    renderNotes();
    expect(screen.queryAllByRole("textbox")).toHaveLength(0);

    await user.click(screen.getByRole("button", { name: "complaintAndNotes" }));

    const inputs = screen.getAllByRole("textbox");
    expect(inputs).toHaveLength(1);
    expect(inputs[0]).toHaveValue("Engine noise");
  });

  it("commits an edited value on blur", async () => {
    const user = userEvent.setup();
    renderNotes();

    await user.click(screen.getByRole("button", { name: "complaintAndNotes" }));
    const complaintInput = screen.getAllByRole("textbox")[0];
    await user.clear(complaintInput);
    await user.type(complaintInput, "Brake squeal");
    await user.tab();

    expect(onSaveNoteField).toHaveBeenCalledWith("complaint", "Brake squeal");
  });
});
