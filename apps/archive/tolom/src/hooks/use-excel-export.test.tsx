import { act } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { renderHook } from "@/test/test-utils";
import { useExcelExport } from "./use-excel-export";

const mockColumns = [
  { key: "name", label: "Name" },
  { key: "score", label: "Score", format: "number" as const },
];

const mockData = [
  { name: "Alpha", score: 100 },
  { name: "Beta", score: 200 },
];

function createMockBlob(): Blob {
  return new Blob(["mock excel content"], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

function createMockAnchor(): HTMLAnchorElement {
  const el = document.createElement("a");
  el.href = "";
  el.download = "";
  vi.spyOn(el, "click").mockReturnValue(undefined);
  return el;
}

const originalCreateElement = document.createElement.bind(document);

beforeEach(() => {
  vi.restoreAllMocks();

  // Mock window.URL
  window.URL.createObjectURL = vi.fn(() => "blob:http://localhost/mock");
  window.URL.revokeObjectURL = vi.fn();
});

it("exportToExcel makes correct POST request and triggers blob download on success", async () => {
  const blob = createMockBlob();
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    blob: vi.fn().mockResolvedValue(blob),
  });
  vi.stubGlobal("fetch", fetchMock);

  const mockAnchor = createMockAnchor();
  vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
    if (tag === "a") return mockAnchor;
    return originalCreateElement(tag);
  });
  const appendChildSpy = vi.spyOn(document.body, "appendChild");
  const removeChildSpy = vi.spyOn(document.body, "removeChild");

  const { result } = renderHook(() => useExcelExport());

  await act(async () => {
    await result.current.exportToExcel({
      data: mockData,
      columns: mockColumns,
      filename: "test-export.xlsx",
    });
  });

  // Verify POST request body
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(fetchMock).toHaveBeenCalledWith("/api/export", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      columns: [
        { key: "name", label: "Name", format: undefined },
        { key: "score", label: "Score", format: "number" },
      ],
      data: [
        { name: "Alpha", score: 100 },
        { name: "Beta", score: 200 },
      ],
      filename: "test-export.xlsx",
      sheetName: undefined,
      title: undefined,
    }),
  });

  // Verify blob URL creation and download
  expect(window.URL.createObjectURL).toHaveBeenCalledWith(blob);
  expect(mockAnchor.href).toBe("blob:http://localhost/mock");
  expect(mockAnchor.download).toBe("test-export.xlsx");
  expect(appendChildSpy).toHaveBeenCalledWith(mockAnchor);
  expect(mockAnchor.click).toHaveBeenCalledTimes(1);
  expect(removeChildSpy).toHaveBeenCalledWith(mockAnchor);
  expect(window.URL.revokeObjectURL).toHaveBeenCalledWith(
    "blob:http://localhost/mock",
  );
});

it("isExporting is true during request and false after", async () => {
  const { promise: fetchPromise, resolve: resolveFetch } =
    Promise.withResolvers<Response>();

  const fetchMock = vi.fn().mockReturnValue(fetchPromise);
  vi.stubGlobal("fetch", fetchMock);

  const { result } = renderHook(() => useExcelExport());

  // Start export without awaiting — capture the promise
  let exportPromise!: Promise<void>;
  act(() => {
    exportPromise = result.current.exportToExcel({
      data: mockData,
      columns: mockColumns,
    });
  });

  // setIsExporting(true) runs synchronously before the first await;
  // act() flushes the update.
  expect(result.current.isExporting).toBe(true);

  // Resolve the fetch
  const blob = createMockBlob();
  const mockAnchor = createMockAnchor();
  vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
    if (tag === "a") return mockAnchor;
    return originalCreateElement(tag);
  });

  resolveFetch({
    ok: true,
    blob: vi.fn().mockResolvedValue(blob),
  } as unknown as Response);

  // Wait for the export to complete
  await act(async () => {
    await exportPromise;
  });

  expect(result.current.isExporting).toBe(false);
});

it("isExporting is false after fetch error", async () => {
  const fetchMock = vi.fn().mockRejectedValue(new Error("Network failure"));
  vi.stubGlobal("fetch", fetchMock);

  const { result } = renderHook(() => useExcelExport());

  await act(async () => {
    await expect(
      result.current.exportToExcel({
        data: mockData,
        columns: mockColumns,
      }),
    ).rejects.toThrow("Network failure");
  });

  expect(result.current.isExporting).toBe(false);
});

it("handles non-ok response with error message from JSON body", async () => {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: false,
    json: vi.fn().mockResolvedValue({
      error: { message: "Column mismatch" },
    }),
  });
  vi.stubGlobal("fetch", fetchMock);

  const { result } = renderHook(() => useExcelExport());

  await act(async () => {
    await expect(
      result.current.exportToExcel({
        data: mockData,
        columns: mockColumns,
      }),
    ).rejects.toThrow("Column mismatch");
  });

  expect(result.current.isExporting).toBe(false);
});

it("falls back to default error message when JSON body has no error.message", async () => {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: false,
    json: vi.fn().mockResolvedValue({}),
  });
  vi.stubGlobal("fetch", fetchMock);

  const { result } = renderHook(() => useExcelExport());

  await act(async () => {
    await expect(
      result.current.exportToExcel({
        data: mockData,
        columns: mockColumns,
      }),
    ).rejects.toThrow("Export failed");
  });

  expect(result.current.isExporting).toBe(false);
});

it("handles non-ok response when error JSON parse fails", async () => {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: false,
    json: vi.fn().mockRejectedValue(new Error("Invalid JSON")),
  });
  vi.stubGlobal("fetch", fetchMock);

  const { result } = renderHook(() => useExcelExport());

  await act(async () => {
    await expect(
      result.current.exportToExcel({
        data: mockData,
        columns: mockColumns,
      }),
    ).rejects.toThrow("Export failed");
  });

  expect(result.current.isExporting).toBe(false);
});

it("uses default filename when none provided", async () => {
  const blob = createMockBlob();
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    blob: vi.fn().mockResolvedValue(blob),
  });
  vi.stubGlobal("fetch", fetchMock);

  const mockAnchor = createMockAnchor();
  vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
    if (tag === "a") return mockAnchor;
    return originalCreateElement(tag);
  });

  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-07-28T12:00:00Z"));

  const { result } = renderHook(() => useExcelExport());

  // fakeTimers means fetch resolves immediately; use act + real microtask
  await act(async () => {
    await result.current.exportToExcel({
      data: mockData,
      columns: mockColumns,
    });
  });

  expect(mockAnchor.download).toBe("export-2026-07-28.xlsx");

  vi.useRealTimers();
});
