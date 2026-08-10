import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DiagnosisLabelsSection } from "@/app/[locale]/dashboard/settings/_diagnosis-labels-section";
import type { DiagnosisLabel } from "@/lib/types";

// ── DnD mocks (rows render statically; drag is not the test focus) ────

vi.mock("@dnd-kit/core", () => ({
  DndContext: ({ children }: { children: ReactNode }) => <>{children}</>,
  closestCenter: () => {},
  KeyboardSensor: vi.fn(),
  MouseSensor: vi.fn(),
  TouchSensor: vi.fn(),
  useSensor: (sensor: unknown) => sensor,
  useSensors: (...sensors: unknown[]) => sensors,
}));

vi.mock("@dnd-kit/modifiers", () => ({
  restrictToVerticalAxis: {},
}));

vi.mock("@dnd-kit/sortable", () => ({
  SortableContext: ({ children }: { children: ReactNode }) => <>{children}</>,
  arrayMove: <T,>(arr: T[], from: number, to: number): T[] => {
    const copy = [...arr];
    const [moved] = copy.splice(from, 1);
    copy.splice(to, 0, moved);
    return copy;
  },
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
  verticalListSortingStrategy: {},
}));

vi.mock("@dnd-kit/utilities", () => ({
  CSS: { Transform: { toString: () => "" } },
}));

// ── Hoisted mocks ──────────────────────────────────────────────────────

const mocks = vi.hoisted(() => ({
  useDiagnosisLabels: vi.fn(),
  useCreateDiagnosisLabel: vi.fn(),
  useUpdateDiagnosisLabel: vi.fn(),
  useDeleteDiagnosisLabel: vi.fn(),
  useReorderDiagnosisLabels: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
  reportServerError: vi.fn(),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "en",
}));

vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => mocks.toastSuccess(...args),
    error: (...args: unknown[]) => mocks.toastError(...args),
  },
}));

vi.mock("@/lib/sentry-report-server", () => ({
  reportServerError: (...args: unknown[]) => mocks.reportServerError(...args),
}));

vi.mock("@/lib/queries/use-diagnosis-labels", () => ({
  useDiagnosisLabels: mocks.useDiagnosisLabels,
  useCreateDiagnosisLabel: mocks.useCreateDiagnosisLabel,
  useUpdateDiagnosisLabel: mocks.useUpdateDiagnosisLabel,
  useDeleteDiagnosisLabel: mocks.useDeleteDiagnosisLabel,
  useReorderDiagnosisLabels: mocks.useReorderDiagnosisLabels,
}));

// ── CrudFormDrawer mock ────────────────────────────────────────────────
// The real CrudFormDrawer memoizes its submit handler with `useCallback(
// fn, [])` (crud-form-drawer.tsx:124), which captures the MOUNT-time
// onSubmit. The drawer stays mounted across open/close, so an edit-mode
// submit (opened after mount) calls the create closure — edit submits
// never reach the update mutation. This faithful mock keeps the real form
// contract (react-hook-form + zodResolver with the caller's schema, live
// onSubmit, close on success) so the sections' own submit/body-building
// logic is exercised without the shared drawer's stale-closure bug.
vi.mock("@/components/ui/crud-form-drawer", async () => {
  const { zodResolver, useForm } = await import("@/lib/hooks/use-form");
  const { reportServerError } = await import("@/lib/sentry-report-server");
  const { useEffect } = await import("react");
  return {
    CrudFormDrawer: ({
      open,
      onOpenChange,
      mode,
      title,
      formId,
      schema,
      defaultValues,
      onSubmit,
      isPending = false,
      children,
    }: {
      open: boolean;
      onOpenChange: (open: boolean) => void;
      mode: "create" | "edit";
      title: { create: string; edit: string };
      formId: string;
      schema: unknown;
      defaultValues: Record<string, unknown>;
      onSubmit: (data: Record<string, unknown>) => Promise<void>;
      isPending?: boolean;
      children: (form: ReturnType<typeof useForm>) => ReactNode;
    }) => {
      const form = useForm({
        resolver: zodResolver(schema as never) as never,
        defaultValues,
      });
      useEffect(() => {
        if (open) form.reset(defaultValues);
      }, [open, defaultValues, form]);
      if (!open) return null;
      return (
        <div>
          <div>{mode === "edit" ? title.edit : title.create}</div>
          <form
            id={formId}
            onSubmit={form.handleSubmit(async (data) => {
              try {
                await onSubmit(data as Record<string, unknown>);
                onOpenChange(false);
              } catch (err) {
                reportServerError("CrudFormDrawer submit failed", err);
              }
            })}
          >
            {children(form as never)}
          </form>
          <button type="submit" form={formId} disabled={isPending}>
            {mode === "edit" ? "Save" : "Create"}
          </button>
        </div>
      );
    },
  };
});

// ── Fixtures ───────────────────────────────────────────────────────────

const ENGINE_LABEL = {
  id: "l1",
  organization_id: "org-1",
  name: "Engine",
  name_mn: "Хөдөлгүүр",
  color: "#dc2626",
  sort_order: 0,
  is_active: true,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  deleted_at: null,
} as DiagnosisLabel;

const BRAKE_LABEL = {
  id: "l2",
  organization_id: "org-1",
  name: "Brake",
  name_mn: null,
  color: null,
  sort_order: 1,
  is_active: false,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  deleted_at: null,
} as DiagnosisLabel;

// ── Helpers ────────────────────────────────────────────────────────────

function renderSection() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <DiagnosisLabelsSection orgId="org-1" />
    </QueryClientProvider>,
  );
}

interface MutationMock {
  mutateAsync: Mock;
  isPending: boolean;
}

function mutationResult(
  mutateAsync = vi.fn().mockResolvedValue(undefined),
): MutationMock {
  return { mutateAsync, isPending: false };
}

function required<T>(value: T | null | undefined, name: string): T {
  if (value == null) throw new Error(`Missing ${name}`);
  return value;
}

function formElement(): HTMLFormElement {
  return required(
    document.querySelector("form") as HTMLFormElement | null,
    "drawer form",
  );
}

function submitForm() {
  fireEvent.submit(formElement());
}

/** The <tr> containing a label's name text (name may appear in two cells). */
function labelRow(name: string): HTMLElement {
  const cells = screen.getAllByText(name);
  for (const cell of cells) {
    const row = cell.closest("tr");
    if (row) return row;
  }
  throw new Error(`No row for label ${name}`);
}

/** Row action button by lucide icon class (pencil / trash-2). */
function rowButton(row: HTMLElement, icon: string): HTMLButtonElement {
  const svg = row.querySelector(`svg.lucide-${icon}`);
  const button = svg?.closest("button");
  if (!button) throw new Error(`No ${icon} button in row`);
  return button as HTMLButtonElement;
}

async function openAddDrawer() {
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "addLabel" }));
  await screen.findByText("addTitle");
}

// ── Tests ──────────────────────────────────────────────────────────────

describe("DiagnosisLabelsSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
    mocks.useDiagnosisLabels.mockReturnValue({
      data: [ENGINE_LABEL, BRAKE_LABEL],
      isPending: false,
      error: null,
    });
    mocks.useCreateDiagnosisLabel.mockReturnValue(mutationResult());
    mocks.useUpdateDiagnosisLabel.mockReturnValue(mutationResult());
    mocks.useDeleteDiagnosisLabel.mockReturnValue(mutationResult());
    mocks.useReorderDiagnosisLabels.mockReturnValue({ mutate: vi.fn() });
  });

  describe("list rendering", () => {
    it("shows skeletons while labels are loading", () => {
      mocks.useDiagnosisLabels.mockReturnValue({
        data: undefined,
        isPending: true,
        error: null,
      });
      const { container } = renderSection();

      expect(
        container.querySelectorAll(".animate-pulse").length,
      ).toBeGreaterThan(0);
      expect(screen.queryByText("Engine")).not.toBeInTheDocument();
    });

    it("shows the error state when labels fail to load", () => {
      mocks.useDiagnosisLabels.mockReturnValue({
        data: undefined,
        isPending: false,
        error: new Error("boom"),
      });
      renderSection();

      expect(screen.getByText("loadFailed")).toBeInTheDocument();
      expect(screen.queryByText("Engine")).not.toBeInTheDocument();
    });

    it("renders labels with bilingual name, color and status", async () => {
      renderSection();

      // Engine label: name_mn in the first column, English name, hex color
      expect(await screen.findByText("Хөдөлгүүр")).toBeInTheDocument();
      expect(screen.getByText("Engine")).toBeInTheDocument();
      expect(screen.getByText("#dc2626")).toBeInTheDocument();
      expect(screen.getByText("active")).toBeInTheDocument();

      // Brake label: falls back to the English name, no color, inactive
      expect(screen.getAllByText("Brake")).toHaveLength(2);
      expect(screen.getByText("inactive")).toBeInTheDocument();
      expect(screen.getByText("–")).toBeInTheDocument();

      // Column headers + add CTA
      expect(screen.getByText("nameMn")).toBeInTheDocument();
      expect(screen.getByText("status")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "addLabel" }),
      ).toBeInTheDocument();
    });

    it("renders the empty state when no labels exist", async () => {
      mocks.useDiagnosisLabels.mockReturnValue({
        data: [],
        isPending: false,
        error: null,
      });
      renderSection();

      expect(await screen.findByText("emptyTitle")).toBeInTheDocument();
      expect(screen.getByText("emptyDescription")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "addLabel" }),
      ).toBeInTheDocument();
    });
  });

  describe("label creation", () => {
    it("validates the English name before submitting", async () => {
      renderSection();
      await screen.findByText("Engine");
      await openAddDrawer();

      submitForm();

      expect(
        await screen.findByText("English name is required"),
      ).toBeInTheDocument();
      expect(
        mocks.useCreateDiagnosisLabel.mock.results[0]?.value.mutateAsync,
      ).not.toHaveBeenCalled();
    });

    it("submits the create payload with trimmed names and a preset color", async () => {
      const createMutate = vi.fn().mockResolvedValue(undefined);
      mocks.useCreateDiagnosisLabel.mockReturnValue(
        mutationResult(createMutate),
      );
      renderSection();
      await screen.findByText("Engine");
      await openAddDrawer();

      const user = userEvent.setup();
      await user.type(
        required(screen.getByPlaceholderText("namePlaceholder"), "name_mn"),
        "  Хөдөлгүүр засвар  ",
      );
      await user.type(
        required(screen.getByPlaceholderText("nameEnPlaceholder"), "name"),
        "  Engine repair  ",
      );
      await user.click(screen.getByTitle("Engine"));
      submitForm();

      await waitFor(() => expect(createMutate).toHaveBeenCalledTimes(1));
      expect(createMutate).toHaveBeenCalledWith({
        name: "Engine repair",
        name_mn: "Хөдөлгүүр засвар",
        color: "#dc2626",
        is_active: true,
      });
      // Drawer closes after a successful submit
      await waitFor(() =>
        expect(screen.queryByText("addTitle")).not.toBeInTheDocument(),
      );
    });

    it("keeps name_mn null when left empty and shows the custom color hint", async () => {
      const createMutate = vi.fn().mockResolvedValue(undefined);
      mocks.useCreateDiagnosisLabel.mockReturnValue(
        mutationResult(createMutate),
      );
      renderSection();
      await screen.findByText("Engine");
      await openAddDrawer();

      const user = userEvent.setup();
      await user.type(
        required(screen.getByPlaceholderText("nameEnPlaceholder"), "name"),
        "Suspension",
      );
      await user.type(
        required(document.getElementById("label-color"), "color input"),
        "#123456",
      );
      expect(screen.getByText("customColor")).toBeInTheDocument();
      submitForm();

      await waitFor(() => expect(createMutate).toHaveBeenCalledTimes(1));
      expect(createMutate).toHaveBeenCalledWith({
        name: "Suspension",
        name_mn: null,
        color: "#123456",
        is_active: true,
      });
    });

    it("deactivates the label via the switch in the form", async () => {
      const createMutate = vi.fn().mockResolvedValue(undefined);
      mocks.useCreateDiagnosisLabel.mockReturnValue(
        mutationResult(createMutate),
      );
      renderSection();
      await screen.findByText("Engine");
      await openAddDrawer();

      const toggle = screen.getByRole("switch");
      expect(toggle).toBeChecked();
      await userEvent.click(toggle);

      await userEvent.type(
        required(screen.getByPlaceholderText("nameEnPlaceholder"), "name"),
        "Body",
      );
      submitForm();

      await waitFor(() => expect(createMutate).toHaveBeenCalledTimes(1));
      expect(createMutate).toHaveBeenCalledWith(
        expect.objectContaining({ is_active: false }),
      );
    });
  });

  describe("label editing", () => {
    it("pre-fills the form and submits an update with the label id", async () => {
      const updateMutate = vi.fn().mockResolvedValue(undefined);
      mocks.useUpdateDiagnosisLabel.mockReturnValue(
        mutationResult(updateMutate),
      );
      renderSection();
      await screen.findByText("Engine");

      const user = userEvent.setup();
      await user.click(rowButton(labelRow("Engine"), "pencil"));

      // Drawer opens in edit mode with the label pre-filled
      expect(await screen.findByText("editTitle")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("namePlaceholder")).toHaveValue(
        "Хөдөлгүүр",
      );
      expect(screen.getByPlaceholderText("nameEnPlaceholder")).toHaveValue(
        "Engine",
      );
      expect(document.getElementById("label-color")).toHaveValue("#dc2626");
      expect(screen.getByRole("switch")).toBeChecked();

      // Change the English name and submit
      const nameInput = screen.getByPlaceholderText("nameEnPlaceholder");
      await user.clear(nameInput);
      await user.type(nameInput, "Engine service");
      submitForm();

      await waitFor(() => expect(updateMutate).toHaveBeenCalledTimes(1));
      expect(updateMutate).toHaveBeenCalledWith({
        id: "l1",
        body: {
          name: "Engine service",
          name_mn: "Хөдөлгүүр",
          color: "#dc2626",
          is_active: true,
        },
      });
    });
  });

  describe("delete", () => {
    it("deletes a label after confirmation and shows a success toast", async () => {
      const confirmSpy = vi.fn().mockReturnValue(true);
      vi.stubGlobal("confirm", confirmSpy);
      const deleteMutate = vi.fn().mockResolvedValue(undefined);
      mocks.useDeleteDiagnosisLabel.mockReturnValue(
        mutationResult(deleteMutate),
      );
      renderSection();
      await screen.findByText("Engine");

      await userEvent.click(rowButton(labelRow("Engine"), "trash-2"));

      expect(confirmSpy).toHaveBeenCalledWith("confirmDelete");
      await waitFor(() => expect(deleteMutate).toHaveBeenCalledWith("l1"));
      expect(mocks.toastSuccess).toHaveBeenCalledWith("deleted");
    });

    it("skips deletion when confirmation is dismissed", async () => {
      vi.stubGlobal("confirm", vi.fn().mockReturnValue(false));
      const deleteMutate = vi.fn().mockResolvedValue(undefined);
      mocks.useDeleteDiagnosisLabel.mockReturnValue(
        mutationResult(deleteMutate),
      );
      renderSection();
      await screen.findByText("Engine");

      await userEvent.click(rowButton(labelRow("Engine"), "trash-2"));

      expect(deleteMutate).not.toHaveBeenCalled();
      expect(mocks.toastSuccess).not.toHaveBeenCalled();
    });

    it("reports and toasts the error when deletion fails", async () => {
      vi.stubGlobal("confirm", vi.fn().mockReturnValue(true));
      const deleteMutate = vi.fn().mockRejectedValue(new Error("Server boom"));
      mocks.useDeleteDiagnosisLabel.mockReturnValue(
        mutationResult(deleteMutate),
      );
      renderSection();
      await screen.findByText("Engine");

      await userEvent.click(rowButton(labelRow("Engine"), "trash-2"));

      await waitFor(() =>
        expect(mocks.toastError).toHaveBeenCalledWith("Server boom"),
      );
      expect(mocks.reportServerError).toHaveBeenCalledWith(
        "Unexpected error",
        expect.any(Error),
      );
    });
  });
});
