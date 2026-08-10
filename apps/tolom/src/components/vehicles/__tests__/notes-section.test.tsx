import { fireEvent, render, screen } from "@testing-library/react";
import { type UseFormReturn, useForm } from "react-hook-form";
import { describe, expect, it } from "vitest";
import { NotesSection } from "@/components/vehicles/form-sections/_notes-section";
import type {
  VehicleFormT,
  VehicleFormValues,
} from "@/components/vehicles/form-sections/_types";

const t: VehicleFormT = (key: string) => key;

function renderNotes(initialNotes = "") {
  let form: UseFormReturn<VehicleFormValues> | undefined;
  function Harness() {
    form = useForm<VehicleFormValues>({
      defaultValues: { notes: initialNotes },
    });
    return <NotesSection form={form} t={t} />;
  }
  const utils = render(<Harness />);
  return { ...utils, getForm: () => form as UseFormReturn<VehicleFormValues> };
}

describe("NotesSection", () => {
  it("renders the notes label and textarea", () => {
    renderNotes();
    expect(screen.getByText("notes")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("notesPlaceholderForm"),
    ).toBeInTheDocument();
  });

  it("shows the watched notes value in the textarea", () => {
    renderNotes("First service note");
    const textarea = screen.getByPlaceholderText(
      "notesPlaceholderForm",
    ) as HTMLTextAreaElement;
    expect(textarea.value).toBe("First service note");
  });

  it("updates the form value when typing", () => {
    const { getForm } = renderNotes();
    const textarea = screen.getByPlaceholderText("notesPlaceholderForm");
    fireEvent.change(textarea, { target: { value: "Oil changed" } });
    expect(getForm().getValues("notes")).toBe("Oil changed");
  });

  it("writes an empty string when the textarea is cleared", () => {
    const { getForm } = renderNotes("existing");
    const textarea = screen.getByPlaceholderText("notesPlaceholderForm");
    fireEvent.change(textarea, { target: { value: "" } });
    expect(getForm().getValues("notes")).toBe("");
  });
});
