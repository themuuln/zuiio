import { QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PartForm } from "@/components/inventory/part-form";
import { createTestQueryClient } from "@/test/test-utils";

vi.mock("next-intl", () => ({
  useTranslations: () => {
    return (key: string) => key;
  },
}));

const mockOrgQuery = vi.fn();
const mockCreatePart = vi.fn();
const mockUpdatePart = vi.fn();
const mockPartCategories = vi.fn();
const mockCreateCategory = vi.fn();

vi.mock("@/lib/queries/use-organization", () => ({
  useCurrentOrg: (...args: unknown[]) => mockOrgQuery(...args),
}));

vi.mock("@/lib/queries/use-wizard-data", () => ({
  useCreatePart: (...args: unknown[]) => mockCreatePart(...args),
}));

vi.mock("@/lib/queries/use-inventory", () => ({
  useUpdatePart: (...args: unknown[]) => mockUpdatePart(...args),
  usePartCategories: (...args: unknown[]) => mockPartCategories(...args),
  useCreatePartCategory: (...args: unknown[]) => mockCreateCategory(...args),
}));

vi.mock("@/lib/sentry-report-server", () => ({
  reportServerError: vi.fn(),
}));

vi.mock("../part-photo-upload", () => ({
  default: () => <div data-testid="part-photo-upload-mock" />,
}));

// ── Helpers ──────────────────────────────────────────────────────

function renderForm(props: Record<string, unknown> = {}) {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <PartForm {...props} />
    </QueryClientProvider>,
  );
}

function q(name: string): HTMLInputElement | null {
  return document.querySelector(`input[name="${name}"]`);
}

function required<T>(value: T | null | undefined, name: string): T {
  if (!value) throw new Error(`Expected ${name} input in DOM`);
  return value;
}

// ── Tests ─────────────────────────────────────────────────────────

describe("PartForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOrgQuery.mockReturnValue({
      data: { orgId: "test-org-1" },
      isLoading: false,
    });
    mockCreatePart.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({ id: "default-part" }),
      isPending: false,
    });
    mockUpdatePart.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({ id: "default-part" }),
      isPending: false,
    });
    mockPartCategories.mockReturnValue({
      data: [{ name: "Engine Parts" }, { name: "Filters" }],
    });
    mockCreateCategory.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({ name: "New Category" }),
    });
  });

  describe("rendering — quick mode (default)", () => {
    it("renders core inputs in quick mode", () => {
      renderForm();
      expect(q("name_mn")).toBeInTheDocument();
      expect(q("name")).toBeInTheDocument();
      expect(q("part_number")).toBeInTheDocument();
    });

    it("renders mode toggle tabs", () => {
      renderForm();
      expect(screen.getByText(/quickAdd/i)).toBeInTheDocument();
      expect(screen.getByText(/fullDetails/i)).toBeInTheDocument();
    });

    it("renders a submit button", () => {
      renderForm();
      expect(
        screen.getByRole("button", { name: /createPart/i }),
      ).toBeInTheDocument();
    });
  });

  describe("rendering — full mode", () => {
    it("renders all fields in full mode", () => {
      renderForm({ mode: "full" });
      expect(q("name_mn")).toBeInTheDocument();
      expect(q("name")).toBeInTheDocument();
      expect(q("part_number")).toBeInTheDocument();
      expect(q("barcode")).toBeInTheDocument();
      expect(q("unit")).toBeInTheDocument();
      expect(q("description")).toBeInTheDocument();
      expect(q("location")).toBeInTheDocument();
    });

    it("renders photo upload in full mode", () => {
      renderForm({ mode: "full" });
      expect(screen.getByTestId("part-photo-upload-mock")).toBeInTheDocument();
    });
  });

  describe("rendering — readOnly and hideActions", () => {
    it("hides submit button in readOnly mode", () => {
      renderForm({ readOnly: true });
      expect(
        screen.queryByRole("button", { name: /createPart/i }),
      ).not.toBeInTheDocument();
    });

    it("hides submit button with hideActions", () => {
      renderForm({ hideActions: true });
      expect(
        screen.queryByRole("button", { name: /createPart/i }),
      ).not.toBeInTheDocument();
    });
  });

  describe("update mode", () => {
    it("shows update button text when partId is provided", () => {
      renderForm({ partId: "part-1" });
      expect(
        screen.getByRole("button", { name: /updatePart/i }),
      ).toBeInTheDocument();
    });
  });

  describe("validation", () => {
    it("shows name error when submitting with empty name_mn", async () => {
      const user = userEvent.setup();
      renderForm();
      await user.click(screen.getByRole("button", { name: /createPart/i }));
      await waitFor(() => {
        // The part schema validates nameMn — expect some error text
        const errorEl = screen.queryByText(/шаардлагатай|required/i);
        expect(errorEl).not.toBeNull();
      });
    });
  });

  describe("submit integration — quick mode create", () => {
    it("calls createPart with form values", async () => {
      const mutateAsync = vi.fn().mockResolvedValue({ id: "part-1" });
      mockCreatePart.mockReturnValue({ mutateAsync, isPending: false });

      const user = userEvent.setup();
      renderForm();

      await user.type(required(q("name_mn"), "name_mn"), "Тосны шүүлтүүр");
      await user.type(required(q("part_number"), "part_number"), "OF-101");
      await user.click(screen.getByRole("button", { name: /createPart/i }));

      await waitFor(() => {
        expect(mutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            name_mn: "Тосны шүүлтүүр",
            part_number: "OF-101",
          }),
        );
      });
    });

    it("calls onSuccess after creation", async () => {
      const newPart = { id: "p-1", name_mn: "Тосны шүүлтүүр" };
      const mutateAsync = vi.fn().mockResolvedValue(newPart);
      mockCreatePart.mockReturnValue({ mutateAsync, isPending: false });

      const user = userEvent.setup();
      const onSuccess = vi.fn();
      renderForm({ onSuccess });

      await user.type(required(q("name_mn"), "name_mn"), "Тосны шүүлтүүр");
      await user.click(screen.getByRole("button", { name: /createPart/i }));

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledWith(newPart);
      });
    });
  });

  describe("submit integration — update mode", () => {
    it("calls updatePart when partId is provided", async () => {
      const mutateAsync = vi.fn().mockResolvedValue({ id: "part-1" });
      mockUpdatePart.mockReturnValue({ mutateAsync, isPending: false });

      const user = userEvent.setup();
      renderForm({ partId: "part-1", mode: "full" });

      await user.type(required(q("name_mn"), "name_mn"), "Шинэ тосны шүүлтүүр");
      await user.click(screen.getByRole("button", { name: /updatePart/i }));

      await waitFor(() => {
        expect(mutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            id: "part-1",
            body: expect.objectContaining({
              name_mn: "Шинэ тосны шүүлтүүр",
            }),
          }),
        );
      });
    });
  });

  describe("onCancel", () => {
    it("calls onCancel when cancel button clicked", async () => {
      const user = userEvent.setup();
      const onCancel = vi.fn();
      renderForm({ onCancel });

      await user.click(screen.getByText(/cancel/i));
      expect(onCancel).toHaveBeenCalledTimes(1);
    });
  });
});
