import type { DocumentProps } from "@react-pdf/renderer";
import type { ReactElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@react-pdf/renderer", () => ({
  renderToBuffer: vi.fn(),
}));

import { renderToBuffer } from "@react-pdf/renderer";
import { pdfFilename, renderToPdfBuffer } from "../pdf";

const mockRenderToBuffer = vi.mocked(renderToBuffer);

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("renderToPdfBuffer", () => {
  it("renders the element to a PDF buffer via the renderer", async () => {
    const element = {} as ReactElement<DocumentProps>;
    const buffer = new Uint8Array([37, 80, 68, 70]) as Buffer;
    mockRenderToBuffer.mockResolvedValue(buffer);

    const result = await renderToPdfBuffer(element);

    expect(result).toBe(buffer);
    expect(mockRenderToBuffer).toHaveBeenCalledWith(element);
  });

  it("returns the resolved buffer unchanged", async () => {
    const element = {} as ReactElement<DocumentProps>;
    const buffer = Buffer.from("pdf-bytes");
    mockRenderToBuffer.mockResolvedValue(buffer);

    const result = await renderToPdfBuffer(element);

    expect(result).toBe(buffer);
  });

  it("propagates renderer failures", async () => {
    mockRenderToBuffer.mockRejectedValue(new Error("font missing"));

    await expect(
      renderToPdfBuffer({} as ReactElement<DocumentProps>),
    ).rejects.toThrow("font missing");
  });
});

describe("pdfFilename", () => {
  it("appends a timestamp and the pdf extension", () => {
    vi.setSystemTime(new Date("2026-08-09T12:34:56.789Z"));

    expect(pdfFilename("invoice")).toBe("invoice-20260809123456.pdf");
  });

  it("accepts a custom extension", () => {
    vi.setSystemTime(new Date("2026-01-02T03:04:05.000Z"));

    expect(pdfFilename("report", "csv")).toBe("report-20260102030405.csv");
  });

  it("uses the current timestamp", () => {
    vi.setSystemTime(new Date("2026-12-31T23:59:58.000Z"));
    const first = pdfFilename("invoice");
    vi.setSystemTime(new Date("2027-01-01T00:00:01.000Z"));
    const second = pdfFilename("invoice");

    expect(first).toBe("invoice-20261231235958.pdf");
    expect(second).toBe("invoice-20270101000001.pdf");
  });
});
