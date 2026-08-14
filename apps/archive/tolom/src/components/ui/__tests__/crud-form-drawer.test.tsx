import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { CrudFormDrawer } from "@/components/ui/crud-form-drawer";

vi.mock("@/lib/sentry-report-server", () => ({
  reportServerError: vi.fn(),
}));

import { reportServerError } from "@/lib/sentry-report-server";

const schema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
});

type FormValues = { name: string };

function renderDrawer({
  open = true,
  mode = "create",
  onSubmit = vi.fn(async () => {}),
  isPending = false,
  defaultValues = { name: "" },
  onOpenChange = vi.fn(),
}: {
  open?: boolean;
  mode?: "create" | "edit";
  onSubmit?: (data: FormValues) => Promise<void>;
  isPending?: boolean;
  defaultValues?: FormValues;
  onOpenChange?: (open: boolean) => void;
}) {
  return render(
    <CrudFormDrawer<FormValues>
      open={open}
      onOpenChange={onOpenChange}
      mode={mode}
      title={{ create: "Add Label", edit: "Edit Label" }}
      formId="label-form"
      schema={schema}
      defaultValues={defaultValues}
      onSubmit={onSubmit}
      isPending={isPending}
      submitLabel={{ create: "Create", edit: "Save changes" }}
    >
      {(form) => (
        <>
          <input
            {...form.register("name")}
            aria-label="Name"
            data-testid="name-input"
          />
          {form.formState.errors.name && (
            <span role="alert">{form.formState.errors.name.message}</span>
          )}
        </>
      )}
    </CrudFormDrawer>,
  );
}

describe("CrudFormDrawer", () => {
  it("renders the create title and submit label in create mode", () => {
    renderDrawer({});
    expect(screen.getByText("Add Label")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create" })).toBeInTheDocument();
  });

  it("renders the edit title and submit label in edit mode", () => {
    renderDrawer({ mode: "edit" });
    expect(screen.getByText("Edit Label")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Save changes" }),
    ).toBeInTheDocument();
  });

  it("renders the cancel button with default label", () => {
    renderDrawer({});
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });

  it("renders nothing when closed", () => {
    renderDrawer({ open: false });
    expect(screen.queryByText("Add Label")).not.toBeInTheDocument();
  });

  it("submits valid data and closes the drawer", async () => {
    const onSubmit = vi.fn(async () => {});
    const onOpenChange = vi.fn();
    renderDrawer({ onSubmit, onOpenChange });

    fireEvent.change(screen.getByTestId("name-input"), {
      target: { value: "Premium Wash" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({ name: "Premium Wash" });
    });
    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it("does not submit invalid data and shows the validation error", async () => {
    const onSubmit = vi.fn(async () => {});
    renderDrawer({ onSubmit });

    fireEvent.change(screen.getByTestId("name-input"), {
      target: { value: "ab" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Name must be at least 3 characters",
      );
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("reports server errors and keeps the drawer open when submit throws", async () => {
    const onSubmit = vi.fn(async () => {
      throw new Error("boom");
    });
    const onOpenChange = vi.fn();
    renderDrawer({ onSubmit, onOpenChange });

    fireEvent.change(screen.getByTestId("name-input"), {
      target: { value: "Premium Wash" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() => {
      expect(reportServerError).toHaveBeenCalledWith(
        "CrudFormDrawer submit failed",
        expect.any(Error),
      );
    });
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("closes the drawer when the cancel button is clicked", () => {
    const onOpenChange = vi.fn();
    renderDrawer({ onOpenChange });
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("disables cancel and submit while pending", () => {
    renderDrawer({ isPending: true });
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Create" })).toBeDisabled();
  });

  it("shows a spinner while pending", () => {
    renderDrawer({ isPending: true });
    expect(document.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("resets the form when defaultValues change", async () => {
    const { rerender } = renderDrawer({ defaultValues: { name: "" } });
    rerender(
      <CrudFormDrawer<FormValues>
        open
        onOpenChange={vi.fn()}
        mode="edit"
        title={{ create: "Add Label", edit: "Edit Label" }}
        formId="label-form"
        schema={schema}
        defaultValues={{ name: "Pre-filled" }}
        onSubmit={vi.fn(async () => {})}
      >
        {(form) => (
          <input {...form.register("name")} data-testid="name-input" />
        )}
      </CrudFormDrawer>,
    );
    await waitFor(() => {
      expect(screen.getByTestId("name-input")).toHaveValue("Pre-filled");
    });
  });

  it("renders custom cancel label", () => {
    render(
      <CrudFormDrawer<FormValues>
        open
        onOpenChange={vi.fn()}
        mode="create"
        title={{ create: "Add Label", edit: "Edit Label" }}
        formId="label-form"
        schema={schema}
        defaultValues={{ name: "" }}
        onSubmit={vi.fn(async () => {})}
        cancelLabel="Close"
      >
        {() => <input data-testid="name-input" />}
      </CrudFormDrawer>,
    );
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
  });

  it("renders a submit button with the matching form id", () => {
    renderDrawer({});
    const submit = screen.getByRole("button", { name: "Create" });
    expect(submit).toHaveAttribute("type", "submit");
    expect(submit).toHaveAttribute("form", "label-form");
  });

  it("renders the form with the form id and extra class", () => {
    render(
      <CrudFormDrawer<FormValues>
        open
        onOpenChange={vi.fn()}
        mode="create"
        title={{ create: "Add Label", edit: "Edit Label" }}
        formId="label-form"
        schema={schema}
        defaultValues={{ name: "" }}
        onSubmit={vi.fn(async () => {})}
        formClassName="custom-form"
      >
        {() => <input data-testid="name-input" />}
      </CrudFormDrawer>,
    );
    const form = document.querySelector("#label-form");
    expect(form).toBeInTheDocument();
    expect(form?.className).toContain("custom-form");
  });

  it("keeps the drawer open when a button click happens outside the form", () => {
    // sanity: cancel button (type=button, outside form) does not submit
    const onSubmit = vi.fn(async () => {});
    renderDrawer({ onSubmit });
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
