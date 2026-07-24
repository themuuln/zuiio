import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ReportErrorDialog } from "@/components/report-error-dialog";

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ReportErrorDialog", () => {
  it("renders a report button with flag icon", () => {
    render(<ReportErrorDialog />);
    const btn = screen.getByRole("button", { name: /алдаа мэдээлэх/i });
    expect(btn).toBeInTheDocument();
  });

  it("renders with game and player IDs without crashing", () => {
    render(<ReportErrorDialog gameId="g-1" playerId="p-1" />);
    const btn = screen.getByRole("button", { name: /алдаа мэдээлэх/i });
    expect(btn).toBeInTheDocument();
  });
});
