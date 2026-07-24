import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  type Mock,
  vi,
} from "vitest";

// Mock sonner
vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

// Mock window.location.reload
const reloadSpy = vi.fn();
Object.defineProperty(window, "location", {
  value: { ...window.location, reload: reloadSpy },
  writable: true,
});

import { toast } from "sonner";
import { ErrorReportActions } from "../_components/error-report-actions";

const mockToast = vi.mocked(toast);

describe("ErrorReportActions", () => {
  let fetchSpy: Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders both buttons", () => {
    render(<ErrorReportActions reportId="report-1" />);
    expect(screen.getByText("Зассан")).toBeInTheDocument();
    expect(screen.getByText("Үл хэрэгсэх")).toBeInTheDocument();
  });

  it("calls PATCH API with status 'resolved' when Зассан is clicked", async () => {
    fetchSpy.mockResolvedValueOnce({ ok: true });
    render(<ErrorReportActions reportId="report-42" />);

    fireEvent.click(screen.getByText("Зассан"));

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        "/admin/api/error-reports/report-42",
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "resolved" }),
        },
      );
    });
  });

  it("calls PATCH API with status 'dismissed' when Үл хэрэгсэх is clicked", async () => {
    fetchSpy.mockResolvedValueOnce({ ok: true });
    render(<ErrorReportActions reportId="report-7" />);

    fireEvent.click(screen.getByText("Үл хэрэгсэх"));

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        "/admin/api/error-reports/report-7",
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "dismissed" }),
        },
      );
    });
  });

  it("shows success toast on resolved", async () => {
    fetchSpy.mockResolvedValueOnce({ ok: true });
    render(<ErrorReportActions reportId="r1" />);

    fireEvent.click(screen.getByText("Зассан"));

    await waitFor(() => {
      expect(mockToast.success).toHaveBeenCalledWith("Зассан гэж тэмдэглэлээ");
    });
  });

  it("shows success toast on dismissed", async () => {
    fetchSpy.mockResolvedValueOnce({ ok: true });
    render(<ErrorReportActions reportId="r2" />);

    fireEvent.click(screen.getByText("Үл хэрэгсэх"));

    await waitFor(() => {
      expect(mockToast.success).toHaveBeenCalledWith("Үл хэрэгсэх");
    });
  });

  it("reloads page after successful status update", async () => {
    fetchSpy.mockResolvedValueOnce({ ok: true });
    render(<ErrorReportActions reportId="r3" />);

    fireEvent.click(screen.getByText("Зассан"));

    await waitFor(() => {
      expect(reloadSpy).toHaveBeenCalled();
    });
  });

  it("shows error toast on failed response", async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Server error" }),
    });
    render(<ErrorReportActions reportId="r4" />);

    fireEvent.click(screen.getByText("Зассан"));

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith("Server error");
    });
  });

  it("shows generic error when response JSON parsing fails", async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: false,
      json: async () => {
        throw new Error("bad json");
      },
    });
    render(<ErrorReportActions reportId="r5" />);

    fireEvent.click(screen.getByText("Зассан"));

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith("Алдаа гарлаа");
    });
  });

  it("shows network error toast on fetch failure", async () => {
    fetchSpy.mockRejectedValueOnce(new Error("Network fail"));
    render(<ErrorReportActions reportId="r6" />);

    fireEvent.click(screen.getByText("Зассан"));

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith("Сүлжээний алдаа");
    });
  });

  it("disables buttons while request is in progress", async () => {
    // Never-resolving promise to keep buttons disabled
    const { promise } = Promise.withResolvers<never>();
    fetchSpy.mockReturnValueOnce(promise);
    render(<ErrorReportActions reportId="r7" />);

    fireEvent.click(screen.getByText("Зассан"));

    await waitFor(() => {
      expect(screen.getByText("Зассан")).toBeDisabled();
      expect(screen.getByText("Үл хэрэгсэх")).toBeDisabled();
    });
  });
});
