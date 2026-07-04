// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SaveAsTemplateDialog } from "./SaveAsTemplateDialog";

// Mock the base-ui dialog primitives which use portals/overlays
// that don't work well in jsdom test environment.
vi.mock("@base-ui/react/dialog", () => ({
  Dialog: {
    Root: ({
      children,
      open,
    }: {
      children: React.ReactNode;
      open: boolean;
    }) => (open ? <div data-testid="dialog-root">{children}</div> : null),
    Portal: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="dialog-portal">{children}</div>
    ),
    Backdrop: ({ className }: { className?: string }) => (
      <div data-testid="dialog-backdrop" className={className} />
    ),
    Popup: ({ children, className }: { children: React.ReactNode; className?: string }) => (
      <div data-testid="dialog-popup" className={className}>
        {children}
      </div>
    ),
    Title: ({ children }: { children: React.ReactNode }) => (
      <h2 data-testid="dialog-title">{children}</h2>
    ),
    Description: ({ children }: { children: React.ReactNode }) => (
      <p data-testid="dialog-description">{children}</p>
    ),
  },
}));

// Mock the Select component from base-ui
vi.mock("@/components/ui/select", () => ({
  Select: ({
    children,
    value,
    onValueChange,
    disabled,
  }: {
    children: React.ReactNode;
    value?: string;
    onValueChange?: (value: string) => void;
    disabled?: boolean;
  }) => (
    <div data-testid="select-root" data-value={value} data-disabled={disabled}>
      <select
        data-testid="select-native"
        value={value}
        onChange={(e) => onValueChange?.(e.target.value)}
        disabled={disabled}
      >
        {children}
      </select>
    </div>
  ),
  SelectContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="select-content">{children}</div>
  ),
  SelectItem: ({
    children,
    value,
  }: {
    children: React.ReactNode;
    value: string;
  }) => (
    <option data-testid="select-item" value={value}>
      {children}
    </option>
  ),
  SelectTrigger: ({
    children,
    id,
    className,
  }: {
    children: React.ReactNode;
    id?: string;
    className?: string;
  }) => (
    <div data-testid="select-trigger" data-for={id} className={className}>
      {children}
    </div>
  ),
  SelectValue: () => <span data-testid="select-value" />,
}));

// Mock the toast store
const mockAddToast = vi.fn();
vi.mock("@/store/toastStore", () => ({
  useToastStore: (selector: (s: { addToast: typeof mockAddToast }) => unknown) =>
    selector({ addToast: mockAddToast }),
}));

// Mock the flow store
const mockExportFlow = vi.fn().mockReturnValue({
  nodes: [{ id: "node-1", type: "start", position: { x: 0, y: 0 }, data: {} }],
  edges: [],
});
vi.mock("@/store/flowStore", () => ({
  useFlowStore: (selector: (s: { exportFlow: typeof mockExportFlow }) => unknown) =>
    selector({ exportFlow: mockExportFlow }),
}));

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
  mockAddToast.mockClear();
  mockExportFlow.mockClear();
});

afterEach(() => {
  vi.unstubAllGlobals();
  cleanup();
});

describe("SaveAsTemplateDialog", () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
  };

  it("renders the dialog with form fields when open", () => {
    render(<SaveAsTemplateDialog {...defaultProps} />);

    expect(screen.getByTestId("dialog-root")).toBeDefined();
    expect(screen.getByText("Save as Template")).toBeDefined();
    expect(
      screen.getByText("Save the current flow as a reusable template."),
    ).toBeDefined();
    expect(screen.getByLabelText(/Name/i)).toBeDefined();
    expect(screen.getByLabelText(/Description/i)).toBeDefined();
    expect(screen.getByText("Save Template")).toBeDefined();
    expect(screen.getByText("Cancel")).toBeDefined();
  });

  it("renders nothing when closed", () => {
    render(<SaveAsTemplateDialog {...defaultProps} open={false} />);

    expect(screen.queryByTestId("dialog-root")).toBeNull();
  });

  it("shows validation error when submitting with empty name", async () => {
    render(<SaveAsTemplateDialog {...defaultProps} />);

    const submitButton = screen.getByText("Save Template");
    await userEvent.click(submitButton);

    // Validation error should appear
    expect(screen.getByText("Template name is required.")).toBeDefined();

    // No API call should be made
    expect(fetch).not.toHaveBeenCalled();
  });

  it("clears name validation error when user starts typing", async () => {
    render(<SaveAsTemplateDialog {...defaultProps} />);

    const submitButton = screen.getByText("Save Template");
    await userEvent.click(submitButton);

    expect(screen.getByText("Template name is required.")).toBeDefined();

    const nameInput = screen.getByLabelText(/Name/i);
    await userEvent.type(nameInput, "My Template");

    expect(screen.queryByText("Template name is required.")).toBeNull();
  });

  it("calls POST /api/templates with correct data on valid submission", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          template: {
            id: "new-temp-1",
            name: "My Template",
            description: "A test template",
            category: "welcome",
          },
        }),
        { status: 201, headers: { "Content-Type": "application/json" } },
      ),
    );

    const onOpenChange = vi.fn();

    render(
      <SaveAsTemplateDialog {...defaultProps} onOpenChange={onOpenChange} />,
    );

    const nameInput = screen.getByLabelText(/Name/i);
    await userEvent.type(nameInput, "My Template");

    const descInput = screen.getByLabelText(/Description/i);
    await userEvent.type(descInput, "A test template");

    const submitButton = screen.getByText("Save Template");
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    const callArgs = vi.mocked(fetch).mock.calls[0];
    expect(callArgs[0]).toBe("/api/templates");
    expect(callArgs[1]).toMatchObject({
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    const body = JSON.parse(callArgs[1]?.body as string);
    expect(body).toMatchObject({
      name: "My Template",
      description: "A test template",
      category: "general",
    });
    expect(body.flow_json).toBeDefined();
    expect(body.flow_json.nodes).toHaveLength(1);
    expect(body.flow_json.edges).toHaveLength(0);

    // Should show success toast and close dialog
    expect(mockAddToast).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Template saved successfully!",
        type: "success",
      }),
    );
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("shows error in dialog when POST /api/templates fails", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({ error: "Category is invalid." }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

    const onOpenChange = vi.fn();

    render(
      <SaveAsTemplateDialog {...defaultProps} onOpenChange={onOpenChange} />,
    );

    const nameInput = screen.getByLabelText(/Name/i);
    await userEvent.type(nameInput, "My Template");

    const submitButton = screen.getByText("Save Template");
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText("Category is invalid."),
      ).toBeDefined();
    });

    // Dialog should remain open
    expect(screen.getByTestId("dialog-root")).toBeDefined();
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("shows error in dialog on network failure", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("Network error"));

    const onOpenChange = vi.fn();

    render(
      <SaveAsTemplateDialog {...defaultProps} onOpenChange={onOpenChange} />,
    );

    const nameInput = screen.getByLabelText(/Name/i);
    await userEvent.type(nameInput, "My Template");

    const submitButton = screen.getByText("Save Template");
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Network error")).toBeDefined();
    });

    // Dialog should remain open
    expect(screen.getByTestId("dialog-root")).toBeDefined();
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("includes the category select with all options", () => {
    render(<SaveAsTemplateDialog {...defaultProps} />);

    expect(screen.getByText("Category")).toBeDefined();
    // All category options should be present
    expect(screen.getByText("Welcome")).toBeDefined();
    expect(screen.getByText("Support")).toBeDefined();
    expect(screen.getByText("Sales")).toBeDefined();
    expect(screen.getByText("Notifications")).toBeDefined();
    expect(screen.getByText("General")).toBeDefined();
  });

  it("resets form when dialog closes via Cancel button", async () => {
    const onOpenChange = vi.fn();

    render(
      <SaveAsTemplateDialog {...defaultProps} onOpenChange={onOpenChange} />,
    );

    // Fill in form fields
    const nameInput = screen.getByLabelText(/Name/i) as HTMLInputElement;
    await userEvent.type(nameInput, "My Template");
    expect(nameInput.value).toBe("My Template");

    // Close by clicking Cancel
    const cancelButton = screen.getByText("Cancel");
    await userEvent.click(cancelButton);

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("disables form fields and buttons while submitting", async () => {
    // Create a promise that never resolves to keep submitting state
    vi.mocked(fetch).mockReturnValue(new Promise<Response>(() => {}));

    render(<SaveAsTemplateDialog {...defaultProps} />);

    const nameInput = screen.getByLabelText(/Name/i);
    await userEvent.type(nameInput, "My Template");

    const submitButton = screen.getByText("Save Template");
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Saving...")).toBeDefined();
    });

    // Form fields should be disabled during submission
    expect((nameInput as HTMLInputElement).disabled).toBe(true);
    expect(
      (screen.getByLabelText(/Description/i) as HTMLInputElement).disabled,
    ).toBe(true);
    expect(
      (screen.getByText("Cancel").closest("button") as HTMLButtonElement)
        .disabled,
    ).toBe(true);
  });

  it("calls onOpenChange when Cancel button is clicked", async () => {
    const onOpenChange = vi.fn();

    render(
      <SaveAsTemplateDialog {...defaultProps} onOpenChange={onOpenChange} />,
    );

    const cancelButton = screen.getByText("Cancel");
    await userEvent.click(cancelButton);

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
