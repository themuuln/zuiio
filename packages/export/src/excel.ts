import type { CsvColumn } from "./csv";

export interface ExcelOptions {
  sheetName?: string;
  /** Column widths in characters (index-aligned with columns array) */
  colWidths?: number[];
  /** Freeze the header row */
  freezeHeader?: boolean;
}

/**
 * Build an Excel workbook buffer from rows + column definitions.
 * Uses exceljs — import dynamically so tree-shaking works in browser bundles.
 */
export async function toExcelBuffer<T>(
  rows: T[],
  columns: CsvColumn<T>[],
  options: ExcelOptions = {},
): Promise<ArrayBuffer> {
  const { default: ExcelJS } = await import("exceljs");
  const { sheetName = "Sheet1", colWidths, freezeHeader = true } = options;

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(sheetName);

  ws.columns = columns.map((col, i) => ({
    header: col.header,
    key: String(i),
    width: colWidths?.[i] ?? 20,
  }));

  // Bold header row
  if (ws.getRow(1).getCell(1)) {
    ws.getRow(1).font = { bold: true };
  }

  if (freezeHeader) {
    ws.views = [{ state: "frozen", xSplit: 0, ySplit: 1 }];
  }

  for (const row of rows) {
    const values: Record<string, string | number | boolean | null | undefined> =
      {};
    for (let i = 0; i < columns.length; i++) {
      const col = columns[i];
      if (col) values[String(i)] = col.accessor(row);
    }
    ws.addRow(values);
  }

  return wb.xlsx.writeBuffer();
}

export async function downloadExcel<T>(
  rows: T[],
  columns: CsvColumn<T>[],
  filename: string,
  options: ExcelOptions = {},
): Promise<void> {
  const buffer = await toExcelBuffer(rows, columns, options);
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const { downloadBlob } = await import("./csv");
  downloadBlob(
    blob,
    filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`,
  );
}
