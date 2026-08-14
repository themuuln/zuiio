import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { describe, expect, it, vi } from "vitest";
import { render } from "@/test/test-utils";
import { CustomerFollowupsSection } from "../customer-followups-section";

// ── Mocks ──────────────────────────────────────────────────────────────
const hooks = vi.hoisted(() => ({
  createMutate: vi.fn(),
  updateMutate: vi.fn(),
  followups: [] as Array<{
    id: string;
    subject: string;
    type: string;
    status: string;
    due_at: string;
    notes: string | null;
    outcome: string | null;
  }>,
}));

vi.mock("next-intl", async (importOriginal) => {
  const mod = await importOriginal();
  return {
    ...mod,
    useTranslations: () => (key: string) => key,
  };
});

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

vi.mock("@/lib/queries/use-followups", () => ({
  followupKeys: {
    list: (orgId: string) => ["followups", orgId],
  },
  useCreateFollowup: () => ({
    mutate: hooks.createMutate,
    isPending: false,
  }),
  useUpdateFollowup: () => ({
    mutate: hooks.updateMutate,
    isPending: false,
  }),
}));

// ── Fixtures ───────────────────────────────────────────────────────────

const PENDING = {
  id: "fu-1",
  subject: "Call about brake quote",
  type: "call",
  status: "pending",
  due_at: "2020-01-01T10:00:00Z",
  notes: null,
  outcome: null,
};

const COMPLETED = {
  id: "fu-2",
  subject: "Follow up on oil change",
  type: "email",
  status: "completed",
  due_at: "2026-08-09T10:00:00Z",
  notes: null,
  outcome: "Done",
};

function stubListFetch(followups: typeof hooks.followups) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: followups, count: followups.length }),
    }),
  );
}

function extractCallbacks(
  mutateMock: ReturnType<typeof vi.fn>,
  callIndex: number,
): { onSuccess: () => void; onError: () => void } {
  const [, callbacks] = mutateMock.mock.calls[callIndex] as [
    unknown,
    { onSuccess: () => void; onError: () => void },
  ];
  return callbacks;
}

// ── Tests ──────────────────────────────────────────────────────────────

describe("CustomerFollowupsSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the pending follow-up list from the API", async () => {
    stubListFetch([PENDING, COMPLETED]);
    render(<CustomerFollowupsSection orgId="org-1" customerId="cust-1" />);

    expect(
      await screen.findByText("Call about brake quote"),
    ).toBeInTheDocument();
    expect(screen.getByText("Follow up on oil change")).toBeInTheDocument();
    // Pending rows show a Done action, completed rows do not
    expect(screen.getByRole("button", { name: "Done" })).toBeInTheDocument();
  });

  it("shows an empty state when there are no follow-ups", async () => {
    stubListFetch([]);
    render(<CustomerFollowupsSection orgId="org-1" customerId="cust-1" />);

    expect(
      await screen.findByText("No pending follow-ups"),
    ).toBeInTheDocument();
  });

  it("completes a follow-up with the expected payload", async () => {
    stubListFetch([PENDING]);
    render(<CustomerFollowupsSection orgId="org-1" customerId="cust-1" />);

    const done = await screen.findByRole("button", { name: "Done" });
    fireEvent.click(done);

    expect(hooks.updateMutate).toHaveBeenCalledWith(
      {
        followupId: "fu-1",
        action: "complete",
        outcome: "Completed",
      },
      expect.any(Object),
    );

    const callbacks = extractCallbacks(hooks.updateMutate, 0);
    callbacks.onSuccess();
    expect(toast.success).toHaveBeenCalledWith("Follow-up completed");

    callbacks.onError();
    expect(toast.error).toHaveBeenCalledWith("Failed to complete follow-up");
  });

  it("creates a follow-up from the add dialog with the expected payload", async () => {
    stubListFetch([]);
    const user = userEvent.setup();
    render(<CustomerFollowupsSection orgId="org-1" customerId="cust-1" />);

    await screen.findByText("No pending follow-ups");
    await user.click(screen.getByRole("button", { name: "+ Add" }));
    expect(screen.getByText("Schedule Follow-up")).toBeInTheDocument();

    // Empty submit → validation toast, no mutation
    // (fireEvent.submit bypasses the required-field constraint validation
    // that jsdom applies to real button clicks)
    const form = document.querySelector("form");
    if (!form) throw new Error("create form not found");
    fireEvent.submit(form);
    expect(toast.error).toHaveBeenCalledWith(
      "Subject and due date are required",
    );
    expect(hooks.createMutate).not.toHaveBeenCalled();

    // Fill and submit
    await user.type(
      screen.getByPlaceholderText("e.g. Callback about brake quote"),
      "Call about quote",
    );
    const dueDateInput = document.querySelector<HTMLInputElement>(
      'input[type="datetime-local"]',
    );
    if (!dueDateInput) throw new Error("due date input not found");
    fireEvent.change(dueDateInput, { target: { value: "2026-08-10T10:00" } });
    await user.type(
      screen.getByPlaceholderText("Additional details..."),
      "Quote pending",
    );
    await user.click(screen.getByRole("button", { name: "Create" }));

    expect(hooks.createMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        customer_id: "cust-1",
        type: "call",
        subject: "Call about quote",
        notes: "Quote pending",
        due_at: expect.any(String),
      }),
      expect.any(Object),
    );

    // Success closes the dialog
    const callbacks = extractCallbacks(hooks.createMutate, 0);
    callbacks.onSuccess();
    expect(toast.success).toHaveBeenCalledWith("Follow-up created");
    await waitFor(() =>
      expect(screen.queryByText("Schedule Follow-up")).not.toBeInTheDocument(),
    );
  });
});
