import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ExportButton } from "@/components/export-button";
import type { ExportColumn } from "@/lib/export";
import { render } from "@/test/test-utils";

// ── Mocks ──────────────────────────────────────────────────────────────

const mockExportToExcel = vi.fn();
let mockIsExporting = false;

vi.mock("@/hooks/use-excel-export", () => ({
  useExcelExport: () => ({
    exportToExcel: mockExportToExcel,
    isExporting: mockIsExporting,
  }),
}));

const mockSuccessToast = vi.fn();
const mockErrorToast = vi.fn();

vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => mockSuccessToast(...args),
    error: (...args: unknown[]) => mockErrorToast(...args),
  },
}));

vi.mock("@/lib/sentry-report-server", () => ({
  reportServerError: vi.fn(),
}));

// ── Test Data ───────────────────────────────────────────────────────────

interface TestRow {
  id: number;
  name: string;
  value: number;
}

const columns: ExportColumn<TestRow>[] = [
  { key: "id", label: "ID" },
  { key: "name", label: "Name" },
  { key: "value", label: "Value", format: "number" },
];

const data: TestRow[] = [
  { id: 1, name: "Alpha", value: 100 },
  { id: 2, name: "Beta", value: 200 },
];

const messages = {
  common: {
    exportSuccess: "Exported successfully",
    exportFailed: "Export failed",
  },
};

// ── Tests ───────────────────────────────────────────────────────────────

describe("ExportButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsExporting = false;
  });

  it("renders with default label", () => {
    render(<ExportButton data={data} columns={columns} />, { messages });
    expect(screen.getByText("Export Excel")).toBeInTheDocument();
  });

  it("renders custom label via prop", () => {
    render(
      <ExportButton data={data} columns={columns} label="Download Report" />,
    );
    expect(screen.getByText("Download Report")).toBeInTheDocument();
  });

  it("renders download icon when not exporting", () => {
    const { container } = render(
      <ExportButton data={data} columns={columns} />,
      { messages },
    );
    expect(container.querySelector(".lucide-download")).toBeInTheDocument();
  });

  it("renders spinner icon when exporting", () => {
    mockIsExporting = true;
    const { container } = render(
      <ExportButton data={data} columns={columns} />,
      { messages },
    );
    // Loader2 maps to LoaderCircle in this lucide-react version
    expect(
      container.querySelector(".lucide-loader-circle"),
    ).toBeInTheDocument();
    expect(container.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("is disabled when data is empty", () => {
    render(<ExportButton data={[]} columns={columns} />, { messages });
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("is disabled when exporting", () => {
    mockIsExporting = true;
    render(<ExportButton data={data} columns={columns} />, { messages });
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("is disabled when disabled prop is true", () => {
    render(<ExportButton data={data} columns={columns} disabled />, {
      messages,
    });
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("calls exportToExcel and shows success toast on click", async () => {
    mockExportToExcel.mockResolvedValueOnce(undefined);
    const user = userEvent.setup();

    render(<ExportButton data={data} columns={columns} />, { messages });
    await user.click(screen.getByRole("button"));

    expect(mockExportToExcel).toHaveBeenCalledWith({
      data,
      columns,
      filename: undefined,
      sheetName: undefined,
      title: undefined,
    });
    expect(mockSuccessToast).toHaveBeenCalledWith("Exported successfully");
  });

  it("passes filename, sheetName, and title to exportToExcel", async () => {
    mockExportToExcel.mockResolvedValueOnce(undefined);
    const user = userEvent.setup();

    render(
      <ExportButton
        data={data}
        columns={columns}
        filename="report.xlsx"
        sheetName="Data"
        title="My Report"
      />,
      { messages },
    );
    await user.click(screen.getByRole("button"));

    expect(mockExportToExcel).toHaveBeenCalledWith({
      data,
      columns,
      filename: "report.xlsx",
      sheetName: "Data",
      title: "My Report",
    });
  });

  it("reports error and shows failure toast on export error", async () => {
    const testError = new Error("Network failure");
    mockExportToExcel.mockRejectedValueOnce(testError);
    const user = userEvent.setup();

    render(<ExportButton data={data} columns={columns} />, { messages });
    await user.click(screen.getByRole("button"));

    const { reportServerError } = await import("@/lib/sentry-report-server");
    expect(reportServerError).toHaveBeenCalledWith(
      "Unexpected error",
      testError,
    );
    expect(mockErrorToast).toHaveBeenCalledWith("Export failed");
  });

  it("accepts custom className", () => {
    const { container } = render(
      <ExportButton data={data} columns={columns} className="my-export" />,
      { messages },
    );
    expect(container.querySelector(".my-export")).toBeInTheDocument();
  });

  it("renders as outline variant", () => {
    render(<ExportButton data={data} columns={columns} />, { messages });
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("outline");
  });
});
